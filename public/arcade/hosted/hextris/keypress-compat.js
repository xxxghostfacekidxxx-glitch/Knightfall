/* Original Knightfall compatibility shim for the small Keypress API used by Hextris.
   This is not copied from the upstream Keypress library. */
(function () {
  "use strict";
  const combos = [];
  const pressed = new Set();
  const normalize = event => {
    if (event.key === "ArrowLeft") return "left";
    if (event.key === "ArrowRight") return "right";
    if (event.key === "ArrowDown") return "down";
    if (event.key === "ArrowUp") return "up";
    if (event.key === " ") return "space";
    if (event.key === "Enter") return "enter";
    return String(event.key || "").toLowerCase();
  };
  window.keypress = {
    register_combo(combo) {
      if (combo && typeof combo.keys === "string") combos.push(combo);
    }
  };
  document.addEventListener("keydown", event => {
    const key = normalize(event);
    const matches = combos.filter(combo => combo.keys === key);
    if (!matches.length) return;
    event.preventDefault();
    if (pressed.has(key)) return;
    pressed.add(key);
    for (const combo of matches) if (typeof combo.on_keydown === "function") combo.on_keydown(event);
  });
  document.addEventListener("keyup", event => {
    const key = normalize(event);
    if (!pressed.has(key)) return;
    pressed.delete(key);
    for (const combo of combos) if (combo.keys === key && typeof combo.on_keyup === "function") combo.on_keyup(event);
  });
})();
