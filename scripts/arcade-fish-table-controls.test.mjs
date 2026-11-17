import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import {
  advance, BOSS_ABILITIES, HEIGHT, newTable, pickTarget, POWERS, seatOrigin, seedTable, SPECIES, STARTING_CREDITS, upcomingBoss, upcomingTide,
} from '../public/arcade/hosted/imp-inferno/furnace.mjs';
import { CREATURE_SPECIES, drawCreature, isCreature } from '../public/arcade/hosted/imp-inferno/creatures.mjs';
import { drawMuzzle, drawProjectile, drawReticle, drawTurret, TURRET_TIP } from '../public/arcade/hosted/imp-inferno/turret.mjs';
import { drawBossAttack, drawBossTell, drawBossHit, drawFurnaceKing } from '../public/arcade/hosted/imp-inferno/bosses.mjs';

function isolatedTable() {
  const table = newTable(800);
  table.nextSchool = table.nextRare = table.nextKing = table.nextTide = Infinity;
  for (const seat of table.seats.slice(1)) seat.readyAt = Infinity;
  return table;
}

function target(table, species, id, y, time = table.time) {
  const routeY = (y - 23 - 54 * Math.sin(Math.PI) - Math.sin(time * 3) * 5) / HEIGHT;
  const target = {
    ...SPECIES[species], species, id, route: 'shoal', direction: 1,
    start: -5, speed: .1, order: 0, sharedY: routeY, x: table.width * .5, y,
  };
  table.targets.push(target);
  return target;
}

const control = { aim: { x: 400, y: 244 }, power: 1, firing: false, lockId: null, lockMode: false, auto: false, rapid: false };

test('shot cost is charged on launch and its multiplier pays the original stake', () => {
  const table = isolatedTable();
  target(table, 'grinner', 1, 290);
  advance(table, .016, { ...control, firing: true }, () => 0);
  assert.equal(table.seats[0].credits, STARTING_CREDITS - POWERS[1].cost);
  for (let i = 0; i < 25; i++) advance(table, .016, { ...control, power: 3 }, () => 0);
  assert.equal(table.seats[0].credits, STARTING_CREDITS - 2 + 2 * SPECIES.grinner.multiplier);
  assert.equal(table.seats[0].caught, 1);
  assert.equal(table.targets.length, 0);
  assert.ok(table.effects.some(effect => effect.kind === 'net'));
});

test('a missed capture costs credits, with no damage carry-over or payout', () => {
  const table = isolatedTable();
  target(table, 'grinner', 1, 290);
  advance(table, .016, { ...control, firing: true }, () => .999);
  for (let i = 0; i < 25; i++) advance(table, .016, control, () => .999);
  assert.equal(table.seats[0].credits, STARTING_CREDITS - 2);
  assert.equal(table.seats[0].totalWon, 0);
  assert.equal(table.targets.length, 1);
});

test('lock selects a moving target and never auto-spends with no target', () => {
  const table = isolatedTable();
  advance(table, .016, { ...control, auto: true, lockMode: true }, () => 0);
  assert.equal(table.seats[0].credits, STARTING_CREDITS);
  const imp = target(table, 'ashwing', 19, 280);
  assert.equal(pickTarget(table, imp).id, imp.id);
  advance(table, .016, { ...control, auto: true, lockMode: true, lockId: imp.id }, () => 0);
  assert.equal(table.shots[0].lockId, imp.id);
});

test('bonus catches can bring in nearby targets and one imp pays only once', () => {
  const table = isolatedTable();
  target(table, 'fuse', 1, 280);
  target(table, 'grinner', 2, 223);
  const shot = { seat: 0, cost: 2, radius: 48, strength: 1, angle: -Math.PI / 2, lockId: 1, life: 1.5, x: 400, y: 280 };
  table.shots.push({ ...shot }, { ...shot, seat: 2 });
  advance(table, .016, control, () => 0);
  assert.equal(table.seats[0].totalWon, 2 * (SPECIES.fuse.multiplier + SPECIES.grinner.multiplier));
  assert.equal(table.seats[0].caught, 2);
  assert.equal(table.seats[2].totalWon, 0);
  assert.ok(table.effects.some(effect => effect.kind === 'blast'));
});

