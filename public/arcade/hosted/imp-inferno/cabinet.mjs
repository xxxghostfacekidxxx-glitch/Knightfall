import { makeRenderer } from './art.mjs?v=6';
import { advance, HEIGHT, newTable, pickTarget, POWERS, resizeTable, seedTable } from './furnace.mjs?v=6';

import { inviteUrl, newRoomId, openRoom, parseRoom } from './online.mjs?v=5';

const byId = id => document.getElementById(id);
const cabinet = byId('cabinet');
const canvas = byId('table');
const ctx = canvas.getContext('2d');
const start = byId('start');
const duo = byId('duo');
const secondHud = byId('second-seat');
const secondScore = byId('p2-score');
const weapon = byId('weapon');
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
let room = null;
const roomBar = byId('online-bar');
const roomStatus = byId('room-status');
const roomInvite = byId('room-invite');
const createRoom = byId('create-room');
const joinForm = byId('join-room');
const refill = byId('refill');
let table = newTable(700);
const control = { aim: { x: 350, y: 235 }, firing: false, auto: false, rapid: false, lockMode: false, lockId: null, power: 0 };
const keys = new Set();
let pointer = null;
let previous = 0;
let bannerUntil = 0;
let audio = null;
seedTable(table);

function updateDisplay() {
  const seat = table.seats[control.onlineSeat ?? 0];
  const values = { credits: seat.credits, cost: POWERS[control.power].cost, won: seat.totalWon, caught: seat.caught };
  const bonus = seat.bonus;
  const weaponText = bonus ? (bonus.kind === 'beam' ? 'Hellbeam ready' : 'Drill shot ready') + ' · next shot free' : '';
  if (weapon.textContent !== weaponText) weapon.textContent = weaponText;
  weapon.hidden = !bonus;
  if (control.secondSeat) {
    const player = table.seats[2];
    const available = player.bonus ? ' · ' + (player.bonus.kind === 'beam' ? 'Free Hellbeam' : 'Free drill shot') : '';
    const score = player.credits.toLocaleString('en-US') + ' credits · ' + POWERS[control.secondSeat.power].cost + ' per shot · ' + player.caught + ' caught' + available;
    if (secondScore.textContent !== score) secondScore.textContent = score;
  }
  for (const [key, amount] of Object.entries(values)) {
    const text = amount.toLocaleString('en-US');
    if (display[key].textContent !== text) display[key].textContent = text;
  }
}

function resize() {
  const box = canvas.getBoundingClientRect();
  if (!box.width || !box.height) return;
  const width = room ? 900 : HEIGHT * box.width / box.height;
  control.aim.x *= width / table.width;
  if (control.secondSeat) control.secondSeat.aim.x *= width / table.width;
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
  if (control.secondSeat) control.secondSeat.firing = false;
  sendRoomInput();
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
  if (phase === 'playing' || phase === 'online') canvas.focus({ preventScroll: true });
}

function begin(twoPlayers = Boolean(control.secondSeat)) {
  if (phase === 'empty') {
    table = newTable(table.width);
    seedTable(table);
    control.lockId = null;
    setToggle('auto', 'auto', false);
    bannerUntil = 0;
    announcement.hidden = true;
  }
  if (phase === 'ready' || phase === 'empty') {
    control.secondSeat = twoPlayers ? { aim: { x: table.width / 2, y: 275 }, firing: false, power: 0 } : null;
    table.seats[0].name = twoPlayers ? 'P1' : 'You';
    if (twoPlayers) table.seats[2].name = 'P2';
    secondHud.hidden = !twoPlayers;
  }
  releaseInput();
  phase = 'playing';
  duo.hidden = true;
  overlay.hidden = true;
  pause.textContent = 'Pause';
  pause.disabled = false;
  canvas.focus({ preventScroll: true });
  updateDisplay();
}

function togglePause() {
  if (room) return quitRoom();
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
  if (phase === 'playing' || phase === 'online') canvas.focus({ preventScroll: true });
  updateDisplay();
}

