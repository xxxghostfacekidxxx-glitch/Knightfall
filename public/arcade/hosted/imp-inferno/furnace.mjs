export const HEIGHT = 500;
export const STARTING_CREDITS = 240;
export const POWERS = [
  { cost: 1, radius: 38, strength: 1 },
  { cost: 2, radius: 47, strength: 1.15 },
  { cost: 5, radius: 58, strength: 1.38 },
  { cost: 10, radius: 73, strength: 1.65 },
];
export const SPECIES = {
  grinner: { name: 'Grinner', multiplier: 2, radius: 17, chance: .49 },
  ashwing: { name: 'Ashwing', multiplier: 4, radius: 19, chance: .25 },
  brute: { name: 'Brute', multiplier: 8, radius: 27, chance: .135 },
  fuse: { name: 'Fuse Imp', multiplier: 15, radius: 24, chance: .09, bonus: 'blast' },
  spark: { name: 'Spark Imp', multiplier: 20, radius: 25, chance: .065, bonus: 'chain' },
  king: { name: 'Furnace King', multiplier: 80, radius: 47, chance: .019 },
};
export const SEAT_COLORS = ['#ffcf70', '#83e4ff', '#ff90c7', '#a7f8a0'];
export const SEAT_NAMES = ['You', 'Coal', 'Hex', 'Vex'];
const FORMATIONS = [
  ['grinner', 8, 'shoal'], ['ashwing', 6, 'zigzag'], ['grinner', 7, 'diagonal'],
  ['brute', 4, 'shoal'], ['grinner', 9, 'zigzag'], ['ashwing', 7, 'diagonal'],
];

