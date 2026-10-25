(() => {
  "use strict";

  // Keep the arcade landing page focused. The full catalog contains every
  // locally playable game; the home shelf only features a small, varied set.
  const FEATURED_TITLES = new Set([
    "Ash-Fall Casino",
    "Zombie Diary",
    "Not Dead Yet, Asshole!",
    "Trench Bounty",
    "Neon Kelp: Reef Rush",
    "Magma Trench: Relic Hunt",
    "Cinder Crossing",
    "Afterburn Breakout",
    "Whack-a-Glitch",
    "Marshland Marksman",
    "Hextris · Imported",
    "2048"
  ]);

  const boot = () => {
    const shelf = document.querySelector("#game-shelf .cartridge-shelf");
    if (!shelf || shelf.dataset.flatCatalogReady === "true") return;
    shelf.dataset.flatCatalogReady = "true";

    const cards = [...shelf.querySelectorAll(":scope > .cartridge-cabinet")];
    const heading = document.querySelector("#arcade-total-count");
    const titleOf = card => card.querySelector("h3, h2")?.textContent?.trim() || "";
    const featured = cards.filter(card => FEATURED_TITLES.has(titleOf(card)));

    cards.forEach(card => {
      const show = featured.includes(card);
      card.hidden = !show;
      card.dataset.featured = show ? "true" : "false";
    });

    if (heading) heading.textContent = featured.length + " FEATURED GAMES";

    const existing = shelf.parentElement.querySelector(".arcade-view-all");
    if (!existing) {
      const cta = document.createElement("div");
      cta.className = "arcade-view-all";
      cta.innerHTML = '<p>Browse the complete collection of 76 locally playable cabinets, all in one searchable list.</p><a class="button button-primary" href="/arcade-30-games.html">View all 76 games ↗</a>';
      shelf.insertAdjacentElement("afterend", cta);
    }

    if (featured.length !== FEATURED_TITLES.size) {
      console.warn("Chaos Cartridge featured shelf: expected " + FEATURED_TITLES.size + " cards but found " + featured.length + ".");
    }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();