test('rivals use four separate seats, credits stay nonnegative, and the table keeps restocking targets', () => {
  const table = newTable(800);
  seedTable(table, () => .55);
  assert.equal(new Set(table.seats.map((_, i) => JSON.stringify(seatOrigin(table, i)))).size, 4);
  table.seats[0].credits = 1;
  let noticedKing = false;
  for (let i = 0; i < 6200; i++) {
    advance(table, .016, { ...control, firing: true }, () => .25);
    noticedKing ||= table.targets.some(target => target.species === 'king');
  }
  assert.ok(noticedKing);
  assert.ok(table.formation > 20);
  assert.equal(table.seats[0].credits, 1);
  assert.ok(table.seats.slice(1).every(seat => seat.credits !== STARTING_CREDITS && seat.credits >= 0));
});

test('a bank shot reflects without charging twice and expires after its bounce budget', () => {
  const table = isolatedTable();
  table.shots.push({
    seat: 0, cost: 2, radius: 45, strength: 1, angle: 0, lockId: null, life: 5, bounces: 1, x: 790, y: 250,
  });
  advance(table, .032, control, () => .99);
  assert.equal(table.shots[0].x, 800);
  assert.equal(table.shots[0].bounces, 0);
  assert.ok(Math.cos(table.shots[0].angle) < 0);
  assert.equal(table.seats[0].credits, STARTING_CREDITS);
  for (let i = 0; i < 40; i++) advance(table, .032, control, () => .99);
  assert.equal(table.shots.length, 0);
});

test('a Prism catch earns one free beam at its original shot value', () => {
  const table = isolatedTable();
  target(table, 'prism', 1, 280);
  table.shots.push({ seat: 0, cost: 5, radius: 47, strength: 1, angle: -Math.PI / 2, lockId: 1, life: 1.5, x: 400, y: 280 });
  advance(table, .016, control, () => 0);
  const seat = table.seats[0];
  assert.deepEqual(seat.bonus, { kind: 'beam', cost: 5 });
  assert.equal(seat.totalWon, 125);
  target(table, 'grinner', 2, 210);
  target(table, 'ashwing', 3, 280);
  advance(table, .016, { ...control, power: 3, firing: true }, () => .99);
  assert.equal(seat.credits, STARTING_CREDITS + 125 + 30);
  assert.equal(seat.bonus, null);
  assert.equal(seat.caught, 3);
  assert.ok(table.effects.some(effect => effect.kind === 'beam'));
});

test('a charged drill pierces two imps and applies the captured shot value', () => {
  const table = isolatedTable();
  table.seats[0].bonus = { kind: 'drill', cost: 2 };
  target(table, 'ashwing', 7, 372);
  target(table, 'grinner', 8, 338);
  advance(table, .016, { ...control, power: 3, firing: true }, () => .99);
  for (let i = 0; i < 16; i++) advance(table, .016, control, () => .99);
  assert.equal(table.seats[0].credits, STARTING_CREDITS + 12);
  assert.equal(table.seats[0].caught, 2);
  assert.equal(table.seats[0].bonus, null);
});

test('Vortex sweeps a matching school and leaves other species in play', () => {
  const table = isolatedTable();
  target(table, 'vortex', 1, 290);
  target(table, 'grinner', 2, 216);
  target(table, 'grinner', 3, 181);
  target(table, 'ashwing', 4, 175);
  table.shots.push({
    seat: 0, cost: 2, radius: 38, strength: 1, angle: -Math.PI / 2, lockId: 1, life: 1.5, x: 400, y: 290,
  });
  advance(table, .016, control, () => 0);
  assert.deepEqual(table.targets.map(target => target.id), [4]);
  assert.equal(table.seats[0].totalWon, 2 * (35 + 2 + 2));
  assert.equal(table.effects.find(effect => effect.kind === 'vortex').points.length, 2);
});

