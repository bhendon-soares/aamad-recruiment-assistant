# Frontend Build Artifact: Recruitment Assistant

**Persona:** Frontend Developer (`frontend-eng`)  
**Action:** `*develop-fe`  
**Date:** 2026-09-23  
**Runtime:** Next.js App Router + TypeScript  
**Status:** MVP frontend migrated and build-validated

---

## Inputs Reviewed

- `project-context/1.define/prd.md`
- `project-context/1.define/sad.md`

`project-context/2.build/setup.md` was expected by the frontend persona but is not present. Frontend work proceeded from PRD and SAD, and this gap is recorded for follow-up.

---

## Implementation Decisions

- Migrated the first static prototype to the SAD-aligned frontend stack: Next.js App Router with TypeScript.
- Kept the interface task-oriented, matching the SAD direction that MVP should not be chat-first.
- Preserved local demo state for this slice; backend API integration remains owned by the integration phase.
- Modeled required human-in-the-loop gates: rubric approval, candidate assessment enablement, compliance warning acknowledgement, reviewer identity, and human decision note before export.
- Kept visible disabled stubs for future PDF/DOCX upload, ATS import, authorized profile import, admin retention/deletion, model settings, analytics, and candidate disclosure workflows.
- Converted internal fit labels to user-facing copy, including `potential_fit_with_gaps` as `Potential fit with gaps` in the Packet tab.
- Added a local light/dark theme switch in the app header. The default theme remains light, and the switch updates UI color variables client-side without backend persistence.

---

## Implemented Frontend Scope

### Files

- `src/frontend/package.json`
- `src/frontend/package-lock.json`
- `src/frontend/next.config.ts`
- `src/frontend/tsconfig.json`
- `src/frontend/eslint.config.mjs`
- `src/frontend/postcss.config.mjs`
- `src/frontend/next-env.d.ts`
- `src/frontend/src/app/layout.tsx`
- `src/frontend/src/app/page.tsx`
- `src/frontend/src/app/globals.css`

The earlier static files were replaced during migration:

- `src/frontend/index.html`
- `src/frontend/styles.css`
- `src/frontend/app.js`

### MVP Screens Represented

| UI area | Status | Notes |
|---|---|---|
| Role intake | Implemented | Captures role title, department, recruiter notes, and job description. |
| Rubric editor | Implemented | Generates local draft criteria and blocks approval until ambiguity is resolved or waived. |
| Candidate queue | Implemented | Candidate text entry is disabled until rubric approval. Upload/import controls are visible stubs. |
| Candidate packet | Implemented | Shows criterion-level assessment, evidence, strengths, gaps, and human note fields. |
| Compliance review | Implemented | Shows warning cards and requires human acknowledgement for export readiness. |
| Report preview/export gate | Implemented | Requires packet, warning acknowledgement, reviewer name, and human decision note. Export remains local-only. |
| Audit timeline | Implemented | Records local workflow events for traceability in the prototype. |
| Admin/governance stubs | Implemented | Disabled placeholders for deferred governance and analytics features. |
| Theme switch | Implemented | Header switch toggles between light and dark palettes for the current browser session. |

---

## Run Notes

From `src/frontend`:

```bash
corepack npm install
corepack npm run dev
```

Then open the local URL reported by Next.js, typically `http://localhost:3000`.

In this WSL environment, direct `npx create-next-app` failed because `npm`/`npx` resolved to Windows binaries and could not handle the Linux UNC workspace path. The app was scaffolded manually, and dependency installation succeeded through `corepack npm install`.

Recommended local smoke test:

1. Click **Generate rubric**.
2. Attempt approval before resolving ambiguity and confirm it is blocked.
3. Check the ambiguity resolution box and approve the rubric.
4. Generate a candidate packet.
5. Confirm the Packet tab shows `Potential fit with gaps` instead of the internal enum value.
6. Toggle the header theme switch and confirm the interface changes between light and dark palettes.
7. Acknowledge warnings, enter reviewer name and decision note, then confirm the export action becomes enabled.

---

## Deferred Items

- Typed API client and integration with FastAPI endpoints.
- Real file upload, PDF/DOCX parsing status, and async job progress.
- Authenticated user identity, persisted audit events, and report export downloads.
- Accessibility audit with automated tooling beyond framework lint/build checks.
- Production package-manager standardization once the project setup artifact is created.

---

## Validation

- VS Code diagnostics reported no errors for `src/frontend` after migration.
- `corepack npm install` completed successfully and found 0 vulnerabilities.
- `corepack npm run lint` passed.
- `corepack npm run build` passed with Next.js 16.3.6 and generated the `/` route as static content.
- Browser smoke test confirmed the light/dark switch updates the application palette and preserves workflow state.
- Known environment warning: `corepack npm` selected npm 12.1.0, which warns that Node.js 22.22.1 is slightly below its preferred patch range (`^22.22.2`). Build and lint still passed.