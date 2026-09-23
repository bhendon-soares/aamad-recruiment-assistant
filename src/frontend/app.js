const state = {
    rubric: null,
    rubricApproved: false,
    packet: null,
    audit: ["Frontend loaded with local-only MVP workflow."],
};

const elements = {
    navItems: document.querySelectorAll(".nav-item"),
    panels: document.querySelectorAll(".panel"),
    generateRubric: document.querySelector("#generateRubric"),
    approveRubric: document.querySelector("#approveRubric"),
    generatePacket: document.querySelector("#generatePacket"),
    exportReport: document.querySelector("#exportReport"),
    rubricStatus: document.querySelector("#rubricStatus"),
    packetStatus: document.querySelector("#packetStatus"),
    mustHaveList: document.querySelector("#mustHaveList"),
    niceHaveList: document.querySelector("#niceHaveList"),
    ambiguityBox: document.querySelector("#ambiguityBox"),
    ambiguityResolved: document.querySelector("#ambiguityResolved"),
    candidateText: document.querySelector("#candidateText"),
    assessmentRows: document.querySelector("#assessmentRows"),
    fitCategory: document.querySelector("#fitCategory"),
    strengthsList: document.querySelector("#strengthsList"),
    gapsList: document.querySelector("#gapsList"),
    warningGrid: document.querySelector("#warningGrid"),
    complianceStatus: document.querySelector("#complianceStatus"),
    warningAcknowledged: document.querySelector("#warningAcknowledged"),
    reviewerName: document.querySelector("#reviewerName"),
    decisionNote: document.querySelector("#decisionNote"),
    reportPreview: document.querySelector("#reportPreview"),
    auditTimeline: document.querySelector("#auditTimeline"),
    toast: document.querySelector("#toast"),
};

function setStatus(element, label, className) {
    element.textContent = label;
    element.className = `status-pill ${className}`;
}

function toast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add("visible");
    window.setTimeout(() => elements.toast.classList.remove("visible"), 2600);
}

function addAudit(message) {
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    state.audit.unshift(`${timestamp} - ${message}`);
    renderAudit();
}

function renderAudit() {
    elements.auditTimeline.innerHTML = state.audit.map((item) => `<li>${item}</li>`).join("");
}

function renderList(element, items) {
    element.innerHTML = items.map((item) => `<li>${item}</li>`).join("");
}

function formatFitCategory(category) {
    const labels = {
        strong_potential_fit: "Strong potential fit",
        potential_fit_with_gaps: "Potential fit with gaps",
        insufficient_evidence: "Insufficient evidence",
        not_aligned_with_current_rubric: "Not aligned with current rubric",
    };

    return labels[category] || category;
}

function switchPanel(panelId) {
    elements.navItems.forEach((item) => item.classList.toggle("active", item.dataset.panel === panelId));
    elements.panels.forEach((panel) => panel.classList.toggle("active", panel.id === panelId));
}

function generateRubric() {
    const roleTitle = document.querySelector("#roleTitleInput").value.trim() || "Untitled role";
    const department = document.querySelector("#departmentInput").value.trim() || "Unassigned";

    state.rubric = {
        roleTitle,
        department,
        mustHave: [
            "Interaction design for complex workflow products",
            "Research synthesis with source-backed recommendations",
            "Accessible design practice",
            "Cross-functional partnership with product and engineering",
        ],
        niceHave: ["Hiring systems domain exposure", "AI-assisted product experience", "Design systems stewardship"],
        ambiguity: "Seniority evidence and hiring-systems depth need recruiter confirmation before assessment.",
    };
    state.rubricApproved = false;
    state.packet = null;
    elements.ambiguityResolved.checked = false;

    renderList(elements.mustHaveList, state.rubric.mustHave);
    renderList(elements.niceHaveList, state.rubric.niceHave);
    elements.ambiguityBox.textContent = state.rubric.ambiguity;
    setStatus(elements.rubricStatus, "Rubric draft", "status-draft");
    setStatus(elements.packetStatus, "Packet waiting", "status-waiting");
    elements.generatePacket.disabled = true;
    elements.candidateText.disabled = true;
    renderPacket();
    updateExportGate();
    addAudit(`Draft rubric generated for ${roleTitle} in ${department}.`);
    toast("Rubric draft generated. Resolve ambiguity before approval.");
    switchPanel("rubricPanel");
}

