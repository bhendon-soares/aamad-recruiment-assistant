# Market Requirements Document (MRD): Recruitment Assistant

**Product:** Recruitment Assistant Application  
**Phase:** AAMAD Define  
**Primary persona:** Product Manager (`product-mgr`)  
**Requested workflow:** `*create-mrd`  
**Target implementation runtime:** CrewAI (`crewai`)  
**Date:** 2026-09-23  
**Status:** Draft v0.1 for stakeholder review

---

## 1. Executive Summary

Recruitment teams are under pressure to process larger candidate pools, reduce time-to-shortlist, maintain consistent evaluation quality, and comply with increasing scrutiny around AI use in employment decisions. The proposed Recruitment Assistant is a human-in-the-loop, multi-agent application that helps recruiters and hiring managers analyze job requirements, structure candidate profiles, compare candidates to role criteria, generate interview preparation materials, and produce an auditable shortlist report.

The use case is based on the CrewAI recruitment example pattern: a collaborative set of specialized agents performs research, profiling, matching, and interview-preparation tasks in a sequential or controlled hierarchical workflow. The product must not act as an autonomous hiring decision maker. It should provide evidence-linked recommendations, explain limitations, flag uncertainty, and require recruiter confirmation before any candidate-facing or decision-impacting action.

The market opportunity is strongest for small-to-mid recruiting teams, startups, staffing agencies, and internal talent acquisition groups that need structured AI assistance without immediately investing in a large enterprise ATS/HRIS platform. The product should prioritize trust, explainability, auditability, privacy, and fairness controls as differentiators over purely automated screening speed.

---

## 2. Detailed Findings by Dimension

### 2.1 Market Analysis & Opportunity Assessment

#### Market need

Recruiting workflows commonly involve repetitive knowledge work:

- Interpreting job descriptions and extracting must-have vs nice-to-have criteria.
- Reading resumes, portfolios, and public candidate information.
- Summarizing candidate strengths, gaps, and risks.
- Comparing multiple candidates consistently.
- Preparing role-specific interview questions.
- Creating outreach or internal briefing material.
- Maintaining traceability for why a candidate was advanced or rejected.

A multi-agent assistant can reduce manual effort and improve consistency, provided that it stays within a compliant advisory role and preserves human decision authority.

#### Target customers

| Segment | Pain points | Likely value proposition |
|---|---|---|
| Startup and SMB recruiters | Low recruiter bandwidth, inconsistent screening templates, limited HR tooling | Faster first-pass candidate analysis and interview kits without complex ATS migration |
| Staffing and recruiting agencies | High candidate volume, repeated role intake, client reporting burden | Standardized candidate ranking, client-ready reports, reusable role profiles |
| Internal talent acquisition teams | Need consistency across hiring managers and auditability across requisitions | Structured role criteria, evidence-linked notes, compliance-friendly review trail |
| Hiring managers without dedicated recruiters | Limited recruiting expertise and time | Guided workflow for job-fit analysis and interview prep |

#### Buyer/user distinction

- **Economic buyer:** Head of Talent, HR Operations, COO, staffing agency owner, startup founder.
- **Primary users:** Recruiters, sourcers, hiring managers.
- **Secondary stakeholders:** Candidates, HR compliance/legal, data protection/security teams.

#### Competitive landscape

The recruitment software market already includes ATS systems, sourcing tools, interview intelligence tools, resume parsers, and AI screening products. Differentiation should focus on:

1. Transparent multi-agent reasoning artifacts rather than opaque scores.
2. Configurable role criteria and rubric-based evaluation.
3. Built-in human oversight and bias/fairness checkpoints.
4. Deployment flexibility for teams experimenting with agentic workflows.
5. Clear audit logs and explainable output rather than black-box ranking.

#### Market timing

AI-assisted hiring is attractive because of productivity pressure, but it is also legally sensitive. The EU AI Act classifies many employment-related AI systems, especially recruitment and selection systems, as high-risk. This creates an opportunity for products designed from day one around governance, transparency, and human oversight.

