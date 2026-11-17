export const HEIGHT = 500;
export const STARTING_CREDITS = 240;
export const POWERS = [
  { cost: 1, radius: 38, strength: 1 },
  { cost: 2, radius: 47, strength: 1.15 },
  { cost: 5, radius: 58, strength: 1.38 },
  { cost: 10, radius: 73, strength: 1.65 },
  { cost: 15, radius: 80, strength: 1.8 },
  { cost: 20, radius: 88, strength: 1.95 },
  { cost: 25, radius: 96, strength: 2.1 },
];
export const SPECIES = {
  grinner: { name: 'Grinner', multiplier: 2, radius: 17, chance: .49 },
  ashwing: { name: 'Ashwing', multiplier: 4, radius: 19, chance: .25 },
  brute: { name: 'Brute', multiplier: 8, radius: 27, chance: .135 },
  fuse: { name: 'Fuse Imp', multiplier: 15, radius: 24, chance: .09, bonus: 'blast' },
  spark: { name: 'Spark Imp', multiplier: 20, radius: 25, chance: .065, bonus: 'chain' },
  prism: { name: 'Prism Imp', multiplier: 25, radius: 26, chance: .058, bonus: 'beam' },
  drill: { name: 'Drill Imp', multiplier: 30, radius: 28, chance: .047, bonus: 'drill' },
  vortex: { name: 'Vortex Imp', multiplier: 35, radius: 29, chance: .041, bonus: 'vortex' },
  croupier: { name: 'Croupier Imp', multiplier: 12, radius: 28, chance: .12, bonus: 'wheel' },
  king: { name: 'Furnace King', multiplier: 80, radius: 47, chance: .019 },
};
const RARE_IMPS = ['fuse', 'croupier', 'spark', 'prism', 'drill', 'vortex'];
export const WHEEL_MULTIPLIERS = [5, 10, 5, 15, 8, 25, 8, 50];
export const WHEEL_DURATION = 2.4;
export const SEAT_COLORS = ['#ffcf70', '#83e4ff', '#ff90c7', '#a7f8a0'];
export const SEAT_NAMES = ['You', 'Coal', 'Hex', 'Vex'];
const FORMATIONS = [
  ['grinner', 8, 'shoal'], ['ashwing', 6, 'zigzag'], ['grinner', 7, 'diagonal'],
  ['brute', 4, 'shoal'], ['grinner', 9, 'zigzag'], ['ashwing', 7, 'diagonal'],
];

export function newTable(width) {
  return {
    width, time: 0, targets: [], shots: [], effects: [], spins: [], nextId: 0, nextShotId: 0,
    nextSchool: 1, nextRare: 8, nextKing: 27, nextTide: 16, rareIndex: 0, formation: 0, banner: '',
    seats: SEAT_NAMES.map((name, i) => ({
      name, credits: STARTING_CREDITS, totalWon: 0, caught: 0, readyAt: 0,
      angle: [-Math.PI / 2, .31, Math.PI / 2, Math.PI - .31][i], recoil: 0, targetId: null, bonus: null,
    })),
  };
}

export function seatOrigin(table, seat) {
  return [
    { x: table.width * .5, y: HEIGHT - 44 },
    { x: 40, y: HEIGHT * .5 },
    { x: table.width * .5, y: 44 },
    { x: table.width - 40, y: HEIGHT * .5 },
  ][seat];
}

export function pickTarget(table, point) {
  return table.targets.reduce((closest, target) => {
    if (target.x < 0 || target.x > table.width || target.y < 0 || target.y > HEIGHT) return closest;
    const distance = Math.hypot(point.x - target.x, point.y - target.y);
    return distance <= target.radius + 10 && distance < closest.distance ? { target, distance } : closest;
  }, { target: null, distance: Infinity }).target;
}

function addFormation(table, species, count, route, rng, { openingAt = 0, lane, from } = {}) {
  const direction = from ?? (rng() < .5 ? 1 : -1);
  const rhythm = route === 'tide' ? .39 : .67 + rng() * .13;
  const sharedY = lane ?? (.24 + rng() * .49);
  const speed = species === 'king' ? .047 : .085 + rng() * .021;
  for (let i = 0; i < count; i++) {
    const stats = SPECIES[species];
    table.targets.push({
      ...stats, species, id: ++table.nextId, direction, route, sharedY, order: i,
      start: table.time + i * rhythm - openingAt, speed,
      x: direction === 1 ? -100 : table.width + 100, y: HEIGHT * sharedY,
    });
  }
}

