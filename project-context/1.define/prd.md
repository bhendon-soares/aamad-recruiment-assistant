# Product Requirements Document (PRD): Recruitment Assistant

**Product:** Recruitment Assistant Application  
**Phase:** AAMAD Define  
**Primary persona:** Product Manager (`product-mgr`)  
**Requested workflow:** `*create-prd`  
**Upstream artifact:** `project-context/1.define/mrd.md`  
**Target implementation runtime:** CrewAI (`crewai`)  
**Date:** 2026-09-23  
**Status:** Draft v0.1 for stakeholder review

---

## 1. Executive Summary

The Recruitment Assistant is a human-in-the-loop AI application that helps recruiters and hiring managers convert job requirements and candidate materials into structured, evidence-linked candidate assessments and interview preparation packets. The MVP will use a CrewAI multi-agent workflow to analyze job descriptions, normalize candidate profiles, compare candidates against an approved rubric, check outputs for compliance and unsupported claims, and generate recruiter-facing reports.

The product must remain decision-support software. It must not automatically reject candidates, finalize rankings, or send candidate communications without explicit human review and confirmation. The first release should optimize for recruiter productivity, consistency, explainability, privacy, and auditability.

### Product goals

1. Reduce recruiter time spent producing first-pass candidate summaries and interview kits.
2. Improve consistency by evaluating candidates against recruiter-approved role criteria.
3. Increase trust through source-linked recommendations and visible uncertainty.
4. Reduce compliance risk through human oversight, logging, and fairness-oriented guardrails.
5. Establish a CrewAI-native architecture that can later support ATS integrations and richer governance workflows.

### Non-goals for MVP

1. No autonomous rejection or final hiring decision.
2. No unsupervised web scraping or social media sourcing.
3. No ATS write-back automation.
4. No candidate outreach automation.
5. No legal determination of compliance; the product supports review but does not replace counsel.

---

## 2. Market Context & User Analysis

### 2.1 Target users

| User | Needs | Product responsibilities |
|---|---|---|
| Recruiter | Fast candidate review, consistent notes, shortlist prep | Provide evidence-linked summaries, rubric assessment, warnings, exports |
| Hiring manager | Clear comparison of candidates against role needs | Provide concise candidate packets and interview questions |
| Recruiting operations/admin | Process consistency, data controls, templates | Configure rubrics, retention, access, model/provider settings |
| Compliance/legal reviewer | Auditability, traceability, risk visibility | Provide logs, source references, human decision records, risk flags |
| Candidate | Fair treatment, privacy, transparency where required | Avoid unsupported/prohibited inferences and support disclosure workflows |

### 2.2 Primary jobs to be done

1. As a recruiter, I want to convert a job description into an editable hiring rubric so that candidate reviews are consistent.
2. As a recruiter, I want candidate resumes summarized with evidence references so that I can quickly understand relevant experience.
3. As a hiring manager, I want to see how each candidate maps to the role criteria so that I can prepare focused interviews.
4. As a compliance reviewer, I want to inspect the basis for AI-generated recommendations so that I can identify unsupported or risky conclusions.
5. As an admin, I want to control retention and access so that candidate data is handled appropriately.

### 2.3 Success metrics

| Metric | MVP target |
|---|---:|
| Recruiter time saved per candidate packet | 30% reduction vs manual baseline in pilot |
| Recruiter hours saved per week | At least 4 hours saved per recruiter per week during pilot |
| Unsupported claim rate after compliance guardrail | < 5% of generated candidate claims in sampled review |
| Recruiter correction rate | Tracked; baseline established during pilot |
| Human review completion before export | 100% |
| Candidate auto-rejection events | 0 |
| Audit package completeness | 100% of exported candidate packets include role rubric, source references, warnings, and human reviewer |
| Agent run failure rate | < 3% of candidate processing jobs in pilot |

---

## 3. Technical Requirements & Architecture

### 3.1 Runtime and orchestration

The system will use CrewAI as the orchestration runtime. Each product workflow maps to a crew made of specialized agents and tasks. The MVP should use a sequential process unless later architecture work identifies a need for hierarchical orchestration.