function approveRubric() {
    if (!state.rubric) {
        toast("Generate a rubric first.");
        return;
    }

    if (!elements.ambiguityResolved.checked) {
        setStatus(elements.rubricStatus, "Approval blocked", "status-blocked");
        toast("Approval requires ambiguity resolution or waiver rationale.");
        addAudit("Rubric approval blocked by unresolved ambiguity.");
        return;
    }

    state.rubricApproved = true;
    setStatus(elements.rubricStatus, "Rubric approved", "status-ready");
    elements.generatePacket.disabled = false;
    elements.candidateText.disabled = false;
    addAudit("Rubric approved by human reviewer; candidate assessment enabled.");
    toast("Rubric approved. Candidate packet generation is now available.");
    switchPanel("candidatePanel");
}

function generatePacket() {
    if (!state.rubricApproved) {
        toast("Approve the rubric before candidate assessment.");
        return;
    }

    const candidateId = document.querySelector("#candidateId").value.trim() || "CAND-DRAFT";
    const sourceDocument = document.querySelector("#sourceDocument").value.trim() || "manual-paste.txt";

    state.packet = {
        candidateId,
        sourceDocument,
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

    setStatus(elements.packetStatus, "Ready with warnings", "status-warning");
    renderPacket();
    updateExportGate();
    addAudit(`Candidate packet generated for ${candidateId} from ${sourceDocument}.`);
    toast("Candidate packet generated with review warnings.");
    switchPanel("packetPanel");
}

function renderPacket() {
    if (!state.packet) {
        elements.assessmentRows.innerHTML = '<tr><td colspan="4">Approve a rubric and generate a candidate packet.</td></tr>';
        elements.strengthsList.innerHTML = "";
        elements.gapsList.innerHTML = "";
        setStatus(elements.fitCategory, "Waiting for candidate", "status-waiting");
        setStatus(elements.complianceStatus, "Not reviewed", "status-waiting");
        elements.warningGrid.innerHTML = '<article class="warning-box">Generate a packet to populate compliance review.</article>';
        elements.reportPreview.textContent = "Candidate report will appear after packet generation.";
        return;
    }

    elements.assessmentRows.innerHTML = state.packet.assessments
        .map(
            (assessment) => `<tr>
        <td>${assessment.criterion}</td>
        <td><span class="status-pill status-ready">${assessment.status}</span></td>
        <td>${assessment.evidence}</td>
        <td><input type="text" aria-label="Human note for ${assessment.criterion}" placeholder="Add note" /></td>
      </tr>`,
        )
        .join("");
    renderList(elements.strengthsList, state.packet.strengths);
    renderList(elements.gapsList, state.packet.gaps);
    setStatus(elements.fitCategory, formatFitCategory(state.packet.fitCategory), "status-warning");
    setStatus(elements.complianceStatus, "Passed with warnings", "status-warning");
    elements.warningGrid.innerHTML = state.packet.warnings
        .map((warning) => `<article class="warning-box">${warning}</article>`)
        .join("");
    renderReportPreview();
}

function renderReportPreview() {
    if (!state.packet) {
        return;
    }

    const reviewer = elements.reviewerName.value.trim() || "Pending reviewer";
    const note = elements.decisionNote.value.trim() || "Pending human decision note.";
    elements.reportPreview.textContent = `# Candidate Report: ${state.packet.candidateId}

Role: ${state.rubric.roleTitle}
Fit category: ${state.packet.fitCategory}
Compliance status: ${state.packet.complianceStatus}
Human reviewer: ${reviewer}

Summary:
The candidate has evidence of workflow product design, accessibility practice, and cross-functional delivery. Research synthesis and seniority scope require human follow-up.

Human decision note:
${note}`;
}

function updateExportGate() {
    const hasPacket = Boolean(state.packet);
    const warningsOk = elements.warningAcknowledged.checked;
    const reviewerOk = elements.reviewerName.value.trim().length > 0;
    const noteOk = elements.decisionNote.value.trim().length > 0;
    elements.exportReport.disabled = !(hasPacket && warningsOk && reviewerOk && noteOk);
    renderReportPreview();
}

function exportReport() {
    if (elements.exportReport.disabled) {
        toast("Complete human review fields and warning acknowledgement before export.");
        return;
    }

    addAudit("Markdown report export prepared after human review gate passed.");
    toast("Markdown export gate passed. Backend export endpoint is intentionally not wired in this slice.");
}

elements.navItems.forEach((item) => {
    item.addEventListener("click", () => switchPanel(item.dataset.panel));
});
elements.generateRubric.addEventListener("click", generateRubric);
elements.approveRubric.addEventListener("click", approveRubric);
elements.generatePacket.addEventListener("click", generatePacket);
elements.exportReport.addEventListener("click", exportReport);
elements.warningAcknowledged.addEventListener("change", updateExportGate);
elements.reviewerName.addEventListener("input", updateExportGate);
elements.decisionNote.addEventListener("input", updateExportGate);

renderAudit();