function point(event) {
  const box = canvas.getBoundingClientRect();
  control.aim.x = Math.max(0, Math.min(table.width, (event.clientX - box.left) * table.width / box.width));
  control.aim.y = Math.max(0, Math.min(HEIGHT, (event.clientY - box.top) * HEIGHT / box.height));
}

function lockAim() {
  control.lockId = pickTarget(table, control.aim)?.id ?? null;
  sendRoomInput({ target: true });
}

canvas.addEventListener('pointerdown', event => {
  if ((phase !== 'playing' && phase !== 'online') || overlay.hidden === false || pointer !== null || event.button !== 0) return;
  event.preventDefault();
  canvas.focus({ preventScroll: true });
  point(event);
  if (control.lockMode) lockAim();
  pointer = event.pointerId;
  canvas.setPointerCapture(pointer);
  if (room) {
    sendRoomInput({ target: control.lockMode, tap: true });
    return;
  }
  // A tap should fire even when down and up land inside the same animation frame.
  const credits = table.seats[0].credits;
  if (!control.lockMode || control.lockId !== null) {
    advance(table, 0, { ...control, firing: true });
    if (table.seats[0].credits < credits) tone(196, .04);
  }
  updateDisplay();
});
canvas.addEventListener('pointermove', event => {
  if ((phase === 'playing' || phase === 'online') && (event.pointerId === pointer || (pointer === null && event.pointerType === 'mouse'))) point(event);
});
for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  canvas.addEventListener(eventName, event => { if (event.pointerId === pointer) { pointer = null; sendRoomInput(); } });
}
window.addEventListener('blur', releaseInput);
canvas.addEventListener('blur', releaseInput);
document.addEventListener('visibilitychange', () => {
  if (document.hidden && phase === 'playing') togglePause();
  if (room) {
    releaseInput();
    if (document.hidden) setToggle('auto', 'auto', false);
    sendRoomInput();
  }
});

const aimKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
const secondAimKeys = ['KeyW', 'KeyS', 'KeyA', 'KeyD'];
document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === 'Escape' && !event.repeat) return togglePause();
  if ((phase !== 'playing' && phase !== 'online') || document.activeElement !== canvas) return;
  if (/^[1-7]$/.test(event.key)) choosePower(Number(event.key) - 1);
  if (event.key === 'Enter' && control.lockMode) lockAim();
  const second = control.secondSeat;
  if (second && (event.code === 'KeyQ' || event.code === 'KeyE')) {
    event.preventDefault();
    if (!event.repeat) second.power = Math.max(0, Math.min(POWERS.length - 1, second.power + (event.code === 'KeyQ' ? -1 : 1)));
    updateDisplay();
  }
  if (second && (secondAimKeys.includes(event.code) || event.code === 'KeyF')) {
    event.preventDefault();
    keys.add(event.code);
    if (event.code === 'KeyF' && !event.repeat) {
      const credits = table.seats[2].credits;
      advance(table, 0, { ...control, secondSeat: { ...second, firing: true } });
      if (table.seats[2].credits < credits) tone(248, .04);
      updateDisplay();
    }
  }
  if (aimKeys.includes(event.key) || event.code === 'Space') {
    event.preventDefault();
    if (event.code === 'Space' && !event.repeat && control.lockMode && !control.lockId) lockAim();
    keys.add(event.code);
    if (room && event.code === 'Space' && !event.repeat) sendRoomInput({ target: control.lockMode, tap: true });
  }
});
document.addEventListener('keyup', event => {
  keys.delete(event.code);
  if (event.code === 'Space') sendRoomInput();
});
start.addEventListener('click', () => begin());
duo.addEventListener('click', () => begin(true));
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
    if (phase === 'playing' || phase === 'online') canvas.focus({ preventScroll: true });
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
  if (phase === 'playing' || phase === 'online') canvas.focus({ preventScroll: true });
});

function sendRoomInput(extra = {}) {
  if (!room?.connection || control.onlineSeat == null) return;
  room.connection.send({
    x: control.aim.x, y: control.aim.y, power: control.power,
    fire: !document.hidden && (pointer !== null || keys.has('Space')),
    auto: !document.hidden && control.auto, rapid: control.rapid, lock: control.lockMode, ...extra,
  });
}

