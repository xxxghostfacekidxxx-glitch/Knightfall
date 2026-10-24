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
      tools.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:.75rem;padding:.7rem 1rem;margin-bottom:.8rem;border:1px solid rgba(255,79,163,.25);border-radius:12px;background:linear-gradient(100deg,rgba(255,79,163,.10),rgba(168,255,62,.06));";
      const tag = document.createElement("span");
      tag.className = "af-game-kicker";
      tag.textContent = "ASH-FALL ARCADE";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "af-fullscreen-toggle";
      button.style.cssText = "display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:.65rem .9rem;border:1px solid #ff4fa3;border-radius:9px;background:linear-gradient(135deg,#ff4fa3,#a8ff3e);color:#101010;font:inherit;font-size:.83rem;font-weight:900;cursor:pointer;";
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
    document.querySelectorAll(".af-game-root").forEach(root => {
      if (root === active && root.dataset.afFullscreenLayout !== "true") {
        root.dataset.afFullscreenLayout = "true";
        root.dataset.afOriginalStyle = root.getAttribute("style") === null ? "__none__" : root.getAttribute("style");
        root.style.cssText = "width:100vw;height:100vh;max-width:none;max-height:none;margin:0;padding:clamp(8px,2vw,24px);overflow:auto;box-sizing:border-box;background:#080808;border-radius:0;";
        root.querySelectorAll(":scope > .back,:scope > .hero,:scope > .intro,:scope > .account,:scope > .directory-hero,:scope > .roster,:scope > .roster-heading,:scope > .mutation-row,:scope > .character-banner").forEach(el => {
          el.dataset.afOriginalStyle = el.getAttribute("style") === null ? "__none__" : el.getAttribute("style");
          el.style.display = "none";
        });
        root.querySelectorAll("canvas").forEach(canvas => {
          canvas.dataset.afOriginalStyle = canvas.getAttribute("style") === null ? "__none__" : canvas.getAttribute("style");
          canvas.style.maxHeight = "calc(100dvh - 190px)";
          canvas.style.width = "100%";
          canvas.style.objectFit = "contain";
        });
        const tools = root.querySelector(".af-game-tools");
        if (tools) { tools.dataset.afOriginalStyle = tools.getAttribute("style") === null ? "__none__" : tools.getAttribute("style"); tools.style.position = "sticky"; tools.style.top = "0"; tools.style.zIndex = "100"; }
      } else if (root !== active && root.dataset.afFullscreenLayout === "true") {
        const original = root.dataset.afOriginalStyle;
        if (original === "__none__") root.removeAttribute("style"); else root.setAttribute("style", original);
        root.querySelectorAll("[data-af-original-style]").forEach(el => {
          const style = el.dataset.afOriginalStyle;
          if (style === "__none__") el.removeAttribute("style"); else el.setAttribute("style", style);
          delete el.dataset.afOriginalStyle;
        });
        delete root.dataset.afFullscreenLayout;
        delete root.dataset.afOriginalStyle;
      }
    });
  }
  document.addEventListener("fullscreenchange", syncButtons);
  document.addEventListener("webkitfullscreenchange", syncButtons);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
