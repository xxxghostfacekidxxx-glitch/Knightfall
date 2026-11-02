/* Crypt Smash: shared rules for the five consolidated tap games. */
globalThis.ChaosWhack = class ChaosWhack {
  static modes = {
    classic: {title: 'Classic', seconds: 20, interval: 850, life: 850, points: 10},
    panic: {title: 'Panic Room', seconds: 30, interval: 650, life: 650, points: 10},
    crypt: {title: 'Crypt Smash', seconds: 45, interval: 720, life: 720, points: 50, decoys: true},
    chase: {title: 'Ember Chase', seconds: 30, interval: 850, life: 850, points: 10, chase: true},
    hunt: {title: 'Exterminator', seconds: 45, interval: 650, life: 1500, points: 10, hunt: true}
  };
  constructor(mode = 'classic', random = Math.random) {
    if (!ChaosWhack.modes[mode]) throw new Error('Unknown mode');
    this.mode = mode; this.rules = ChaosWhack.modes[mode]; this.random = random;
    this.phase = 'ready'; this.paused = false; this.remaining = this.rules.seconds * 1000;
    this.score = 0; this.hits = 0; this.attempts = 0; this.escaped = 0; this.friendlyHits = 0;
    this.combo = 0; this.bestCombo = 0; this.targets = []; this.nextId = 1; this.untilSpawn = 0;
  }
  start() {
    if (this.phase !== 'ready') return false;
    this.phase = 'running'; this.spawn(); this.untilSpawn = this.rules.interval; return true;
  }
  spawn() {
    if (this.phase !== 'running') return;
    if (!this.rules.hunt) this.targets = [];
    const slot = Math.floor(this.random() * 9);
    this.targets.push({id: this.nextId++, slot, x: 12 + this.random() * 76, y: 12 + this.random() * 76,
      kind: this.rules.chase ? 'ember' : this.rules.hunt ? 'bug' : this.rules.decoys && this.random() < .2 ? 'friend' : 'glitch',
      life: this.rules.life});
  }
  advance(ms) {
    if (this.phase !== 'running' || this.paused || !Number.isFinite(ms) || ms <= 0) return;
    this.remaining = Math.max(0, this.remaining - ms);
    if (!this.remaining) { this.end(); return; }
    this.targets.forEach(t => { t.life -= ms; });
    for (const t of this.targets) if (t.life <= 0 && t.kind !== 'friend') { this.escaped++; this.combo = 0; }
    this.targets = this.targets.filter(t => t.life > 0);
    this.untilSpawn -= ms;
    if (this.untilSpawn <= 0) {
      this.spawn(); this.untilSpawn = this.rules.interval;
    }
  }
  tap(id) {
    if (this.phase !== 'running' || this.paused) return {kind: 'ignored', points: 0};
    this.attempts++;
    const i = this.targets.findIndex(t => t.id === id);
    if (i < 0) {
      this.combo = 0;
      if (this.rules.hunt) { this.remaining = Math.max(0, this.remaining - 1000); if (!this.remaining) this.end(); }
      return {kind: 'miss', points: 0};
    }
    const [t] = this.targets.splice(i, 1);
    if (t.kind === 'friend') {
      const old = this.score; this.score = Math.max(0, this.score - 25); this.combo = 0; this.friendlyHits++;
      return {kind: 'friend', points: this.score - old};
    }
    this.hits++; this.combo++; this.bestCombo = Math.max(this.bestCombo, this.combo);
    const points = this.rules.points * this.multiplier;
    this.score += points;
    if (this.rules.chase) { this.spawn(); this.untilSpawn = this.rules.interval; }
    return {kind: 'hit', points};
  }
  get multiplier() { return Math.min(4, 1 + Math.floor(this.combo / 5)); }
  get accuracy() { return this.attempts ? Math.round(100 * this.hits / this.attempts) : 100; }
  pause() { if (this.phase === 'running') this.paused = true; }
  resume() { if (this.phase === 'running') this.paused = false; }
  end() { this.phase = 'ended'; this.paused = false; this.remaining = 0; this.targets = []; }
};