### 2.2 Technical Feasibility & Requirements Analysis

#### Technical feasibility

The product is technically feasible as an MVP using CrewAI-style agents and tasks:

- **Job Analysis Agent:** extracts role criteria, required skills, seniority indicators, and evaluation rubric.
- **Candidate Profiler Agent:** summarizes candidate materials and normalizes evidence.
- **Fit Assessment Agent:** compares candidate evidence to the role rubric.
- **Interview Prep Agent:** creates structured interview questions and probes for gaps.
- **Compliance/Audit Agent:** checks outputs for unsupported claims, prohibited criteria, missing evidence, and fairness concerns.
- **Report Writer Agent:** compiles human-readable recruiter and hiring-manager outputs.

CrewAI supports agents with roles/goals/backstories, tools, task sequencing, task context, structured task outputs through Pydantic/JSON, guardrails, logging, and crew-level process orchestration. These map well to the recruitment workflow.

#### Required integrations

MVP integrations should be minimal and controlled:

- Local or uploaded job description input.
- Candidate resume/CV upload in PDF/DOCX/text, or structured pasted profile.
- Optional public URL/profile input only if user has authorization and terms allow access.
- Export to Markdown/PDF/CSV for shortlist reports.
- Later: ATS integrations such as Greenhouse, Lever, Ashby, Workday, or BambooHR.

#### Data requirements

| Data category | Examples | Risk level | Notes |
|---|---|---:|---|
| Job data | Job description, competencies, location, compensation range | Medium | May include confidential workforce planning data |
| Candidate data | Resume, work history, education, portfolio links, contact information | High | Personal data; may include sensitive or inferred attributes |
| Evaluation data | Scores, notes, interview questions, shortlist status | High | Can materially affect employment opportunity |
| System metadata | prompts, model outputs, logs, user actions, timestamps | Medium/High | Necessary for audit but must be minimized and protected |

#### Feasibility constraints

- Resume parsing quality varies by document format and language.
- LLM outputs can hallucinate or infer protected attributes unless constrained.
- Bias evaluation requires representative data and domain-specific legal review.
- Public candidate data access may be limited by platform terms and privacy law.
- The system needs strong guardrails to avoid turning recommendations into automated decisions.

### 2.3 User Experience & Workflow Analysis

#### Core workflow

1. Recruiter creates a role intake.
2. System extracts criteria and proposes a rubric.
3. Recruiter edits/approves rubric.
4. Recruiter uploads candidate materials.
5. Agents create candidate summaries and evidence maps.
6. Fit assessment compares evidence against the approved rubric.
7. Compliance/audit checks unsupported claims, prohibited criteria, and missing citations.
8. Recruiter reviews candidate packets and shortlist recommendations.
9. Interview prep generates candidate-specific interview plans.
10. Recruiter exports report and records final human decision.

#### UX principles

- **Human approval before evaluation:** no candidate scoring until the role rubric is approved.
- **Evidence-first:** every recommendation must cite candidate-provided or role-provided evidence.
- **No hidden auto-reject:** product should not reject candidates automatically in MVP.
- **Editable outputs:** recruiters can correct summaries and mark system errors.
- **Uncertainty visible:** missing evidence and low-confidence claims are explicit.
- **Candidate-impact transparency:** outputs should support disclosure that AI assistance was used where required.

#### Critical screens

- Role intake and rubric editor.
- Candidate upload/import queue.
- Candidate profile and evidence map.
- Fit assessment comparison view.
- Compliance/fairness warnings panel.
- Interview kit generator.
- Export/audit package view.

### 2.4 Production & Operations Requirements

#### Operational model

The application should run as a controlled web application with a backend orchestrating CrewAI tasks. In early MVP, it can support a single tenant or project workspace. Production should support multi-tenant isolation, role-based access, encrypted storage, and admin-configurable retention.

