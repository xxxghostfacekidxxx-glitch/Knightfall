import { makeRenderer } from './art.mjs';
import { advance, DURATION, HEIGHT, multiplier, newRun, resizeRun } from './furnace.mjs';

const byId = id => document.getElementById(id);
const cabinet = byId('cabinet');
const canvas = byId('table');
const ctx = canvas.getContext('2d');
const startButton = byId('start');
const pauseButton = byId('pause');
const fullButton = byId('fullscreen');
const soundButton = byId('sound');
const overlay = byId('overlay');
const announcement = byId('announcement');
const modeButtons = [...document.querySelectorAll('[data-mode]')];
const bestKey = 'knightfall.imp-inferno.best.v1';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const backdrop = new Image();
backdrop.src = new URL('./furnace.webp', import.meta.url).href;
const draw = makeRenderer(ctx, backdrop);

let phase = 'ready';
let run = newRun(700);
let aim = { x: run.width / 2, y: 235 };
let mode = 0;
let pointer = null;
const keys = new Set();
let best = 0;
let audio = null;
let previousFrame = 0;
let bannerUntil = 0;

try {
  const saved = Number(localStorage.getItem(bestKey));
  if (Number.isSafeInteger(saved) && saved >= 0) best = saved;
} catch { /* The arcade remains playable when storage is disabled. */ }

const format = value => value.toLocaleString('en-US');
const display = Object.fromEntries(['score', 'best', 'wave', 'time', 'chain'].map(id => [id, byId(id)]));
function updateScoreboard() {
  const seconds = Math.ceil(DURATION - run.elapsed);
  const values = {
    score: format(run.score), best: format(Math.max(best, run.score)),
    wave: Math.max(1, run.wave + 1) + ' / 4',
    time: Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0'),
    chain: '×' + multiplier(run),
  };
  for (const [id, value] of Object.entries(values)) {
    if (display[id].textContent !== value) display[id].textContent = value;
  }
}

function resize() {
  const box = canvas.getBoundingClientRect();
  if (!box.width || !box.height) return;
  const width = HEIGHT * box.width / box.height;
  aim.x *= width / run.width;
  resizeRun(run, width);
  const density = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(box.width * density);
  canvas.height = Math.round(box.height * density);
  ctx.setTransform(canvas.width / width, 0, 0, canvas.height / HEIGHT, 0, 0);
}
new ResizeObserver(resize).observe(canvas);

function releaseInput() {
  if (pointer !== null && canvas.hasPointerCapture(pointer)) canvas.releasePointerCapture(pointer);
  pointer = null;
  keys.clear();
}

function showOverlay(label, headline, instructions, action) {
  byId('eyebrow').textContent = label;
  byId('headline').textContent = headline;
  byId('instructions').textContent = instructions;
  startButton.textContent = action;
  overlay.hidden = false;
  startButton.focus();
}

function begin() {
  if (phase !== 'paused') {
    run = newRun(run.width);
    aim = { x: run.width / 2, y: 235 };
    bannerUntil = 0;
    announcement.hidden = true;
  }
  releaseInput();
  phase = 'playing';
  overlay.hidden = true;
  pauseButton.disabled = false;
  pauseButton.textContent = 'Pause';
  canvas.focus({ preventScroll: true });
  updateScoreboard();
}

function togglePause() {
  if (phase === 'paused') begin();
  else if (phase === 'playing') {
    phase = 'paused';
    releaseInput();
    pauseButton.textContent = 'Resume';
    showOverlay('Run paused', 'Hold that fire', 'Your timer is stopped. Resume when you’re ready.', 'Resume run');
  }
}

function finish() {
  phase = 'ended';
  releaseInput();
  announcement.hidden = true;
  pauseButton.disabled = true;
  const record = run.score > best;
  if (record) {
    best = run.score;
    try { localStorage.setItem(bestKey, String(best)); } catch { /* Keep the best score for this page. */ }
  }
  const message = format(run.score) + ' points · ' + run.kills + (run.kills === 1 ? ' imp blasted.' : ' imps blasted.');
  showOverlay(record ? 'New local best' : 'Run complete', run.outcome === 'cleared' ? 'Furnace King down' : 'Furnace closed', message, 'Play again');
}

function chooseMode(index) {
  mode = index;
  modeButtons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === mode)));
}

function point(event) {
  const box = canvas.getBoundingClientRect();
  aim.x = Math.max(0, Math.min(run.width, (event.clientX - box.left) * run.width / box.width));
  aim.y = Math.max(0, Math.min(HEIGHT - 50, (event.clientY - box.top) * HEIGHT / box.height));
}

