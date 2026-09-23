from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

import yaml

from app.guardrails import assert_no_final_decision_language, parse_json_model
from app.models import (
    CandidatePacketRequest,
    CandidatePacketResponse,
    CandidateProfile,
    CandidateReport,
    ComplianceReview,
    ComplianceStatus,
    CriterionAssessment,
    EvidenceSnippet,
    FitAssessment,
    FitCategory,
    GenerateRubricRequest,
    InterviewKit,
    InterviewQuestion,
    RoleRubric,
)

CONFIG_DIR = Path(__file__).parent / "config"


class ApplicationCrew:
    def __init__(self) -> None:
        self.agents_config = self._load_yaml(CONFIG_DIR / "agents.yaml")
        self.tasks_config = self._load_yaml(CONFIG_DIR / "tasks.yaml")

    def generate_role_rubric(self, request: GenerateRubricRequest) -> RoleRubric:
        inputs = request.model_dump()
        try:
            output = self._run_crewai_task("extract_role_rubric", inputs)
        except Exception:
            return self._fallback_role_rubric(request)
        return parse_json_model(output, RoleRubric)

    def generate_candidate_packet(self, request: CandidatePacketRequest) -> CandidatePacketResponse:
        if request.role_rubric.status != "approved":
            raise ValueError("candidate assessment requires an approved role rubric")

        run_id = str(uuid4())
        try:
            profile, fit, compliance, interview_kit, report = self._run_candidate_packet_crew(request)
        except Exception:
            profile, fit, compliance, interview_kit, report = self._fallback_candidate_packet(request)

        assert_no_final_decision_language(report.model_dump())
        return CandidatePacketResponse(
            run_id=run_id,
            candidate_profile=profile,
            fit_assessment=fit,
            compliance_review=compliance,
            interview_kit=interview_kit,
            candidate_report=report,
            status=self._status_for_compliance(compliance),
        )

    def _run_crewai_task(self, task_name: str, inputs: dict[str, Any]) -> Any:
        try:
            from crewai import Agent, Crew, Process, Task
        except ImportError as exc:
            raise RuntimeError("CrewAI is not installed in the active environment") from exc

        task_config = self.tasks_config[task_name]
        agent_key = task_config["agent"]
        agent_config = self.agents_config[agent_key]
        agent = Agent(config=agent_config)
        task = Task(
            description=task_config["description"],
            expected_output=task_config["expected_output"],
            agent=agent,
        )
        crew = Crew(
            agents=[agent],
            tasks=[task],
            process=Process.sequential,
            memory=False,
            max_rpm=20,
        )
        return crew.kickoff(inputs=inputs)

    def _run_candidate_packet_crew(
        self,
        request: CandidatePacketRequest,
    ) -> tuple[CandidateProfile, FitAssessment, ComplianceReview, InterviewKit, CandidateReport]:
        try:
            from crewai import Agent, Crew, Process, Task
        except ImportError as exc:
            raise RuntimeError("CrewAI is not installed in the active environment") from exc

        agents = {name: Agent(config=config) for name, config in self.agents_config.items()}
        profile_task = self._task(Task, "build_candidate_profile", agents)
        fit_task = self._task(Task, "assess_candidate_fit", agents, context=[profile_task])
        compliance_task = self._task(Task, "review_compliance", agents, context=[profile_task, fit_task])
        interview_task = self._task(Task, "generate_interview_kit", agents, context=[fit_task, compliance_task])
        report_task = self._task(
            Task,
            "draft_candidate_report",
            agents,
            context=[profile_task, fit_task, compliance_task, interview_task],
        )
        Crew(
            agents=list(agents.values()),
            tasks=[profile_task, fit_task, compliance_task, interview_task, report_task],
            process=Process.sequential,
            memory=False,
            max_rpm=20,
        ).kickoff(inputs=request.model_dump())

        return (
            parse_json_model(profile_task.output, CandidateProfile),
            parse_json_model(fit_task.output, FitAssessment),
            parse_json_model(compliance_task.output, ComplianceReview),
            parse_json_model(interview_task.output, InterviewKit),
            parse_json_model(report_task.output, CandidateReport),
        )

    def _task(self, task_type: Any, task_name: str, agents: dict[str, Any], context: list[Any] | None = None) -> Any:
        task_config = self.tasks_config[task_name]
        return task_type(
            description=task_config["description"],
            expected_output=task_config["expected_output"],
            agent=agents[task_config["agent"]],
            context=context or [],
        )

    @staticmethod
    def _load_yaml(path: Path) -> dict[str, Any]:
        with path.open("r", encoding="utf-8") as config_file:
            return yaml.safe_load(config_file)

    @staticmethod
    def _status_for_compliance(compliance: ComplianceReview) -> str:
        if compliance.review_status == ComplianceStatus.BLOCKED_UNTIL_RESOLVED:
            return "blocked_until_resolved"
        if compliance.review_status == ComplianceStatus.PASSED_WITH_WARNINGS:
            return "ready_with_warnings"
        return "ready_for_human_review"

    @staticmethod
    def _fallback_role_rubric(request: GenerateRubricRequest) -> RoleRubric:
        text = request.job_description
        must_haves = _extract_keyword_lines(text, ("required", "must", "minimum", "need"))
        nice_to_haves = _extract_keyword_lines(text, ("preferred", "nice", "bonus", "plus"))
        responsibilities = _extract_keyword_lines(text, ("responsible", "own", "build", "manage", "lead"))
        ambiguous = [] if must_haves else [{"severity": "medium", "requirement": "Must-have criteria are not explicit."}]
        questions = [] if must_haves else ["Which requirements are mandatory for this role?"]
        return RoleRubric(
            role_title=request.role_title,
            department=request.department,
            must_have_criteria=must_haves[:8] or ["Recruiter-approved role criteria pending clarification"],
            nice_to_have_criteria=nice_to_haves[:8],
            responsibilities=responsibilities[:8],
            evaluation_categories=["role alignment", "evidence strength", "experience relevance"],
            ambiguous_requirements=ambiguous,
            clarification_questions=questions,
            created_by=request.created_by,
        )

    @staticmethod
    def _fallback_candidate_packet(
        request: CandidatePacketRequest,
    ) -> tuple[CandidateProfile, FitAssessment, ComplianceReview, InterviewKit, CandidateReport]:
        source_documents = request.source_documents
        combined_text = "\n".join(document.text for document in source_documents)
        first_document = source_documents[0]
        snippets = [
            EvidenceSnippet(
                source_document_id=first_document.document_id,
                text=line,
                reference=f"{first_document.name}:line-{index}",
            )
            for index, line in enumerate(_significant_lines(combined_text), start=1)
        ][:8]
        profile = CandidateProfile(
            candidate_id=request.candidate_id or str(uuid4()),
            source_documents=source_documents,
            skills=_extract_skill_terms(combined_text),
            evidence_snippets=snippets,
            missing_or_unclear_information=[] if snippets else ["No substantive candidate evidence was extracted."],
            profile_corrections=request.profile_corrections,
        )
        assessments = [
            CriterionAssessment(
                criterion=criterion,
                status="partially_met" if snippets else "not_evidenced",
                rationale="Candidate evidence should be reviewed by a recruiter before use.",
                confidence="low",
                evidence_references=[snippet.reference for snippet in snippets[:2]],
            )
            for criterion in request.role_rubric.must_have_criteria
        ]
        fit = FitAssessment(
            candidate_id=profile.candidate_id,
            role_rubric_id=request.role_rubric.role_rubric_id,
            criterion_assessments=assessments,
            strengths=["Potentially relevant experience found in submitted materials"] if snippets else [],
            gaps=[] if snippets else ["Insufficient evidence to assess role criteria"],
            follow_up_questions=[f"Can you describe your experience with {criterion}?" for criterion in request.role_rubric.must_have_criteria[:3]],
            fit_category=FitCategory.POTENTIAL_FIT_WITH_GAPS if snippets else FitCategory.INSUFFICIENT_EVIDENCE,
            confidence_level="low",
            evidence_references=[snippet.reference for snippet in snippets],
            generated_at=datetime.now(timezone.utc).isoformat(),
        )
        compliance = ComplianceReview(
            missing_evidence_warnings=[] if snippets else ["Candidate packet has no cited evidence."],
            required_human_actions=["Recruiter must review all generated assessment content before export."],
            review_status=ComplianceStatus.PASSED_WITH_WARNINGS,
        )
        interview_kit = InterviewKit(
            questions=[
                InterviewQuestion(
                    criterion=assessment.criterion,
                    question=f"Please walk through a specific example related to {assessment.criterion}.",
                    reason="Validate evidence and clarify fit against the approved rubric.",
                    evidence_references=assessment.evidence_references,
                )
                for assessment in assessments[:6]
            ]
        )
        report = CandidateReport(
            candidate_id=profile.candidate_id,
            role_rubric_summary=f"Assessment against approved rubric for {request.role_rubric.role_title}.",
            candidate_summary="Draft candidate packet generated for human review.",
            fit_assessment=fit,
            interview_kit=interview_kit,
            compliance_review=compliance,
        )
        return profile, fit, compliance, interview_kit, report


def _extract_keyword_lines(text: str, keywords: tuple[str, ...]) -> list[str]:
    results: list[str] = []
    for raw_line in text.splitlines():
        line = raw_line.strip(" -\t")
        if len(line) < 4:
            continue
        lowered = line.lower()
        if any(keyword in lowered for keyword in keywords):
            results.append(line[:240])
    return results


def _significant_lines(text: str) -> list[str]:
    return [line.strip()[:300] for line in text.splitlines() if len(line.strip()) >= 20]


def _extract_skill_terms(text: str) -> list[str]:
    known_terms = ("python", "javascript", "typescript", "fastapi", "react", "sql", "aws", "leadership", "recruiting")
    lowered = text.lower()
    return [term for term in known_terms if term in lowered]
