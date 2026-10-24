/* Ash-Fall arcade: restrained gameplay feedback without changing game logic. */
(() => {
  "use strict";
  if (window.__ashFallFeedbackInstalled) return;
  window.__ashFallFeedbackInstalled = true;

  const statusSelector = [
    '[id$="status"]', '[id$="message"]', '[id$="msg"]',
    '[role="status"]', '[aria-live="polite"]'
  ].join(",");
  const scoreSelector = [
    '[id$="score"]', '[id$="best"]', '[id$="moves"]',
    '[id$="pairs"]', '[id$="round"]', '[id$="kills"]',
    '[id$="cash"]', '[id$="health"]', '[id$="lives"]'
  ].join(",");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const seen = new WeakMap();

  function pulse(element, kind) {
    if (!element || reducedMotion.matches) return;
    element.classList.remove("af-feedback-pulse", "af-feedback-alert");
    void element.offsetWidth;
    element.classList.add(kind === "alert" ? "af-feedback-alert" : "af-feedback-pulse");
    window.setTimeout(() => element.classList.remove("af-feedback-pulse", "af-feedback-alert"), 520);
  }

  function prepare(root) {
    if (!(root instanceof Element)) return;
    if (root.matches(statusSelector)) {
      if (!root.hasAttribute("aria-live")) root.setAttribute("aria-live", "polite");
      if (!root.hasAttribute("aria-atomic")) root.setAttribute("aria-atomic", "true");
      root.classList.add("af-feedback-status");
      if (!seen.has(root)) seen.set(root, root.textContent.trim());
    }
    if (root.matches(scoreSelector)) {
      root.classList.add("af-feedback-number");
      if (!seen.has(root)) seen.set(root, root.textContent.trim());
    }
    root.querySelectorAll?.(statusSelector + "," + scoreSelector).forEach(prepare);
  }

  function inspect(element) {
    if (!(element instanceof Element)) return;
    const text = element.textContent.trim();
    if (seen.get(element) === text) return;
    const previous = seen.get(element);
    seen.set(element, text);
    if (!previous || !text) return;
    if (element.matches(statusSelector)) {
      const negative = /wrong|miss|fail|damage|injur|lost|cannot|can't|not enough|game over|dead|broken|crash/i.test(text);
      pulse(element, negative ? "alert" : "pulse");
    } else if (element.matches(scoreSelector)) {
      pulse(element, "pulse");
    }
  }

  function init() {
    prepare(document.body);
    const observer = new MutationObserver(records => {
      for (const record of records) {
        if (record.type === "characterData") {
          const parent = record.target.parentElement;
          if (parent) { prepare(parent); inspect(parent); }
        } else {
          if (record.target instanceof Element) { prepare(record.target); inspect(record.target); }
          record.addedNodes.forEach(node => {
            if (node instanceof Element) { prepare(node); inspect(node); }
          });
        }
      }
    });
    observer.observe(document.body, {subtree:true,childList:true,characterData:true});
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) document.body.classList.add("af-arcade-hidden");
      else document.body.classList.remove("af-arcade-hidden");
    });
    document.addEventListener("pointerdown", event => {
      const button = event.target.closest?.("button,[role=button],.btn,.action");
      if (!button || button.disabled || reducedMotion.matches) return;
      button.classList.remove("af-feedback-press");
      void button.offsetWidth;
      button.classList.add("af-feedback-press");
      window.setTimeout(() => button.classList.remove("af-feedback-press"), 180);
    }, {passive:true});
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true});
  else init();
})();