test('the tide sends three schools in the same direction on separate lanes', () => {
  const table = isolatedTable();
  table.nextTide = 0;
  advance(table, .016, control, () => .1);
  assert.equal(table.targets.length, 20);
  assert.ok(table.targets.every(target => target.direction === 1 && target.route === 'tide'));
  assert.equal(new Set(table.targets.map(target => target.sharedY)).size, 3);
  assert.ok(table.nextSchool > table.time);
});

test('the tide warning previews the actual schools on each rail and rotates through three patterns', () => {
  const table = isolatedTable();
  const online = { onlineSeats: [null, null, null, null] };
  table.nextTide = 5;
  assert.equal(upcomingTide(table), null);
  for (const [name, directions] of [
    ['Inferno Tide', [1, 1, 1]], ['Crossfire', [1, -1, 1, -1]],
    ['Chevron Rush', [1, 1, 1]], ['Inferno Tide', [-1, -1, -1]],
  ]) {
    table.time = table.nextTide - 4;
    const warning = upcomingTide(table);
    assert.equal(warning.name, name);
    assert.equal(warning.seconds, 4);
    assert.deepEqual(warning.schools.map(school => school.from), directions);
    const previousId = table.nextId;
    table.time = table.nextTide;
    advance(table, .016, online, () => .1);
    assert.equal(upcomingTide(table), null);
    const arrivals = table.targets.filter(target => target.id > previousId);
    for (const { species, count, lane, from } of warning.schools) {
      const school = arrivals.filter(target => target.sharedY === lane);
      assert.equal(school.length, count);
      assert.ok(school.every(target => target.direction === from && target.species === species));
    }
  }
});

test('a saved table resumes into the wave rotation and chevron wings close toward the center', () => {
  const table = isolatedTable();
  const online = { onlineSeats: [null, null, null, null] };
  delete table.tideIndex;
  advance(table, .016, online);
  assert.equal(table.tideIndex, 0);
  table.tideIndex = 2;
  table.nextTide = table.time;
  advance(table, .016, online);
  const wing = table.targets.find(target => target.sharedY === .18);
  assert.ok(wing.y < HEIGHT * .25);
  for (let i = 0; i < 165; i++) advance(table, .032, online);
  assert.ok(wing.y > HEIGHT * .37);
});

test('two local players have independent aiming, shot costs, and credits', () => {
  const table = isolatedTable();
  table.seats[2].readyAt = 0;
  const guest = { aim: { x: 400, y: 320 }, firing: false, power: 2 };
  target(table, 'grinner', 1, 290);
  advance(table, .016, { ...control, secondSeat: guest }, () => 0);
  assert.equal(table.shots.length, 0, 'the CPU must yield the occupied seat');
  advance(table, .016, { ...control, firing: true, secondSeat: { ...guest, firing: true } }, () => 0);
  assert.deepEqual(table.shots.map(({ seat, cost }) => [seat, cost]), [[0, 2], [2, 5]]);
  assert.equal(table.seats[0].credits, STARTING_CREDITS - 2);
  assert.equal(table.seats[2].credits, STARTING_CREDITS - 5);
  assert.ok(table.shots[0].y > table.shots[1].y);
});

test('both design references are linked from the Imp Inferno arcade card', () => {
  const html = readFileSync('public/chaos-cartridge.html', 'utf8');
  const card = html.split('data-game-id="imp-inferno"')[1].split('</article>')[0];
  assert.ok(card.includes('https://github.com/d4vucat/Fish-Joy'));
  assert.ok(card.includes('https://gaming-products.com/mini-arcade/455-ocean-king-3-monster-awaken'));
});

