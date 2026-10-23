(() => {
  "use strict";
  const boot = () => {
    const shelf = document.querySelector("#game-shelf .cartridge-shelf");
    if (!shelf || shelf.dataset.catalogOrganized === "true") return;
    const cards = [...shelf.querySelectorAll(":scope > .cartridge-cabinet")];
    if (!cards.length) return;
    shelf.dataset.catalogOrganized = "true";
    const groups = [
      {name:"Arcade & Action", icon:"✦", match:/reflex|arcade|clicker|reaction|whack|breaker|pong|shooter|shoot|zombie|rampage|city of cinders|not dead yet/i},
      {name:"Puzzle & Brain", icon:"◇", match:/puzzle|memory|logic|guess|minefield|2048|lights out|tic-tac-toe|match/i},
      {name:"Shooters & Survival", icon:"☠", match:/zombie|survival|snake|ashes of the void|trench bounty|reef rush|relic hunt|fish|shooter|horde/i},
      {name:"Casino & Table Games", icon:"♠", match:/casino|table games|blackjack|roulette|plinko|fish-shooter/i},
      {name:"Strategy & Simulation", icon:"⚙", match:/business sim|survival sim|lemonade|wagonbound|strategy|city builder|trail/i},
      {name:"Originals & Experiments", icon:"✹", match:/original build|prototype|original|ash-fall|cabinet 0/i}
    ];
    const categorized = new Map(groups.map(g => [g.name, []]));
    cards.forEach(card => {
      const text = (card.innerText || "").replace(/\s+/g, " ");
      let chosen = groups.find(g => g.match.test(text));
      if (!chosen) chosen = groups[groups.length - 1];
      // Prefer a genre-specific home, while allowing original builds to stay in their gameplay genre.
      categorized.get(chosen.name).push(card);
    });
    // Casino is a destination card, not a duplicate mini-game; keep it in its own genre.
    const casino = cards.find(c => /Ash-Fall Casino/i.test(c.innerText || ""));
    if (casino) {
      for (const [name, items] of categorized) {
        const index = items.indexOf(casino);
        if (index >= 0) items.splice(index, 1);
      }
      categorized.get("Casino & Table Games").unshift(casino);
    }
    const fragment = document.createDocumentFragment();
    groups.forEach((group, index) => {
      const items = categorized.get(group.name);
      if (!items.length) return;
      const section = document.createElement("section");
      section.className = "arcade-genre";
      section.setAttribute("aria-labelledby", "arcade-genre-" + index);
      const header = document.createElement("div");
      header.className = "arcade-genre-heading";
      const heading = document.createElement("div");
      heading.innerHTML = '<p class="eyebrow">GAME COLLECTION</p><h3 id="arcade-genre-' + index + '">' + group.icon + ' ' + group.name + '</h3><span class="arcade-genre-count">' + items.length + (items.length === 1 ? ' game' : ' games') + '</span>';
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "arcade-view-all";
      toggle.textContent = "View all";
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "View all " + group.name + " games");
      header.append(heading, toggle);
      const grid = document.createElement("div");
      grid.className = "cartridge-shelf arcade-genre-shelf";
      items.forEach((card, i) => {
        card.classList.add("arcade-mini-card");
        if (i >= 4) card.hidden = true;
        grid.append(card);
      });
      toggle.hidden = items.length <= 4;
      toggle.addEventListener("click", () => {
        const expanded = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!expanded));
        toggle.textContent = expanded ? "View all" : "Show less";
        grid.querySelectorAll(".arcade-mini-card").forEach((card, i) => {
          if (i >= 4) card.hidden = expanded;
        });
      });
      section.append(header, grid);
      fragment.append(section);
    });
    shelf.replaceWith(fragment);
    const toolbar = document.createElement("div");
    toolbar.className = "arcade-catalog-toolbar";
    toolbar.innerHTML = '<label class="arcade-search-label" for="arcade-game-search">Find a game</label><input id="arcade-game-search" type="search" placeholder="Search games or genres…" autocomplete="off"><span class="arcade-search-count" aria-live="polite"></span>';
    const firstGenre = document.querySelector("#game-shelf .arcade-genre");
    if (firstGenre) firstGenre.parentNode.insertBefore(toolbar, firstGenre);
    const search = toolbar.querySelector("input");
    const count = toolbar.querySelector(".arcade-search-count");
    search.addEventListener("input", () => {
      const query = search.value.trim().toLowerCase();
      let visible = 0;
      document.querySelectorAll("#game-shelf .arcade-genre").forEach(section => {
        const matches = [];
        section.querySelectorAll(".arcade-mini-card").forEach(card => {
          const hit = !query || (card.innerText || "").toLowerCase().includes(query);
          const index = [...section.querySelectorAll(".arcade-mini-card")].indexOf(card);
          const expanded = section.querySelector(".arcade-view-all").getAttribute("aria-expanded") === "true";
          card.hidden = !hit || (!query && index >= 4 && !expanded);
          if (hit) { visible++; matches.push(card); }
        });
        section.hidden = matches.length === 0;
        const button = section.querySelector(".arcade-view-all");
        if (query) {
          button.hidden = true;
        } else {
          button.hidden = matches.length <= 4;
          button.textContent = button.getAttribute("aria-expanded") === "true" ? "Show less" : "View all";
        }
      });
      count.textContent = query ? visible + (visible === 1 ? " game found" : " games found") : "";
    });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();