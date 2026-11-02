/* On-screen control bridge for the original Embervale keyboard input API.
   Knightfall adaptation, preserving the upstream MIT license. */
(() => {
  'use strict';
  const controls = document.querySelector('#touch-controls');
  const fullscreenButton = document.querySelector('#full-screen');
  if (!controls || typeof Input === 'undefined') return;
  const active = new Map();
  const release = (e) => {
    const code = active.get(e.pointerId);
    if (!code) return;
    active.delete(e.pointerId);
    const button = controls.querySelector('[data-code="'+code+'"]');
    if (button && ![...active.values()].includes(code)) button.classList.remove('is-pressed');
    // Another pointer might still hold this direction.
    Input.keys[code] = [...active.values()].includes(code);
  };
  controls.querySelectorAll('[data-code]').forEach(button => {
    button.addEventListener('pointerdown', e => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      e.preventDefault();
      const code = button.dataset.code;
      if (active.has(e.pointerId)) return;
      try { AudioSys.unlock(); } catch { /* audio is optional */ }
      if (!Input.keys[code]) Input.pressed[code] = true;
      Input.keys[code] = true;
      active.set(e.pointerId, code);
      button.classList.add('is-pressed');
      try { button.setPointerCapture(e.pointerId); } catch { /* browser may decline */ }
    });
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release);
    button.addEventListener('contextmenu', e => e.preventDefault());
  });
  const reset = () => {
    for (const code of active.values()) Input.keys[code] = false;
    active.clear();
    controls.querySelectorAll('.is-pressed').forEach(el=>el.classList.remove('is-pressed'));
  };
  window.addEventListener('blur',reset);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)reset()});
  fullscreenButton?.addEventListener('click',async()=>{
    try {
      if(document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { /* unsupported platforms can play without fullscreen */ }
    window.dispatchEvent(new Event('resize'));
  });
})();