test('Croupier triggers one free wheel payout valued at the original shot cost', () => {
  const table = isolatedTable();
  target(table, 'croupier', 1, 290);
  table.shots.push({
    seat: 0, cost: 5, radius: 38, strength: 1, angle: -Math.PI / 2,
    lockId: 1, life: 1.5, x: 400, y: 290,
  });
  advance(table, .016, control, () => 0);
  assert.equal(table.spins.length, 1);
  assert.equal(table.seats[0].credits, STARTING_CREDITS + 60);
  advance(table, 1, { ...control, power: 6 }, () => .99);
  assert.equal(table.spins[0].paid, false);
  advance(table, 1.5, control, () => .99);
  assert.equal(table.spins[0].paid, true);
  assert.equal(table.seats[0].credits, STARTING_CREDITS + 60 + 25);
  advance(table, 2, control, () => .99);
  assert.equal(table.spins.length, 0);
  assert.equal(table.seats[0].credits, STARTING_CREDITS + 60 + 25);
});

test('Firestorm sweeps across the table, caps ordinary catches, and credits its triggering seat', () => {
  const table = isolatedTable();
  target(table, 'firestorm', 1, 290);
  for (let id = 2; id <= 15; id++) target(table, 'grinner', id, 160);
  target(table, 'king', 16, 170);
  table.shots.push({
    seat: 2, cost: 5, radius: 25, strength: 1, angle: -Math.PI / 2,
    lockId: 1, life: 1.5, x: 400, y: 290,
  });
  advance(table, .016, control, () => 0);
  assert.equal(table.storms.length, 1);
  assert.equal(table.seats[2].credits, STARTING_CREDITS + 90);
  advance(table, 1.22, control, () => .99);
  assert.equal(table.storms[0].caught, 12);
  assert.ok(table.targets.some(target => target.species === 'king'));
  advance(table, .85, control, () => .99);
  assert.equal(table.seats[2].credits, STARTING_CREDITS + 90 + 120);
  assert.equal(table.seats[0].credits, STARTING_CREDITS);
  assert.equal(table.storms.length, 0);
});

test('retired cabinet routes are absent from the site, catalog, and redirects', () => {
  const routes = ['abyssal-arsenal', 'neon-kelp-reef-rush', 'magma-trench-relic-hunt', 'casino/fish-tables'];
  const catalog = JSON.parse(readFileSync('public/arcade/catalog.json', 'utf8'));
  const redirectSources = readFileSync('public/_redirects', 'utf8').split('\n').map(line => line.split(/\s+/)[0]);
  const pages = ['public/chaos-cartridge.html', 'public/casino/index.html', 'public/casino/classic-floor.html', 'public/devil-tools.html'];
  for (const route of routes) {
    assert.equal(existsSync('public/' + route + '.html'), false);
    assert.ok(!catalog.games.some(game => game.route === '/' + route + '.html'));
    for (const path of ['/' + route, '/' + route + '.html']) {
      assert.ok(!redirectSources.includes(path), path);
      for (const page of pages) assert.ok(!readFileSync(page, 'utf8').includes('href="' + path + '"'), page + ' links to ' + path);
    }
  }
  assert.equal(catalog.games.filter(game => game.id === 'imp-inferno').length, 1);
});


