/* Knightfall arcade: verify an actual first paint before showing any recovery UI.
 * The recovery notice stays in normal document flow, never over the game.
 * This script does not delete saves, account data, or other games' cache.
 */
(() => {
  'use strict';
  const loader = document.currentScript;
  const selector = loader?.dataset.surface || '#board';
  const kind = loader?.dataset.kind || 'canvas';
  let notice = null, dismissed = false;

  function ready() {
    const root = document.querySelector(selector);
    if (!root) return false;
    const style = getComputedStyle(root);
    const box = root.getBoundingClientRect();
    if (style.display === 'none' || style.visibility === 'hidden' ||
        Number(style.opacity) < 0.05 || box.width < 80 || box.height < 80) return false;
    if (kind === 'grid') {
      const cells = [...root.querySelectorAll('.cell')];
      if (cells.length !== 81) return false;
      const first = cells[0].getBoundingClientRect();
      return first.width >= 10 && first.height >= 10 &&
        document.querySelectorAll('#digits button').length === 9;
    }
    if (!(root instanceof HTMLCanvasElement) || root.width < 80 || root.height < 80) return false;
    let ctx;
    try { ctx = root.getContext('2d'); } catch { return false; }
    if (!ctx) return false;
    try {
      const width = root.width, height = root.height;
      const pixels = ctx.getImageData(0, 0, width, height).data;
      let first = null, different = false;
      for (let row = 1; row <= 20 && !different; row++) {
        for (let col = 1; col <= 24; col++) {
          const x = Math.min(width - 1, Math.floor(width * col / 25));
          const y = Math.min(height - 1, Math.floor(height * row / 21));
          const i = (y * width + x) * 4;
          if (pixels[i + 3] < 16) continue;
          const sample = [pixels[i], pixels[i + 1], pixels[i + 2]];
          if (!first) first = sample;
          else if (sample.some((v, channel) => Math.abs(v - first[channel]) > 20)) {
            different = true;
            break;
          }
        }
      }
      return different;
    } catch {
      // A protected/tainted canvas may disallow pixel reads while drawing fine.
      return true;
    }
  }

  async function clearThisGameCache() {
    if (!('caches' in window)) return;
    const match = location.pathname.match(/^\/arcade\/hosted\/[^/]+\//);
    if (!match) return;
    const prefix = match[0];
    const names = await caches.keys();
    for (const name of names.filter(n => /^(?:knightfall|ashfall)-shell-/.test(n))) {
      try {
        const cache = await caches.open(name);
        for (const item of await cache.keys()) {
          const url = new URL(item.url);
          if (url.origin === location.origin && url.pathname.startsWith(prefix) &&
              url.pathname !== '/arcade/hosted/hex-and-whisk/index.html') {
            await cache.delete(item).catch(() => {});
          }
        }
      } catch { /* Storage may be unavailable in private browsing. */ }
    }
  }

  function showNotice() {
    if (dismissed || notice || !document.body) return;
    const surface = document.querySelector(selector);
    const panel = document.createElement('section');
    panel.id = 'kf-arcade-boot-guard';
    panel.setAttribute('role', 'alert');
    panel.style.cssText = 'margin:12px auto;padding:14px;max-width:640px;background:#21152e;color:#fff;border:2px solid #ff55d8;border-radius:12px;font:14px/1.5 system-ui,sans-serif';
    const heading = document.createElement('strong');
    heading.textContent = 'Game board did not start correctly';
    heading.style.display = 'block';
    const copy = document.createElement('p');
    copy.textContent = 'The game area is empty or hidden. Retry its files without erasing saves.';
    copy.style.margin = '8px 0';
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.textContent = 'Retry game files';
    retry.style.cssText = 'margin-right:8px;padding:10px;border:1px solid #baff38;border-radius:8px;background:#132b30;color:#fff';
    retry.onclick = async () => {
      retry.disabled = true;
      retry.textContent = 'Refreshing…';
      try { await clearThisGameCache(); } catch {}
      const url = new URL(location.href);
      url.searchParams.set('kf-fresh', String(Date.now()));
      location.replace(url.href);
    };
    const dismiss = document.createElement('button');
    dismiss.type = 'button';
    dismiss.textContent = 'Dismiss';
    dismiss.style.cssText = 'padding:10px;border:1px solid #999;border-radius:8px;background:#201a2c;color:#fff';
    dismiss.onclick = () => { dismissed = true; panel.remove(); notice = null; };
    panel.append(heading, copy, retry, dismiss);
    if (surface?.parentElement) surface.insertAdjacentElement('afterend', panel);
    else document.body.append(panel);
    notice = panel;
  }

  function inspect() {
    if (document.hidden) return;
    if (ready()) {
      notice?.remove();
      notice = null;
      return;
    }
    showNotice();
  }
  function init() {
    setTimeout(inspect, 2500);
    setTimeout(inspect, 6000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) setTimeout(inspect, 500);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
