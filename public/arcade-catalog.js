(() => {
  "use strict";

  // Show a useful playable shelf without forcing members through genre submenus.
  // The searchable full catalog remains available from the View all link.
  const FEATURED_TITLES = new Set([
    "Ash-Fall Casino",
    "Not Dead Yet, Asshole!",
    "Trench Bounty",
    "Neon Kelp: Reef Rush",
    "Magma Trench: Relic Hunt",
    "Last Drop Lemonade",
    "Wagonbound",
    "Cinder Clicker",
    "Madhouse Memory",
    "Guess the Curse",
    "Reaction Ritual",
    "Rock, Paper, Ruin",
    "Tic-Tac-Toe: Doom Edition",
    "Whack-a-Glitch",
    "Snake in the Ashes",
    "Minefield of Bad Ideas",
    "Ember Breaker",
    "2048",
    "Hextris · Imported",
    "Maze Muncher · Imported",
    "Sokoban · Imported",
    "Air Hockey · Imported",
    "Lights Out · Imported",
    "Whack-a-Mole · Imported",
    "Asteroids",
    "Connect Four",
    "Custom Tetris · Imported",
    "Dino Run: Ash-Fall Edition",
    "Cinder Crossing",
    "Afterburn Breakout"
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

    if (heading) heading.textContent = featured.length + " PLAYABLE GAMES";

    const existing = shelf.parentElement.querySelector(".arcade-view-all");
    if (!existing) {
      const cta = document.createElement("div");
      cta.className = "arcade-view-all";
      cta.innerHTML = '<p>Thirty playable cabinets on the main shelf. Browse all 76 locally playable games in one searchable list, without hopping through genre menus.</p><a class="button button-primary" href="/arcade-30-games.html">View all 76 games ↗</a>';
      shelf.insertAdjacentElement("afterend", cta);
    }

    if (featured.length !== FEATURED_TITLES.size) {
      console.warn("Chaos Cartridge shelf: expected " + FEATURED_TITLES.size + " cards but found " + featured.length + ".");
    }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();