export const HEIGHT = 500;
export const DURATION = 80;
export const CANNONS = [
  { cadence: .13, damage: 1, speed: 1000, spread: [0], color: '#ffe379', radius: 4 },
  { cadence: .27, damage: 1, speed: 880, spread: [-.105, 0, .105], color: '#ff8d52', radius: 4 },
  { cadence: .45, damage: 4, speed: 1180, spread: [0], color: '#fff5e0', radius: 7 },
];
const WAVES = [
  { at: 0, title: 'The Grinning Swarm', interval: .86 },
  { at: 15, title: 'Ashwing Ambush', interval: .66 },
  { at: 32, title: 'Molten Stampede', interval: .49 },
  { at: 50, title: 'The Furnace King', interval: 1.25 },
];
const IMPS = {
  grinner: { radius: 22, hp: 2, points: 100, speed: 74 },
  ashwing: { radius: 17, hp: 1, points: 150, speed: 123 },
  brute: { radius: 29, hp: 5, points: 300, speed: 59 },
};

export function newRun(width) {
  return {
    width, elapsed: 0, wave: -1, score: 0, streak: 0, chainUntil: 0, shots: [],
    targets: [], effects: [], boss: null, nextSpawn: .45, nextShot: 0,
    recoil: 0, banner: '', outcome: null, kills: 0,
  };
}

export function muzzle(width, aim) {
  const x = width / 2;
  const y = HEIGHT - 35;
  const angle = Math.atan2(Math.min(-12, aim.y - y), aim.x - x);
  return { x: x + Math.cos(angle) * 32, y: y + Math.sin(angle) * 32, angle };
}

export function multiplier(run) {
  return 1 + Math.min(4, Math.floor(run.streak / 3));
}

export function bossParts(boss) {
  return [
    { id: 'left', x: boss.x - 44, y: boss.y + 8, radius: 24, hp: boss.left },
    { id: 'right', x: boss.x + 44, y: boss.y + 8, radius: 24, hp: boss.right },
    { id: 'core', x: boss.x, y: boss.y + 12, radius: 27, hp: boss.core },
  ];
}

export function resizeRun(run, width) {
  const scale = width / run.width;
  for (const item of [...run.targets, ...run.shots, ...run.effects]) item.x *= scale;
  if (run.boss) run.boss.x *= scale;
  run.width = width;
}

function spawn(run, rng) {
  const roll = rng();
  const type = run.wave >= 2 && roll < .27 ? 'brute' : run.wave >= 1 && roll < .68 ? 'ashwing' : 'grinner';
  const stats = IMPS[type];
  const direction = rng() < .5 ? 1 : -1;
  const baseY = 111 + rng() * 240;
  const phase = rng() * Math.PI * 2;
  run.targets.push({
    ...stats, type, direction, x: direction === 1 ? -52 : run.width + 52,
    y: baseY, baseY, phase, flash: 0,
  });
}

function effects(run, x, y, color, label = '') {
  run.effects.push({ x, y, color, label, life: label ? .78 : .28, seed: run.shots.length + run.elapsed });
}

function award(run, points, x, y, color) {
  const total = points * multiplier(run);
  run.score += total;
  effects(run, x, y, color, '+' + total.toLocaleString('en-US'));
}

// Closest entry into a circle over the full timestep, including high-speed shots.
function impact(shot, dx, dy, target) {
  const x = shot.x - target.x;
  const y = shot.y - target.y;
  const radius = target.radius + shot.radius;
  const c = x * x + y * y - radius * radius;
  if (c <= 0) return 0;
  const a = dx * dx + dy * dy;
  const b = x * dx + y * dy;
  const discriminant = b * b - a * c;
  return b < 0 && discriminant >= 0 ? (-b - Math.sqrt(discriminant)) / a : Infinity;
}

