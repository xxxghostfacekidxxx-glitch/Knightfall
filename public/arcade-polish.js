(() => {
  "use strict";
  const boot = () => {
    if (document.querySelector("[data-arcade-fullscreen]")) return;
    const target = document.querySelector("main.wrap") || document.querySelector("main.arcade") || document.querySelector("main") || document.querySelector(".wrap") || document.querySelector(".arcade") || document.body;
    if (!target) return;
    target.classList.add("arcade-fullscreen-target");
    const dock = document.createElement("div");
    dock.className = "arcade-tools";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "arcade-fullscreen";
    button.dataset.arcadeFullscreen = "true";
    button.setAttribute("aria-pressed", "false");
    button.setAttribute("aria-label", "Enter fullscreen game mode");
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("fill", "none");
    icon.setAttribute("stroke", "currentColor");
    icon.setAttribute("stroke-width", "2");
    icon.setAttribute("stroke-linecap", "round");
    icon.setAttribute("stroke-linejoin", "round");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3m13-5v3a2 2 0 0 1-2 2h-3");
    icon.append(path);
    const label = document.createElement("span");
    label.textContent = "Fullscreen";
    button.append(icon, label);
    dock.append(button);
    target.insertBefore(dock, target.firstChild);
    const sync = () => {
      const active = document.fullscreenElement === target;
      button.setAttribute("aria-pressed", String(active));
      button.setAttribute("aria-label", active ? "Exit fullscreen game mode" : "Enter fullscreen game mode");
      label.textContent = active ? "Exit fullscreen" : "Fullscreen";
    };
    button.addEventListener("click", async () => {
      try {
        if (document.fullscreenElement === target) await document.exitFullscreen();
        else if (!document.fullscreenElement && target.requestFullscreen) await target.requestFullscreen({ navigationUI: "hide" });
        else if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
          if (target.requestFullscreen) await target.requestFullscreen({ navigationUI: "hide" });
        }
        sync();
      } catch (error) {
        button.title = "Fullscreen is unavailable in this browser. Try your browser's full-screen option.";
      }
    });
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("keydown", event => {
      if (event.key.toLowerCase() !== "f" || event.altKey || event.ctrlKey || event.metaKey) return;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable) return;
      event.preventDefault();
      button.click();
    });
    sync();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