function moveTarget(table, target) {
  const progress = (table.time - target.start) * target.speed;
  const x = -96 + progress * (table.width + 192);
  const phase = progress * Math.PI;
  const offset = (target.order % 2 ? -1 : 1) * (target.route === 'shoal' ? 23 : 10);
  const y = target.route === 'diagonal' ? 124 + 238 * progress
    : HEIGHT * target.sharedY + Math.sin(phase * (target.route === 'zigzag' ? 4 : 2)) * (target.route === 'tide' ? 18 : 54);
  target.x = target.direction === 1 ? x : table.width - x;
  target.y = y + offset + Math.sin(table.time * 3 + target.order) * 5;
  return progress < 1;
}

export function seedTable(table, rng = Math.random) {
  addFormation(table, 'grinner', 8, 'shoal', rng, { openingAt: 7 });
  addFormation(table, 'ashwing', 5, 'diagonal', rng, { openingAt: 6 });
  addFormation(table, 'brute', 3, 'zigzag', rng, { openingAt: 6 });
  for (const target of table.targets) moveTarget(table, target);
}

export function resizeTable(table, width) {
  const scale = width / table.width;
  for (const item of [...table.targets, ...table.shots]) item.x *= scale;
  for (const effect of table.effects) {
    effect.x *= scale;
    if (effect.kind === 'beam') effect.endX *= scale;
    if (effect.target) effect.target.x *= scale;
    for (const point of effect.points ?? []) point.x *= scale;
  }
  table.width = width;
}

function visible(table, target) {
  return target.x >= target.radius && target.x <= table.width - target.radius;
}

function aimRival(table, seat, rng) {
  const id = table.seats[seat].targetId;
  const current = table.targets.find(target => target.id === id);
  if (current && visible(table, current)) return current;
  const origin = seatOrigin(table, seat);
  const candidates = table.targets.filter(target => visible(table, target) && Math.hypot(target.x - origin.x, target.y - origin.y) < Math.max(320, table.width * .57));
  const target = candidates[Math.floor(rng() * candidates.length)];
  table.seats[seat].targetId = target?.id ?? null;
  return target;
}

function fire(table, seat, aim, power, rapid, locked, cpu = false) {
  const player = table.seats[seat];
  const { cost, radius, strength } = POWERS[power];
  const origin = seatOrigin(table, seat);
  const angle = Math.atan2(aim.y - origin.y, aim.x - origin.x);
  player.angle = angle;
  const bonus = player.bonus;
  if (table.time < player.readyAt || (!bonus && player.credits < cost)) return;
  player.readyAt = table.time + (cpu ? .80 + seat * .09 : rapid ? .20 : .37);
  player.recoil = 1;
  const shot = {
    id: ++table.nextShotId, seat, cost, radius, strength, angle, lockId: locked ? aim.id : null, life: 2.8, bounces: 2,
    x: origin.x + Math.cos(angle) * 34, y: origin.y + Math.sin(angle) * 34,
  };
  if (bonus) {
    player.bonus = null;
    shot.cost = bonus.cost;
    if (bonus.kind === 'beam') return fireBeam(table, shot);
    Object.assign(shot, { drill: true, visited: new Set(), lockId: null, life: 3.1, bounces: 4 });
  } else player.credits -= cost;
  table.shots.push(shot);
}

function fireBeam(table, shot) {
  const dx = Math.cos(shot.angle);
  const dy = Math.sin(shot.angle);
  const reach = Math.hypot(table.width, HEIGHT);
  table.effects.push({
    kind: 'beam', x: shot.x, y: shot.y, endX: shot.x + dx * reach, endY: shot.y + dy * reach,
    seat: shot.seat, life: .43, duration: .43,
  });
  for (const target of table.targets) {
    if (target.caught || target.multiplier > 8 || !visible(table, target)) continue;
    const x = target.x - shot.x;
    const y = target.y - shot.y;
    if (x * dx + y * dy >= 0 && Math.abs(x * dy - y * dx) < target.radius + 18) payout(table, target, shot);
  }
}

