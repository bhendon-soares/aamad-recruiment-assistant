# QA Smoke and Acceptance Report

Date: 2026-09-23
Agent: @qa.eng
Scope: MVP recruitment assistant role/rubric/candidate-packet flow

## Inputs Reviewed

- `project-context/1.define/prd.md`
- `project-context/1.define/sad.md`
- `project-context/2.build/frontend.md`
- `project-context/2.build/backend.md`
- `project-context/2.build/integration.md`
- Current implementation in `src/backend/app` and `src/frontend/src/app/page.tsx`

No `aamad.config.yml`, `project-context/1.define/system-description.md`, `project-context/1.define/user-stories/`, or prior `project-context/2.build/qa.md` was present. No AC-* acceptance IDs were available, so checks are mapped to PRD functional requirements where applicable.

## Test Scope

Tested only implemented MVP behavior:

- Role intake to draft rubric generation.
- Human rubric approval gate.
- Candidate material paste to candidate packet generation.
- Evidence-linked fit assessment, compliance warnings, and report preview gates.
- Backend API contracts used by the frontend.

Deferred or non-MVP features were not tested as functional requirements: async job status, streaming, file upload parsing, ATS integrations, persistence, authentication, final hiring decisions, automated ranking, outreach, and backend report export.

## Unit Checks

| Check | Mapping | Result | Notes |
| --- | --- | --- | --- |
| Python compile for backend app modules | FR-001, FR-004, FR-005, FR-006 | Passed | `python -m compileall app` completed successfully. |
| Pydantic validation for approved rubrics | FR-002 | Passed | Approved rubric without `approved_by` fails validation. |
| Guardrail for final-decision language | FR-007, NFR-002 | Passed | `assert_no_final_decision_language` blocks prohibited terms such as `hired`. |

## Integration Checks

| Check | Mapping | Result | Evidence |
| --- | --- | --- | --- |
| `GET /api/health` | Runtime adapter health | Passed | Returned `{"status":"ok","runtime":"crewai"}`. |
| Invalid rubric request validation | FR-001 | Passed | Short job description returned HTTP 422. |
| Draft rubric generation | FR-001, FR-002 | Passed | `POST /api/rubrics/generate` returned HTTP 200 with `status=draft` and criteria. |
| Candidate packet blocked before rubric approval | FR-004, FR-007 | Passed | `POST /api/candidate-packets` returned HTTP 422 with approved-rubric requirement. |
| Approved rubric to candidate packet round-trip | FR-003, FR-004, FR-005, FR-006 | Passed | Returned HTTP 200; preserved `candidate_id=QA-001`; status `ready_with_warnings`; fit category `potential_fit_with_gaps`; compliance `passed_with_warnings`. |
| Frontend lint | UI quality gate | Passed with warning | `corepack npm run lint` completed; npm warned Node.js 22.22.1 is slightly below npm 12.1.0 preferred range. |
| Frontend production build | UI quality gate | Passed with warning | `corepack npm run build` compiled Next.js successfully; same npm/Node warning. |

## Smoke / Acceptance Checks

Browser smoke was run against temporary local servers and both servers were stopped afterward.

| Flow Step | Mapping | Result | Observed Outcome |
| --- | --- | --- | --- |
| Load main application | FR-008 | Passed | UI opened at `/` with role intake, navigation, rubric draft, and packet waiting statuses. |
| Generate rubric from default role intake | FR-001, FR-002 | Passed with caveat | UI moved to rubric panel and rendered must-have/nice-to-have criteria. |
| Human ambiguity resolution and rubric approval | FR-002, FR-007 | Passed | Checkbox gate enabled approval; header showed `Rubric approved`. |
| Generate candidate packet from pasted candidate text | FR-003, FR-004, FR-005, FR-006 | Passed with caveat | UI moved to packet panel; header showed `Ready with warnings`; fit category showed `Potential fit with gaps`; evidence rendered as `resume-paste.txt:line-1`; criterion status showed `Partially met`. |
| Future ingestion controls remain disabled | FR-003 deferred scope | Passed | PDF/DOCX upload, ATS import, and authorized profile import controls are disabled stubs. |

## Issues and Known Gaps

| ID | Severity | Area | Status | Description |
| --- | --- | --- | --- | --- |
| QA-001 | Medium | Runtime operations | Open | CrewAI prompts interactively: `Would you like to view your execution traces? [y/N]`. This can block browser/API requests in unattended local smoke tests until a terminal response or timeout occurs. |
| QA-002 | Medium | Runtime configuration | Open | CrewAI provider execution falls back to local deterministic artifacts when provider credentials/configuration are unavailable. This enables MVP smoke testing but does not validate real LLM task quality. |
| QA-003 | Low | Frontend copy/state | Open | Initial audit text still says `Frontend loaded with local-only MVP workflow` even though the UI now calls the backend API. |
| QA-004 | Low | Rubric quality | Open | Fallback keyword extraction can duplicate broad job-description text across must-have and nice-to-have criteria. This is acceptable for smoke fallback but weak for production recruiter review. |
| QA-005 | Low | Toolchain | Open | npm 12.1.0 warns that Node.js 22.22.1 is below the preferred support range `^22.22.2 || ^24.15.0 || >=26.0.0`. Build and lint still passed. |

## Future Work

- Add automated backend tests under a test runner such as pytest for health, validation, guardrails, approved-rubric gating, candidate ID preservation, and status mapping.
- Add frontend interaction tests for role intake, approval gating, candidate packet rendering, compliance acknowledgement, and report export gate.
- Configure CrewAI to run non-interactively in local and CI smoke environments.
- Add CI coverage for backend tests, frontend lint, frontend build, and a no-server-leak smoke check.
- Add production validation with real configured provider credentials in a controlled environment.
- Implement or explicitly hide deferred features: async run status, document upload parsing, ATS import, authenticated sessions, persistence, and backend report export.

## QA Verdict

MVP smoke status: Passed with caveats.

The implemented recruitment assistant supports the current happy path from role intake through human-approved rubric and candidate packet generation. Decision-support guardrails and approval gating are present for the tested slice. The main release risks are operational rather than flow-breaking: interactive CrewAI trace prompts, fallback-only LLM behavior without valid provider configuration, and lack of automated regression tests.