### 3.2 Proposed CrewAI agents

| Agent | Role | Primary responsibilities | Output |
|---|---|---|---|
| Job Requirements Analyst | Convert job description into structured rubric | Extract required skills, nice-to-have skills, responsibilities, seniority, constraints, ambiguity flags, evaluation categories | `RoleRubric` |
| Candidate Profiler | Normalize candidate materials | Parse resume/profile, summarize work history, extract evidence snippets, identify missing data | `CandidateProfile` |
| Candidate Fit Assessor | Compare candidate to approved rubric | Map evidence to criteria, identify strengths/gaps, produce categorical fit assessment | `FitAssessment` |
| Interview Prep Specialist | Generate interview kit | Create role-specific and candidate-specific questions tied to gaps and strengths | `InterviewKit` |
| Compliance & Fairness Reviewer | Review generated outputs | Detect unsupported claims, prohibited criteria, protected-attribute inferences, missing citations, overconfident language | `ComplianceReview` |
| Hiring Report Writer | Assemble final packet | Compile candidate summary, rubric assessment, warnings, interview kit, and human decision fields | `CandidateReport` |

### 3.3 Proposed CrewAI tasks

| Task | Agent | Inputs | Dependencies | Human input required |
|---|---|---|---|---|
| Extract role rubric | Job Requirements Analyst | Job description, recruiter notes | None | Recruiter resolves ambiguity warnings and approves/edits rubric before candidate analysis |
| Build candidate profile | Candidate Profiler | Resume/CV text, optional authorized profile text | Approved rubric optional for relevance filtering | Recruiter can correct extracted fields |
| Assess fit | Candidate Fit Assessor | Approved rubric, candidate profile, evidence map | Candidate profile, approved rubric | Human review before shortlist/export |
| Generate interview kit | Interview Prep Specialist | Fit assessment, candidate profile, role rubric | Fit assessment | Recruiter can edit questions |
| Run compliance review | Compliance & Fairness Reviewer | All prior outputs and source references | Candidate profile, fit assessment, interview kit | Required warning acknowledgement |
| Produce candidate report | Hiring Report Writer | All approved outputs, warnings, human reviewer identity | Compliance review | Human confirmation required |

### 3.4 Core data objects

#### RoleRubric

Required fields:

- `role_title`
- `department`
- `must_have_criteria[]`
- `nice_to_have_criteria[]`
- `responsibilities[]`
- `seniority_level`
- `location_or_work_authorization_constraints`
- `evaluation_categories[]`
- `excluded_criteria[]`
- `ambiguous_requirements[]`
- `clarification_questions[]`
- `ambiguity_resolution_notes[]`
- `created_by`
- `approved_by`
- `approved_at`

#### CandidateProfile

Required fields:

- `candidate_id`
- `source_documents[]`
- `contact_fields_detected`
- `work_history[]`
- `education[]`
- `skills[]`
- `certifications[]`
- `project_highlights[]`
- `evidence_snippets[]`
- `missing_or_unclear_information[]`
- `profile_corrections[]`

#### FitAssessment

Required fields:

- `candidate_id`
- `role_rubric_id`
- `criterion_assessments[]`
- `strengths[]`
- `gaps[]`
- `follow_up_questions[]`
- `fit_category`
- `confidence_level`
- `evidence_references[]`
- `generated_at`

Allowed MVP `fit_category` values:

- `strong_potential_fit`
- `potential_fit_with_gaps`
- `insufficient_evidence`
- `not_aligned_with_current_rubric`

The system must not label a candidate as rejected.

#### ComplianceReview

Required fields:

- `unsupported_claims[]`
- `protected_attribute_warnings[]`
- `missing_evidence_warnings[]`
- `overconfidence_warnings[]`
- `prompt_injection_flags[]`
- `required_human_actions[]`
- `review_status`

Allowed `review_status` values:

- `passed`
- `passed_with_warnings`
- `blocked_until_resolved`

#### CandidateReport

Required fields:

- `candidate_id`
- `role_rubric_summary`
- `candidate_summary`
- `fit_assessment`
- `interview_kit`
- `compliance_review`
- `human_reviewer`
- `human_reviewed_at`
- `human_decision_note`
- `exported_at`

---

## 4. Functional Requirements

### 4.1 Role intake and rubric management

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| FR-001 | Users can create a role by entering or uploading a job description. | Must | User can save a role with title, description, and metadata. |
| FR-002 | The system generates a structured role rubric from the job description. | Must | Generated rubric separates must-have, nice-to-have, responsibilities, seniority, and exclusions. |
| FR-003 | Users can edit the generated rubric before candidate analysis. | Must | Candidate assessment cannot start until rubric status is `approved`. |
| FR-004 | The system records rubric version history. | Must | Each rubric edit stores user, timestamp, changed fields, and version. |
| FR-005 | Users can mark criteria as excluded/prohibited. | Should | Excluded criteria are visible to the compliance review and cannot be used for fit assessment. |
| FR-032 | The system detects ambiguous, missing, or contradictory job requirements during rubric generation. | Must | Vague terms, conflicting seniority signals, undefined requirements, and criteria without evaluation basis are captured in `ambiguous_requirements[]` with severity and source reference. |
| FR-033 | The system blocks candidate assessment when unresolved high-severity job requirement ambiguity remains. | Must | Rubric approval requires the user to resolve the ambiguity, remove the criterion, or explicitly waive it with a rationale stored in `ambiguity_resolution_notes[]`. |
| FR-034 | The system generates clarification prompts for ambiguous job requirements. | Should | Each ambiguity includes a recruiter-facing clarification question and suggested resolution options where possible. |

### 4.2 Candidate ingestion

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| FR-006 | Users can upload candidate resumes/CVs. | Must | MVP accepts PDF, DOCX, and plain text where parser support is available. |
| FR-007 | Users can paste candidate profile text manually. | Must | Pasted profile text is stored as a source document. |
| FR-008 | The system extracts candidate profile fields and evidence snippets. | Must | Extracted profile includes source references for each substantive claim. |
| FR-009 | Users can correct extracted candidate fields. | Must | Corrections are stored with user and timestamp and used in downstream assessment. |
| FR-010 | The system flags missing or unclear candidate information. | Should | Missing evidence appears in the candidate profile and fit assessment. |

### 4.3 Candidate assessment

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| FR-011 | The system assesses candidates only against an approved role rubric. | Must | Assessment task is blocked for unapproved rubrics. |
| FR-012 | The system generates criterion-level fit assessments. | Must | Each criterion includes status, rationale, confidence, and evidence references. |
| FR-013 | The system uses categorical fit labels instead of final hiring decisions. | Must | No generated output includes `reject`, `hire`, or equivalent final decision labels. |
| FR-014 | Users can compare multiple candidate packets for a role. | Should | Comparison view shows criteria, fit category, strengths, gaps, and warning status. |
| FR-015 | Users can override or annotate AI-generated assessments. | Must | Overrides are auditable and visible in exported reports. |

### 4.4 Compliance, fairness, and guardrails

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| FR-016 | The system runs compliance review before report export. | Must | Export is blocked if compliance status is `blocked_until_resolved`. |
| FR-017 | The system flags unsupported claims. | Must | Any claim without source evidence is removed, downgraded, or flagged. |
| FR-018 | The system flags protected-attribute or proxy-attribute usage. | Must | Outputs warn when age, gender, race, disability, religion, family status, or similar attributes are detected or inferred. |
| FR-019 | The system treats candidate documents as untrusted input. | Must | Prompt-injection-like instructions inside candidate documents are flagged and not followed. |
| FR-020 | The system requires human confirmation before shortlist export. | Must | Export requires reviewer identity and human decision note. |
| FR-021 | The system provides an audit package for each exported report. | Must | Audit package includes inputs, rubric version, agent run metadata, warnings, edits, and reviewer identity. |