test('infernal creature families have unique point denominations and distinct procedural artwork', () => {
  const expected = { coalbug: 1, cinderbat: 3, hellhound: 6, skullwisp: 10,
    magmaworm: 14, boneserpent: 24, gargoyle: 45, hydra: 60 };
  assert.deepEqual(CREATURE_SPECIES, Object.keys(expected));
  assert.equal(new Set(Object.values(expected)).size, CREATURE_SPECIES.length);
  for (const [species, multiplier] of Object.entries(expected)) {
    assert.equal(SPECIES[species].multiplier, multiplier);
    assert.ok(SPECIES[species].chance > 0 && SPECIES[species].chance < 1);
    assert.ok(SPECIES[species].radius > 0);
    assert.equal(isCreature(species), true);
  }
  assert.equal(isCreature('grinner'), false);
  const calls = [];
  const ctx = new Proxy({}, {
    get(_, prop) {
      if (prop === 'canvas') return null;
      return (...args) => calls.push([prop, ...args]);
    },
    set() { return true; },
  });
  for (const species of CREATURE_SPECIES) {
    calls.length = 0;
    assert.equal(drawCreature(ctx, { species, x: 50, y: 50, radius: SPECIES[species].radius,
      direction: 1, id: 1 }, 1.5), true);
    assert.ok(calls.some(([op]) => op === 'fill'), species + ' drew nothing');
    assert.ok(calls.some(([op]) => op === 'restore'), species + ' did not restore canvas state');
  }
  assert.equal(drawCreature(ctx, { species: 'grinner' }, 0), false);
});

test('new beast types enter naturally through opening schools, rotation and rare hunts', () => {
  const table = newTable(800);
  seedTable(table, () => .5);
  assert.ok(table.targets.some(target => target.species === 'coalbug'));
  assert.ok(table.targets.some(target => target.species === 'hellhound'));
  const observed = new Set(table.targets.map(target => target.species));
  advance(table, 95, { onlineSeats: [null, null, null, null] }, () => .5);
  // Frame one big step only spawns one formation; subsequent ticks rotate through all groups.
  table.nextSchool = table.time;
  for (let i = 0; i < 45; i++) {
    advance(table, 3.2, { onlineSeats: [null, null, null, null] }, () => .5);
    for (const target of table.targets) observed.add(target.species);
  }
  for (const species of ['coalbug', 'cinderbat', 'hellhound', 'skullwisp', 'magmaworm', 'boneserpent', 'gargoyle', 'hydra']) {
    assert.ok(observed.has(species), species + ' never spawned');
  }
});


test('all four turrets are rendered as detailed swivel-mounted cannons', () => {
  const table = newTable(900);
  const calls = [];
  const ctx = new Proxy({}, {
    get(_, prop) { return (...args) => calls.push({ prop, args }); },
    set() { return true; },
  });
  assert.equal(TURRET_TIP, 46);
  for (let index = 0; index < 4; index++) {
    const seat = table.seats[index];
    seat.power = index + 1;
    seat.recoil = .5;
    calls.length = 0;
    drawTurret(ctx, table, seat, index, true);
    const position = seatOrigin(table, index);
    assert.deepEqual(calls.find(call => call.prop === 'translate').args, [position.x, position.y]);
    assert.ok(calls.filter(call => call.prop === 'fill').length > 20);
    assert.equal(calls.filter(call => call.prop === 'save').length,
      calls.filter(call => call.prop === 'restore').length);
    assert.ok(calls.some(call => call.prop === 'rotate'));
    assert.ok(calls.some(call => call.prop === 'fillText'));
  }
  delete table.seats[0].power;
  assert.doesNotThrow(() => drawTurret(ctx, table, table.seats[0], 0));
});

test('paid cannon fire emits synchronized muzzle flashes and stronger-looking projectiles', () => {
  const table = isolatedTable();
  const firing = { ...control, power: 6, firing: true };
  advance(table, .016, firing, () => .99);
  const shot = table.shots[0];
  const flash = table.effects.find(effect => effect.kind === 'muzzle');
  const origin = seatOrigin(table, 0);
  assert.ok(shot);
  assert.ok(flash);
  assert.equal(table.seats[0].power, 6);
  assert.equal(flash.power, 6);
  assert.equal(flash.seat, 0);
  assert.ok(Math.abs(flash.x - (origin.x + Math.cos(shot.angle) * TURRET_TIP)) < .001);
  assert.ok(Math.abs(flash.y - (origin.y + Math.sin(shot.angle) * TURRET_TIP)) < .001);
  assert.equal(table.seats[0].credits, STARTING_CREDITS - 25);
  const ctx = new Proxy({}, { get() { return () => {}; }, set() { return true; } });
  assert.doesNotThrow(() => drawMuzzle(ctx, flash, false));
  assert.doesNotThrow(() => drawProjectile(ctx, shot, table.time, false));
  assert.doesNotThrow(() => drawReticle(ctx, table, firing, 0, false));
  for (let i = 0; i < 16; i++) advance(table, .016, { ...control, power: 6 }, () => .99);
  assert.ok(!table.effects.some(effect => effect.kind === 'muzzle'), 'expired muzzle effects must be cleaned up');
});

