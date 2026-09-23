"use client";

import { useState } from "react";

type PanelId = "role" | "rubric" | "candidate" | "packet" | "compliance" | "report" | "audit" | "admin";
type FitCategory = "strong_potential_fit" | "potential_fit_with_gaps" | "insufficient_evidence" | "not_aligned_with_current_rubric";
type Theme = "light" | "dark";
type CriterionStatus = "met" | "partially_met" | "not_evidenced" | "gap";
type ComplianceStatus = "passed" | "passed_with_warnings" | "blocked_until_resolved";

type RoleRubric = {
    role_rubric_id: string;
    role_title: string;
    department: string;
    must_have_criteria: string[];
    nice_to_have_criteria: string[];
    responsibilities: string[];
    seniority_level: string;
    location_or_work_authorization_constraints: string[];
    evaluation_categories: string[];
    excluded_criteria: string[];
    ambiguous_requirements: Array<Record<string, unknown>>;
    clarification_questions: string[];
    ambiguity_resolution_notes: string[];
    created_by: string;
    approved_by: string | null;
    approved_at: string | null;
    status: "draft" | "approved";
};

type Assessment = {
    criterion: string;
    status: CriterionStatus;
    rationale: string;
    confidence: "low" | "medium" | "high";
    evidence_references: string[];
};

type CandidateProfile = {
    candidate_id: string;
    source_documents: Array<{ document_id: string; name: string; text: string; source_type: "paste" | "text" | "pdf" | "docx" }>;
    skills: string[];
    evidence_snippets: Array<{ source_document_id: string; text: string; reference: string }>;
    missing_or_unclear_information: string[];
};

type FitAssessment = {
    candidate_id: string;
    role_rubric_id: string;
    criterion_assessments: Assessment[];
    strengths: string[];
    gaps: string[];
    follow_up_questions: string[];
    fit_category: FitCategory;
    confidence_level: "low" | "medium" | "high";
    evidence_references: string[];
    generated_at: string;
};

type ComplianceReview = {
    unsupported_claims: string[];
    protected_attribute_warnings: string[];
    missing_evidence_warnings: string[];
    overconfidence_warnings: string[];
    prompt_injection_flags: string[];
    required_human_actions: string[];
    review_status: ComplianceStatus;
};

