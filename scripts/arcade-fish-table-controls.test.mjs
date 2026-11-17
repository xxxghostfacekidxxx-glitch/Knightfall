import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import {
  advance, HEIGHT, newTable, pickTarget, POWERS, seatOrigin, seedTable, SPECIES, STARTING_CREDITS, upcomingTide,
} from '../public/arcade/hosted/imp-inferno/furnace.mjs';

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