### 4.5 Interview preparation

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| FR-022 | The system generates candidate-specific interview questions. | Must | Questions map to rubric criteria, strengths, gaps, or missing evidence. |
| FR-023 | Users can edit interview questions. | Must | Edited interview kits are versioned before export. |
| FR-024 | The system avoids questions based on protected attributes. | Must | Compliance review flags or blocks prohibited questions. |

### 4.6 Reporting and export

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| FR-025 | Users can generate a candidate report. | Must | Report includes candidate summary, fit assessment, interview kit, warnings, and human review fields. |
| FR-026 | Users can export reports as Markdown or PDF. | Should | Export preserves source references and audit metadata. |
| FR-027 | Users can export a role-level shortlist summary. | Should | Summary includes candidates, fit categories, warning statuses, and reviewer notes. |
| FR-028 | The product shows a clear distinction between AI-generated content and human edits. | Must | Report marks generated content, edited content, and final human notes. |

### 4.7 Administration

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| FR-029 | Admins can configure retention settings. | Should | Retention applies to source docs, derived outputs, logs, and exports. |
| FR-030 | Admins can configure allowed model/provider settings. | Should | Runtime uses only configured providers. |
| FR-031 | Admins can manage user roles. | Should | Recruiter, hiring manager, admin, and auditor roles have distinct permissions. |

---

## 5. Non-Functional Requirements

### 5.1 Security

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| NFR-001 | Encrypt data in transit. | Must | All application traffic uses TLS in production. |
| NFR-002 | Encrypt sensitive data at rest. | Must | Candidate documents and reports are encrypted in storage. |
| NFR-003 | Enforce role-based access control. | Must | Users only access roles/candidates permitted by assigned role. |
| NFR-004 | Minimize sensitive data in logs. | Must | Logs avoid full resume text unless explicitly configured for secure audit storage. |
| NFR-005 | Record security-relevant audit events. | Must | Login, access, export, delete, permission change, and model-run events are logged. |

### 5.2 Privacy and data governance

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| NFR-006 | Support data deletion for candidate records. | Must | Authorized users can delete candidate source documents and derived outputs. |
| NFR-007 | Support retention policies. | Should | Data can expire by role, tenant, or configured period. |
| NFR-008 | Track source and purpose for candidate data. | Must | Each candidate source document records origin, uploader, timestamp, and use purpose. |
| NFR-009 | Support candidate disclosure workflows where required. | Should | System can export AI-use disclosure/audit summary for admin review. |

### 5.3 Reliability and observability

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| NFR-010 | Agent jobs are retryable and traceable. | Must | Failed tasks show status, error, retry count, and correlation ID. |
| NFR-011 | Multi-candidate processing is asynchronous. | Should | User can leave processing view and return to completed results. |
| NFR-012 | The system exposes run metrics. | Should | Admin view shows task latency, failure rate, cost estimate, and guardrail warnings. |

### 5.4 Performance

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| NFR-013 | Single candidate packet generation completes within practical recruiter workflow time. | Should | Pilot target: under 3 minutes per candidate for typical resume and role rubric. |
| NFR-014 | UI remains responsive during agent processing. | Must | Long-running tasks show progress/status without blocking navigation. |

### 5.5 Compliance and human oversight

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| NFR-015 | Maintain human oversight for candidate-impacting outputs. | Must | Report export requires human reviewer confirmation. |
| NFR-016 | Preserve technical documentation for agent behavior. | Must | Agent roles, task definitions, prompts/configs, model provider, and output schemas are versioned. |
| NFR-017 | Provide explainability for recommendations. | Must | Fit rationale links to role criteria and candidate evidence. |
| NFR-018 | Support audit review. | Must | Admin/auditor can retrieve role rubric, candidate sources, agent outputs, warnings, edits, and export history. |

---

## 6. User Experience Design

### 6.1 Primary navigation

MVP application areas:

- Roles
- Candidates
- Reviews
- Reports
- Audit
- Admin Settings

### 6.2 Key screens

#### Role Intake

Required UI elements:

- Job description input/upload.
- Role metadata fields.
- Rubric generation action.
- Editable rubric sections.
- Approval status and version history.