function payout(table, target, shot) {
  const player = table.seats[shot.seat];
  const amount = shot.cost * target.multiplier;
  player.credits += amount;
  player.totalWon += amount;
  player.caught++;
  target.caught = true;
  table.effects.push({ kind: 'catch', x: target.x, y: target.y, seat: shot.seat, amount, target: { ...target }, life: 1.04, duration: 1.04 });
  if (target.multiplier >= 15 && (!shot.seat || player.name === 'P2')) table.banner = player.name + ' caught ' + target.name + ' · +' + amount;
}

function net(table, shot, rng) {
  table.effects.push({ kind: 'net', x: shot.x, y: shot.y, radius: shot.radius, seat: shot.seat, life: .35, duration: .35 });
  for (const target of table.targets) {
    if (target.caught || !visible(table, target)) continue;
    const distance = Math.hypot(target.x - shot.x, target.y - shot.y);
    if (distance > shot.radius + target.radius) continue;
    const factor = distance <= target.radius + 8 ? 1 : .65;
    if (rng() >= Math.min(.85, target.chance * shot.strength * factor)) continue;
    payout(table, target, shot);
    if (target.bonus) triggerBonus(table, target, shot, rng);
  }
}

function triggerBonus(table, target, shot, rng) {
  const kind = target.bonus;
  if (kind === 'wheel') {
    const slot = Math.floor(rng() * WHEEL_MULTIPLIERS.length);
    const spins = table.spins ??= [];
    const previous = spins.findLast(spin => spin.seat === shot.seat);
    const starts = Math.max(table.time, previous ? previous.ends + 1.25 : 0);
    spins.push({ seat: shot.seat, cost: shot.cost, slot, starts, ends: starts + WHEEL_DURATION, paid: false });
    return;
  }
  if (kind === 'beam' || kind === 'drill') {
    const seat = table.seats[shot.seat];
    seat.bonus = { kind, cost: shot.cost };
    if (!shot.seat || seat.name === 'P2') table.banner = seat.name + ' · ' + (kind === 'beam' ? 'Hellbeam' : 'Drill shot') + ' ready';
    return;
  }
  const radius = kind === 'chain' ? 190 : kind === 'vortex' ? 230 : 117;
  const nearby = table.targets.filter(other => !other.caught && visible(table, other) && other.multiplier <= 8
    && Math.hypot(other.x - target.x, other.y - target.y) <= radius);
  const chosenSpecies = nearby.reduce((closest, other) => {
    const distance = Math.hypot(other.x - target.x, other.y - target.y);
    return distance < closest.distance ? { species: other.species, distance } : closest;
  }, { species: null, distance: Infinity }).species;
  const captured = kind === 'vortex' ? nearby.filter(other => other.species === chosenSpecies)
    : nearby.slice(0, kind === 'chain' ? 4 : 8).filter(() => rng() < (kind === 'chain' ? .86 : .72));
  for (const other of captured) payout(table, other, shot);
  table.effects.push({
    kind, x: target.x, y: target.y, radius, seat: shot.seat, life: .58, duration: .58,
    points: captured.map(({ x, y }) => ({ x, y })),
  });
}

function impactTime(shot, dx, dy, target) {
  const x = shot.x - target.x;
  const y = shot.y - target.y;
  const r = target.radius + 5;
  const c = x * x + y * y - r * r;
  if (c <= 0) return 0;
  const a = dx * dx + dy * dy;
  const b = x * dx + y * dy;
  const discriminant = b * b - a * c;
  return b < 0 && discriminant >= 0 ? (-b - Math.sqrt(discriminant)) / a : Infinity;
}

