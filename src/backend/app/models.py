from __future__ import annotations

from enum import Enum
from typing import Any, Literal
from uuid import uuid4

from pydantic import BaseModel, Field, model_validator


class FitCategory(str, Enum):
    STRONG_POTENTIAL_FIT = "strong_potential_fit"
    POTENTIAL_FIT_WITH_GAPS = "potential_fit_with_gaps"
    INSUFFICIENT_EVIDENCE = "insufficient_evidence"
    NOT_ALIGNED_WITH_CURRENT_RUBRIC = "not_aligned_with_current_rubric"


class ComplianceStatus(str, Enum):
    PASSED = "passed"
    PASSED_WITH_WARNINGS = "passed_with_warnings"
    BLOCKED_UNTIL_RESOLVED = "blocked_until_resolved"


class SourceDocument(BaseModel):
    document_id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    text: str
    source_type: Literal["paste", "text", "pdf", "docx"] = "paste"


class EvidenceSnippet(BaseModel):
    source_document_id: str
    text: str
    reference: str


class CriterionAssessment(BaseModel):
    criterion: str
    status: Literal["met", "partially_met", "not_evidenced", "gap"]
    rationale: str
    confidence: Literal["low", "medium", "high"]
    evidence_references: list[str] = Field(default_factory=list)


class InterviewQuestion(BaseModel):
    criterion: str
    question: str
    reason: str
    evidence_references: list[str] = Field(default_factory=list)


class RoleRubric(BaseModel):
    role_rubric_id: str = Field(default_factory=lambda: str(uuid4()))
    role_title: str
    department: str = "Unspecified"
    must_have_criteria: list[str] = Field(default_factory=list)
    nice_to_have_criteria: list[str] = Field(default_factory=list)
    responsibilities: list[str] = Field(default_factory=list)
    seniority_level: str = "Unspecified"
    location_or_work_authorization_constraints: list[str] = Field(default_factory=list)
    evaluation_categories: list[str] = Field(default_factory=list)
    excluded_criteria: list[str] = Field(default_factory=list)
    ambiguous_requirements: list[dict[str, Any]] = Field(default_factory=list)
    clarification_questions: list[str] = Field(default_factory=list)
    ambiguity_resolution_notes: list[str] = Field(default_factory=list)
    created_by: str
    approved_by: str | None = None
    approved_at: str | None = None
    status: Literal["draft", "approved"] = "draft"

    @model_validator(mode="after")
    def require_approval_metadata(self) -> "RoleRubric":
        if self.status == "approved" and (not self.approved_by or not self.approved_at):
            raise ValueError("approved rubrics require approved_by and approved_at")
        return self


class CandidateProfile(BaseModel):
    candidate_id: str = Field(default_factory=lambda: str(uuid4()))
    source_documents: list[SourceDocument]
    contact_fields_detected: list[str] = Field(default_factory=list)
    work_history: list[dict[str, Any]] = Field(default_factory=list)
    education: list[dict[str, Any]] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)
    project_highlights: list[str] = Field(default_factory=list)
    evidence_snippets: list[EvidenceSnippet] = Field(default_factory=list)
    missing_or_unclear_information: list[str] = Field(default_factory=list)
    profile_corrections: list[dict[str, Any]] = Field(default_factory=list)


class FitAssessment(BaseModel):
    candidate_id: str
    role_rubric_id: str
    criterion_assessments: list[CriterionAssessment] = Field(default_factory=list)
    strengths: list[str] = Field(default_factory=list)
    gaps: list[str] = Field(default_factory=list)
    follow_up_questions: list[str] = Field(default_factory=list)
    fit_category: FitCategory
    confidence_level: Literal["low", "medium", "high"]
    evidence_references: list[str] = Field(default_factory=list)
    generated_at: str


class ComplianceReview(BaseModel):
    unsupported_claims: list[str] = Field(default_factory=list)
    protected_attribute_warnings: list[str] = Field(default_factory=list)
    missing_evidence_warnings: list[str] = Field(default_factory=list)
    overconfidence_warnings: list[str] = Field(default_factory=list)
    prompt_injection_flags: list[str] = Field(default_factory=list)
    required_human_actions: list[str] = Field(default_factory=list)
    review_status: ComplianceStatus


class InterviewKit(BaseModel):
    questions: list[InterviewQuestion] = Field(default_factory=list)


class CandidateReport(BaseModel):
    candidate_id: str
    role_rubric_summary: str
    candidate_summary: str
    fit_assessment: FitAssessment
    interview_kit: InterviewKit
    compliance_review: ComplianceReview
    human_reviewer: str | None = None
    human_reviewed_at: str | None = None
    human_decision_note: str | None = None
    exported_at: str | None = None


class GenerateRubricRequest(BaseModel):
    role_title: str
    department: str = "Unspecified"
    job_description: str = Field(min_length=20)
    recruiter_notes: str | None = None
    created_by: str


class CandidatePacketRequest(BaseModel):
    candidate_id: str | None = None
    role_rubric: RoleRubric
    source_documents: list[SourceDocument] = Field(min_length=1)
    profile_corrections: list[dict[str, Any]] = Field(default_factory=list)


class CandidatePacketResponse(BaseModel):
    run_id: str
    candidate_profile: CandidateProfile
    fit_assessment: FitAssessment
    compliance_review: ComplianceReview
    interview_kit: InterviewKit
    candidate_report: CandidateReport
    status: Literal["ready_for_human_review", "ready_with_warnings", "blocked_until_resolved"]