#### Candidate Queue

Required UI elements:

- Candidate upload/paste action.
- Processing status.
- Parser warnings.
- Candidate source list.
- Batch processing controls.

#### Candidate Packet

Required UI elements:

- Candidate summary.
- Source/evidence panel.
- Criterion-level assessment.
- Strengths and gaps.
- Missing evidence warnings.
- Human correction controls.

#### Compliance Review

Required UI elements:

- Unsupported claims.
- Protected/proxy attribute warnings.
- Prompt injection flags.
- Required human actions.
- Resolve/acknowledge controls.

#### Interview Kit

Required UI elements:

- Questions grouped by rubric criterion.
- Evidence/gap linkage.
- Editing controls.
- Compliance warning state.

#### Report Export

Required UI elements:

- Report preview.
- AI-generated vs human-edited content markers.
- Human reviewer identity.
- Human decision note.
- Export action.
- Audit package link.

### 6.3 UX guardrails

- Candidate analysis button is disabled until rubric approval.
- Export button is disabled until compliance review passes or warnings are acknowledged.
- No UI copy should imply the AI makes final hiring decisions.
- Fit categories must be displayed with explanatory text and source references.
- Compliance warnings must be visible before export.

---

## 7. Success Metrics & KPIs

### 7.1 Product metrics

- Median time to generate first candidate packet.
- Recruiter time saved per candidate versus baseline.
- Recruiter hours saved per week, calculated as baseline manual review hours minus AI-assisted review hours for completed candidate packets.
- Number of candidate packets reviewed per recruiter per week.
- User acceptance rate of generated summaries.
- User edit/correction rate.
- Interview kit usage rate.

### 7.2 Quality metrics

- Unsupported claim rate.
- Missing evidence rate.
- Guardrail block rate.
- Human override rate.
- Candidate profile extraction accuracy from sampled review.
- Compliance warning precision from sampled review.

### 7.3 Operational metrics

- Agent task success rate.
- Agent task latency by task type.
- Cost per candidate packet.
- Export volume.
- Audit retrieval success rate.

### 7.4 Risk metrics

- Protected/proxy attribute warning rate.
- Reports exported with warnings acknowledged.
- Prompt injection flag rate.
- Data deletion request completion time.
- Access-control violation attempts.

---

## 8. Implementation Strategy

### 8.1 MVP phases

#### Phase 1: Prototype workflow

- Define CrewAI agents and task schemas.
- Implement job description to rubric generation.
- Implement candidate text ingestion.
- Generate candidate profile, fit assessment, interview kit, and compliance review.
- Export Markdown report.

#### Phase 2: Web application MVP

- Build role/rubric UI.
- Build candidate upload and processing queue.
- Build candidate packet review UI.
- Add human review and export controls.
- Persist audit logs and version history.

#### Phase 3: Pilot hardening

- Add PDF/DOCX parsing improvements.
- Add role-based access control.
- Add retention/deletion controls.
- Add observability dashboard.
- Add sampled quality review workflow.

#### Phase 4: Production readiness

- Security review.
- Compliance review.
- Load/cost testing.
- Deployment automation.
- User guide and admin runbook.

### 8.2 Suggested build artifacts

| AAMAD artifact | Purpose | Status |
|---|---|---|
| MRD | Market and requirement context | Created as `project-context/1.define/mrd.md` |
| PRD | Product requirements | This document |
| SAD | System architecture design | Pending |
| SFS | Software feature specification | Pending after architecture decisions |
| Test plan | QA validation | Pending |
| Security assessment | Security review | Required by config, pending |
| User guide | End-user documentation | Required by config, pending |

### 8.3 Dependencies

- CrewAI runtime and project structure.
- LLM/model provider with acceptable data handling terms.
- Resume text extraction library/service.
- Application database for roles, candidates, outputs, and audit events.
- Authentication and authorization layer.
- Secure object storage for candidate documents.
- Export renderer for Markdown/PDF.

---

## 9. Launch & Go-to-Market Strategy