function moveShot(table, shot, dt, rng) {
  const lock = shot.lockId && table.targets.find(target => target.id === shot.lockId && !target.caught);
  if (lock) shot.angle = Math.atan2(lock.y - shot.y, lock.x - shot.x);
  const speed = shot.drill ? 630 : 790;
  const dx = Math.cos(shot.angle) * speed * dt;
  const dy = Math.sin(shot.angle) * speed * dt;
  const wallX = dx > 0 ? (table.width - shot.x) / dx : dx < 0 ? -shot.x / dx : Infinity;
  const wallY = dy > 0 ? (HEIGHT - shot.y) / dy : dy < 0 ? -shot.y / dy : Infinity;
  const wall = Math.max(0, Math.min(wallX, wallY));
  let hit = Infinity;
  for (const target of table.targets) {
    if (target.caught || !visible(table, target) || (lock && target !== lock)) continue;
    if (shot.drill && (target.multiplier > 8 || shot.visited.has(target.id))) continue;
    const impact = impactTime(shot, dx, dy, target);
    if (impact > 1 || impact > wall) continue;
    if (shot.drill) {
      shot.visited.add(target.id);
      payout(table, target, shot);
    } else hit = Math.min(hit, impact);
  }
  if (hit <= 1) {
    shot.x += dx * hit;
    shot.y += dy * hit;
    net(table, shot, rng);
    return false;
  }
  const travel = Math.min(1, wall);
  shot.x += dx * travel;
  shot.y += dy * travel;
  shot.life -= dt;
  if (shot.life <= 0) return false;
  if (wall > 1) return true;
  if (!shot.bounces) return false;
  shot.bounces--;
  shot.lockId = null;
  if (wallX <= wallY) shot.angle = Math.PI - shot.angle;
  if (wallY <= wallX) shot.angle = -shot.angle;
  table.effects.push({ kind: 'bounce', x: shot.x, y: shot.y, radius: 16, seat: shot.seat, life: .2, duration: .2 });
  return true;
}

export function advance(table, dt, control, rng = Math.random) {
  table.time += dt;
  updateWheels(table);
  if (table.time >= table.nextSchool) {
    const [species, count, route] = FORMATIONS[table.formation++ % FORMATIONS.length];
    addFormation(table, species, count, route, rng);
    table.nextSchool = table.time + 3.1;
  }
  if (table.time >= table.nextRare) {
    addFormation(table, RARE_IMPS[table.rareIndex++ % RARE_IMPS.length], 1, 'zigzag', rng);
    table.nextRare = table.time + 8.5;
  }
  if (table.time >= table.nextTide) {
    const from = rng() < .5 ? 1 : -1;
    addFormation(table, 'grinner', 8, 'tide', rng, { lane: .29, from });
    addFormation(table, 'ashwing', 7, 'tide', rng, { lane: .50, from });
    addFormation(table, 'brute', 5, 'tide', rng, { lane: .71, from });
    table.nextTide = table.time + 32;
    table.nextSchool = table.time + 7;
    table.banner = 'Inferno tide · three schools incoming';
  }
  if (table.time >= table.nextKing) {
    addFormation(table, 'king', 1, 'shoal', rng);
    table.nextKing = table.time + 35;
    table.banner = 'Furnace King incoming · 80×';
  }

  table.targets = table.targets.filter(target => !target.caught && moveTarget(table, target));
  for (const seat of table.seats) seat.recoil = Math.max(0, seat.recoil - dt * 8);
  const online = control.onlineSeats;
  if (online) {
    online.forEach((input, index) => { if (input) directSeat(table, index, input); });
  } else {
    directSeat(table, 0, control);
    if (control.secondSeat) directSeat(table, 2, control.secondSeat);
  }
  for (let seat = 1; !online && seat < table.seats.length; seat++) {
    if (seat === 2 && control.secondSeat) continue;
    if (table.time < table.seats[seat].readyAt) continue;
    const target = aimRival(table, seat, rng);
    if (target) {
      const power = target.multiplier >= 15 && table.seats[seat].credits > 70 ? 1 : 0;
      fire(table, seat, target, power, false, true, true);
    }
  }
  table.shots = table.shots.filter(shot => moveShot(table, shot, dt, rng));
  table.targets = table.targets.filter(target => !target.caught);
  table.effects = table.effects.filter(effect => (effect.life -= dt) > 0);
}

function directSeat(table, seat, control) {
  const origin = seatOrigin(table, seat);
  const lock = table.targets.find(target => target.id === control.lockId && visible(table, target));
  const aim = lock ?? control.aim;
  table.seats[seat].angle = Math.atan2(aim.y - origin.y, aim.x - origin.x);
  if (control.firing || (control.auto && (!control.lockMode || lock))) {
    fire(table, seat, aim, control.power, control.rapid, Boolean(lock));
  }
}

function updateWheels(table) {
  const spins = table.spins ??= [];
  for (const spin of spins) {
    if (spin.paid || spin.ends > table.time) continue;
    const seat = table.seats[spin.seat];
    const amount = spin.cost * WHEEL_MULTIPLIERS[spin.slot];
    seat.credits += amount;
    seat.totalWon += amount;
    spin.paid = true;
    table.banner = seat.name + ' · Furnace wheel +' + amount;
  }
  table.spins = spins.filter(spin => spin.ends + 1.25 > table.time);
}