test('Furnace King warns five seconds before arrival and enters with two escort schools', () => {
  const table = isolatedTable();
  const online = { onlineSeats: [null, null, null, null] };
  table.nextKing = 10;
  table.time = 4.9;
  assert.equal(upcomingBoss(table), null);
  table.time = 5;
  assert.equal(upcomingBoss(table).seconds, 5);
  table.time = 9.1;
  assert.equal(upcomingBoss(table).seconds, 1);
  table.time = 10;
  advance(table, .016, online, () => .2);
  assert.equal(upcomingBoss(table), null);
  assert.equal(table.targets.filter(target => target.species === 'king').length, 1);
  assert.equal(table.targets.filter(target => target.species === 'cinderbat').length, 4);
  assert.equal(table.targets.filter(target => target.species === 'hellhound').length, 4);
  assert.equal(table.targets.length, 9);
  assert.equal(table.banner, 'FURNACE KING · 80× · Demonic escort incoming!');
  assert.ok(table.targets.every(target => target.direction === 1));
  assert.equal(table.nextKing, table.time + 35);
  assert.equal(SPECIES.king.multiplier, 80);
});

test('rare catches remain 4-player score events and all catches retain standard payouts', () => {
  const table = isolatedTable();
  target(table, 'gargoyle', 1, 290);
  const shot = { seat: 3, cost: 5, radius: 58, strength: 1.38, angle: 0,
    lockId: 1, life: 1, bounces: 0, x: 400, y: 290 };
  table.shots.push(shot);
  advance(table, .016, { onlineSeats: [null, null, null, null] }, () => 0);
  assert.equal(table.seats[3].totalWon, 45 * 5);
  assert.equal(table.seats[3].credits, STARTING_CREDITS + 225);
  assert.match(table.banner, /Gargoyle/);
  assert.equal(table.effects.filter(effect => effect.kind === 'catch').length, 1);
});


test('three distinct towering bosses cast their own attacks and summon catchable minions without charging seats', () => {
  assert.ok(SPECIES.king.radius >= 75);
  assert.ok(SPECIES.hydra.radius >= 70);
  assert.ok(SPECIES.gargoyle.radius >= 50);
  const seen = new Set();
  for (const species of ['gargoyle', 'hydra', 'king']) {
    const table = isolatedTable();
    const boss = target(table, species, 100, 290);
    boss.nextAttack = .01;
    const credits = table.seats.map(seat => seat.credits);
    const rng = () => .3;
    advance(table, .016, { onlineSeats: [null, null, null, null] }, rng);
    const attack = table.effects.find(effect => effect.kind === 'boss-attack');
    assert.ok(attack, species + ' never cast');
    assert.equal(attack.species, species);
    assert.equal(attack.attack, BOSS_ABILITIES[species].name);
    assert.equal(attack.radius, SPECIES[species].radius);
    assert.equal(attack.duration, 1.25);
    assert.equal(boss.attackCount, 1);
    assert.ok(boss.nextAttack > table.time + 4);
    assert.deepEqual(table.seats.map(seat => seat.credits), credits);
    const summoned = table.targets.filter(item => item.id !== boss.id);
    assert.equal(summoned.length, BOSS_ABILITIES[species].count);
    assert.ok(summoned.every(item => item.species === BOSS_ABILITIES[species].escort));
    assert.ok(summoned.every(item => item.chance > 0 && item.multiplier > 0));
    assert.ok(summoned.every(item => Math.abs(item.x - boss.x) < 1));
    assert.match(table.banner, new RegExp(attack.attack));
    seen.add(attack.attack);
    for (let i = 0; i < 42; i++) advance(table, .033, { onlineSeats: [] }, () => .8);
    assert.equal(table.effects.filter(effect => effect.kind === 'boss-attack').length, 0);
  }
  assert.equal(seen.size, 3);
});