### 9.1 Initial launch model

Start with a controlled pilot rather than broad launch. Use a small number of internal or consented recruiting workflows to validate accuracy, trust, and compliance procedures.

### 9.2 Pilot criteria

- 2–3 roles with clearly written job descriptions.
- 20–50 synthetic or consented candidate profiles.
- Recruiters willing to compare AI-assisted workflow to baseline manual review.
- Compliance/legal reviewer available to evaluate output risks.

### 9.3 Launch readiness criteria

- No auto-rejection behavior present.
- Human review required for all exports.
- Audit package available for every exported report.
- Unsupported claim rate within target.
- Security controls reviewed.
- Privacy/retention policy configured.
- Legal/compliance review completed for target jurisdiction.

---

## 10. Quality Assurance Checklist

### Functional QA

- [ ] Role can be created from job description.
- [ ] Rubric is generated with must-have and nice-to-have criteria.
- [ ] Ambiguous, missing, or contradictory job requirements are flagged during rubric generation.
- [ ] Candidate assessment is blocked when high-severity job requirement ambiguity is unresolved.
- [ ] Ambiguity resolution notes are recorded in rubric version history.
- [ ] Candidate assessment is blocked before rubric approval.
- [ ] Candidate resume/text can be ingested.
- [ ] Candidate profile includes evidence references.
- [ ] Fit assessment includes criterion-level rationale.
- [ ] Interview kit maps questions to criteria/gaps.
- [ ] Compliance review runs before export.
- [ ] Export is blocked when compliance status is blocking.
- [ ] Human reviewer and decision note are required before export.
- [ ] Audit package includes required metadata.

### Safety and compliance QA

- [ ] System does not generate final hire/reject decisions.
- [ ] System flags unsupported claims.
- [ ] System flags protected/proxy attribute references.
- [ ] System does not follow instructions embedded inside candidate documents.
- [ ] Human edits are recorded separately from generated content.
- [ ] Rubric version history is preserved.
- [ ] Candidate deletion removes source and derived records according to policy.

### Security QA

- [ ] Candidate documents are access-controlled.
- [ ] Sensitive data is not emitted to ordinary application logs.
- [ ] Export actions are audited.
- [ ] Retention/deletion controls are tested.
- [ ] Model provider configuration is restricted to admin users.

### Performance QA

- [ ] Candidate packet generation time measured.
- [ ] Multi-candidate processing remains usable under pilot load.
- [ ] Failed tasks expose actionable retry/error state.

---

## Sources

### User/workspace sources

1. User request in current session: create MRD and PRD for a recruitment assistant application based on the CrewAI recruitment example; run `*create-mrd` then `*create-prd` or `*create-context`; complete Sources, Assumptions, Open Questions, and Audit.
2. MRD created in this workspace: `project-context/1.define/mrd.md`.
3. Workspace AAMAD configuration: `aamad.config.example.yml` indicates `runtime.target: crewai`, security assessment required, unit/integration tests required, user guide required.
4. AAMAD templates read from workspace:
   - `.cursor/templates/mrd-template.md`
   - `.cursor/templates/prd-template.md`
5. AAMAD Product Manager agent capabilities in workspace: `.github/agents/product-mgr.agent.md` supports `*create-mrd`, `*create-prd`, `*create-context`, and `*create-stories`.

### External sources consulted

