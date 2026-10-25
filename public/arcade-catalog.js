(() => {
  "use strict";
  // Every cabinet stays visible. Genres are labels, not extra navigation.
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
    const render = () => {
      const query = search.value.trim().toLowerCase();
      let visible = 0;
      for (const card of cards) {
        const show = !query || (card.innerText || card.textContent || "").toLowerCase().includes(query);
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