test('boss summons respect population cap and never cascade into unlimited spawns', () => {
  const table = isolatedTable();
  const boss = target(table, 'king', 700, 280);
  boss.nextAttack = .01;
  for (let id = 1000; id < 1090; id++) {
    const spawn = target(table, 'grinner', id, 300);
    spawn.x = 420;
  }
  advance(table, .016, { onlineSeats: [] }, () => .4);
  assert.equal(boss.attackCount, 1);
  assert.equal(table.targets.length, 91);
  assert.equal(table.effects.filter(effect => effect.kind === 'boss-attack').length, 1);
  assert.deepEqual(table.seats.map(seat => seat.credits), Array(4).fill(STARTING_CREDITS));
});

test('boss cinematics render safely, including reduced-motion attack tells and all three attacks', () => {
  const calls = [];
  const ctx = new Proxy({}, {
    get(_, prop) { return (...args) => calls.push(prop); },
    set() { return true; },
  });
  const dummy = { id: 4, x: 320, y: 220, species: 'king', direction: -1, radius: 80,
    nextAttack: 4.3 };
  drawFurnaceKing(ctx, dummy, 4, false);
  assert.ok(calls.filter(op => op === 'fill').length > 20);
  assert.equal(calls.filter(op => op === 'save').length, calls.filter(op => op === 'restore').length);
  drawBossTell(ctx, dummy, 4, true);
  for (const species of ['king', 'hydra', 'gargoyle']) {
    const burst = { kind: 'boss-attack', species, x: 100, y: 200,
      radius: SPECIES[species].radius, direction: 1, life: .8, duration: 1.25 };
    assert.equal(drawBossAttack(ctx, burst, false), true);
    assert.equal(drawBossAttack(ctx, burst, true), true);
  }
  assert.equal(calls.filter(op => op === 'save').length, calls.filter(op => op === 'restore').length);
  assert.equal(drawBossAttack(ctx, { kind: 'catch' }), false);
});


test('a resistant boss visibly recoils without altering either credits or catch odds', () => {
  const table = isolatedTable();
  const king = target(table, 'king', 600, 290);
  king.nextAttack = Infinity;
  table.shots.push({
    seat: 0, id: 15, cost: 10, radius: 73, strength: 1.65,
    angle: -Math.PI / 2, lockId: 600, life: 1, bounces: 0,
    x: 400, y: 290,
  });
  advance(table, .016, { onlineSeats: [] }, () => .99);
  const hit = table.effects.find(effect => effect.kind === 'boss-hit');
  assert.ok(hit);
  assert.equal(hit.species, 'king');
  assert.equal(hit.seat, 0);
  assert.ok(king.flashUntil > table.time);
  assert.equal(table.seats[0].credits, STARTING_CREDITS);
  assert.equal(table.seats[0].totalWon, 0);
  assert.equal(king.caught, undefined);
  const strokes = [];
  const ctx = new Proxy({}, {
    get(_, property) { return (...args) => strokes.push(property); },
    set() { return true; },
  });
  assert.equal(drawBossHit(ctx, hit), true);
  assert.equal(drawBossHit(ctx, hit, true), true);
  assert.ok(strokes.includes('stroke'));
  for (let i=0;i<20;i++) advance(table, .016, { onlineSeats: [] }, () => .99);
  assert.equal(table.effects.some(effect => effect.kind === 'boss-hit'), false);
});