1. CrewAI documentation, Agents concept page: agents are autonomous units with role, goal, tools, memory/context, delegation, and structured behavior. URL: https://docs.crewai.com/concepts/agents
2. CrewAI documentation, Tasks concept page: tasks define description, expected output, assigned agent, tools, context dependencies, human input, guardrails, and structured outputs. URL: https://docs.crewai.com/concepts/tasks
3. CrewAI documentation, Crews concept page: crews coordinate agents and tasks using sequential or hierarchical processes, memory, callbacks, logs, checkpointing, and kickoff execution. URL: https://docs.crewai.com/concepts/crews
4. EU Artificial Intelligence Act, Regulation (EU) 2024/1689: employment, workers management, and access to self-employment AI systems are addressed as high-risk use cases; high-risk systems require risk management, data governance, technical documentation, logging, transparency, human oversight, accuracy/robustness/cybersecurity, and deployer obligations. URL: https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689
5. NIST AI Risk Management Framework overview: voluntary framework for managing AI risks to individuals, organizations, and society and incorporating trustworthiness into AI design, development, use, and evaluation. URL: https://www.nist.gov/itl/ai-risk-management-framework
6. HHS HIPAA Privacy Rule summary: used only as a general privacy reference for minimum necessary, safeguards, and protected information concepts; HIPAA may not apply to ordinary recruiting data unless health data or covered entities are involved. URL: https://www.hhs.gov/hipaa/for-professionals/privacy/laws-regulations/index.html
7. IBM Cost of a Data Breach report landing page: used only as a general cybersecurity risk signal for AI/agentic identity and data protection concerns; not used for numeric claims due dynamic page values. URL: https://www.ibm.com/reports/data-breach

### Source limitations

- A direct GitHub search for a public CrewAI recruitment example returned no usable snippets in this session. The PRD therefore relies on the user-provided description of the CrewAI recruitment example plus CrewAI’s official agent/task/crew documentation.
- EEOC pages attempted during research returned fetch errors in this environment, so no EEOC content is cited as a direct source in this PRD.
- This PRD is product and engineering guidance, not legal advice.

---

## Assumptions

1. The target runtime is CrewAI (`crewai`).
2. MVP will operate as a human-in-the-loop decision-support tool.
3. Recruiters or authorized users provide candidate materials.
4. MVP will not perform autonomous sourcing, rejection, final ranking, or outreach.
5. Role rubric approval is mandatory before candidate assessment.
6. Candidate-facing or decision-impacting actions require human review.
7. Legal/compliance review will occur before production deployment.
8. Candidate data is sensitive and requires encryption, access control, retention, and deletion support.
9. Initial deployment can be a controlled pilot with synthetic or consented data.
10. ATS integration is deferred until after core workflow validation.
11. Numeric scoring is not required for MVP and may be feature-flagged later.
12. Structured outputs will be used for key CrewAI task results.

---

## Open Questions

1. Which jurisdictions must be supported at MVP launch?
2. Which customers or internal teams will participate in pilot validation?
3. Should MVP support numeric scores, categorical fit labels only, or configurable scoring?
4. Which model providers are approved for candidate data processing?
5. What identity provider should be used for authentication?
6. What retention period is required for candidate documents and audit logs?
7. Should reports include candidate-facing disclosure language?
8. What document formats are mandatory for resume ingestion?
9. Should candidate comparison be available in MVP or deferred to post-MVP?
10. Who may approve role rubrics: recruiter only, hiring manager only, or both?
11. What exact protected/proxy attribute policy should be implemented by jurisdiction?
12. What audit export format is required by legal/compliance teams?
13. Should user corrections be used for future evaluation improvements, and under what consent/data policy?
14. Is cloud deployment allowed for candidate data, or is local/private deployment required?

---

## Audit

| Field | Value |
|---|---|
| Artifact | `project-context/1.define/prd.md` |
| Action | `create-prd` |
| Persona | `product-mgr` |
| Requested by | User in current Copilot/AAMAD session |
| Created at | 2026-09-23 |
| Runtime resolved | `crewai` |
| Templates referenced | `.cursor/templates/prd-template.md` |
| Upstream artifact | `project-context/1.define/mrd.md` |
| Primary input | User request: recruitment assistant based on CrewAI recruitment example |
| Repository context checked | `project-context/1.define/`, `.cursor/templates/`, `.github/agents/`, `aamad.config.example.yml` |
| External research performed | CrewAI docs, EU AI Act, NIST AI RMF, HHS HIPAA Privacy Rule summary, IBM data breach report landing page |
| Known gaps | Direct CrewAI recruitment example source not retrieved; EEOC pages not fetched successfully; legal review pending; SAD still needed |
| Recommended next action | Run `*handoff system.arch` / create SAD |
