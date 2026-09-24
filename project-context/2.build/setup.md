# Build Setup Artifact: Recruitment Assistant

**Persona:** Project Manager (`project-mgr`)  
**Action:** `*setup-project` / `*install-dependencies` / `*configure-env` / `*document-setup`  
**Date:** 2026-09-23  
**Runtime:** CrewAI (`crewai`)  
**Status:** Build setup documented for MVP local execution

---

## Setup Summary

The Build phase uses a two-service local application:

- FastAPI backend under `src/backend` for CrewAI orchestration, schema validation, guardrails, and recruitment workflow APIs.
- Next.js frontend under `src/frontend` for role intake, rubric approval, candidate packet review, compliance warning acknowledgement, and report preview gates.

The selected AAMAD runtime is CrewAI and must be set as `AAMAD_TARGET_RUNTIME=crewai` in local shells and environment files.

## Environment Setup

Create local configuration from the example file:

```bash
cp .env.example .env
```

Confirm or set the runtime target:

```bash
export AAMAD_TARGET_RUNTIME=crewai
```

Optional provider settings are documented in `.env.example`. The backend can return conservative fallback artifacts for smoke testing when provider credentials are not configured.

## Backend Setup

From the repository root:

```bash
pip install -r src/backend/requirements.txt
PYTHONPATH=src/backend uvicorn app.main:app --reload
```

The backend serves:

- `GET /api/health`
- `POST /api/rubrics/generate`
- `POST /api/candidate-packets`

Default URL: `http://127.0.0.1:8000`.

## Frontend Setup

From `src/frontend`:

```bash
corepack npm install
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000 corepack npm run dev
```

Default URL: `http://127.0.0.1:3000`.

## Validation Commands

Backend compile check:

```bash
PYTHONPATH=src/backend python -m compileall src/backend/app
```

Frontend checks:

```bash
cd src/frontend
corepack npm run lint
corepack npm run build
```

AAMAD Build gate:

```bash
aamad validate --phase build
```

## Sources

- `project-context/1.define/prd.md`
- `project-context/1.define/sad.md`
- `.env.example`
- `src/backend/requirements.txt`
- `src/frontend/package.json`
- `src/backend/app/main.py`
- `src/frontend/src/app/page.tsx`

## Assumptions

- Python and Node.js are already available in the developer environment.
- `corepack npm` is the working package-manager path for this WSL workspace.
- The local MVP does not require database, object storage, authentication, or async worker setup.
- Provider credentials are optional for local smoke validation because fallback artifacts are implemented.

## Open Questions

- Which exact Python virtual environment should be standardized for CI and contributor onboarding?
- Should the project pin a package-manager version with `packageManager` in `src/frontend/package.json`?
- Which deployment environment should own production secrets and runtime variables?

## Audit

| Item | Value |
|---|---|
| AAMAD_TARGET_RUNTIME=crewai | Confirmed selected runtime for Build phase |
| Backend framework | FastAPI |
| Agent runtime | CrewAI |
| Frontend framework | Next.js App Router |
| Backend dependency file | `src/backend/requirements.txt` |
| Frontend dependency file | `src/frontend/package.json` |
| Environment example | `.env.example` |