type CandidatePacket = {
    run_id: string;
    candidate_profile: CandidateProfile;
    fit_assessment: FitAssessment;
    compliance_review: ComplianceReview;
    status: "ready_for_human_review" | "ready_with_warnings" | "blocked_until_resolved";
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

const fitCategoryLabels: Record<FitCategory, string> = {
    strong_potential_fit: "Strong potential fit",
    potential_fit_with_gaps: "Potential fit with gaps",
    insufficient_evidence: "Insufficient evidence",
    not_aligned_with_current_rubric: "Not aligned with current rubric",
};

const criterionStatusLabels: Record<CriterionStatus, string> = {
    met: "Met",
    partially_met: "Partially met",
    not_evidenced: "Not evidenced",
    gap: "Gap",
};

const complianceStatusLabels: Record<ComplianceStatus, string> = {
    passed: "Passed",
    passed_with_warnings: "Passed with warnings",
    blocked_until_resolved: "Blocked until resolved",
};

const navItems: Array<{ id: PanelId; label: string }> = [
    { id: "role", label: "Role" },
    { id: "rubric", label: "Rubric" },
    { id: "candidate", label: "Candidates" },
    { id: "packet", label: "Packet" },
    { id: "compliance", label: "Compliance" },
    { id: "report", label: "Report" },
    { id: "audit", label: "Audit" },
    { id: "admin", label: "Admin" },
];

function timestamp() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function StatusPill({ label, tone }: { label: string; tone: "draft" | "waiting" | "ready" | "warning" | "blocked" }) {
    return <span className={`status-pill status-${tone}`}>{label}</span>;
}

export default function Home() {
    const [theme, setTheme] = useState<Theme>("light");
    const [activePanel, setActivePanel] = useState<PanelId>("role");
    const [roleTitle, setRoleTitle] = useState("Senior Product Designer");
    const [department, setDepartment] = useState("Product");
    const [notes, setNotes] = useState("Prioritize complex workflow design and evidence of cross-functional leadership.");
    const [jobDescription, setJobDescription] = useState(
        "We need a senior product designer for a complex B2B workflow product. Must have strong interaction design, research synthesis, accessible design practice, and experience partnering with engineering and product leads. Nice to have: hiring systems, AI-assisted products, and design systems. The role is remote-friendly in US time zones.",
    );
    const [candidateId, setCandidateId] = useState("CAND-1042");
    const [sourceDocument, setSourceDocument] = useState("resume-paste.txt");
    const [candidateText, setCandidateText] = useState(
        "Led redesign of enterprise workflow tools, partnered with research and engineering, introduced accessibility review practices, and maintained a component library. Recent work includes AI-assisted applicant tracking experiments.",
    );
    const [rubric, setRubric] = useState<RoleRubric | null>(null);
    const [rubricApproved, setRubricApproved] = useState(false);
    const [ambiguityResolved, setAmbiguityResolved] = useState(false);
    const [packet, setPacket] = useState<CandidatePacket | null>(null);
    const [warningAcknowledged, setWarningAcknowledged] = useState(false);
    const [reviewerName, setReviewerName] = useState("");
    const [decisionNote, setDecisionNote] = useState("");
    const [toast, setToast] = useState("");
    const [isBusy, setIsBusy] = useState(false);
    const [audit, setAudit] = useState(["Frontend loaded with local-only MVP workflow."]);

    const rubricStatus = rubricApproved ? { label: "Rubric approved", tone: "ready" as const } : { label: "Rubric draft", tone: "draft" as const };
    const packetStatus = packet ? { label: packet.status === "ready_with_warnings" ? "Ready with warnings" : packet.status === "blocked_until_resolved" ? "Blocked" : "Ready for review", tone: packet.status === "blocked_until_resolved" ? "blocked" as const : packet.status === "ready_with_warnings" ? "warning" as const : "ready" as const } : { label: "Packet waiting", tone: "waiting" as const };
    const exportEnabled = Boolean(packet && warningAcknowledged && reviewerName.trim() && decisionNote.trim());
    const isDarkTheme = theme === "dark";
    const complianceWarnings = packet ? [
        ...packet.compliance_review.unsupported_claims,
        ...packet.compliance_review.protected_attribute_warnings,
        ...packet.compliance_review.missing_evidence_warnings,
        ...packet.compliance_review.overconfidence_warnings,
        ...packet.compliance_review.prompt_injection_flags,
        ...packet.compliance_review.required_human_actions,
    ] : [];

    function showToast(message: string) {
        setToast(message);
        window.setTimeout(() => setToast(""), 2600);
    }

    function addAudit(message: string) {
        setAudit((items) => [`${timestamp()} - ${message}`, ...items]);
    }

    async function postJson<ResponseBody>(path: string, body: unknown): Promise<ResponseBody> {
        const response = await fetch(`${apiBaseUrl}${path}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => null) as { detail?: string } | null;
            throw new Error(errorBody?.detail ?? `API request failed with status ${response.status}`);
        }

        return response.json() as Promise<ResponseBody>;
    }

    async function generateRubric() {
        setIsBusy(true);
        try {
            const nextRubric = await postJson<RoleRubric>("/api/rubrics/generate", {
                role_title: roleTitle.trim() || "Untitled role",
                department: department.trim() || "Unassigned",
                job_description: jobDescription,
                recruiter_notes: notes,
                created_by: reviewerName.trim() || "local_recruiter",
            });

            setRubric(nextRubric);
            setRubricApproved(false);
            setPacket(null);
            setAmbiguityResolved(false);
            setWarningAcknowledged(false);
            addAudit(`Draft rubric generated through API for ${nextRubric.role_title} in ${nextRubric.department}.`);
            showToast("Rubric draft generated by backend API.");
            setActivePanel("rubric");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to generate rubric.";
            addAudit(`Rubric generation failed: ${message}`);
            showToast(message);
        } finally {
            setIsBusy(false);
        }
    }

    function approveRubric() {
        if (!rubric) {
            showToast("Generate a rubric first.");
            return;
        }

        if (!ambiguityResolved) {
            addAudit("Rubric approval blocked by unresolved ambiguity.");
            showToast("Approval requires ambiguity resolution or waiver rationale.");
            return;
        }

        const approvedRubric: RoleRubric = {
            ...rubric,
            status: "approved",
            approved_by: reviewerName.trim() || "local_recruiter",
            approved_at: new Date().toISOString(),
            ambiguity_resolution_notes: rubric.ambiguity_resolution_notes.length ? rubric.ambiguity_resolution_notes : ["Human reviewer resolved or waived ambiguity for MVP assessment."],
        };

        setRubric(approvedRubric);
        setRubricApproved(true);
        addAudit("Rubric approved by human reviewer; candidate assessment enabled.");
        showToast("Rubric approved. Candidate packet generation is now available.");
        setActivePanel("candidate");
    }

    async function generatePacket() {
        if (!rubricApproved || !rubric) {
            showToast("Approve the rubric before candidate assessment.");
            return;
        }

        setIsBusy(true);
        try {
            const nextPacket = await postJson<CandidatePacket>("/api/candidate-packets", {
                candidate_id: candidateId.trim() || "CAND-DRAFT",
                role_rubric: rubric,
                source_documents: [
                    {
                        name: sourceDocument.trim() || "manual-paste.txt",
                        text: candidateText,
                        source_type: "paste",
                    },
                ],
                profile_corrections: [],
            });

            setPacket(nextPacket);
            setWarningAcknowledged(false);
            addAudit(`Candidate packet generated through API for ${nextPacket.candidate_profile.candidate_id}; run ${nextPacket.run_id}.`);
            showToast("Candidate packet generated by backend API.");
            setActivePanel("packet");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to generate candidate packet.";
            addAudit(`Candidate packet generation failed: ${message}`);
            showToast(message);
        } finally {
            setIsBusy(false);
        }
    }

    function exportReport() {
        if (!exportEnabled) {
            showToast("Complete human review fields and warning acknowledgement before export.");
            return;
        }

        addAudit("Markdown report export prepared after human review gate passed.");
        showToast("Markdown export gate passed. Backend export endpoint is intentionally not wired in this slice.");
    }

    const reportPreview = packet
        ? `# Candidate Report: ${packet.candidate_profile.candidate_id}\n\nRole: ${rubric?.role_title ?? "Pending role"}\nFit category: ${fitCategoryLabels[packet.fit_assessment.fit_category]}\nCompliance status: ${complianceStatusLabels[packet.compliance_review.review_status]}\nHuman reviewer: ${reviewerName.trim() || "Pending reviewer"}\nRun ID: ${packet.run_id}\n\nSummary:\n${packet.candidate_profile.evidence_snippets[0]?.text ?? "Draft candidate packet generated for human review."}\n\nHuman decision note:\n${decisionNote.trim() || "Pending human decision note."}`
        : "Candidate report will appear after packet generation.";

    return (
        <div className="app-frame" data-theme={theme}>
            <header className="app-header">
                <div>
                    <p className="eyebrow">Recruitment Assistant</p>
                    <h1>Evidence-linked candidate review</h1>
                </div>
                <div className="header-controls">
                    <button
                        aria-checked={isDarkTheme}
                        className="theme-switch"
                        onClick={() => setTheme(isDarkTheme ? "light" : "dark")}
                        role="switch"
                        type="button"
                    >
                        <span className="switch-track" aria-hidden="true">
                            <span className="switch-thumb" />
                        </span>
                        {isDarkTheme ? "Dark" : "Light"}
                    </button>
                    <div className="header-status" aria-label="Workflow status">
                        <StatusPill label={rubricStatus.label} tone={rubricStatus.tone} />
                        <StatusPill label={packetStatus.label} tone={packetStatus.tone} />
                    </div>
                </div>
            </header>

            <main className="workspace-shell">
                <nav className="sidebar" aria-label="Recruitment workflow">
                    {navItems.map((item) => (
                        <button className={`nav-item ${activePanel === item.id ? "active" : ""}`} key={item.id} onClick={() => setActivePanel(item.id)} type="button">
                            {item.label}
                        </button>
                    ))}
                </nav>

                <section className="content-surface" aria-live="polite">
                    {activePanel === "role" && (
                        <section className="panel active" aria-labelledby="roleTitleHeading">
                            <div className="panel-heading">
                                <div>
                                    <p className="eyebrow">Role intake</p>
                                    <h2 id="roleTitleHeading">Create a role</h2>
                                </div>
                                <button className="primary-action" disabled={isBusy} onClick={generateRubric} type="button">{isBusy ? "Working..." : "Generate rubric"}</button>
                            </div>

                            <div className="form-grid">
                                <label>
                                    Role title
                                    <input value={roleTitle} onChange={(event) => setRoleTitle(event.target.value)} type="text" />
                                </label>
                                <label>
                                    Department
                                    <input value={department} onChange={(event) => setDepartment(event.target.value)} type="text" />
                                </label>
                                <label>
                                    Recruiter notes
                                    <input value={notes} onChange={(event) => setNotes(event.target.value)} type="text" />
                                </label>
                                <label className="full-width">
                                    Job description
                                    <textarea value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} rows={9} />
                                </label>
                            </div>
                        </section>
                    )}

                    {activePanel === "rubric" && (
                        <section className="panel active" aria-labelledby="rubricTitleHeading">
                            <div className="panel-heading">
                                <div>
                                    <p className="eyebrow">Rubric editor</p>
                                    <h2 id="rubricTitleHeading">Review generated criteria</h2>
                                </div>
                                <button className="primary-action" onClick={approveRubric} type="button">Approve rubric</button>
                            </div>

                            <div className="split-layout">
                                <article className="review-card">
                                    <h3>Must-have criteria</h3>
                                    <ul className="editable-list">
                                        {(rubric?.must_have_criteria ?? []).map((item) => <li key={item}>{item}</li>)}
                                    </ul>
                                </article>
                                <article className="review-card">
                                    <h3>Nice-to-have criteria</h3>
                                    <ul className="editable-list">
                                        {(rubric?.nice_to_have_criteria ?? []).map((item) => <li key={item}>{item}</li>)}
                                    </ul>
                                </article>
                                <article className="review-card full-width">
                                    <h3>Ambiguity resolution</h3>
                                    <div className="warning-box">
                                        {rubric?.ambiguous_requirements.length
                                            ? rubric.ambiguous_requirements.map((item) => JSON.stringify(item)).join("; ")
                                            : "No backend ambiguity warnings returned for this draft."}
                                    </div>
                                    <label className="checkbox-row">
                                        <input checked={ambiguityResolved} onChange={(event) => setAmbiguityResolved(event.target.checked)} type="checkbox" />
                                        High-severity ambiguity has been resolved or waived with rationale
                                    </label>
                                </article>
                            </div>
                        </section>
                    )}

                    {activePanel === "candidate" && (
                        <section className="panel active" aria-labelledby="candidateTitleHeading">
                            <div className="panel-heading">
                                <div>
                                    <p className="eyebrow">Candidate queue</p>
                                    <h2 id="candidateTitleHeading">Add candidate material</h2>
                                </div>
                                <button className="primary-action" disabled={!rubricApproved || isBusy} onClick={generatePacket} type="button">{isBusy ? "Working..." : "Generate packet"}</button>
                            </div>

                            <div className="form-grid">
                                <label>
                                    Candidate ID
                                    <input value={candidateId} onChange={(event) => setCandidateId(event.target.value)} type="text" />
                                </label>
                                <label>
                                    Source document
                                    <input value={sourceDocument} onChange={(event) => setSourceDocument(event.target.value)} type="text" />
                                </label>
                                <label className="full-width">
                                    Candidate profile text
                                    <textarea disabled={!rubricApproved} value={candidateText} onChange={(event) => setCandidateText(event.target.value)} rows={10} />
                                </label>
                            </div>

                            <div className="stub-row" aria-label="Future ingestion stubs">
                                <button className="ghost-action" type="button" disabled>Upload PDF/DOCX</button>
                                <button className="ghost-action" type="button" disabled>ATS import</button>
                                <button className="ghost-action" type="button" disabled>Authorized profile import</button>
                            </div>
                        </section>
                    )}

                    {activePanel === "packet" && (
                        <section className="panel active" aria-labelledby="packetTitleHeading">
                            <div className="panel-heading">
                                <div>
                                    <p className="eyebrow">Candidate packet</p>
                                    <h2 id="packetTitleHeading">Criterion assessment</h2>
                                </div>
                                <StatusPill label={packet ? fitCategoryLabels[packet.fit_assessment.fit_category] : "Waiting for candidate"} tone={packet ? "warning" : "waiting"} />
                            </div>

                            <div className="table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Criterion</th>
                                            <th>Status</th>
                                            <th>Evidence</th>
                                            <th>Human note</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {packet ? packet.fit_assessment.criterion_assessments.map((assessment) => (
                                            <tr key={assessment.criterion}>
                                                <td>{assessment.criterion}</td>
                                                <td><StatusPill label={criterionStatusLabels[assessment.status]} tone="ready" /></td>
                                                <td>{assessment.evidence_references.join(", ") || assessment.rationale}</td>
                                                <td><input aria-label={`Human note for ${assessment.criterion}`} placeholder="Add note" type="text" /></td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={4}>Approve a rubric and generate a candidate packet.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="split-layout compact-gap">
                                <article className="review-card">
                                    <h3>Strengths</h3>
                                    <ul>{(packet?.fit_assessment.strengths ?? []).map((item) => <li key={item}>{item}</li>)}</ul>
                                </article>
                                <article className="review-card">
                                    <h3>Gaps and follow-up</h3>
                                    <ul>{(packet ? [...packet.fit_assessment.gaps, ...packet.fit_assessment.follow_up_questions] : []).map((item) => <li key={item}>{item}</li>)}</ul>
                                </article>
                            </div>
                        </section>
                    )}

                    {activePanel === "compliance" && (
                        <section className="panel active" aria-labelledby="complianceTitleHeading">
                            <div className="panel-heading">
                                <div>
                                    <p className="eyebrow">Compliance review</p>
                                    <h2 id="complianceTitleHeading">Warnings and required actions</h2>
                                </div>
                                <StatusPill label={packet ? complianceStatusLabels[packet.compliance_review.review_status] : "Not reviewed"} tone={packet ? "warning" : "waiting"} />
                            </div>

                            <div className="warning-grid">
                                {packet ? complianceWarnings.map((warning) => <article className="warning-box" key={warning}>{warning}</article>) : <article className="warning-box">Generate a packet to populate compliance review.</article>}
                            </div>
                            <label className="checkbox-row">
                                <input checked={warningAcknowledged} onChange={(event) => setWarningAcknowledged(event.target.checked)} type="checkbox" />
                                Required warnings reviewed by a human
                            </label>
                        </section>
                    )}

                    {activePanel === "report" && (
                        <section className="panel active" aria-labelledby="reportTitleHeading">
                            <div className="panel-heading">
                                <div>
                                    <p className="eyebrow">Report preview</p>
                                    <h2 id="reportTitleHeading">Human review and export</h2>
                                </div>
                                <button className="primary-action" disabled={!exportEnabled} onClick={exportReport} type="button">Export Markdown</button>
                            </div>

                            <div className="form-grid">
                                <label>
                                    Human reviewer
                                    <input placeholder="Reviewer name" value={reviewerName} onChange={(event) => setReviewerName(event.target.value)} type="text" />
                                </label>
                                <label className="full-width">
                                    Human decision note
                                    <textarea placeholder="Document the human-reviewed next step without final AI decision labels." value={decisionNote} onChange={(event) => setDecisionNote(event.target.value)} rows={4} />
                                </label>
                            </div>

                            <article className="report-preview">{reportPreview}</article>
                        </section>
                    )}

                    {activePanel === "audit" && (
                        <section className="panel active" aria-labelledby="auditTitleHeading">
                            <div className="panel-heading">
                                <div>
                                    <p className="eyebrow">Audit timeline</p>
                                    <h2 id="auditTitleHeading">Traceable workflow events</h2>
                                </div>
                            </div>
                            <ol className="timeline">
                                {audit.map((item) => <li key={item}>{item}</li>)}
                            </ol>
                        </section>
                    )}

                    {activePanel === "admin" && (
                        <section className="panel active" aria-labelledby="adminTitleHeading">
                            <div className="panel-heading">
                                <div>
                                    <p className="eyebrow">Admin stubs</p>
                                    <h2 id="adminTitleHeading">Governance controls</h2>
                                </div>
                            </div>
                            <div className="stub-grid">
                                <button className="ghost-action" type="button" disabled>Retention policy</button>
                                <button className="ghost-action" type="button" disabled>Deletion request</button>
                                <button className="ghost-action" type="button" disabled>Model provider settings</button>
                                <button className="ghost-action" type="button" disabled>Adverse-impact analytics</button>
                                <button className="ghost-action" type="button" disabled>Candidate disclosure workflow</button>
                            </div>
                        </section>
                    )}
                </section>
            </main>

            <div className={`toast ${toast ? "visible" : ""}`} role="status" aria-live="polite">{toast}</div>
        </div>
    );
}