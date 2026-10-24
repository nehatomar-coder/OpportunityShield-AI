(() => {
    const $ = id => document.getElementById(id);
    let lastAnalysis = null;
    let toastTimer;
    const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
    function toast(message) {
        const el = $("toast"); el.textContent = message; el.classList.add("show");
        clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2800);
    }
    function goView(view) {
        document.querySelectorAll(".nav-item").forEach(button => button.classList.toggle("active", button.dataset.view === view));
        $("trackerView").classList.toggle("hidden", view !== "tracker");
        $("resourcesView").classList.toggle("hidden", view !== "resources");
        document.querySelector(".workspace-grid").classList.toggle("hidden", view !== "home" && view !== "analyze" && view !== "skills" && view !== "saved");
        document.querySelector(".hero").classList.toggle("hidden", view !== "home");
        document.querySelector(".stats-grid").classList.toggle("hidden", view !== "home");
        document.querySelector(".bottom-banner").classList.toggle("hidden", view !== "home");
        if (view === "analyze") $("analyzerSection").scrollIntoView({ behavior: "smooth", block: "center" });
        if (view === "skills") $("skillSection").scrollIntoView({ behavior: "smooth", block: "center" });
        if (view === "tracker") renderTracker();
        if (view === "saved") { goView("tracker"); toast("Your saved opportunities are in the Application Tracker."); return; }
        if (view === "resources") $("resourcesView").scrollIntoView({ behavior: "smooth", block: "center" });
    }
    function showAnalysis(result) {
        lastAnalysis = result;
        if (result.error) { toast(result.error); $("analyzerHint").textContent = result.error; return; }
        $("analysisResult").classList.remove("hidden");
        $("analysisResult").innerHTML = `<div class="result-summary"><strong>Analysis summary</strong><p>${escapeHTML(result.summary)}</p><div class="detail-chips"><span>Company: ${escapeHTML(result.details.company)}</span><span>Role: ${escapeHTML(result.details.role)}</span><span>Deadline: ${escapeHTML(result.details.deadline)}</span></div></div>
      <h3>Warning signals (${result.flags.length})</h3>${result.flags.length ? result.flags.map(flag => `<article class="flag-item"><strong>⚠ ${escapeHTML(flag.title)}</strong><p>${escapeHTML(flag.reason)}</p><small>Matched phrase: “${escapeHTML(flag.phrase)}”</small></article>`).join("") : `<p class="no-flags">No configured warning phrases found. This is not a guarantee of legitimacy; independently verify the employer.</p>`}
      <h3>Skills detected</h3><p>${result.skills.length ? result.skills.map(escapeHTML).join(", ") : "No known skills detected. Check the description manually."}</p>
      ${result.positives.length ? `<h3>Details to verify</h3><ul>${result.positives.map(item => `<li>${escapeHTML(item)}</li>`).join("")}</ul>` : ""}
      <button class="outline-button" id="saveCurrentAnalysis">Save this opportunity →</button>`;
        $("analyzerHint").textContent = "Analysis complete — review the reasons below.";
        $("trustScore").textContent = result.score;
        $("riskLabel").textContent = result.level + " signal level";
        $("riskLabel").className = "risk-pill " + result.level.toLowerCase();
        $("trustNote").textContent = result.flags.length ? `${result.flags.length} warning signal(s) found. Check the explanations and verify independently.` : "No configured warning phrases found. A clean scan cannot prove an opportunity is genuine.";
        const match = SkillMatcher.match(result.skills);
        $("matchPercent").textContent = match.score + "%";
        $("matchRing").style.background = `conic-gradient(#27b08d ${match.score * 3.6}deg,#e7ecfb 0deg)`;
        $("matchedSkills").innerHTML = match.matched.length ? match.matched.map(skill => `<li class="good">${escapeHTML(skill)}</li>`).join("") : "<li>No matched skills detected yet.</li>";
        $("missingSkills").innerHTML = match.missing.length ? match.missing.map(skill => `<li class="missing">${escapeHTML(skill)}</li>`).join("") : "<li>No gaps among detected skills.</li>";
        $("riskCount").textContent = result.level === "High" ? "1" : "0";
        $("saveCurrentAnalysis").addEventListener("click", () => {
            const name = result.details.role !== "Review the role title manually" ? result.details.role : "Analysed opportunity";
            OpportunityTracker.add({ name, status: "Saved", deadline: "", risk: result.level, score: result.score });
            renderAll(); toast("Opportunity saved to your tracker.");
        });
        addActivity("You analysed an opportunity", result.level + " signal level · " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    }
    function renderTracker() {
        const items = OpportunityTracker.getAll();
        $("opportunityList").innerHTML = items.length ? items.map(item => `<div class="opportunity-row"><span class="action-icon purple">▣</span><div><strong>${escapeHTML(item.name)}</strong><small>${escapeHTML(item.risk || "Not analysed")} signals${item.deadline ? " · Deadline: " + escapeHTML(item.deadline) : ""}</small></div><select aria-label="Status for ${escapeHTML(item.name)}" data-status-id="${item.id}">${["Saved", "Applied", "Interview", "Offer", "Rejected"].map(status => `<option ${item.status === status ? "selected" : ""}>${status}</option>`).join("")}</select><button class="delete-button" data-delete-id="${item.id}" aria-label="Delete ${escapeHTML(item.name)}">Delete</button></div>`).join("") : `<div class="empty-state">No opportunities saved yet. Analyse a job description and choose “Save this opportunity”.</div>`;
        $("opportunityList").querySelectorAll("[data-status-id]").forEach(select => select.addEventListener("change", () => { OpportunityTracker.update(Number(select.dataset.statusId), select.value); renderAll(); toast("Application status updated."); }));
        $("opportunityList").querySelectorAll("[data-delete-id]").forEach(button => button.addEventListener("click", () => { OpportunityTracker.remove(Number(button.dataset.deleteId)); renderAll(); toast("Opportunity removed."); }));
    }
    function addActivity(title, detail) {
        const list = $("activityList");
        if (list.querySelector(".empty-state")) list.innerHTML = "";
        const item = document.createElement("div"); item.className = "activity-item";
        item.innerHTML = `<span class="activity-dot">✦</span><div><strong>${escapeHTML(title)}</strong><small>${escapeHTML(detail)}</small></div>`;
        list.prepend(item);
        while (list.children.length > 5) list.lastElementChild.remove();
    }
    function renderAll() {
        const items = OpportunityTracker.getAll();
        const countStatus = status => items.filter(item => item.status === status).length;
        $("savedCount").textContent = items.filter(item => item.status === "Saved").length;
        $("appliedCount").textContent = items.length;
        $("deadlineCount").textContent = items.filter(item => item.deadline && item.deadline >= new Date().toISOString().slice(0, 10)).length;
        $("miniSaved").textContent = countStatus("Saved");
        $("miniApplied").textContent = countStatus("Applied");
        $("miniInterview").textContent = countStatus("Interview");
        $("miniOffer").textContent = countStatus("Offer");
        renderTracker();
    }
    $("analyzeButton").addEventListener("click", () => {
        const result = OpportunityAnalyzer.analyze($("jobDescription").value);
        showAnalysis(result);
    });
    $("howItWorks").addEventListener("click", () => toast("We check configured warning phrases and explain why each may deserve attention. This is a helper, not a guarantee or a substitute for verification."));
    $("viewAnalysis").addEventListener("click", () => { $("analyzerSection").scrollIntoView({ behavior: "smooth", block: "center" }); $("jobDescription").focus(); });
    $("suggestButton").addEventListener("click", () => {
        const items = OpportunityTracker.getAll();
        const message = items.length ? "Review the missing skills from your latest analysis and verify saved employers before applying." : "Start by pasting a job description into the analyser. We’ll identify possible warning signs and detected skills.";
        toast(message); $("analyzerSection").scrollIntoView({ behavior: "smooth", block: "center" });
    });
    $("saveOpportunityForm").addEventListener("submit", event => {
        event.preventDefault();
        OpportunityTracker.add({ name: $("companyName").value.trim(), status: $("applicationStatus").value, deadline: $("deadlineDate").value, risk: "Not analysed", score: null });
        event.target.reset(); renderAll(); toast("Opportunity added successfully.");
    });
    document.querySelectorAll(".nav-item").forEach(button => button.addEventListener("click", () => goView(button.dataset.view)));
    document.querySelectorAll("[data-view]").forEach(button => { if (!button.classList.contains("nav-item")) button.addEventListener("click", () => goView(button.dataset.view)); });
    document.querySelectorAll("[data-view-link]").forEach(button => button.addEventListener("click", () => goView(button.dataset.viewLink)));
    document.querySelectorAll("[data-scroll]").forEach(button => button.addEventListener("click", () => $(button.dataset.scroll).scrollIntoView({ behavior: "smooth", block: "center" })));
    $("backHome").addEventListener("click", () => goView("home"));
    $("backHomeResources").addEventListener("click", () => goView("home"));
    $("themeToggle").addEventListener("click", () => document.body.classList.toggle("dark-mode"));
    $("globalSearch").addEventListener("keydown", event => { if (event.key === "Enter") { const query = event.target.value.trim(); if (query) { $("jobDescription").value = query; goView("analyze"); toast("Search text moved to the analyser. Add the full description to analyse it."); } } });
    document.addEventListener("keydown", event => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); $("globalSearch").focus(); } });
    renderAll();
})();
