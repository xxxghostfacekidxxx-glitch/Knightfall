/* Reaction Ritual: one state machine for single- and three-round tests. */
globalThis.ReactionRitual = class ReactionRitual {
  constructor(rounds = 3) {
    if (![1, 3].includes(rounds)) throw new Error('Unsupported ritual length');
    this.rounds = rounds; this.times = []; this.falseStarts = 0;
    this.phase = 'idle'; this.signalAt = null;
  }
  wait() {
    if (!['idle', 'result', 'early', 'paused'].includes(this.phase)) return false;
    if (this.times.length >= this.rounds) return false;
    this.phase = 'waiting'; this.signalAt = null; return true;
  }
  signal(now) {
    if (this.phase !== 'waiting' || !Number.isFinite(now) || now < 0) return false;
    this.phase = 'ready'; this.signalAt = now; return true;
  }
  tap(now) {
    if (this.phase === 'waiting') {
      this.falseStarts++; this.phase = 'early'; this.signalAt = null; return 'early';
    }
    if (this.phase !== 'ready' || !Number.isFinite(now) || now < this.signalAt) return 'ignored';
    this.times.push(Math.round(now - this.signalAt)); this.signalAt = null;
    this.phase = this.times.length === this.rounds ? 'done' : 'result';
    return this.phase;
  }
  interrupt() {
    if (!['waiting', 'ready'].includes(this.phase)) return false;
    this.phase = 'paused'; this.signalAt = null; return true;
  }
  get average() { return this.times.length ? Math.round(this.times.reduce((a, b) => a + b, 0) / this.times.length) : null; }
  get fastest() { return this.times.length ? Math.min(...this.times) : null; }
  get score() {
    if (this.phase !== 'done') return 0;
    return Math.max(0, (this.rounds === 3 ? 10000 : 1000) - this.average - this.falseStarts * (this.rounds === 3 ? 250 : 25));
  }
};
