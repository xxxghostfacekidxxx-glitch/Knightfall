// Global keyboard state, polled by the game loop.

const keys = new Set<string>();
const pressedOnce = new Set<string>();

export function initInput() {
  const down = (e: KeyboardEvent) => {
    if (e.repeat) return;
    keys.add(e.code);
    pressedOnce.add(e.code);
  };
  const up = (e: KeyboardEvent) => { keys.delete(e.code); pressedOnce.delete(e.code); };
  const reset = () => { keys.clear(); pressedOnce.clear(); };
  const onVisibility = () => { if (document.hidden) reset(); };
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  window.addEventListener('blur', reset);
  document.addEventListener('visibilitychange', onVisibility);
  return () => {
    window.removeEventListener('keydown', down);
    window.removeEventListener('keyup', up);
    window.removeEventListener('blur', reset);
    document.removeEventListener('visibilitychange', onVisibility);
    keys.clear();
    pressedOnce.clear();
  };
}

export function isDown(code: string): boolean {
  return keys.has(code);
}

/** True once per physical key press; consumed on read. */
export function consumePress(code: string): boolean {
  if (pressedOnce.has(code)) {
    pressedOnce.delete(code);
    return true;
  }
  return false;
}

export function clearFramePresses() {
  pressedOnce.clear();
}
