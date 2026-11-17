import { advance, HEIGHT, newTable, pickTarget, POWERS, seedTable, STARTING_CREDITS } from '../../public/arcade/hosted/imp-inferno/furnace.mjs';

const PROTOCOL = 'imp-inferno-v1';
const WIDTH = 900;
const RESERVE_MS = 45_000;
const STEP_MS = 1000 / 30;

export async function connectImpInferno(request, env, room, allowedOrigins, rateLimit) {
  const protocol = request.headers.get('Sec-WebSocket-Protocol')?.split(',').map(item => item.trim());
  const token = protocol?.find(item => /^seat\.[a-f0-9]{32}$/.test(item));
  if (request.method !== 'GET' || request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
    return new Response('WebSocket required.', { status: 426 });
  }
  if (!allowedOrigins.has(request.headers.get('Origin'))) return new Response('Origin not allowed.', { status: 403 });
  if (!protocol?.includes(PROTOCOL) || !token) return new Response('Invalid table protocol.', { status: 400 });
  if (!env.IMP_INFERNO_ROOMS) return new Response('Online tables unavailable.', { status: 503 });
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const allowed = env.MESSAGE_RATE_LIMITER?.limit
    ? (await env.MESSAGE_RATE_LIMITER.limit({ key: 'imp-inferno:' + ip })).success
    : await rateLimit(env, request, 'imp-inferno-connect', 60, 60);
  if (!allowed) {
    return new Response('Too many connections.', { status: 429 });
  }
  return env.IMP_INFERNO_ROOMS.getByName(room).fetch(new Request('https://imp-inferno.internal/connect', {
    headers: { Upgrade: 'websocket', 'X-Seat-Token': token.slice(5) },
  }));
}

export function readImpInput(raw) {
  if (typeof raw !== 'string' || raw.length > 240) return null;
  let input;
  try { input = JSON.parse(raw); } catch { return null; }
  if (!input || !Number.isFinite(input.x) || !Number.isFinite(input.y)
    || !Number.isInteger(input.power) || !POWERS[input.power]) return null;
  const flag = key => input[key] === true;
  return {
    aim: { x: Math.min(WIDTH, Math.max(0, input.x)), y: Math.min(HEIGHT, Math.max(0, input.y)) },
    power: input.power, firing: flag('fire'), auto: flag('auto'), rapid: flag('rapid'),
    lockMode: flag('lock'), retarget: flag('target'), tap: flag('tap'), refill: flag('refill'),
  };
}

export class ImpInfernoRoom {
  constructor(ctx) {
    this.ctx = ctx;
    this.inputs = Array(4).fill(null);
    this.connections = new Map();
    this.tickCount = 0;
    this.timer = null;
    ctx.blockConcurrencyWhile(async () => {
      const saved = await ctx.storage.get('room');
      this.table = saved?.table ?? newTable(WIDTH);
      this.leases = saved?.leases ?? Array(4).fill(null);
      if (!saved) seedTable(this.table);
      for (const socket of ctx.getWebSockets()) {
        const seat = socket.deserializeAttachment()?.seat;
        if (Number.isInteger(seat)) this.connections.set(seat, socket);
      }
      this.run();
    });
  }

  checkpoint() {
    return this.ctx.storage.put('room', { table: this.table, leases: this.leases });
  }

