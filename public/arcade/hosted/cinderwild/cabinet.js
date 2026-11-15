(() => {
  const shell = document.getElementById("game-shell");
  const button = document.getElementById("fullscreen");
  const label = document.getElementById("fullscreen-label");
  const controls = document.getElementById("controls");
  let expanded = false, savedScroll = 0, hold, repeat, heldButton, pointerId, skipClick;

  function sync() {
    const active = expanded || document.fullscreenElement === shell;
    button.setAttribute("aria-pressed", String(active));
    label.textContent = active ? "Exit fullscreen" : "Fullscreen";
  }

  function setExpanded(active) {
    expanded = active;
    shell.classList.toggle("is-expanded", active);
    document.documentElement.classList.toggle("cabinet-expanded", active);
    if (active) shell.scrollTop = 0;
    else window.scrollTo(0, savedScroll);
    sync();
  }

  button.addEventListener("click", async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    if (document.fullscreenElement === shell) {
      await document.exitFullscreen().catch(sync);
      return;
    }
    savedScroll = window.scrollY;
    try {
      if (!shell.requestFullscreen || document.fullscreenEnabled === false) {
        setExpanded(true);
        return;
      }
      await shell.requestFullscreen();
    } catch {
      setExpanded(true);
    }
  });

  document.addEventListener("fullscreenchange", sync);
  window.addEventListener("keydown", event => {
    if (event.key === "Escape" && expanded && !event.defaultPrevented && !window.CinderwildGame.isBusy()) setExpanded(false);
  });

  function clearHold() {
    clearTimeout(hold);
    clearInterval(repeat);
    heldButton = null;
    pointerId = null;
  }

  controls.addEventListener("pointerdown", event => {
    const direction = event.target.closest(".dpad button");
    if (!direction || !event.isPrimary || event.button !== 0) return;
    clearHold();
    skipClick = null;
    heldButton = direction;
    pointerId = event.pointerId;
    direction.setPointerCapture?.(pointerId);
    hold = setTimeout(() => {
      skipClick = direction;
      direction.click();
      repeat = setInterval(() => {
        if (window.CinderwildGame.isBusy()) clearHold();
        else direction.click();
      }, 165);
    }, 230);
  });

  for (const eventName of ["pointerup", "pointercancel", "lostpointercapture"]) {
    controls.addEventListener(eventName, event => {
      if (heldButton && event.pointerId === pointerId) clearHold();
    });
  }
  window.addEventListener("blur", clearHold);
  controls.addEventListener("click", event => {
    if (event.detail && event.target.closest(".dpad button") === skipClick) {
      event.stopImmediatePropagation();
      skipClick = null;
    }
  }, true);
})();
