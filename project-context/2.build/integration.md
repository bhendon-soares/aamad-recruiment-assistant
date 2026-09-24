# Integration Build Artifact: Recruitment Assistant

**Persona:** Integration Engineer (`integration-eng`)  
**Action:** `*integrate-api`  
**Date:** 2026-09-23  
**Runtime:** CrewAI (`crewai`)  
**Status:** MVP frontend/backend integration implemented and smoke-validated

---

## Inputs Reviewed

- `project-context/1.define/prd.md`
- `project-context/1.define/sad.md`
- `project-context/2.build/frontend.md`
- `project-context/2.build/backend.md`

`project-context/2.build/setup.md` is still missing. Integration proceeded from the PRD, SAD, frontend build artifact, and backend build artifact.

---

## Integration Summary

The Next.js MVP UI now calls the FastAPI backend for the core recruitment-assistant flow:

1. Generate a draft role rubric through `POST /api/rubrics/generate`.
2. Keep the required human approval gate in the frontend.
3. Submit an approved rubric and pasted candidate material through `POST /api/candidate-packets`.
4. Render backend-generated candidate packet, fit assessment, compliance review, evidence references, run ID, and report preview fields.

No external integrations, ATS write-back, candidate outreach, or third-party services were added.

---

## Endpoint Contract

### Health

- Method: `GET`
- Path: `/api/health`
- Response shape: `{ "status": "ok", "runtime": "crewai" }`
- Streaming: none

### Generate Rubric

- Method: `POST`
- Path: `/api/rubrics/generate`
- Request schema:
  - `role_title: string`
  - `department: string`
  - `job_description: string` with backend minimum length validation
  - `recruiter_notes: string | null`
  - `created_by: string`
- Response schema: `RoleRubric`
- Streaming: none; response is a final schema-validated JSON object
- Error envelope: FastAPI validation and application errors return `{ "detail": ... }`

### Generate Candidate Packet

- Method: `POST`
- Path: `/api/candidate-packets`
- Request schema:
  - `candidate_id: string | null`
  - `role_rubric: RoleRubric`
  - `source_documents: SourceDocument[]`
  - `profile_corrections: object[]`
- Response schema: `CandidatePacketResponse`
- Streaming: none; response is a final schema-validated JSON object
- Error envelope: FastAPI validation and application errors return `{ "detail": ... }`
- Gate: backend rejects candidate packet generation unless `role_rubric.status` is `approved` and approval metadata is present.

---

## Implementation Notes

- Added backend CORS middleware for local Next.js origins: `http://localhost:3000` and `http://127.0.0.1:3000`.
- Added optional `candidate_id` to `CandidatePacketRequest` so the candidate identifier entered in the UI is preserved in backend packet output.
- Updated the backend fallback path so CrewAI provider/runtime failures use the documented local fallback instead of aborting API requests. This supports MVP smoke testing when CrewAI is installed but model-provider credentials are absent or invalid.
- Replaced local-only frontend rubric and packet generators with typed `fetch` calls to the FastAPI API.
- Kept the human rubric approval gate and export gate in the frontend prototype, consistent with the PRD/SAD decision-support requirements.
- Added `NEXT_PUBLIC_API_BASE_URL` support for the frontend; default is `http://127.0.0.1:8000`.

---

## Verification

### Backend API Round Trip

Validated with FastAPI `TestClient` using the frontend MVP payload shape:

- `POST /api/rubrics/generate` returned `200`.
- The returned rubric was marked approved with human-review metadata.
- `POST /api/candidate-packets` returned `200`.
- Candidate ID was preserved as `CAND-1042`.
- Packet status returned `ready_with_warnings`.
- Fit category returned `potential_fit_with_gaps`.
- Compliance review status returned `passed_with_warnings`.

### Build and Static Checks

- Backend compile check passed for edited backend modules.
- Frontend lint passed.
- Frontend production build passed with Next.js 16.3.6.

Known environment warning: `corepack npm` reports that npm 12.1.0 prefers Node.js `^22.22.2 || ^24.15.0 || >=26.0.0`; the current environment is Node.js 22.22.1. Lint and build still passed.

---

## Known Issues and Caveats

- `project-context/2.build/setup.md` is missing, so integration could not confirm project-manager setup conventions from that artifact.
- The current integration uses synchronous, non-streaming API calls. The SAD leaves status-event streaming optional, but it is not implemented in this MVP slice.
- There is no async job queue or `/api/agent-runs/{run_id}` status endpoint yet; candidate packet generation returns a final response.
- CrewAI execution depends on model-provider configuration. When CrewAI or provider execution fails locally, the backend returns conservative fallback artifacts for smoke testing.
- The frontend currently supports pasted candidate text only. PDF/DOCX upload controls remain disabled stubs.
- Export remains a frontend gate and preview only; no backend Markdown/PDF export endpoint is implemented yet.
- Authentication, persistent audit storage, retention/deletion workflows, and role-based access controls are still deferred.

## Sources

- `project-context/1.define/prd.md`
- `project-context/1.define/sad.md`
- `project-context/2.build/frontend.md`
- `project-context/2.build/backend.md`
- `src/backend/app/main.py`
- `src/frontend/src/app/page.tsx`

## Assumptions

- Frontend and backend run as separate local services during Build validation.
- The MVP uses final JSON API responses rather than streaming events.
- Local fallback artifacts are acceptable for smoke testing when provider credentials are unavailable.

## Open Questions

- What is the target async queue implementation for `/api/agent-runs/{run_id}`?
- Should report export move to a backend endpoint before Deliver phase packaging?
- Which CORS origins should be allowed in the first deployed environment?

## Audit

| Item | Value |
|---|---|
| AAMAD_TARGET_RUNTIME=crewai | Confirmed selected runtime for Build phase |
| Frontend service | Next.js on `http://127.0.0.1:3000` |
| Backend service | FastAPI on `http://127.0.0.1:8000` |
| Core endpoints | `GET /api/health`, `POST /api/rubrics/generate`, `POST /api/candidate-packets` |
| Streaming | Not implemented for MVP |
