(() => {
  "use strict";

  const workshop = document.getElementById("workshop");
  const catalog = document.getElementById("foundry-catalog");
  const filters = [...document.querySelectorAll("#foundry-filters button")];
  const search = document.getElementById("foundry-search");
  const count = document.getElementById("foundry-count");
  const empty = document.getElementById("foundry-empty");
  const back = document.getElementById("foundry-back");

  const legacyAnchors = {
    "tools": "foundry-catalog",
    "open-source-tools": "foundry-catalog",
    "dt-workspace-1": "arcade-project-resources",
    "dt-workspace-12": "sprite-preview",
    "dt-workspace-13": "sprite-catalog",
    "dt-workspace-14": "arcade-project-resources",
    "dt-workspace-15": "render-controls",
    "dt-workspace-16": "developer-bench"
  };

  function init() {
    const workspaces = [...workshop.querySelectorAll("[data-workspace]")];
    const groups = [...catalog.querySelectorAll("[data-group]")].map(section => ({
      section,
      cards: [...section.querySelectorAll(".foundry-card")].map(element => {
        const workspaceLink = element.querySelector("[data-workspace-search]");
        return {
          element,
          target: workspaceLink && document.getElementById(workspaceLink.hash.slice(1)),
          text: [element.textContent, element.dataset.search, section.querySelector("h2").textContent].join(" ")
        };
      })
    }));
    let category = "all";
    let previousLink;

    function filter() {
      const terms = search.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
      let total = 0;
      for (const { section, cards } of groups) {
        let matches = 0;
        for (const { element, target, text } of cards) {
          const inCategory = category === "all" || category === section.dataset.group;
          const index = (text + " " + (target?.textContent || "")).toLowerCase();
          element.hidden = !inCategory || !terms.every(term => index.includes(term));
          if (!element.hidden) matches++;
        }
        section.hidden = matches === 0;
        total += matches;
      }
      count.textContent = total + (total === 1 ? " result" : " results");
      empty.hidden = total > 0;
    }

    function showLocation() {
      const hash = location.hash.slice(1);
      const target = document.getElementById(legacyAnchors[hash] || hash);
      const active = target?.closest("[data-workspace]");
      if (!active && !catalog.hidden) {
        if (target === catalog) catalog.scrollIntoView({ block: "start" });
        return;
      }

      catalog.hidden = Boolean(active);
      back.hidden = !active;
      document.getElementById("creator-handoff").classList.toggle("hidden", Boolean(active));
      for (const workspace of workspaces) workspace.hidden = workspace !== active;

      if (active) {
        const heading = target.querySelector("h2, h3") || active.querySelector("h2");
        if (heading) {
          heading.tabIndex = -1;
          heading.focus({ preventScroll: true });
        }
        (target === active ? back : target).scrollIntoView({ block: "start" });
      } else {
        (previousLink?.getClientRects().length ? previousLink : catalog).focus();
        if (!previousLink?.getClientRects().length) catalog.scrollIntoView({ block: "start" });
      }
    }

    search.addEventListener("input", filter);
    for (const button of filters) {
      button.addEventListener("click", () => {
        category = button.dataset.category;
        for (const other of filters) other.setAttribute("aria-pressed", String(other === button));
        filter();
      });
    }

    catalog.addEventListener("click", event => {
      const link = event.target.closest('a[href^="#"]');
      if (link) previousLink = link;
    });
    window.addEventListener("hashchange", showLocation);
    filter();
    showLocation();
  }

  if (workshop.classList.contains("hidden")) {
    workshop.addEventListener("foundry:ready", init, { once: true });
  } else {
    init();
  }
})();