#### Security and privacy expectations

- Encrypt data at rest and in transit.
- Role-based access control for recruiters, hiring managers, admins, and auditors.
- Retention controls per role/requisition/candidate.
- Prompt/output logging with sensitive data minimization.
- PII redaction options for evaluation views where feasible.
- Consent/authorization workflows for candidate materials.
- Audit trail for rubric changes, agent runs, output edits, exports, and final human decisions.

#### Compliance expectations

The product touches employment decisions. It must be treated as a high-sensitivity system and potentially a high-risk AI system under jurisdictions such as the EU. The product must support:

- Human oversight.
- Transparent instructions and limitations.
- Bias and adverse-impact review processes.
- Technical documentation.
- Record keeping and logs.
- Data governance and purpose limitation.
- Explainability for recommendations.
- Candidate/person rights workflows where applicable.

#### Monitoring and support

Operational telemetry should include:

- Agent run success/failure.
- Task latency and cost.
- Guardrail failure rate.
- Output correction rate.
- Unsupported-claim detection rate.
- User override rates.
- Security/audit events.

### 2.5 Innovation & Differentiation Analysis

#### Differentiators

1. **Rubric-first multi-agent evaluation:** system analyzes candidates only against recruiter-approved criteria.
2. **Evidence-linked recommendations:** summaries, scores, and interview questions cite source snippets or fields.
3. **Built-in compliance agent:** every candidate packet is checked before presentation/export.
4. **Human decision capture:** the system distinguishes AI recommendation from final human action.
5. **Transparent task chain:** CrewAI task outputs are inspectable for audit and debugging.
6. **Configurable risk posture:** organizations can disable scoring, require dual review, or restrict data sources.

#### Long-term opportunities

- ATS integrations.
- Structured interview feedback ingestion.
- Adverse-impact dashboards.
- Candidate communication workflows.
- Multilingual resume and job analysis.
- Department-specific hiring rubrics.
- Model/vendor abstraction for regulated environments.

---

## 3. Critical Decision Points

| Decision | Options | Recommendation | Rationale |
|---|---|---|---|
| Product posture | Autonomous screening vs decision support | Decision support only | Reduces legal/fairness risk and aligns with human oversight expectations |
| Evaluation basis | Freeform model judgment vs approved rubric | Approved rubric | Improves consistency, explainability, and auditability |
| Ranking in MVP | Numeric ranking, categorical fit, or no ranking | Categorical fit + evidence; optional score behind feature flag | Avoid overreliance on opaque scores while enabling prioritization |
| Candidate data source | User-upload only vs web scraping | User-upload/pasted/authorized sources only | Reduces privacy and terms-of-service risk |
| Runtime | Generic LLM chain vs CrewAI multi-agent workflow | CrewAI | User requested CrewAI example and workspace config targets CrewAI |
| Compliance scope | Later add-on vs MVP requirement | MVP requirement | Employment AI is high-sensitivity; compliance cannot be bolted on safely |
| Deployment | Local prototype vs hosted SaaS | Local/dev MVP first, SaaS-ready architecture | Faster validation while preserving future production path |

---

## 4. Risk Assessment Matrix

| Risk | Likelihood | Impact | Severity | Mitigation |
|---|---:|---:|---:|---|
| Biased or discriminatory recommendations | Medium | High | High | Rubric-only evaluation, protected-attribute suppression, bias tests, human review, audit logs |
| Hallucinated candidate claims | Medium | High | High | Evidence citations required, unsupported-claim guardrail, source snippets, user corrections |
| Overreliance by recruiters | Medium | High | High | UX warnings, no auto-reject, confidence labels, mandatory human decision capture |
| Privacy breach involving resumes/PII | Medium | High | High | Encryption, RBAC, retention controls, least privilege, logging minimization, incident response |
| Non-compliance with EU AI Act or employment law | Medium | High | High | Technical documentation, human oversight, DPIA/FRA support, legal review before launch |
| Public profile scraping violates terms/privacy | Medium | Medium | Medium | MVP excludes scraping; only authorized user-provided sources |
| Low parsing accuracy for resumes | Medium | Medium | Medium | Structured upload validation, manual correction, parser confidence, fallback text input |
| Model cost/latency too high | Medium | Medium | Medium | Batch processing, async queue, smaller tool-calling models, caching, observability |
| Users reject AI recommendations due to lack of trust | Medium | Medium | Medium | Explainability, editable outputs, transparent limitations, pilot feedback loops |
| Prompt injection in candidate documents | Medium | High | High | Treat documents as untrusted data, prompt isolation, content sanitization, tool permissions |

