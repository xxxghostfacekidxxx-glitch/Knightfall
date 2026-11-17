import test from 'node:test';
import assert from 'node:assert/strict';
import { connectImpInferno, ImpInfernoRoom, readImpInput } from './imp-inferno-room.js';
import { advance, upcomingTide } from '../../public/arcade/hosted/imp-inferno/furnace.mjs';

test('room input clamps aim and cannot specify seat, balance, or target identity', () => {
  assert.equal(readImpInput('{"x":0,"y":0,"power":-1}'), null);
  assert.equal(readImpInput('x'.repeat(241)), null);
  const input = readImpInput('{"x":-9,"y":922,"power":2,"fire":true,"seat":3,"credits":99,"lockId":4}');
  assert.deepEqual(input.aim, { x: 0, y: 500 });
  assert.equal(input.power, 2);
  assert.equal(input.firing, true);
  assert.equal(input.credits, undefined);
  assert.equal(input.seat, undefined);
  assert.equal(input.lockId, undefined);
  assert.equal(readImpInput('{"x":0,"y":0,"power":6}').power, 6);
  assert.equal(readImpInput('{"x":0,"y":0,"power":7}'), null);
});

test('socket upgrade validates origin and forwards only the seat capability', async () => {
  let forwarded;
  const env = { IMP_INFERNO_ROOMS: { getByName: room => ({ fetch: request => {
    forwarded = [room, request];
    return new Response('upgrade');
  } }) } };
  const origin = 'https://ash-fall.com';
  const headers = {
    Origin: origin, Upgrade: 'websocket', Cookie: 'session=ignored',
    'Sec-WebSocket-Protocol': 'imp-inferno-v1, seat.' + 'a'.repeat(32),
  };
  const request = values => new Request('https://api.ash-fall.com/', { headers: { ...headers, ...values } });
  const run = input => connectImpInferno(input, env, '0123456789abcdef', new Set([origin]), async () => true);
  assert.equal((await run(request({ Origin: 'https://foreign.example' }))).status, 403);
  assert.equal((await run(request({ 'Sec-WebSocket-Protocol': 'imp-inferno-v1' }))).status, 400);
  assert.equal((await run(request({}))).status, 200);
  assert.equal(forwarded[0], '0123456789abcdef');
  assert.equal(forwarded[1].headers.get('Cookie'), null);
  assert.equal(forwarded[1].headers.get('X-Seat-Token'), 'a'.repeat(32));
});

test('four sockets get distinct seats, fifth is refused, and reconnect preserves credits', async t => {
  class Socket {
    messages = [];
    accept() {}
    serializeAttachment(data) { this.data = data; }
    deserializeAttachment() { return this.data; }
    send(message) { this.messages.push(JSON.parse(message)); }
    close(code) { this.closeCode = code; }
  }
  const pairs = [];
  t.mock.method(globalThis, 'Response', class {
    constructor(body, options) { return { body, ...options }; }
  });
  globalThis.WebSocketPair = class {
    constructor() {
      this[0] = new Socket();
      this[1] = new Socket();
      pairs.push(this);
    }
  };
  t.after(() => delete globalThis.WebSocketPair);
  const ctx = {
    storage: { get: async () => null, put: async () => {}, setAlarm: async () => {} },
    blockConcurrencyWhile: callback => { ctx.ready = callback(); },
    acceptWebSocket: () => {},
    getWebSockets: () => [],
  };
  const room = new ImpInfernoRoom(ctx);
  await ctx.ready;
  t.after(() => clearInterval(room.timer));
  const join = id => room.fetch(new Request('https://imp-inferno.internal/connect', {
    headers: { 'X-Seat-Token': id.repeat(32), 'X-Imp-Protocol': id === 'a' ? 'imp-inferno-v1' : id === 'b' ? 'imp-inferno-v2' : id === 'c' ? 'imp-inferno-v3' : 'imp-inferno-v4' },
  }));
  for (const id of 'abcd') assert.equal((await join(id)).status, 101);
  assert.deepEqual(pairs.map(pair => pair[1].messages[0].seat), [0, 1, 2, 3]);
  // Existing v1/v2 clients receive equivalent legacy silhouettes; v3 sees actual creatures.
  const openingTargets = room.table.targets;
  room.table.targets = [
    { species: 'hydra', multiplier: 60, name: 'Infernal Hydra', id: 501 },
    { species: 'firestorm', multiplier: 18, bonus: 'storm', id: 502 },
  ];
  room.broadcast();
  const messages = pairs.map(pair => pair[1].messages.at(-1).table.targets);
  assert.deepEqual(messages.map(targets => targets[0].species), ['king', 'king', 'hydra', 'hydra']);
  assert.deepEqual(messages.map(targets => targets[1].species), ['fuse', 'firestorm', 'firestorm', 'firestorm']);
  const muzzle = { kind: 'muzzle', seat: 1, x: 100, y: 50, angle: 0, power: 6, life: .2, duration: .2 };
  room.table.effects.push(muzzle);
  room.broadcast();
  for (const pair of pairs.slice(0, 2)) {
    assert.equal(pair[1].messages.at(-1).table.effects.some(effect => effect.kind === 'muzzle'), false);
  }
  for (const pair of pairs.slice(2, 4)) {
    assert.equal(pair[1].messages.at(-1).table.effects.some(effect => effect.kind === 'muzzle'), true);
  }
  const bossAttack = { kind: 'boss-attack', species: 'king', x: 100, y: 100, radius: 80, direction: 1, life: 1, duration: 1.25 };
  room.table.effects.push(bossAttack);
  room.broadcast();
  assert.deepEqual(pairs.map(pair => pair[1].messages.at(-1).table.effects.some(effect =>
    effect.kind === 'boss-attack')), [false, false, false, true]);
  room.table.effects.pop();
  room.table.effects.pop();
  room.table.targets = openingTargets;
  room.table.tideIndex = 1;
  room.table.nextTide = room.table.time + 3;
  room.broadcast();
  const forecasts = pairs.map(pair => upcomingTide(pair[1].messages.at(-1).table));
  assert.equal(forecasts[0].name, 'Crossfire');
  for (const forecast of forecasts) assert.deepEqual(forecast, forecasts[0]);
  advance(room.table, 3, { onlineSeats: [] });
  room.broadcast();
  for (const pair of pairs) {
    const { table } = pair[1].messages.at(-1);
    assert.equal(table.banner, 'Crossfire · 4 schools incoming');
    assert.deepEqual([...new Set(table.targets.filter(target => target.route === 'tide').map(target => target.direction))], [1, -1]);
  }
  await join('e');
  assert.equal(pairs[4][1].closeCode, 4004);
  room.table.seats[2].credits = 113;
  await room.webSocketClose(pairs[2][1], 1006, '');
  await join('c');
  assert.equal(pairs[5][1].messages[0].seat, 2);
  assert.equal(pairs[5][1].messages[1].table.seats[2].credits, 113);
  room.table.spins = [{ seat: 2, cost: 25 }];
  await room.webSocketClose(pairs[5][1], 4000, 'Left table');
  await join('e');
  assert.equal(pairs[6][1].messages[0].seat, 2);
  assert.equal(pairs[6][1].messages[1].table.seats[2].credits, 240);
  assert.equal(room.table.spins.length, 0);
});