  async fetch(request) {
    const token = request.headers.get('X-Seat-Token');
    if (!token || !/^[a-f0-9]{32}$/.test(token)) return new Response(null, { status: 400 });
    const now = Date.now();
    let seat = this.leases.findIndex(lease => lease?.token === token);
    if (seat < 0) {
      seat = this.leases.findIndex((lease, index) => !this.connections.has(index) && (!lease || lease.until <= now));
      if (seat < 0) {
        const pair = new WebSocketPair();
        pair[1].accept();
        pair[1].close(4004, 'All four seats are taken');
        return new Response(null, { status: 101, webSocket: pair[0], headers: { 'Sec-WebSocket-Protocol': PROTOCOL } });
      }
      this.clearSeatEffects(seat);
      this.table.seats[seat] = { ...newTable(WIDTH).seats[seat], name: 'P' + (seat + 1) };
    }
    const previous = this.connections.get(seat);
    this.leases[seat] = { token, until: now + RESERVE_MS };
    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1]);
    pair[1].serializeAttachment({ seat, token });
    this.connections.set(seat, pair[1]);
    this.inputs[seat] = null;
    if (previous) previous.close(4001, 'Seat opened elsewhere');
    await this.checkpoint();
    pair[1].send(JSON.stringify({ type: 'welcome', seat }));
    this.broadcast();
    this.run();
    return new Response(null, { status: 101, webSocket: pair[0], headers: { 'Sec-WebSocket-Protocol': PROTOCOL } });
  }

  clearSeatEffects(seat) {
    this.table.shots = this.table.shots.filter(shot => shot.seat !== seat);
    this.table.spins = (this.table.spins ?? []).filter(spin => spin.seat !== seat);
  }

  webSocketMessage(socket, raw) {
    const seat = socket.deserializeAttachment()?.seat;
    if (this.connections.get(seat) !== socket) return;
    const input = readImpInput(raw);
    if (!input) return;
    const previous = this.inputs[seat];
    const now = Date.now();
    if (previous && now - previous.at < 8) return;
    if (input.refill && this.table.seats[seat].credits === 0 && !this.table.seats[seat].bonus
      && !this.table.shots.some(shot => shot.seat === seat)
      && !this.table.spins?.some(spin => spin.seat === seat && !spin.paid)) this.table.seats[seat].credits = STARTING_CREDITS;
    const lockId = input.lockMode
      ? input.retarget ? pickTarget(this.table, input.aim)?.id ?? null : previous?.lockId ?? null
      : null;
    this.inputs[seat] = { ...input, lockId, tap: input.tap || previous?.tap, at: now };
  }

  async webSocketClose(socket, code, reason) {
    const seat = socket.deserializeAttachment()?.seat;
    if (this.connections.get(seat) === socket) {
      this.connections.delete(seat);
      this.inputs[seat] = null;
      if (code === 4000) {
        this.leases[seat] = null;
        this.clearSeatEffects(seat);
      } else this.leases[seat].until = Date.now() + RESERVE_MS;
      this.broadcast();
      if (!this.connections.size) {
        clearInterval(this.timer);
        this.timer = null;
        await this.ctx.storage.setAlarm(Date.now() + RESERVE_MS);
      }
      await this.checkpoint();
    }
    try { socket.close(code, reason); } catch {}
  }

  webSocketError(socket) {
    return this.webSocketClose(socket, 1011, 'Connection interrupted');
  }

  async alarm() {
    if (this.connections.size) return;
    const until = Math.max(0, ...this.leases.map(lease => lease?.until ?? 0));
    if (until > Date.now()) return this.ctx.storage.setAlarm(until);
    this.leases = Array(4).fill(null);
    this.table = newTable(WIDTH);
    seedTable(this.table);
    await this.ctx.storage.deleteAll();
  }

  run() {
    if (this.timer || !this.connections.size) return;
    this.timer = setInterval(() => {
      const now = Date.now();
      const onlineSeats = this.inputs.map(input => {
        if (!input || now - input.at > 800) return null;
        const tableHasLock = this.table.targets.some(target => target.id === input.lockId
          && target.x >= target.radius && target.x <= WIDTH - target.radius);
        const firing = (input.firing || input.tap) && (!input.lockMode || tableHasLock);
        input.tap = false;
        return { ...input, firing, lockId: tableHasLock ? input.lockId : null };
      });
      advance(this.table, STEP_MS / 1000, { onlineSeats });
      this.tickCount++;
      if (this.tickCount % 3 === 0) {
        this.broadcast();
        this.table.banner = '';
      }
      if (this.tickCount % 180 === 0) this.checkpoint().catch(() => {});
    }, STEP_MS);
  }

  broadcast() {
    if (!this.connections.size) return;
    const seats = this.leases.map((lease, index) => this.connections.has(index) ? 'connected'
      : lease?.until > Date.now() ? 'reconnecting' : 'open');
    const state = JSON.stringify({ type: 'state', table: this.table, seats });
    for (const socket of this.connections.values()) {
      try { socket.send(state); } catch {}
    }
  }
}
