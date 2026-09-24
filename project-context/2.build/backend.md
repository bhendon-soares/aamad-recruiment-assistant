# Backend Build Artifact: Recruitment Assistant

**Persona:** Backend Developer (`backend-eng`)  
**Action:** `*develop-be`  
**Date:** 2026-09-23  
**Runtime:** CrewAI (`crewai`)  
**Status:** MVP backend scaffold implemented

---

## Inputs Reviewed

- `project-context/1.define/prd.md`
- `project-context/1.define/sad.md`
- `.github/instructions/adapter-crewai.instructions.md`
- `.cursor/rules/adapter-crewai.mdc`

`project-context/2.build/setup.md` was expected by the backend persona but is not present. Backend work proceeded from PRD, SAD, and the active CrewAI adapter rules, and this gap is recorded in Audit.

---

## Implemented Backend Scope

The backend MVP implements a CrewAI-compatible FastAPI service for the recruitment assistant workflow.

### API Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/health` | Health check with resolved runtime value |
| `POST` | `/api/rubrics/generate` | Generate a draft role rubric from job description and recruiter notes |
| `POST` | `/api/candidate-packets` | Generate candidate profile, fit assessment, compliance review, interview kit, and report draft from an approved rubric |

A non-schema `/health` alias is also available for simple local probes.

### CrewAI Runtime

Implemented `ApplicationCrew` in `src/backend/app/crews/recruitment/crew.py`.

- Loads externalized CrewAI agent definitions from `src/backend/app/crews/recruitment/config/agents.yaml`.
- Loads externalized CrewAI task definitions from `src/backend/app/crews/recruitment/config/tasks.yaml`.
- Uses `Process.sequential`.
- Disables CrewAI memory for MVP reproducibility and candidate-data minimization.
- Sets `allow_delegation: false` in each MVP agent config.
- Uses explicit task context chaining for candidate packet generation:
  - `build_candidate_profile`
  - `assess_candidate_fit`
  - `review_compliance`
  - `generate_interview_kit`
  - `draft_candidate_report`

### Application Crew Agents

| Agent | Implementation status | Responsibility |
|---|---|---|
| Researcher Agent | Implemented in YAML | Extract role requirements, normalize candidate evidence, treat candidate text as untrusted input |
| Evaluator Agent | Implemented in YAML | Assess fit against approved rubric, review evidence and compliance concerns |
| Recommender Agent | Implemented in YAML | Draft interview kit and candidate report for human review |

### Schemas and Guardrails

Implemented Pydantic models in `src/backend/app/models.py` for:

- `RoleRubric`
- `CandidateProfile`
- `FitAssessment`
- `ComplianceReview`
- `InterviewKit`
- `CandidateReport`
- request/response envelopes for rubric and candidate-packet generation

Implemented guardrail helpers in `src/backend/app/guardrails.py`.

- Validates CrewAI JSON output against Pydantic schemas.
- Blocks prohibited final-decision language such as `reject`, `rejected`, `hired`, `do not proceed`, `advance candidate`, and `final decision`.
- Enforces approved rubric metadata when `RoleRubric.status` is `approved`.
- Blocks candidate packet generation unless the supplied rubric status is `approved`.

### Dependencies

Created `src/backend/requirements.txt` with MVP backend dependencies:

- FastAPI
- Uvicorn
- CrewAI
- Pydantic
- PyYAML
- python-dotenv

---

## Files Created

- `src/backend/requirements.txt`
- `src/backend/app/__init__.py`
- `src/backend/app/main.py`
- `src/backend/app/models.py`
- `src/backend/app/guardrails.py`
- `src/backend/app/crews/__init__.py`
- `src/backend/app/crews/recruitment/__init__.py`
- `src/backend/app/crews/recruitment/crew.py`
- `src/backend/app/crews/recruitment/config/agents.yaml`
- `src/backend/app/crews/recruitment/config/tasks.yaml`
- `project-context/2.build/backend.md`

---

## Local Run Notes

Install dependencies in a Python environment:

```bash
pip install -r src/backend/requirements.txt
```

Run the API locally from the repository root:

```bash
PYTHONPATH=src/backend uvicorn app.main:app --reload
```

Health check:

```bash
curl http://127.0.0.1:8000/api/health
```

CrewAI execution requires model-provider configuration through environment variables. The fallback path returns conservative, low-confidence draft artifacts for local API testing when CrewAI is not installed or not configured.

---

## Non-MVP / Deferred Items

The following SAD/PRD capabilities are intentionally not implemented in this backend slice:

- Persistent database models and migrations.
- Object storage for uploaded candidate documents and exports.
- Authentication, authorization, and role-based permissions.
- Async job queue and `/api/agent-runs/{run_id}` status endpoint.
- PDF/DOCX parsing.
- Markdown/PDF export endpoint.
- Audit event persistence and immutable audit package retrieval.
- Retention/deletion workflows.
- Admin model/provider settings UI or service.
- ATS integrations, candidate outreach, public sourcing, analytics, and adverse-impact dashboards.

These remain follow-up build tasks for Project Manager, Integration Engineer, QA, Security, and DevOps phases.

---

## Sources

- `project-context/1.define/prd.md`
- `project-context/1.define/sad.md`
- `.github/instructions/adapter-crewai.instructions.md`
- `.cursor/rules/adapter-crewai.mdc`
- `src/backend/app/main.py`
- `src/backend/app/models.py`
- `src/backend/app/guardrails.py`
- `src/backend/app/crews/recruitment/crew.py`

## Assumptions

- The Build-phase backend is an MVP API and does not include persistent storage, authentication, or async job infrastructure.
- CrewAI/model-provider credentials may be absent in local development, so fallback artifacts support smoke validation.
- Candidate materials are treated as untrusted input and must not override system or task instructions.

## Open Questions

- Which provider credentials and model policy should be approved for non-fallback CrewAI validation?
- Which database and object storage targets should back persistent audit packages in the next build slice?
- Should async job execution be introduced before or after document upload parsing?

---

## Audit

| Item | Value |
|---|---|
| AAMAD_TARGET_RUNTIME=crewai | Confirmed selected runtime for Build phase |
| Resolved `AAMAD_TARGET_RUNTIME` | `crewai` |
| Adapter followed | `adapter-crewai` |
| Backend framework | FastAPI |
| CrewAI process | Sequential |
| CrewAI memory | Disabled |
| Delegation | Disabled for all MVP agents |
| Agent config path | `src/backend/app/crews/recruitment/config/agents.yaml` |
| Task config path | `src/backend/app/crews/recruitment/config/tasks.yaml` |
| LLM/model provider | Environment-managed; not hardcoded |
| Temperature | Environment/provider default; not hardcoded |
| Max tokens | Environment/provider default; not hardcoded |
| Crew-level rate control | `max_rpm=20` |
| Setup artifact status | `project-context/2.build/setup.md` missing |
| Validation run | `PYTHONPATH=src/backend .venv/bin/python -m py_compile src/backend/app/models.py src/backend/app/guardrails.py src/backend/app/crews/recruitment/crew.py src/backend/app/main.py` |
| Validation result | Passed |