---

## 5. Actionable Recommendations

### 5.1 MVP scope

Build an MVP focused on a single recruiter/hiring-manager workflow:

- Role intake and rubric generation.
- Candidate document ingestion.
- Candidate evidence summary.
- Rubric-based fit assessment.
- Compliance/audit review.
- Interview kit generation.
- Exportable shortlist report.

Exclude from MVP:

- Automated rejection or advancement.
- Unsupervised sourcing/scraping.
- Automated candidate outreach.
- ATS write-back.
- Fully automated ranking without recruiter review.

### 5.2 Governance recommendations

- Treat the system as employment decision support and design for high-risk AI obligations where applicable.
- Require recruiter approval of role criteria before candidate analysis.
- Require a final human decision field for any shortlist/export action.
- Maintain an audit record of input, rubric, task outputs, edits, warnings, and final decision.
- Provide administrator controls for data retention and model/provider configuration.

### 5.3 Technical recommendations

- Use structured outputs for candidate profiles, rubric assessments, and audit findings.
- Use guardrails to reject unsupported claims and prohibited criteria.
- Store source-to-claim mappings for every generated recommendation.
- Isolate candidate documents from system prompts to reduce prompt injection risk.
- Implement async task execution for multi-candidate batches.

### 5.4 Product validation recommendations

Pilot with 2–3 realistic roles and 20–50 synthetic or consented candidate profiles. Measure:

- Recruiter time saved per candidate.
- Rate of corrected AI claims.
- User trust rating.
- Interview kit usefulness.
- Human override rate.
- Compliance warning usefulness.

---

## Sources

### User/workspace sources

1. User request in current session: create MRD and PRD for a recruitment assistant application based on the CrewAI recruitment example; run `*create-mrd` then `*create-prd` or `*create-context`; complete Sources, Assumptions, Open Questions, and Audit.
2. Workspace AAMAD configuration: `aamad.config.example.yml` indicates `runtime.target: crewai`, security assessment required, unit/integration tests required, user guide required.
3. AAMAD templates read from workspace:
   - `.cursor/templates/mrd-template.md`
   - `.cursor/templates/prd-template.md`
4. AAMAD Product Manager agent capabilities in workspace: `.github/agents/product-mgr.agent.md` supports `*create-mrd`, `*create-prd`, `*create-context`, and `*create-stories`.

### External sources consulted

1. CrewAI documentation, Agents concept page: agents are autonomous units with role, goal, tools, memory/context, delegation, and structured behavior. URL: https://docs.crewai.com/concepts/agents
2. CrewAI documentation, Tasks concept page: tasks define description, expected output, assigned agent, tools, context dependencies, human input, guardrails, and structured outputs. URL: https://docs.crewai.com/concepts/tasks
3. CrewAI documentation, Crews concept page: crews coordinate agents and tasks using sequential or hierarchical processes, memory, callbacks, logs, checkpointing, and kickoff execution. URL: https://docs.crewai.com/concepts/crews
4. EU Artificial Intelligence Act, Regulation (EU) 2024/1689: employment, workers management, and access to self-employment AI systems are addressed as high-risk use cases; high-risk systems require risk management, data governance, technical documentation, logging, transparency, human oversight, accuracy/robustness/cybersecurity, and deployer obligations. URL: https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689
5. NIST AI Risk Management Framework overview: voluntary framework for managing AI risks to individuals, organizations, and society and incorporating trustworthiness into AI design, development, use, and evaluation. URL: https://www.nist.gov/itl/ai-risk-management-framework
6. HHS HIPAA Privacy Rule summary: used only as a general privacy reference for minimum necessary, safeguards, and protected information concepts; HIPAA may not apply to ordinary recruiting data unless health data or covered entities are involved. URL: https://www.hhs.gov/hipaa/for-professionals/privacy/laws-regulations/index.html
7. IBM Cost of a Data Breach report landing page: used only as a general cybersecurity risk signal for AI/agentic identity and data protection concerns; not used for numeric claims due dynamic page values. URL: https://www.ibm.com/reports/data-breach

