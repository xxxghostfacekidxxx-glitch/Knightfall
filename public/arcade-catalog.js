(() => {
  "use strict";
  // Every cabinet stays visible. Genres are labels, not extra navigation.
  // Each cabinet also gets a direct, prefilled GitHub issue link so broken
  // launches can be reported with enough context to reproduce them.
  const boot = () => {
    const shelf = document.querySelector("#game-shelf .cartridge-shelf");
    if (!shelf || shelf.dataset.flatCatalogReady === "true") return;
    shelf.dataset.flatCatalogReady = "true";
    const cards = [...shelf.querySelectorAll(":scope > .cartridge-cabinet")];
    const heading = document.querySelector("#arcade-total-count");
    const toolbar = document.createElement("div");
    toolbar.className = "arcade-catalog-toolbar";
    toolbar.innerHTML = '<label class="arcade-search-label" for="arcade-game-search">FIND A GAME</label><input id="arcade-game-search" type="search" placeholder="Search games, genres, or descriptions…" autocomplete="off"><span class="arcade-search-count" aria-live="polite"></span>';
    shelf.parentNode.insertBefore(toolbar, shelf);
    const search = toolbar.querySelector("input");
    const count = toolbar.querySelector(".arcade-search-count");

    for (const [index, card] of cards.entries()) {
      if (card.querySelector(".arcade-report-issue")) continue;
      const title = card.querySelector("h3")?.textContent?.trim() || `Arcade cabinet ${index + 1}`;
      const launch = card.querySelector('a.button[href], a[href*="/arcade/"], a[href*=".html"]');
      const launchUrl = launch ? new URL(launch.getAttribute("href"), window.location.origin).href : window.location.href;
      const body = [
        "## Arcade game issue",
        "",
        "**Game:** " + title,
        "**Launch URL:** " + launchUrl,
        "**Page:** " + window.location.href,
        "",
        "### What happened?",
        "Describe what you expected and what actually happened.",
        "",
        "### Device / browser",
        "Add your device and browser if known.",
        "",
        "### Console error (optional)",
        "Paste any visible error message here."
      ].join("\n");
      const report = document.createElement("a");
      report.className = "arcade-report-issue";
      report.href = "https://github.com/xxxghostfacekidxxx-glitch/Knightfall/issues/new?title=" +
        encodeURIComponent("[Arcade] " + title + " launch or gameplay issue") +
        "&body=" + encodeURIComponent(body);
      report.target = "_blank";
      report.rel = "noopener noreferrer";
      report.textContent = "⚑ Report a problem";
      report.setAttribute("aria-label", "Report a launch or gameplay problem with " + title);
      card.append(report);
    }

    const searchableText = card => [
      card.querySelector(".cartridge-number")?.textContent || "",
      card.querySelector("h3")?.textContent || "",
      ...[...card.querySelectorAll("p")].map(p => p.textContent || "")
    ].join(" ").toLowerCase();

    const render = () => {
      const query = search.value.trim().toLowerCase();
      let visible = 0;
      for (const card of cards) {
        const show = !query || searchableText(card).includes(query);
        card.hidden = !show;
        if (show) visible++;
      }
      count.textContent = query ? visible + (visible === 1 ? " game found" : " games found") : visible + " games ready";
      if (heading) heading.textContent = visible + (query ? " MATCHING GAMES" : " GAMES · ALL VISIBLE");
    };
    search.addEventListener("input", render);
    render();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();