function quitRoom(message = '') {
  room?.connection.close();
  room = null;
  delete control.onlineSeat;
  releaseInput();
  control.lockId = null;
  setToggle('auto', 'auto', false);
  table = newTable(700);
  seedTable(table);
  control.aim = { x: 350, y: 235 };
  phase = 'ready';
  cabinet.classList.remove('online');
  roomBar.hidden = true;
  roomInvite.hidden = true;
  pause.disabled = true;
  pause.textContent = 'Pause';
  start.hidden = false;
  duo.hidden = false;
  createRoom.hidden = false;
  joinForm.hidden = false;
  announcement.hidden = true;
  if (location.hash.startsWith('#room=')) history.replaceState(null, '', location.pathname + location.search);
  showOverlay('Free play · Four-seat table', 'Take your seat', message || 'Play solo or invite up to three friends to a shared table.', 'Play solo');
  resize();
  updateDisplay();
}

function joinRoom(code) {
  if (room) return;
  phase = 'online';
  control.secondSeat = null;
  secondHud.hidden = true;
  setToggle('auto', 'auto', false);
  room = { previous: null, snapshotAt: 0, nextInput: 0 };
  cabinet.classList.add('online');
  resize();
  roomInvite.value = inviteUrl(code);
  history.replaceState(null, '', roomInvite.value);
  roomBar.hidden = false;
  refill.hidden = true;
  roomStatus.textContent = 'Connecting…';
  showOverlay('Online table', 'Taking your seat', 'Connecting to room ' + code + '…', 'Play solo');
  start.hidden = true;
  duo.hidden = true;
  createRoom.hidden = true;
  joinForm.hidden = true;
  pause.disabled = false;
  pause.textContent = 'Leave table';
  const currentRoom = room;
  try {
    room.connection = openRoom(code, message => {
      if (room !== currentRoom) return;
      if (message.type === 'welcome') {
        control.onlineSeat = message.seat;
        room.previous = null;
        releaseInput();
        canvas.focus({ preventScroll: true });
      } else if (message.type === 'state' && control.onlineSeat != null) {
        const seat = control.onlineSeat;
        room.previous = room.snapshotAt ? table : null;
        room.snapshotAt = performance.now();
        table = message.table;
        table.seats.forEach((player, i) => {
          player.name = message.seats[i] === 'open' ? 'Open' : message.seats[i] === 'reconnecting' ? 'Away' : 'P' + (i + 1);
        });
        if (!overlay.hidden) {
          overlay.hidden = true;
          canvas.focus({ preventScroll: true });
        }
        const count = message.seats.filter(value => value === 'connected').length;
        roomStatus.textContent = 'Room ' + code + ' · P' + (seat + 1) + ' · ' + count + '/4 online';
        refill.hidden = !seatEmpty(seat);
        if (table.banner) {
          announcement.textContent = table.banner;
          announcement.hidden = false;
          bannerUntil = table.time + 3.2;
        } else if (table.time >= bannerUntil) announcement.hidden = true;
        updateDisplay();
      }
    }, (label, terminal) => {
      if (room !== currentRoom) return;
      delete control.onlineSeat;
      releaseInput();
      if (terminal) quitRoom(label);
      else roomStatus.textContent = label;
    });
  } catch {
    quitRoom('Could not open an online table.');
  }
}

createRoom.addEventListener('click', () => joinRoom(newRoomId()));
joinForm.addEventListener('submit', event => {
  event.preventDefault();
  const input = byId('room-code');
  const code = parseRoom(input.value);
  if (code) joinRoom(code);
  else {
    input.setCustomValidity('Enter a room code or an Imp Inferno invite link.');
    input.reportValidity();
  }
});
byId('room-code').addEventListener('input', event => event.target.setCustomValidity(''));
byId('copy-room').addEventListener('click', async event => {
  try {
    await navigator.clipboard.writeText(roomInvite.value);
    const button = event.currentTarget ?? byId('copy-room');
    button.textContent = 'Invite copied';
    setTimeout(() => { button.textContent = 'Copy invite'; }, 1400);
  } catch {
    roomInvite.hidden = false;
    roomInvite.select();
  }
});
refill.addEventListener('click', () => {
  sendRoomInput({ refill: true });
  canvas.focus({ preventScroll: true });
});

