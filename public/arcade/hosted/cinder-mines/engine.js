/* Original Chaos Minesweeper rules; no DOM dependencies. */
globalThis.ChaosMines = class ChaosMines {
  constructor(level = 'easy', random = Math.random) {
    const presets = {easy: [8, 10], medium: [12, 24], hard: [16, 48]};
    if (!presets[level]) throw new Error('Unknown difficulty');
    [this.size, this.mines] = presets[level];
    this.level = level; this.random = random; this.started = false;
    this.result = null; this.flareUsed = false;
    this.cells = Array.from({length: this.size ** 2}, () => ({mine: false, n: 0, open: false, flag: false}));
  }
  neighbors(i) {
    const out = [], r = Math.floor(i / this.size), c = i % this.size;
    for (let y = -1; y <= 1; y++) for (let x = -1; x <= 1; x++) {
      if ((x || y) && r+y >= 0 && r+y < this.size && c+x >= 0 && c+x < this.size) out.push((r+y)*this.size+c+x);
    }
    return out;
  }
  plant(i) {
    const safe = new Set([i, ...this.neighbors(i)]);
    const pool = this.cells.map((_, j) => j).filter(j => !safe.has(j));
    for (let j = pool.length-1; j > 0; j--) {
      const k = Math.floor(this.random()*(j+1)); [pool[j], pool[k]] = [pool[k], pool[j]];
    }
    pool.slice(0, this.mines).forEach(j => { this.cells[j].mine = true; });
    this.cells.forEach((c, j) => { c.n = this.neighbors(j).filter(k => this.cells[k].mine).length; });
    this.started = true;
  }
  get flags() { return this.cells.filter(c => c.flag).length; }
  get cleared() { return this.cells.filter(c => c.open && !c.mine).length; }
  flag(i) {
    const c = this.cells[i];
    if (!c || this.result || c.open || (!c.flag && this.flags >= this.mines)) return false;
    c.flag = !c.flag; return true;
  }
  reveal(i) {
    const c = this.cells[i];
    if (!c || this.result || c.flag) return;
    if (c.open) {
      const near = this.neighbors(i);
      if (c.n && near.filter(j => this.cells[j].flag).length === c.n) {
        for (const j of near) if (!this.cells[j].open && !this.cells[j].flag) this.open(j);
      }
      return;
    }
    if (!this.started) this.plant(i);
    this.open(i);
  }
  open(i) {
    if (this.result) return;
    const queue = [i];
    while (queue.length) {
      const j = queue.pop(), c = this.cells[j];
      if (c.open || c.flag) continue;
      c.open = true;
      if (c.mine) { this.result = 'lost'; this.cells.forEach(x => { if (x.mine) x.open = true; }); return; }
      if (!c.n) this.neighbors(j).forEach(k => { if (!this.cells[k].mine && !this.cells[k].open) queue.push(k); });
    }
    if (this.cleared === this.cells.length-this.mines) this.result = 'won';
  }
  flare() {
    if (this.result || this.flareUsed) return false;
    const choices = this.cells.map((c, i) => i).filter(i => !this.cells[i].open && !this.cells[i].flag && (!this.started || !this.cells[i].mine));
    if (!choices.length) return false;
    const i = choices[Math.floor(this.random()*choices.length)];
    this.flareUsed = true; this.reveal(i); return true;
  }
};
