/* Ash-Fall arcade: per-cabinet fullscreen controls. No dependencies. */
(() => {
  "use strict";
  const page = location.pathname.split("/").pop();
  const selectors = {
    "arcade-games.html": ".game-panel",
    "arcade-vault.html": ".panel",
    "arcade-after-dark.html": ".game",
    "arcade-originals.html": ".cabinet",
    "arcade-fresh-meat.html": ".cabinet",
    "city-of-cinders.html": "main",
    "not-dead-yet.html": "main",
    "last-drop-lemonade.html": "main",
    "wagonbound.html": "main"
  };
  const selector = selectors[page];
  if (!selector) return;

  const label = (button, active) => {
    button.textContent = active ? "⤢ Exit fullscreen" : "⛶ Fullscreen";
    button.setAttribute("aria-label", active ? "Exit fullscreen game view" : "Open game in fullscreen");
    button.setAttribute("aria-pressed", String(active));
  };

  function init() {
    document.querySelectorAll(selector).forEach((root, index) => {
      if (root.dataset.afFullscreenReady === "true") return;
      root.dataset.afFullscreenReady = "true";
      root.classList.add("af-game-root");
      if (!root.id) root.id = "af-game-root-" + (index + 1);

      const tools = document.createElement("div");
      tools.className = "af-game-tools";
      const tag = document.createElement("span");
      tag.className = "af-game-kicker";
      tag.textContent = "ASH-FALL ARCADE";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "af-fullscreen-toggle";
      button.dataset.fullscreenTarget = root.id;
      label(button, false);
      button.addEventListener("click", async () => {
        const current = document.fullscreenElement || document.webkitFullscreenElement;
        if (current === root) {
          try {
            if (document.exitFullscreen) await document.exitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
          } catch (_) { button.textContent = "Fullscreen unavailable"; }
          return;
        }
        try {
          if (root.requestFullscreen) {
            try { await root.requestFullscreen({ navigationUI: "hide" }); }
            catch (_) { await root.requestFullscreen(); }
          } else if (root.webkitRequestFullscreen) {
            root.webkitRequestFullscreen();
          } else {
            button.textContent = "Fullscreen unsupported";
            button.setAttribute("aria-label", "Fullscreen is not supported by this browser");
          }
        } catch (_) {
          button.textContent = "Fullscreen blocked";
          button.setAttribute("aria-label", "The browser blocked fullscreen mode");
        }
      });
      tools.append(tag, button);
      root.prepend(tools);
    });
    syncButtons();
  }

  function syncButtons() {
    const active = document.fullscreenElement || document.webkitFullscreenElement;
    document.querySelectorAll(".af-fullscreen-toggle").forEach(button => {
      const root = document.getElementById(button.dataset.fullscreenTarget);
      label(button, !!active && active === root);
    });
  }
  document.addEventListener("fullscreenchange", syncButtons);
  document.addEventListener("webkitfullscreenchange", syncButtons);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