function displayRoom(now) {
  if (!room?.previous) return table;
  const blend = Math.min(1, Math.max(0, (now - room.snapshotAt) / 100));
  const positions = (before, after) => {
    const previous = new Map(before.map(item => [item.id, item]));
    return after.map(item => {
      const from = previous.get(item.id);
      return from ? { ...item, x: from.x + (item.x - from.x) * blend, y: from.y + (item.y - from.y) * blend } : item;
    });
  };
  return { ...table, targets: positions(room.previous.targets, table.targets), shots: positions(room.previous.shots, table.shots) };
}

function seatEmpty(index) {
  const seat = table.seats[index];
  return seat.credits === 0 && !seat.bonus && !table.shots.some(shot => shot.seat === index)
    && !table.spins?.some(spin => spin.seat === index && !spin.paid);
}

function moveAim(aim, [up, down, left, right], dt) {
  const step = 260 * dt;
  aim.x = Math.min(table.width, Math.max(0, aim.x + step * (Number(keys.has(right)) - Number(keys.has(left)))));
  aim.y = Math.min(HEIGHT, Math.max(0, aim.y + step * (Number(keys.has(down)) - Number(keys.has(up)))));
}

function frame(now) {
  const dt = previous ? Math.min(.25, (now - previous) / 1000) : 0;
  previous = now;
  if (phase === 'playing') {
    moveAim(control.aim, aimKeys, dt);
    const second = control.secondSeat;
    if (second) {
      moveAim(second.aim, secondAimKeys, dt);
      second.firing = keys.has('KeyF');
    }
    const player = table.seats[0];
    const guest = table.seats[2];
    const previousCredits = player.credits + (second ? guest.credits : 0);
    const previousWon = player.totalWon + (second ? guest.totalWon : 0);
    const steps = Math.max(1, Math.ceil(dt / .032));
    for (let i = 0; i < steps; i++) {
      if (control.lockId !== null && !table.targets.some(target =>
        target.id === control.lockId && target.x >= target.radius && target.x <= table.width - target.radius)) control.lockId = null;
      control.firing = (pointer !== null || keys.has('Space')) && (!control.lockMode || control.lockId !== null);
      advance(table, dt / steps, control);
    }
    if (player.totalWon + (second ? guest.totalWon : 0) > previousWon) tone(730, .15);
    else if (player.credits + (second ? guest.credits : 0) < previousCredits) tone(196, .04);
    if (table.banner) {
      announcement.textContent = table.banner;
      announcement.hidden = false;
      table.banner = '';
      bannerUntil = table.time + 3.2;
    } else if (table.time >= bannerUntil) announcement.hidden = true;
    if (seatEmpty(0) && (!second || seatEmpty(2))) {
      phase = 'empty';
      releaseInput();
      pause.disabled = true;
      const summary = second
        ? 'P1 caught ' + player.caught + ' · P2 caught ' + guest.caught + '.'
        : 'You caught ' + player.caught + ' targets and won ' + player.totalWon.toLocaleString('en-US') + ' credits.';
      showOverlay('Out of credits', 'Table closed', summary + ' Start a free table with 240 new credits per seat.', 'New table');
    }
    updateDisplay();
  }
  if (phase === 'online') {
    moveAim(control.aim, aimKeys, dt);
    if (control.lockMode && control.lockId != null && !table.targets.some(target => target.id === control.lockId)) control.lockId = null;
    if (now >= room.nextInput) {
      sendRoomInput();
      room.nextInput = now + 64;
    }
  }
  draw(displayRoom(now), control, reducedMotion.matches);
  requestAnimationFrame(frame);
}
new ResizeObserver(resize).observe(canvas);
resize();
updateDisplay();
const invite = parseRoom(location.href);
if (invite) joinRoom(invite);
requestAnimationFrame(frame);