### Source limitations

- A direct GitHub search for a public CrewAI recruitment example returned no usable snippets in this session. The MRD therefore relies on the user-provided description of the CrewAI recruitment example plus CrewAI’s official agent/task/crew documentation.
- EEOC pages attempted during research returned fetch errors in this environment, so no EEOC content is cited as a direct source in this MRD.
- This MRD is product/research guidance, not legal advice.

---

## Assumptions

1. The initial implementation target is CrewAI because the workspace configuration and user request point to `crewai`.
2. The product is a decision-support tool for recruiters and hiring managers, not an autonomous hiring decision system.
3. MVP users will provide job descriptions and candidate materials directly or through authorized inputs.
4. MVP will not scrape public websites or social networks automatically.
5. Candidate data may include personal data and must be handled as sensitive even where not legally classified as special-category data.
6. The first release is intended for internal pilots or controlled customer pilots before broad production launch.
7. The product should be designed for potential EU AI Act high-risk obligations, even if first pilots occur outside the EU.
8. Legal/compliance counsel will review jurisdiction-specific employment, privacy, and AI obligations before production deployment.
9. The product will use LLMs through configurable providers; model choice is not finalized in this MRD.
10. The product should preserve auditability even during prototyping.

---

## Open Questions

1. Which jurisdiction(s) and customer geographies must be supported at launch?
2. Will the product be used for internal hiring, staffing agency workflows, or both?
3. Which ATS/HRIS integrations are required for the first production customer?
4. Should MVP include numeric candidate scores, categorical recommendations only, or both with configurable controls?
5. What data retention policy is required for candidate documents and agent outputs?
6. Will candidate consent/disclosure be collected outside the tool, inside the tool, or both?
7. What model providers are allowed by the organization’s data processing agreements?
8. Should the product support multilingual resumes and job descriptions in MVP?
9. What protected-attribute handling policy should be implemented for each target jurisdiction?
10. Who is accountable for final hiring decisions in the workflow: recruiter, hiring manager, or both?
11. What level of audit export is required for legal/compliance review?
12. Are synthetic candidate datasets acceptable for pilot validation, or will real consented resumes be used?

---

## Audit

| Field | Value |
|---|---|
| Artifact | `project-context/1.define/mrd.md` |
| Action | `create-mrd` |
| Persona | `product-mgr` |
| Requested by | User in current Copilot/AAMAD session |
| Created at | 2026-09-23 |
| Runtime resolved | `crewai` |
| Templates referenced | `.cursor/templates/mrd-template.md` |
| Primary input | User request: recruitment assistant based on CrewAI recruitment example |
| Repository context checked | `project-context/1.define/`, `.cursor/templates/`, `.github/agents/`, `aamad.config.example.yml` |
| External research performed | CrewAI docs, EU AI Act, NIST AI RMF, HHS HIPAA Privacy Rule summary, IBM data breach report landing page |
| Known gaps | Direct CrewAI recruitment example source not retrieved; EEOC pages not fetched successfully; legal review pending |
| Next artifact | `project-context/1.define/prd.md` via `create-prd` |