canvas.addEventListener('pointerdown', event => {
  if (phase !== 'playing' || pointer !== null || event.button !== 0) return;
  event.preventDefault();
  canvas.focus({ preventScroll: true });
  point(event);
  pointer = event.pointerId;
  canvas.setPointerCapture(pointer);
  // Fire a tap immediately when the cannon is ready, even between animation frames.
  const cues = advance(run, 0, { aim, firing: true, mode });
  playCues(cues);
});
canvas.addEventListener('pointermove', event => {
  if (phase === 'playing' && (event.pointerId === pointer || (pointer === null && event.pointerType === 'mouse'))) point(event);
});
for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  canvas.addEventListener(eventName, event => { if (event.pointerId === pointer) pointer = null; });
}
window.addEventListener('blur', releaseInput);
document.addEventListener('visibilitychange', () => {
  if (document.hidden && phase === 'playing') togglePause();
});

const aimKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === 'Escape' && !event.repeat) return togglePause();
  if (phase !== 'playing' || document.activeElement !== canvas) return;
  if (/^[123]$/.test(event.key)) chooseMode(Number(event.key) - 1);
  if (aimKeys.includes(event.key) || event.code === 'Space') {
    event.preventDefault();
    keys.add(event.code);
  }
});
document.addEventListener('keyup', event => keys.delete(event.code));
canvas.addEventListener('blur', releaseInput);
startButton.addEventListener('click', begin);
pauseButton.addEventListener('click', togglePause);
modeButtons.forEach((button, i) => button.addEventListener('click', () => {
  chooseMode(i);
  if (phase === 'playing') canvas.focus({ preventScroll: true });
}));

if (document.fullscreenEnabled && cabinet.requestFullscreen) {
  fullButton.hidden = false;
  fullButton.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await cabinet.requestFullscreen();
    } catch {
      fullButton.hidden = true;
    }
    if (phase === 'playing') canvas.focus({ preventScroll: true });
  });
  document.addEventListener('fullscreenchange', () => {
    fullButton.textContent = document.fullscreenElement ? 'Exit full screen' : 'Full screen';
  });
}

const tones = { shot: [190, 68, .07, .03], pop: [510, 780, .09, .045], break: [380, 76, .19, .075], victory: [520, 1040, .36, .08] };
function playCues(cues) {
  if (!audio || audio.state !== 'running') return;
  for (const [cue, [start, end, length, volume]] of Object.entries(tones)) {
    if (!cues.has(cue)) continue;
    const now = audio.currentTime;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = cue === 'shot' ? 'triangle' : 'sine';
    oscillator.frequency.setValueAtTime(start, now);
    oscillator.frequency.exponentialRampToValueAtTime(end, now + length);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(.001, now + length);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(now);
    oscillator.stop(now + length);
  }
}

if (!window.AudioContext) soundButton.hidden = true;
soundButton.addEventListener('click', async () => {
  try {
    audio ??= new AudioContext();
    if (audio.state === 'running') await audio.suspend();
    else await audio.resume();
    const enabled = audio.state === 'running';
    soundButton.textContent = enabled ? 'Sound on' : 'Sound off';
    soundButton.setAttribute('aria-pressed', String(enabled));
  } catch {
    soundButton.hidden = true;
  }
  if (phase === 'playing') canvas.focus({ preventScroll: true });
});

function frame(now) {
  const dt = previousFrame ? Math.min(.05, (now - previousFrame) / 1000) : 0;
  previousFrame = now;
  if (phase === 'playing') {
    const step = 280 * dt;
    aim.x = Math.min(run.width, Math.max(0, aim.x + step * (Number(keys.has('ArrowRight')) - Number(keys.has('ArrowLeft')))));
    aim.y = Math.min(HEIGHT - 50, Math.max(0, aim.y + step * (Number(keys.has('ArrowDown')) - Number(keys.has('ArrowUp')))));
    const cues = advance(run, dt, { aim, firing: pointer !== null || keys.has('Space'), mode });
    playCues(cues);
    if (run.banner) {
      announcement.textContent = run.banner;
      announcement.hidden = false;
      run.banner = '';
      bannerUntil = run.elapsed + 2.1;
    } else if (run.elapsed >= bannerUntil) announcement.hidden = true;
    if (run.outcome) finish();
    updateScoreboard();
  }
  draw(run, run.width, aim, mode, reducedMotion.matches ? run.elapsed : now / 1000, reducedMotion.matches);
  requestAnimationFrame(frame);
}

resize();
updateScoreboard();
requestAnimationFrame(frame);
