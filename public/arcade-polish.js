(() => {
  "use strict";
  const KEY = "ashfall-arcade-preferences-v2";
  const defaults = { focus: false, contrast: false, motion: false };
  let prefs = { ...defaults };
  try { prefs = { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch {} };
  const boot = () => {
    if (document.querySelector("[data-arcade-tool-dock]")) return;
    const target = document.querySelector("main.wrap") || document.querySelector("main.arcade") || document.querySelector("main") || document.querySelector(".wrap") || document.querySelector(".arcade") || document.body;
    if (!target) return;
    target.classList.add("arcade-fullscreen-target");
    const dock = document.createElement("nav");
    dock.className = "arcade-tools";
    dock.dataset.arcadeToolDock = "true";
    dock.setAttribute("aria-label", "Arcade display controls");
    const makeButton = (label, symbol, action, key, pressed = false) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "arcade-tool";
      b.setAttribute("aria-label", label); b.title = label + (key ? " (" + key + ")" : "");
      if (pressed !== null) b.setAttribute("aria-pressed", String(pressed));
      const icon = document.createElement("span"); icon.className = "arcade-tool-icon"; icon.setAttribute("aria-hidden", "true"); icon.textContent = symbol;
      const text = document.createElement("span"); text.textContent = label;
      b.append(icon, text); b.addEventListener("click", action); dock.append(b);
      return b;
    };
    const fullscreen = makeButton("Fullscreen", "⛶", async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else if (target.requestFullscreen) await target.requestFullscreen({ navigationUI: "hide" });
      } catch { fullscreen.title = "Fullscreen is unavailable here. Use your browser menu."; }
    }, "F", false);
    const focus = makeButton("Focus mode", "◉", () => {
      prefs.focus = !prefs.focus; document.body.classList.toggle("arcade-focus-mode", prefs.focus);
      focus.setAttribute("aria-pressed", String(prefs.focus)); save();
    }, "G", prefs.focus);
    const contrast = makeButton("High contrast", "◐", () => {
      prefs.contrast = !prefs.contrast; document.documentElement.classList.toggle("arcade-high-contrast", prefs.contrast);
      contrast.setAttribute("aria-pressed", String(prefs.contrast)); save();
    }, "C", prefs.contrast);
    const motion = makeButton("Reduce motion", "Ⅱ", () => {
      prefs.motion = !prefs.motion; document.documentElement.classList.toggle("arcade-reduce-motion", prefs.motion);
      motion.setAttribute("aria-pressed", String(prefs.motion)); save();
    }, "M", prefs.motion);
    const help = makeButton("Keyboard help", "?", () => toggleHelp(), "H", null);
    target.insertBefore(dock, target.firstChild);
    const panel = document.createElement("section");
    panel.className = "arcade-shortcuts"; panel.hidden = true; panel.setAttribute("aria-label", "Arcade keyboard shortcuts");
    panel.innerHTML = '<div class="arcade-shortcuts-head"><strong>ARCADE QUICK CONTROLS</strong><button type="button" class="arcade-help-close" aria-label="Close keyboard help">×</button></div><dl><div><dt>F</dt><dd>Toggle fullscreen</dd></div><div><dt>G</dt><dd>Toggle focus mode</dd></div><div><dt>C</dt><dd>Toggle high contrast</dd></div><div><dt>M</dt><dd>Reduce motion effects</dd></div><div><dt>H or ?</dt><dd>Show or hide this guide</dd></div><div><dt>Esc</dt><dd>Exit fullscreen or close browser dialog</dd></div></dl><p>Game-specific controls remain unchanged. Preferences are saved on this device.</p>';
    target.insertBefore(panel, dock.nextSibling);
    const togglePressed = (button, on) => button.setAttribute("aria-pressed", String(on));
    const syncFullscreen = () => {
      const active = document.fullscreenElement === target;
      fullscreen.setAttribute("aria-pressed", String(active));
      fullscreen.querySelector("span:last-child").textContent = active ? "Exit fullscreen" : "Fullscreen";
      fullscreen.setAttribute("aria-label", active ? "Exit fullscreen" : "Fullscreen");
    };
    const toggleHelp = () => { panel.hidden = !panel.hidden; help.setAttribute("aria-expanded", String(!panel.hidden)); if (!panel.hidden) panel.querySelector(".arcade-help-close").focus(); };
    panel.querySelector(".arcade-help-close").addEventListener("click", () => { panel.hidden = true; help.focus(); });
    document.body.classList.toggle("arcade-focus-mode", !!prefs.focus);
    document.documentElement.classList.toggle("arcade-high-contrast", !!prefs.contrast);
    document.documentElement.classList.toggle("arcade-reduce-motion", !!prefs.motion);
    togglePressed(focus, !!prefs.focus); togglePressed(contrast, !!prefs.contrast); togglePressed(motion, !!prefs.motion);
    document.addEventListener("fullscreenchange", syncFullscreen);
    document.addEventListener("keydown", e => {
      if (e.altKey || e.ctrlKey || e.metaKey || /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable) return;
      const k = e.key.toLowerCase();
      if (k === "f") { e.preventDefault(); fullscreen.click(); }
      else if (k === "g") { e.preventDefault(); focus.click(); }
      else if (k === "c") { e.preventDefault(); contrast.click(); }
      else if (k === "m") { e.preventDefault(); motion.click(); }
      else if (k === "h" || k === "?") { e.preventDefault(); if (panel.hidden) toggleHelp(); else { panel.hidden = true; help.focus(); } }
    });
    syncFullscreen();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();