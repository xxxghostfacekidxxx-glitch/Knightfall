import { makeRenderer } from './art.mjs?v=3';
import { advance, HEIGHT, newTable, pickTarget, POWERS, resizeTable, seedTable } from './furnace.mjs?v=3';

const byId = id => document.getElementById(id);
const cabinet = byId('cabinet');
const canvas = byId('table');
const ctx = canvas.getContext('2d');
const start = byId('start');
const pause = byId('pause');
const full = byId('fullscreen');
const sound = byId('sound');
const overlay = byId('overlay');
const announcement = byId('announcement');
const powerButtons = [...document.querySelectorAll('[data-power]')];
const display = Object.fromEntries(['credits', 'cost', 'won', 'caught'].map(id => [id, byId(id)]));
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const backdrop = new Image();
backdrop.src = new URL('./furnace.webp?v=2', import.meta.url).href;
const draw = makeRenderer(ctx, backdrop);

let phase = 'ready';
let table = newTable(700);
const control = { aim: { x: 350, y: 235 }, firing: false, auto: false, rapid: false, lockMode: false, lockId: null, power: 0 };
const keys = new Set();
let pointer = null;
let previous = 0;
let bannerUntil = 0;
let audio = null;
seedTable(table);

function updateDisplay() {
  const seat = table.seats[0];
  const values = { credits: seat.credits, cost: POWERS[control.power].cost, won: seat.totalWon, caught: seat.caught };
  const bonus = seat.bonus;
  const weapon = byId('weapon');
  const weaponText = bonus ? (bonus.kind === 'beam' ? 'Hellbeam ready' : 'Drill shot ready') + ' · next shot free' : '';
  if (weapon.textContent !== weaponText) weapon.textContent = weaponText;
  weapon.hidden = !bonus;
  for (const [key, amount] of Object.entries(values)) {
    const text = amount.toLocaleString('en-US');
    if (display[key].textContent !== text) display[key].textContent = text;
  }
}

function resize() {
  const box = canvas.getBoundingClientRect();
  if (!box.width || !box.height) return;
  const width = HEIGHT * box.width / box.height;
  control.aim.x *= width / table.width;
  resizeTable(table, width);
  const density = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(box.width * density);
  canvas.height = Math.round(box.height * density);
  ctx.setTransform(canvas.width / width, 0, 0, canvas.height / HEIGHT, 0, 0);
}

function releaseInput() {
  if (pointer !== null && canvas.hasPointerCapture(pointer)) canvas.releasePointerCapture(pointer);
  pointer = null;
  keys.clear();
  control.firing = false;
}

function showOverlay(label, headline, instructions, action) {
  byId('eyebrow').textContent = label;
  byId('headline').textContent = headline;
  byId('instructions').textContent = instructions;
  start.textContent = action;
  overlay.hidden = false;
  start.focus();
}

function setToggle(id, property, value) {
  control[property] = value;
  byId(id).setAttribute('aria-pressed', String(value));
  if (phase === 'playing') canvas.focus({ preventScroll: true });
}

function begin() {
  if (phase === 'empty') {
    table = newTable(table.width);
    seedTable(table);
    control.lockId = null;
    setToggle('auto', 'auto', false);
    bannerUntil = 0;
    announcement.hidden = true;
  }
  releaseInput();
  phase = 'playing';
  overlay.hidden = true;
  pause.textContent = 'Pause';
  pause.disabled = false;
  canvas.focus({ preventScroll: true });
  updateDisplay();
}

function togglePause() {
  if (phase === 'paused') begin();
  else if (phase === 'playing') {
    phase = 'paused';
    releaseInput();
    pause.textContent = 'Resume';
    showOverlay('Table paused', 'Hold that fire', 'Your seat, credits, and targets stay here until you resume.', 'Resume table');
  }
}

function choosePower(index) {
  control.power = index;
  powerButtons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
  if (phase === 'playing') canvas.focus({ preventScroll: true });
  updateDisplay();
}

function point(event) {
  const box = canvas.getBoundingClientRect();
  control.aim.x = Math.max(0, Math.min(table.width, (event.clientX - box.left) * table.width / box.width));
  control.aim.y = Math.max(0, Math.min(HEIGHT, (event.clientY - box.top) * HEIGHT / box.height));
}

function lockAim() {
  control.lockId = pickTarget(table, control.aim)?.id ?? null;
}

canvas.addEventListener('pointerdown', event => {
  if (phase !== 'playing' || pointer !== null || event.button !== 0) return;
  event.preventDefault();
  canvas.focus({ preventScroll: true });
  point(event);
  if (control.lockMode) lockAim();
  pointer = event.pointerId;
  canvas.setPointerCapture(pointer);
  // A tap should fire even when down and up land inside the same animation frame.
  const credits = table.seats[0].credits;
  if (!control.lockMode || control.lockId !== null) {
    advance(table, 0, { ...control, firing: true });
    if (table.seats[0].credits < credits) tone(196, .04);
  }
  updateDisplay();
});
canvas.addEventListener('pointermove', event => {
  if (phase === 'playing' && (event.pointerId === pointer || (pointer === null && event.pointerType === 'mouse'))) point(event);
});
for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  canvas.addEventListener(eventName, event => { if (event.pointerId === pointer) pointer = null; });
}
window.addEventListener('blur', releaseInput);
canvas.addEventListener('blur', releaseInput);
document.addEventListener('visibilitychange', () => {
  if (document.hidden && phase === 'playing') togglePause();
});

const aimKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === 'Escape' && !event.repeat) return togglePause();
  if (phase !== 'playing' || document.activeElement !== canvas) return;
  if (/^[1-4]$/.test(event.key)) choosePower(Number(event.key) - 1);
  if (event.key === 'Enter' && control.lockMode) lockAim();
  if (aimKeys.includes(event.key) || event.code === 'Space') {
    event.preventDefault();
    if (event.code === 'Space' && !event.repeat && control.lockMode && !control.lockId) lockAim();
    keys.add(event.code);
  }
});
document.addEventListener('keyup', event => keys.delete(event.code));
start.addEventListener('click', begin);
pause.addEventListener('click', togglePause);
powerButtons.forEach((button, i) => button.addEventListener('click', () => choosePower(i)));
byId('auto').addEventListener('click', () => setToggle('auto', 'auto', !control.auto));
byId('rapid').addEventListener('click', () => setToggle('rapid', 'rapid', !control.rapid));
byId('lock').addEventListener('click', () => {
  setToggle('lock', 'lockMode', !control.lockMode);
  if (control.lockMode) lockAim();
  else control.lockId = null;
});

if (document.fullscreenEnabled && cabinet.requestFullscreen) {
  full.hidden = false;
  full.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await cabinet.requestFullscreen();
    } catch {
      full.hidden = true;
    }
    if (phase === 'playing') canvas.focus({ preventScroll: true });
  });
  document.addEventListener('fullscreenchange', () => {
    full.textContent = document.fullscreenElement ? 'Exit full screen' : 'Full screen';
  });
}

function tone(frequency, duration) {
  if (!audio || audio.state !== 'running') return;
  const now = audio.currentTime;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(.047, now);
  gain.gain.exponentialRampToValueAtTime(.001, now + duration);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(now);
  oscillator.stop(now + duration);
}

if (!window.AudioContext) sound.hidden = true;
sound.addEventListener('click', async () => {
  try {
    audio ??= new AudioContext();
    if (audio.state === 'running') await audio.suspend();
    else await audio.resume();
    const enabled = audio.state === 'running';
    sound.textContent = enabled ? 'Sound on' : 'Sound off';
    sound.setAttribute('aria-pressed', String(enabled));
  } catch {
    sound.hidden = true;
  }
  if (phase === 'playing') canvas.focus({ preventScroll: true });
});

function frame(now) {
  const dt = previous ? Math.min(.25, (now - previous) / 1000) : 0;
  previous = now;
  if (phase === 'playing') {
    const step = 260 * dt;
    control.aim.x = Math.min(table.width, Math.max(0, control.aim.x + step * (Number(keys.has('ArrowRight')) - Number(keys.has('ArrowLeft')))));
    control.aim.y = Math.min(HEIGHT, Math.max(0, control.aim.y + step * (Number(keys.has('ArrowDown')) - Number(keys.has('ArrowUp')))));
    const previousCredits = table.seats[0].credits;
    const previousWon = table.seats[0].totalWon;
    const steps = Math.max(1, Math.ceil(dt / .032));
    for (let i = 0; i < steps; i++) {
      if (control.lockId !== null && !table.targets.some(target =>
        target.id === control.lockId && target.x >= target.radius && target.x <= table.width - target.radius)) control.lockId = null;
      control.firing = (pointer !== null || keys.has('Space')) && (!control.lockMode || control.lockId !== null);
      advance(table, dt / steps, control);
    }
    const player = table.seats[0];
    if (player.totalWon > previousWon) tone(730, .15);
    else if (player.credits < previousCredits) tone(196, .04);
    if (table.banner) {
      announcement.textContent = table.banner;
      announcement.hidden = false;
      table.banner = '';
      bannerUntil = table.time + 3.2;
    } else if (table.time >= bannerUntil) announcement.hidden = true;
    if (player.credits === 0 && !player.bonus && !table.shots.some(shot => shot.seat === 0)) {
      phase = 'empty';
      releaseInput();
      pause.disabled = true;
      showOverlay('Out of credits', 'Table closed', 'You caught ' + player.caught + ' targets and won ' + player.totalWon.toLocaleString('en-US') + ' credits. Start a free table with 240 new credits.', 'New table');
    }
    updateDisplay();
  }
  draw(table, control, reducedMotion.matches);
  requestAnimationFrame(frame);
}
new ResizeObserver(resize).observe(canvas);
resize();
updateDisplay();
requestAnimationFrame(frame);
