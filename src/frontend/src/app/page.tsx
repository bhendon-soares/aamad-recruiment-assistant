"use client";

import { useState } from "react";

type PanelId = "role" | "rubric" | "candidate" | "packet" | "compliance" | "report" | "audit" | "admin";
type FitCategory = "strong_potential_fit" | "potential_fit_with_gaps" | "insufficient_evidence" | "not_aligned_with_current_rubric";
type Theme = "light" | "dark";

type RoleRubric = {
    roleTitle: string;
    department: string;
    mustHave: string[];
    niceHave: string[];
    ambiguity: string;
};

type Assessment = {
    criterion: string;
    status: string;
    evidence: string;
};

type CandidatePacket = {
    candidateId: string;
    sourceDocument: string;
    fitCategory: FitCategory;
    assessments: Assessment[];
    strengths: string[];
    gaps: string[];
    warnings: string[];
    complianceStatus: "passed_with_warnings";
};

const fitCategoryLabels: Record<FitCategory, string> = {
    strong_potential_fit: "Strong potential fit",
    potential_fit_with_gaps: "Potential fit with gaps",
    insufficient_evidence: "Insufficient evidence",
    not_aligned_with_current_rubric: "Not aligned with current rubric",
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
    const [audit, setAudit] = useState(["Frontend loaded with local-only MVP workflow."]);

    const rubricStatus = rubricApproved ? { label: "Rubric approved", tone: "ready" as const } : { label: "Rubric draft", tone: "draft" as const };
    const packetStatus = packet ? { label: "Ready with warnings", tone: "warning" as const } : { label: "Packet waiting", tone: "waiting" as const };
    const exportEnabled = Boolean(packet && warningAcknowledged && reviewerName.trim() && decisionNote.trim());
    const isDarkTheme = theme === "dark";

    function showToast(message: string) {
        setToast(message);
        window.setTimeout(() => setToast(""), 2600);
    }

    function addAudit(message: string) {
        setAudit((items) => [`${timestamp()} - ${message}`, ...items]);
    }

    function generateRubric() {
        const nextRubric: RoleRubric = {
            roleTitle: roleTitle.trim() || "Untitled role",
            department: department.trim() || "Unassigned",
            mustHave: [
                "Interaction design for complex workflow products",
                "Research synthesis with source-backed recommendations",
                "Accessible design practice",
                "Cross-functional partnership with product and engineering",
            ],
            niceHave: ["Hiring systems domain exposure", "AI-assisted product experience", "Design systems stewardship"],
            ambiguity: "Seniority evidence and hiring-systems depth need recruiter confirmation before assessment.",
        };

        setRubric(nextRubric);
        setRubricApproved(false);
        setPacket(null);
        setAmbiguityResolved(false);
        setWarningAcknowledged(false);
        addAudit(`Draft rubric generated for ${nextRubric.roleTitle} in ${nextRubric.department}.`);
        showToast("Rubric draft generated. Resolve ambiguity before approval.");
        setActivePanel("rubric");
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

        setRubricApproved(true);
        addAudit("Rubric approved by human reviewer; candidate assessment enabled.");
        showToast("Rubric approved. Candidate packet generation is now available.");
        setActivePanel("candidate");
    }

    function generatePacket() {
        if (!rubricApproved || !rubric) {
            showToast("Approve the rubric before candidate assessment.");
            return;
        }

        const nextPacket: CandidatePacket = {
            candidateId: candidateId.trim() || "CAND-DRAFT",
            sourceDocument: sourceDocument.trim() || "manual-paste.txt",
            fitCategory: "potential_fit_with_gaps",
            assessments: [
                {
                    criterion: "Interaction design for complex workflow products",
                    status: "supported",
                    evidence: "Led redesign of enterprise workflow tools.",
                },
                {
                    criterion: "Research synthesis with source-backed recommendations",
                    status: "partial evidence",
                    evidence: "Partnered with research; explicit synthesis artifacts not provided.",
                },
                {
                    criterion: "Accessible design practice",
                    status: "supported",
                    evidence: "Introduced accessibility review practices.",
                },
                {
                    criterion: "Cross-functional partnership with product and engineering",
                    status: "supported",
                    evidence: "Partnered with research, engineering, and product leads.",
                },
            ],
            strengths: ["Workflow product experience", "Accessibility practice", "Cross-functional delivery"],
            gaps: ["Ask for concrete research synthesis examples", "Confirm seniority scope and mentoring evidence"],
            warnings: [
                "One assessment uses partial evidence and needs human review.",
                "No protected-attribute inference detected in this local demo packet.",
                "Candidate source text is treated as untrusted input.",
            ],
            complianceStatus: "passed_with_warnings",
        };

        setPacket(nextPacket);
        addAudit(`Candidate packet generated for ${nextPacket.candidateId} from ${nextPacket.sourceDocument}.`);
        showToast("Candidate packet generated with review warnings.");
        setActivePanel("packet");
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
        ? `# Candidate Report: ${packet.candidateId}\n\nRole: ${rubric?.roleTitle ?? "Pending role"}\nFit category: ${fitCategoryLabels[packet.fitCategory]}\nCompliance status: Passed with warnings\nHuman reviewer: ${reviewerName.trim() || "Pending reviewer"}\n\nSummary:\nThe candidate has evidence of workflow product design, accessibility practice, and cross-functional delivery. Research synthesis and seniority scope require human follow-up.\n\nHuman decision note:\n${decisionNote.trim() || "Pending human decision note."}`
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
                                <button className="primary-action" onClick={generateRubric} type="button">Generate rubric</button>
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
                                        {(rubric?.mustHave ?? []).map((item) => <li key={item}>{item}</li>)}
                                    </ul>
                                </article>
                                <article className="review-card">
                                    <h3>Nice-to-have criteria</h3>
                                    <ul className="editable-list">
                                        {(rubric?.niceHave ?? []).map((item) => <li key={item}>{item}</li>)}
                                    </ul>
                                </article>
                                <article className="review-card full-width">
                                    <h3>Ambiguity resolution</h3>
                                    <div className="warning-box">{rubric?.ambiguity ?? "Generate a rubric to review ambiguity warnings."}</div>
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
                                <button className="primary-action" disabled={!rubricApproved} onClick={generatePacket} type="button">Generate packet</button>
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
                                <StatusPill label={packet ? fitCategoryLabels[packet.fitCategory] : "Waiting for candidate"} tone={packet ? "warning" : "waiting"} />
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
                                        {packet ? packet.assessments.map((assessment) => (
                                            <tr key={assessment.criterion}>
                                                <td>{assessment.criterion}</td>
                                                <td><StatusPill label={assessment.status} tone="ready" /></td>
                                                <td>{assessment.evidence}</td>
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
                                    <ul>{(packet?.strengths ?? []).map((item) => <li key={item}>{item}</li>)}</ul>
                                </article>
                                <article className="review-card">
                                    <h3>Gaps and follow-up</h3>
                                    <ul>{(packet?.gaps ?? []).map((item) => <li key={item}>{item}</li>)}</ul>
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
                                <StatusPill label={packet ? "Passed with warnings" : "Not reviewed"} tone={packet ? "warning" : "waiting"} />
                            </div>

                            <div className="warning-grid">
                                {packet ? packet.warnings.map((warning) => <article className="warning-box" key={warning}>{warning}</article>) : <article className="warning-box">Generate a packet to populate compliance review.</article>}
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