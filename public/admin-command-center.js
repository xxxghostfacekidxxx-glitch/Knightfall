(() => {
  "use strict";
  const root = document.querySelector("#profile");
  if (!root) return;

  const actions = [
    {
      title: "Plan a feature",
      detail: "Turn an idea into a small, testable implementation plan.",
      prompt: "Act as my Knightfall/Ash-Fall development partner. Help me plan the next feature. Based only on the project context supplied to you, give me: goal, affected components/files if known, smallest safe implementation sequence, risks, and verification tests. Clearly label assumptions and do not pretend to inspect files or live services."
    },
    {
      title: "Debug a failure",
      detail: "Work from evidence instead of summoning bugs from the void.",
      prompt: "Help me debug a Knightfall/Ash-Fall failure systematically. First identify the minimum evidence needed (exact error, relevant logs, changed files, workflow/deployment status). Give me a short diagnostic tree and distinguish confirmed facts from hypotheses. Do not claim live GitHub or Cloudflare access."
    },
    {
      title: "Deployment readiness",
      detail: "Check the Pages, Worker, and workflow verification sequence.",
      prompt: "Create a deployment-readiness checklist for Knightfall/Ash-Fall using our Pages frontend and Cloudflare Worker API architecture. Include GitHub Actions status, correct production branch, Pages build/deployment, Worker deployment, /health, authenticated API smoke tests, browser console/network checks, and rollback criteria. Do not claim any check has passed unless I provide evidence."
    },
    {
      title: "Security review",
      detail: "Review boundaries, authorization, validation, and secrets handling.",
      prompt: "Act as a cautious security reviewer for Knightfall/Ash-Fall. Give me a prioritized checklist covering authentication/session cookies, owner-only and admin authorization, API input validation, CORS/CSRF considerations, rate limits, audit logs, secret handling, D1/KV permissions, and destructive admin actions. Separate issues confirmed by supplied evidence from checks still requiring source code or runtime testing."
    },
    {
      title: "End-to-end test plan",
      detail: "Trace the main member journey and admin controls.",
      prompt: "Build a practical end-to-end test plan for Knightfall covering registration, login/logout, profile editing, forum thread creation and replies, messaging, notifications, reports/moderation, admin controls, and the private Miss Chaos assistant. For each test give steps, expected result, and evidence to capture. Mark anything that needs a real authenticated browser test."
    },
    {
      title: "Review Miss Chaos rules",
      detail: "Find contradictions before they become personality bugs.",
      prompt: "Review the current public Miss Chaos behavior and personality configuration supplied in your context. Identify conflicts, ambiguous rules, unintended side effects, and missing evaluation scenarios. Recommend the smallest useful changes and explain trade-offs. Do not change anything or create a proposal unless I explicitly ask."
    },
    {
      title: "Triage Developer Arsenal scan",
      detail: "Sort Biome and Semgrep findings into actual fixes and false positives.",
      prompt: "Review the Knightfall developer-arsenal-summary.json from GitHub Actions when provided. It contains only counts and severity totals. Explain what those numbers do and do not establish, identify scanner failures separately from code findings, and propose a prioritized investigation. Do not invent source files, finding descriptions, fixes, or repository access. Never request raw potential secret matches pasted into chat. A patch requires separately verified evidence and approval."
    },
    {
      title: "Investigate a browser bug",
      detail: "Prepare a reproducible Playwright and DevTools test.",
      prompt: "Help reproduce a Knightfall browser issue using an isolated Playwright test. Describe page route, viewport, actions, expected state, selectors, screenshot evidence, JavaScript console errors, and failed requests. Never paste credentials into screenshots or logs. Identify whether an MCP browser connection is actually available before suggesting direct agent execution."
    },
    {
      title: "Draft a GitHub task",
      detail: "Produce a ready-to-file issue or pull request brief.",
      prompt: "Help me turn my next Knightfall/Ash-Fall change into a GitHub-ready task. Ask for the missing feature or bug details if needed, then draft a concise title, problem statement, acceptance criteria, implementation notes, security considerations, and test plan. Do not claim to have created an issue or changed repository files."
    }
  ];

  const checklist = [
    ["site", "Public pages load and navigation works"],
    ["auth", "Registration, login, logout, and session expiry"],
    ["profile", "Profile view and editing work for the right account"],
    ["forum", "Create a thread, reply, and revisit it"],
    ["messages", "Send and receive private messages"],
    ["notifications", "Unread state, links, and read status"],
    ["moderation", "Report, review, restore, and audit actions"],
    ["chaos", "Private assistant chat and proposal approval"],
    ["deploy", "GitHub checks, Pages, Worker, and API health verified"]
  ];
  const storageKey = "knightfall.privateAdminChecklist.v1";

  function mount() {
    const lab = document.querySelector("#private-chaos-lab");
    if (!lab || lab.dataset.commandCenterMounted === "true") return false;
    const chat = lab.querySelector(".lab-chat");
    const chatForm = lab.querySelector("#lab-chat-form");
    const chatInput = lab.querySelector("#lab-chat-input");
    if (!chat || !chatForm || !chatInput) return false;

    lab.dataset.commandCenterMounted = "true";
    const section = document.createElement("section");
    section.className = "admin-command-center";
    section.setAttribute("aria-labelledby", "admin-command-center-title");

    const heading = document.createElement("div");
    heading.className = "command-center-heading";
    const title = document.createElement("h3");
    title.id = "admin-command-center-title";
    title.textContent = "Development Command Center";
    const intro = document.createElement("p");
    intro.textContent = "Choose a workflow to send a focused brief to your private assistant. It can reason from context and evidence you provide, but this panel does not itself connect to GitHub or Cloudflare.";
    heading.append(title, intro);

    const grid = document.createElement("div");
    grid.className = "command-center-actions";
    for (const item of actions) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "command-center-action";
      const name = document.createElement("strong");
      name.textContent = item.title;
      const detail = document.createElement("span");
      detail.textContent = item.detail;
      button.append(name, detail);
      button.addEventListener("click", () => {
        chatInput.value = item.prompt;
        chatInput.focus();
        chatForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      });
      grid.append(button);
    }

    // User-selected counts-only report. Never upload the raw file to a server.
    const importSection = document.createElement("div");
    importSection.className = "command-center-audit-import";
    const importTitle = document.createElement("h4");
    importTitle.textContent = "Import sanitized CI summary";
    const importHint = document.createElement("p");
    importHint.textContent = "Choose developer-arsenal-summary.json from GitHub Actions. Only aggregate counts are inserted into the assistant prompt. Raw Semgrep reports are not supported.";
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".json,application/json";
    fileInput.setAttribute("aria-label", "Select sanitized Developer Arsenal summary JSON");
    const importStatus = document.createElement("p");
    importStatus.setAttribute("role", "status");
    function fillAuditComposer(raw) {
      if (raw?.schemaVersion !== 1 || raw?.tool !== "knightfall-developer-arsenal") throw Error("Not a Knightfall sanitized summary.");
      const count = value => {
        if (!Number.isSafeInteger(value) || value < 0 || value > 1000000) throw Error("Invalid summary count.");
        return value;
      };
      const severity = {};
      for (const level of ["ERROR", "WARNING", "INFO", "UNKNOWN"]) severity[level] = count(raw.semgrep?.severity?.[level]);
      const total = count(raw.semgrep?.findings);
      if (Object.values(severity).reduce((a, b) => a + b, 0) !== total) throw Error("Severity totals do not match findings.");
      if (typeof raw.biome?.hasOutput !== "boolean") throw Error("Invalid Biome report.");
      const clean = {
        semgrep: { findings: total, severity, scannerErrors: count(raw.semgrep?.scannerErrors) },
        biome: { hasOutput: raw.biome.hasOutput, reportedErrors: count(raw.biome.reportedErrors), reportedWarnings: count(raw.biome.reportedWarnings) }
      };
      chatInput.value = "Interpret this verified-format, counts-only Knightfall Developer Arsenal summary. Distinguish scanner errors from findings. Do not invent affected files or fixes. Recommend next evidence-gathering steps only. Summary: " + JSON.stringify(clean);
      chatInput.focus();
      importStatus.textContent = "Sanitized counts inserted into the assistant composer. Review and send when ready.";
    }
    fileInput.addEventListener("change", async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      try {
        if (file.size > 16384) throw Error("File exceeds the 16 KB sanitized-summary limit.");
        const raw = JSON.parse(await file.text());
        fillAuditComposer(raw);
      } catch (error) {
        importStatus.textContent = "Import rejected: " + String(error?.message || error);
      } finally {
        fileInput.value = "";
      }
    });
    const loadLatest = document.createElement("button");
    loadLatest.type = "button";
    loadLatest.className = "action";
    loadLatest.textContent = "Load latest verified report (God)";
    loadLatest.addEventListener("click", async () => {
      loadLatest.disabled = true;
      importStatus.textContent = "Checking private report…";
      try {
        const response = await fetch("https://api.ash-fall.com/api/god/developer-audit", {
          method: "GET", credentials: "include", cache: "no-store"
        });
        if (!response.ok) throw Error(response.status === 401 || response.status === 403
          ? "God-account access required." : "No verified report is available. Check CI and ingest-secret setup.");
        const data = await response.json();
        fillAuditComposer(data.result);
      } catch (error) {
        importStatus.textContent = String(error?.message || "Diagnostic retrieval failed.");
      } finally {
        loadLatest.disabled = false;
      }
    });
    importSection.append(importTitle, importHint, loadLatest, fileInput, importStatus);

    const checklistSection = document.createElement("div");
    checklistSection.className = "command-center-checklist";
    const checklistTitle = document.createElement("h4");
    checklistTitle.textContent = "Release verification checklist";
    const checklistHelp = document.createElement("p");
    checklistHelp.textContent = "Your ticks are stored only in this browser. Mark an item complete only after you verify it.";
    const list = document.createElement("div");
    list.className = "command-center-checklist-items";
    let saved = {};
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || "{}");
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) saved = parsed;
    } catch {}
    for (const [key, label] of checklist) {
      const row = document.createElement("label");
      row.className = "command-center-check";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = saved[key] === true;
      input.addEventListener("change", () => {
        saved[key] = input.checked;
        try { localStorage.setItem(storageKey, JSON.stringify(saved)); } catch {}
        row.classList.toggle("complete", input.checked);
        updateProgress();
      });
      const text = document.createElement("span");
      text.textContent = label;
      row.append(input, text);
      row.classList.toggle("complete", input.checked);
      list.append(row);
    }
    const progress = document.createElement("p");
    progress.className = "command-center-progress";
    function updateProgress() {
      const count = list.querySelectorAll('input[type="checkbox"]:checked').length;
      progress.textContent = count + " of " + checklist.length + " checks marked complete";
    }
    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "action";
    reset.textContent = "Reset checklist";
    reset.addEventListener("click", () => {
      if (!confirm("Clear all release checklist ticks in this browser?")) return;
      saved = {};
      try { localStorage.removeItem(storageKey); } catch {}
      for (const input of list.querySelectorAll('input[type="checkbox"]')) {
        input.checked = false;
        input.closest("label").classList.remove("complete");
      }
      updateProgress();
    });
    checklistSection.append(checklistTitle, checklistHelp, list, progress, reset);
    section.append(heading, grid, importSection, checklistSection);

    const capabilities = chat.querySelector(".lab-assistant-capabilities");
    if (capabilities) chat.insertBefore(section, capabilities);
    else chat.insertBefore(section, chatForm);
    updateProgress();
    return true;
  }

  if (!mount()) {
    const observer = new MutationObserver(() => {
      if (mount()) observer.disconnect();
    });
    observer.observe(root, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 30000);
  }
})();