export function newTable(width) {
  return {
    width, time: 0, targets: [], shots: [], effects: [], nextId: 0,
    nextSchool: 1, nextRare: 8, nextKing: 27, formation: 0, banner: '',
    seats: SEAT_NAMES.map((name, i) => ({
      name, credits: STARTING_CREDITS, totalWon: 0, caught: 0, readyAt: 0,
      angle: [-Math.PI / 2, .31, Math.PI / 2, Math.PI - .31][i], recoil: 0, targetId: null,
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

function addFormation(table, species, count, route, rng, openingAt = 0) {
  const direction = rng() < .5 ? 1 : -1;
  const rhythm = .67 + rng() * .13;
  const sharedY = .24 + rng() * .49;
  for (let i = 0; i < count; i++) {
    const stats = SPECIES[species];
    table.targets.push({
      ...stats, species, id: ++table.nextId, direction, route, sharedY, order: i,
      start: table.time + i * rhythm - openingAt, speed: species === 'king' ? .047 : .085 + rng() * .021,
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
    : HEIGHT * target.sharedY + Math.sin(phase * (target.route === 'zigzag' ? 4 : 2)) * 54;
  target.x = target.direction === 1 ? x : table.width - x;
  target.y = y + offset + Math.sin(table.time * 3 + target.order) * 5;
  return progress < 1;
}

export function seedTable(table, rng = Math.random) {
  addFormation(table, 'grinner', 8, 'shoal', rng, 7);
  addFormation(table, 'ashwing', 5, 'diagonal', rng, 6);
  addFormation(table, 'brute', 3, 'zigzag', rng, 6);
  for (const target of table.targets) moveTarget(table, target);
}

export function resizeTable(table, width) {
  const scale = width / table.width;
  for (const item of [...table.targets, ...table.shots, ...table.effects]) item.x *= scale;
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

function fire(table, seat, aim, power, rapid, locked) {
  const player = table.seats[seat];
  const { cost, radius, strength } = POWERS[power];
  const origin = seatOrigin(table, seat);
  const angle = Math.atan2(aim.y - origin.y, aim.x - origin.x);
  player.angle = angle;
  if (table.time < player.readyAt || player.credits < cost) return;
  player.readyAt = table.time + (seat ? .80 + seat * .09 : rapid ? .20 : .37);
  player.credits -= cost;
  player.recoil = 1;
  table.shots.push({
    seat, cost, radius, strength, angle, lockId: locked ? aim.id : null, life: 1.55,
    x: origin.x + Math.cos(angle) * 34, y: origin.y + Math.sin(angle) * 34,
  });
}

function payout(table, target, shot) {
  const player = table.seats[shot.seat];
  const amount = shot.cost * target.multiplier;
  player.credits += amount;
  player.totalWon += amount;
  player.caught++;
  target.caught = true;
  table.effects.push({ kind: 'catch', x: target.x, y: target.y, seat: shot.seat, amount, life: 1.04, duration: 1.04 });
  if (!shot.seat && (target.multiplier >= 15)) table.banner = target.name + ' caught · +' + amount;
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
  const chain = target.bonus === 'chain';
  const radius = chain ? 190 : 117;
  table.effects.push({ kind: target.bonus, x: target.x, y: target.y, radius, seat: shot.seat, life: .5, duration: .5 });
  const nearby = table.targets.filter(other => !other.caught && visible(table, other) && other.multiplier <= 8
    && Math.hypot(other.x - target.x, other.y - target.y) <= radius);
  for (const other of nearby.slice(0, chain ? 4 : 8)) {
    if (rng() < (chain ? .86 : .72)) payout(table, other, shot);
  }
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
  const dx = Math.cos(shot.angle) * 790 * dt;
  const dy = Math.sin(shot.angle) * 790 * dt;
  let event = Infinity;
  for (const target of table.targets) {
    if (target.caught || (lock && target !== lock)) continue;
    event = Math.min(event, impactTime(shot, dx, dy, target));
  }
  if (event <= 1) {
    shot.x += dx * event;
    shot.y += dy * event;
    net(table, shot, rng);
    return false;
  }
  shot.x += dx;
  shot.y += dy;
  shot.life -= dt;
  return shot.life > 0 && shot.x >= -8 && shot.x <= table.width + 8 && shot.y >= -8 && shot.y <= HEIGHT + 8;
}

export function advance(table, dt, control, rng = Math.random) {
  table.time += dt;
  if (table.time >= table.nextSchool) {
    const [species, count, route] = FORMATIONS[table.formation++ % FORMATIONS.length];
    addFormation(table, species, count, route, rng);
    table.nextSchool = table.time + 3.1;
  }
  if (table.time >= table.nextRare) {
    addFormation(table, table.formation % 2 ? 'fuse' : 'spark', 1, 'zigzag', rng);
    table.nextRare = table.time + 8.5;
  }
  if (table.time >= table.nextKing) {
    addFormation(table, 'king', 1, 'shoal', rng);
    table.nextKing = table.time + 35;
    table.banner = 'Furnace King incoming · 80×';
  }

  table.targets = table.targets.filter(target => !target.caught && moveTarget(table, target));
  for (const seat of table.seats) seat.recoil = Math.max(0, seat.recoil - dt * 8);
  const origin = seatOrigin(table, 0);
  const lock = table.targets.find(target => target.id === control.lockId && visible(table, target));
  const aim = lock ?? control.aim;
  table.seats[0].angle = Math.atan2(aim.y - origin.y, aim.x - origin.x);
  if (control.firing || (control.auto && (!control.lockMode || lock))) {
    fire(table, 0, aim, control.power, control.rapid, Boolean(lock));
  }
  for (let seat = 1; seat < table.seats.length; seat++) {
    if (table.time < table.seats[seat].readyAt) continue;
    const target = aimRival(table, seat, rng);
    if (target) {
      const power = target.multiplier >= 15 && table.seats[seat].credits > 70 ? 1 : 0;
      fire(table, seat, target, power, false, true);
    }
  }
  table.shots = table.shots.filter(shot => moveShot(table, shot, dt, rng));
  table.targets = table.targets.filter(target => !target.caught);
  table.effects = table.effects.filter(effect => (effect.life -= dt) > 0);
}
