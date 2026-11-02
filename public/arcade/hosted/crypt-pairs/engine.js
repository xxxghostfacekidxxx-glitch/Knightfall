/* Original Madhouse Memory rules, independent of rendering and timers. */
globalThis.ChaosMemory = class ChaosMemory {
  constructor(pairCount = 8, random = Math.random) {
    if (![6, 8, 12].includes(pairCount)) throw new Error('Unsupported board size');
    this.pairCount = pairCount;
    const values = Array.from({length: pairCount * 2}, (_, i) => i % pairCount);
    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }
    this.cards = values.map(value => ({value, up: false, found: false}));
    this.opened = []; this.moves = 0; this.matched = 0;
    this.locked = false; this.started = false; this.done = false; this.peekUsed = false; this.peeking = false;
  }
  pick(i) {
    const c = this.cards[i];
    if (!c || this.done || this.locked || this.peeking || c.up || c.found) return 'ignored';
    this.started = true; c.up = true; this.opened.push(i);
    if (this.opened.length < 2) return 'first';
    this.moves++;
    const [a, b] = this.opened;
    if (this.cards[a].value !== this.cards[b].value) { this.locked = true; return 'miss'; }
    this.cards[a].found = this.cards[b].found = true;
    this.opened = []; this.matched++; this.done = this.matched === this.pairCount;
    return this.done ? 'won' : 'match';
  }
  resolveMismatch() {
    if (!this.locked) return false;
    this.opened.forEach(i => { this.cards[i].up = false; });
    this.opened = []; this.locked = false; return true;
  }
  peek() {
    if (this.peekUsed || this.done || this.locked || this.opened.length) return false;
    this.peekUsed = true; this.peeking = true; this.started = true; return true;
  }
  endPeek() { this.peeking = false; }
  score(seconds) {
    return Math.max(100, this.pairCount * 200 - (this.moves - this.pairCount) * 45 - Math.max(0, seconds) * 2 - (this.peekUsed ? 250 : 0));
  }
};