function strike(run, shot, target, cues) {
  effects(run, target.x, target.y, shot.color);
  if (!target.id) {
    target.hp -= shot.damage;
    target.flash = .1;
    if (target.hp <= 0) {
      run.kills++;
      run.streak++;
      run.chainUntil = run.elapsed + 3.2;
      award(run, target.points, target.x, target.y, '#ffe16a');
      cues.add('pop');
    }
    return;
  }

  const boss = run.boss;
  if (target.id === 'core' && (boss.left > 0 || boss.right > 0)) return;
  boss[target.id] = Math.max(0, boss[target.id] - shot.damage);
  boss.flash = .1;
  if (boss[target.id] > 0) return;
  if (target.id === 'core') {
    award(run, 3500, target.x, target.y, '#fff1ac');
    run.outcome = 'cleared';
    cues.add('victory');
  } else {
    award(run, 450, target.x, target.y, '#ffbd64');
    run.banner = boss.left || boss.right ? 'One shoulder plate down' : 'Core exposed';
    cues.add('break');
  }
}

export function advance(run, dt, { aim, firing, mode }, rng = Math.random) {
  const cues = new Set();
  if (run.outcome) return cues;
  run.elapsed = Math.min(DURATION, run.elapsed + dt);
  if (run.elapsed >= run.chainUntil) run.streak = 0;
  const wave = WAVES.findLastIndex(({ at }) => at <= run.elapsed);
  if (wave !== run.wave) {
    run.wave = wave;
    run.banner = WAVES[wave].title;
    cues.add('wave');
    if (wave === 3) run.boss = { x: run.width / 2, y: -100, left: 26, right: 26, core: 51, flash: 0 };
  }
  if (run.elapsed >= run.nextSpawn) {
    spawn(run, rng);
    if (wave < 3 && Math.floor(run.elapsed) % 4 === 0 && rng() < .55) spawn(run, rng);
    run.nextSpawn = run.elapsed + WAVES[wave].interval;
  }

  run.recoil = Math.max(0, run.recoil - 7 * dt);
  if (firing && run.elapsed >= run.nextShot) {
    const cannon = CANNONS[mode];
    const origin = muzzle(run.width, aim);
    for (const offset of cannon.spread) {
      const angle = origin.angle + offset;
      run.shots.push({ ...cannon, x: origin.x, y: origin.y, vx: Math.cos(angle) * cannon.speed, vy: Math.sin(angle) * cannon.speed });
    }
    run.nextShot = run.elapsed + cannon.cadence;
    run.recoil = 1;
    cues.add('shot');
  }
  for (const target of run.targets) {
    target.x += target.direction * (target.speed + wave * 7) * dt;
    target.y = target.baseY + Math.sin(run.elapsed * (target.type === 'ashwing' ? 4.3 : 2.2) + target.phase) * 24;
    target.flash = Math.max(0, target.flash - dt);
  }

  if (run.boss) {
    const age = run.elapsed - WAVES[3].at;
    run.boss.x = run.width / 2 + Math.sin(age * .97) * Math.min(run.width * .27, 158);
    run.boss.y = Math.min(182, -100 + age * 115) + Math.sin(age * 2.1) * 27;
    run.boss.flash = Math.max(0, run.boss.flash - dt);
  }

  run.shots = run.shots.filter(shot => {
    const dx = shot.vx * dt;
    const dy = shot.vy * dt;
    const targets = run.boss ? [...run.targets, ...bossParts(run.boss)] : run.targets;
    let nearest = null;
    let earliest = 1;
    for (const target of targets) {
      if (target.hp <= 0) continue;
      const time = impact(shot, dx, dy, target);
      if (time <= earliest) {
        nearest = target;
        earliest = time;
      }
    }
    if (nearest) {
      if (!run.outcome) strike(run, shot, nearest, cues);
      return false;
    }
    shot.x += dx;
    shot.y += dy;
    return shot.x > -16 && shot.x < run.width + 16 && shot.y > -16 && shot.y < HEIGHT + 16;
  });
  run.targets = run.targets.filter(target => target.hp > 0 && target.x > -58 && target.x < run.width + 58);
  for (const effect of run.effects) effect.life -= dt;
  run.effects = run.effects.filter(effect => effect.life > 0);
  if (!run.outcome && run.elapsed >= DURATION) run.outcome = 'timeout';
  return cues;
}
