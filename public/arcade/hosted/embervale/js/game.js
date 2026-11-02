// ============================================================
// EMBERVALE — game.js
// Main loop, states, room management, HUD, rendering
// ============================================================
'use strict';

const HUD_H = 48;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// scale canvas to window: integer steps when room allows (crisp pixels),
// fractional shrink so the whole game still fits on small screens
function fitCanvas() {
  const touchLayout = window.matchMedia('(pointer: coarse), (max-width: 700px)').matches;
  const availableHeight = window.innerHeight - (touchLayout ? 195 : 40);
  let scale = Math.min(window.innerWidth / 256, Math.max(95, availableHeight) / 224);
  // Preserve integer pixel scaling on desktop; fill available space on mobile.
  if (scale >= 1 && !touchLayout) scale = Math.floor(scale);
  canvas.style.width = 256 * scale + 'px';
  canvas.style.height = 224 * scale + 'px';
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

// offscreen playfield (for scroll transitions)
const pfSnap = document.createElement('canvas');
pfSnap.width = PF_W; pfSnap.height = PF_H;
const pfSnap2 = document.createElement('canvas');
pfSnap2.width = PF_W; pfSnap2.height = PF_H;

// ============================================================
// INPUT
// ============================================================
const Input = {
  keys: {}, pressed: {},
  init() {
    window.addEventListener('keydown', e => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Enter'].includes(e.key)) e.preventDefault();
      AudioSys.unlock();
      if (!this.keys[e.code]) this.pressed[e.code] = true;
      this.keys[e.code] = true;
      if (e.code === 'KeyM' && !e.repeat) {
        const m = AudioSys.toggleMute();
        G.toast(m ? 'MUTED' : 'SOUND ON');
      }
    });
    window.addEventListener('keyup', e => { this.keys[e.code] = false; });
  },
  get left() { return this.keys['ArrowLeft'] || this.keys['KeyA']; },
  get right() { return this.keys['ArrowRight'] || this.keys['KeyD']; },
  get up() { return this.keys['ArrowUp'] || this.keys['KeyW']; },
  get down() { return this.keys['ArrowDown'] || this.keys['KeyS']; },
  get attack() { return this.pressed['KeyZ'] || this.pressed['Space']; },
  get item() { return this.pressed['KeyX']; },
  get start() { return this.pressed['Enter']; },
  flush() { this.pressed = {}; }
};

// ============================================================
// GAME STATE
// ============================================================
const G = {
  state: 'title',
  map: 'overworld', sx: 2, sy: 2,
  roomTiles: [], roomDef: null, dark: false,
  player: null,
  enemies: [], pickups: [], projectiles: [], bombs: [], chests: [], npcs: [], shopItems: [],
  hp: 3, maxHp: 3, gems: 0, keys: 0,
  inv: { sword: false, emberblade: false, bow: false, lantern: false, bosskey: false, crown: false, bombs: 0, maxBombs: 0, arrows: 0 },
  equipped: null,            // 'bow' | 'bombs'
  flags: new Set(),
  visited: new Set(),
  shake: 0,
  animT: 0,
  scroll: null,
  fade: 0, fadeDir: 0, fadeCb: null,
  dialog: null,
  itemGetData: null,
  pauseCursor: 0,
  toastMsg: '', toastT: 0,
  titleT: 0, winT: 0, gameoverT: 0,
  bossDying: 0, bossDeathPos: null,
  gates: [], gatesClosed: false,
  stats: { time: 0, deaths: 0, kills: 0 },
  lowHpT: 0,
  lastPos: { map: 'overworld', sx: 2, sy: 2, px: 7, py: 7 },

  toast(msg) { this.toastMsg = msg; this.toastT = 130; },

  // ---------- persistence ----------
  save() {
    try {
      localStorage.setItem('embervale_save', JSON.stringify({
        flags: [...this.flags], inv: this.inv, hp: this.hp, maxHp: this.maxHp,
        gems: this.gems, keys: this.keys, equipped: this.equipped,
        visited: [...this.visited], stats: this.stats, lastPos: this.lastPos
      }));
    } catch (e) { /* private mode */ }
  },
  loadSave() {
    try {
      const s = JSON.parse(localStorage.getItem('embervale_save'));
      if (!s) return false;
      this.flags = new Set(s.flags); this.inv = s.inv;
      this.hp = s.hp; this.maxHp = s.maxHp; this.gems = s.gems; this.keys = s.keys;
      this.equipped = s.equipped;
      this.visited = new Set(s.visited || []);
      this.stats = s.stats || { time: 0, deaths: 0, kills: 0 };
      if (s.lastPos) this.lastPos = s.lastPos;
      return true;
    } catch (e) { return false; }
  },
  hasSave() { try { return !!localStorage.getItem('embervale_save'); } catch (e) { return false; } },
  clearSave() { try { localStorage.removeItem('embervale_save'); } catch (e) { } },

  // ---------- flag helpers ----------
  doorFlag(side) {
    return `dopen:${this.map}:${this.sx},${this.sy}:${side}`;
  },
  neighborOf(side) {
    const d = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] }[side];
    return [this.sx + d[0], this.sy + d[1]];
  },
  openDoorPair(side) {
    const opp = { n: 's', s: 'n', w: 'e', e: 'w' }[side];
    const [nx, ny] = this.neighborOf(side);
    this.flags.add(this.doorFlag(side));
    this.flags.add(`dopen:${this.map}:${nx},${ny}:${opp}`);
  },

  // ---------- room loading ----------
  loadRoom(map, sx, sy, px, py) {
    this.map = map; this.sx = sx; this.sy = sy;
    const def = getScreenDef(map, sx, sy);
    this.roomDef = def;
    this.dark = !!def.dark;
    this.visited.add(map + ':' + sx + ',' + sy);

    // tiles
    this.roomTiles = def.tiles.map(row => [...row].map(ch => CHAR_TILE[ch]));
    // apply opened doors / cracks
    const sides = { n: [], s: [], w: [], e: [] };
    for (let ty = 0; ty < 11; ty++) {
      for (let tx = 0; tx < 16; tx++) {
        const id = this.roomTiles[ty][tx];
        if (id === T.DOOR_LOCK || id === T.DOOR_BOSS || id === T.DCRACK) {
          const side = ty === 0 ? 'n' : ty === 10 ? 's' : tx === 0 ? 'w' : 'e';
          sides[side].push([tx, ty, id]);
        }
        if (id === T.CRACK && this.flags.has(`crack:${map}:${sx},${sy}:${tx},${ty}`)) {
          this.roomTiles[ty][tx] = T.CAVE;
        }
      }
    }
    for (const side of ['n', 's', 'w', 'e']) {
      for (const [tx, ty, id] of sides[side]) {
        const flagKey = id === T.DCRACK ? `dcrk:${map}:${sx},${sy}:${side}` : this.doorFlag(side);
        if (this.flags.has(flagKey)) this.roomTiles[ty][tx] = T.DOOR_OPEN;
      }
    }

    // entities
    this.enemies = []; this.pickups = []; this.projectiles = []; this.bombs = [];
    this.chests = []; this.npcs = []; this.shopItems = [];
    Particles.clear();

    const cleared = this.flags.has(`clear:${map}:${sx},${sy}`);
    const hasGates = def.tiles.some(r => r.includes('G'));
    if (def.enemies && !(cleared && (hasGates || (def.chests || []).some(c => c.requiresClear)))) {
      for (const [type, tx, ty] of def.enemies) {
        if (type === 'boss' && this.flags.has('boss_dead')) continue;
        if (type === 'bigslime' && this.flags.has('clear:dungeon:2,1')) continue;
        const e = makeEnemy(type, tx, ty);
        if (e) this.enemies.push(e);
      }
    }
    if (def.chests) for (const c of def.chests) this.chests.push(new Chest(c));
    if (def.npcs) for (const n of def.npcs) this.npcs.push(new NPC(n));
    if (def.shopItems) for (const s of def.shopItems) this.shopItems.push(new ShopItem(s));
    if (def.pickups) for (const p of def.pickups) {
      if (!this.flags.has(p.flag)) {
        const pk = new Pickup(p.tx * TILE + 4, p.ty * TILE + 4, p.item, p.n || 1, p.flag);
        this.pickups.push(pk);
      }
    }

    // shutter gates
    this.gates = [];
    this.gatesClosed = false;
    for (let ty = 0; ty < 11; ty++)
      for (let tx = 0; tx < 16; tx++)
        if (def.tiles[ty][tx] === 'G') {
          this.gates.push([tx, ty]);
          // start open
          this.roomTiles[ty][tx] = T.DOOR_OPEN;
        }
    if (this.gates.length && (cleared || this.enemies.length === 0)) {
      // stays open
      this.gates = [];
    }

    // player placement
    if (px !== undefined) {
      this.player.x = px * TILE; this.player.y = py * TILE;
      this.lastPos = { map, sx, sy, px, py };
    }
    this.player.kx = 0; this.player.ky = 0;

    // music
    const want = mapMusic(map, def);
    const boss = this.enemies.find(e => e.isBoss);
    if (boss) AudioSys.playSong('boss');
    else if (AudioSys.currentSong() !== want) AudioSys.playSong(want);

    // location toast
    if (def.name) this.toast(def.name);
    this.save();
  },

  breakCrack(tx, ty) {
    const id = this.roomTiles[ty][tx];
    if (id === T.CRACK) {
      this.roomTiles[ty][tx] = T.CAVE;
      this.flags.add(`crack:${this.map}:${this.sx},${this.sy}:${tx},${ty}`);
      AudioSys.sfx('secret');
    } else if (id === T.DCRACK) {
      const side = ty === 0 ? 'n' : ty === 10 ? 's' : tx === 0 ? 'w' : 'e';
      // open both tiles on this side + neighbor's matching side
      for (let j = 0; j < 11; j++)
        for (let i = 0; i < 16; i++)
          if (this.roomTiles[j][i] === T.DCRACK) {
            const s2 = j === 0 ? 'n' : j === 10 ? 's' : i === 0 ? 'w' : 'e';
            if (s2 === side) this.roomTiles[j][i] = T.DOOR_OPEN;
          }
      const opp = { n: 's', s: 'n', w: 'e', e: 'w' }[side];
      const [nx, ny] = this.neighborOf(side);
      this.flags.add(`dcrk:${this.map}:${this.sx},${this.sy}:${side}`);
      this.flags.add(`dcrk:${this.map}:${nx},${ny}:${opp}`);
      AudioSys.sfx('secret');
    }
    Particles.spawn(tx * 16 + 8, ty * 16 + 8, 14, { color: ['#9a8a78', '#6e6254', '#52483c'], speed: 2, life: 24 });
  },

  // ---------- dialog ----------
  openDialog(text, cb) {
    const lines = wrapText(text);
    this.dialog = {
      lines, shown: 0, done: false, cb: cb || null,
      total: lines.reduce((n, l) => n + l.length, 0)
    };
    this.state = 'dialog';
  },

  // ---------- item get ----------
  itemGet(item, n = 1) {
    const apply = () => {
      switch (item) {
        case 'sword': this.inv.sword = true; break;
        case 'emberblade': this.inv.sword = true; this.inv.emberblade = true; break;
        case 'bow': this.inv.bow = true; this.inv.arrows = Math.min(30, this.inv.arrows + 10); this.equipped = 'bow'; break;
        case 'lantern': this.inv.lantern = true; break;
        case 'bosskey': this.inv.bosskey = true; break;
        case 'key': this.keys++; break;
        case 'heartcont': this.maxHp = Math.min(8, this.maxHp + 1); this.hp = this.maxHp; break;
        case 'gems': this.gems = Math.min(999, this.gems + n); break;
        case 'bombs': this.inv.maxBombs = Math.max(this.inv.maxBombs, 8); this.inv.bombs = Math.min(this.inv.maxBombs, this.inv.bombs + n); if (!this.equipped || !this.inv.bow) this.equipped = 'bombs'; break;
      }
      this.save();
    };
    const textKey = 'get_' + item;
    const big = ['sword', 'emberblade', 'bow', 'lantern', 'bosskey', 'heartcont'].includes(item);
    const sprKey = {
      sword: 'it_sword', emberblade: 'it_sword', bow: 'it_bow', lantern: 'it_lantern', bosskey: 'it_bosskey',
      heartcont: 'it_heartcont', key: 'key', gems: 'gem_big', bombs: 'bomb_pickup', crown: 'it_crown'
    }[item];
    this.itemGetData = { item, spr: sprKey, t: 0, textKey, applied: false, apply, big };
    this.state = 'itemget';
    const songWas = mapMusic(this.map, this.roomDef);
    AudioSys.playSong(big ? 'bigitem' : 'item', () => {
      const bossAlive = this.enemies.find(e => e.isBoss && !e.dead);
      AudioSys.playSong(bossAlive ? 'boss' : songWas);
    });
  },

  getCrown() {
    this.inv.crown = true;
    this.state = 'win';
    this.winT = 0;
    AudioSys.stopMusic();
    setTimeout(() => AudioSys.playSong('victory', () => AudioSys.playSong('title')), 600);
    this.save();
  },

  die() {
    this.hp = 0;
    this.state = 'gameover';
    this.gameoverT = 0;
    this.stats.deaths++;
    AudioSys.stopMusic();
    AudioSys.playSong('gameover');
  },

  newGame() {
    this.flags = new Set();
    this.visited = new Set();
    this.hp = 3; this.maxHp = 3; this.gems = 0; this.keys = 0;
    this.inv = { sword: false, emberblade: false, bow: false, lantern: false, bosskey: false, crown: false, bombs: 0, maxBombs: 0, arrows: 0 };
    this.equipped = null;
    this.stats = { time: 0, deaths: 0, kills: 0 };
    this.player = new Player();
    this.clearSave();
    this.loadRoom('overworld', 2, 2, 7, 7);
    this.state = 'play';
    this.openDialog("EMBERVALE WITHERS... THE ELDER OF THE WESTERN HOLLOW CALLS FOR YOU, RUA.");
  },

  continueGame() {
    if (!this.loadSave()) { this.newGame(); return; }
    this.player = new Player();
    // resume where the player last was; fall back to the meadow if the
    // saved spot is somehow blocked
    const lp = this.lastPos;
    this.loadRoom(lp.map, lp.sx, lp.sy, lp.px, lp.py);
    const p = this.player;
    if (rectSolid(p.x + p.hx, p.y + p.hy, p.hw, p.hh)) {
      this.loadRoom('overworld', 2, 2, 7, 7);
    }
    this.state = 'play';
  },

  respawn() {
    this.hp = this.maxHp;
    this.player = new Player();
    this.loadRoom('overworld', 2, 2, 7, 7);
    this.state = 'play';
  }
};

// ============================================================
// UPDATE — PLAY
// ============================================================
function updatePlay() {
  G.stats.time++;
  G.animT++;
  const p = G.player;

  p.update(Input);

  // attack
  if (Input.attack) {
    // try interactions first: NPC / sign / door in facing dir
    if (!tryInteract()) p.startAttack();
  }
  if (Input.item) useItem();
  if (Input.start) { G.state = 'pause'; G.pauseCursor = 0; AudioSys.sfx('cursor'); return; }

  // sword collisions
  const hb = p.swordHitbox();
  if (hb) {
    for (const e of G.enemies) {
      if (e.dead) continue;
      if (overlap(hb.x, hb.y, hb.w, hb.h, e.x + e.hx, e.y + e.hy, e.hw, e.hh)) {
        if (e instanceof Boss) e.hurt(G.inv.emberblade ? 2 : 1, p.cx, p.cy, 'sword');
        else { if (e.hurt(G.inv.emberblade ? 2 : 1, p.cx, p.cy)) G.stats.kills++; }
      }
    }
    // cut bushes
    for (const [dx, dy] of [[hb.x + 2, hb.y + 2], [hb.x + hb.w - 2, hb.y + 2], [hb.x + 2, hb.y + hb.h - 2], [hb.x + hb.w - 2, hb.y + hb.h - 2], [hb.x + hb.w / 2, hb.y + hb.h / 2]]) {
      const tx = Math.floor(dx / 16), ty = Math.floor(dy / 16);
      if (tx >= 0 && ty >= 0 && tx < 16 && ty < 11 && G.roomTiles[ty][tx] === T.BUSH) {
        G.roomTiles[ty][tx] = T.GRASS;
        leafBurst(tx * 16 + 8, ty * 16 + 8);
        AudioSys.sfx('cut');
        if (Math.random() < 0.4) spawnDrop(tx * 16 + 8, ty * 16 + 8);
      }
    }
  }

  // entities
  for (const e of G.enemies) if (!e.dead) e.update();
  const hadEnemies = G.enemies.length > 0;
  G.enemies = G.enemies.filter(e => !e.dead || e.isBoss && G.bossDying > 0);
  for (const pr of G.projectiles) pr.update();
  G.projectiles = G.projectiles.filter(x => !x.dead);
  for (const b of G.bombs) b.update();
  G.bombs = G.bombs.filter(x => !x.dead);
  for (const pk of G.pickups) pk.update();
  G.pickups = G.pickups.filter(x => !x.dead);
  for (const c of G.chests) c.update();
  for (const n of G.npcs) n.update();
  for (const s of G.shopItems) s.update();
  G.shopItems = G.shopItems.filter(x => !x.dead);
  Particles.update();

  // gates
  updateGates(hadEnemies);

  // boss death cinematic
  if (G.bossDying > 0) {
    G.bossDying--;
    if (G.bossDying % 14 === 0) {
      const [bx, by] = G.bossDeathPos;
      Particles.spawn(bx + (Math.random() - 0.5) * 30, by + (Math.random() - 0.5) * 24, 10,
        { color: ['#8a4ad8', '#f2cf4a', '#fff', '#d83838'], speed: 2.2, life: 26, size: 3 });
      AudioSys.sfx('boom');
      G.shake = 6;
    }
    if (G.bossDying === 0) {
      G.flags.add('boss_dead');
      G.flags.add('clear:dungeon:1,0');
      G.enemies = G.enemies.filter(e => !e.isBoss);
      G.pickups.push(new Pickup(G.bossDeathPos[0] - 8, G.bossDeathPos[1] - 8, 'crown', 1, 'crown_drop'));
      AudioSys.sfx('secret');
    }
  }

  // low hp beep
  if (G.hp > 0 && G.hp <= 1) {
    G.lowHpT++;
    if (G.lowHpT % 60 === 0) AudioSys.sfx('lowHp');
  }

  // warps (stand on warp tile)
  const wtx = Math.floor(p.cx / 16), wty = Math.floor((p.y + p.hy + p.hh - 2) / 16);
  const warp = (G.roomDef.warps || []).find(w => w.tx === wtx && w.ty === wty);
  if (warp) {
    const id = G.roomTiles[wty][wtx];
    if (id === T.CAVE || id === T.HDOOR || id === T.STAIRS || id === T.RUG || id === T.WWALL || id === T.DFLOOR || id === T.WFLOOR) {
      AudioSys.sfx('stairs');
      startFade(() => {
        if (MAPS[warp.map]) G.loadRoom(warp.map, warp.sx, warp.sy, warp.px, warp.py);
        else G.loadRoom(warp.map, 0, 0, warp.px, warp.py);
        G.player.facing = warp.map === 'overworld' ? 'd' : 'u';
        if (G.map !== 'overworld') G.player.facing = 'd';
      });
      return;
    }
  }
  // interior bottom-exit rug (walk onto bottom row)
  // (handled via warp tiles at row 10)

  // screen edge transitions
  if (MAPS[G.map]) {
    const M = MAPS[G.map];
    let dir = null;
    if (p.x + p.hx < 1 && Input.left) dir = 'w';
    else if (p.x + p.hx + p.hw > PF_W - 1 && Input.right) dir = 'e';
    else if (p.y + p.hy < 1 && Input.up) dir = 'n';
    else if (p.y + p.hy + p.hh > PF_H - 1 && Input.down) dir = 's';
    if (dir) {
      const [nx, ny] = G.neighborOf(dir);
      if (nx >= 0 && ny >= 0 && nx < M.w && ny < M.h && getScreenDef(G.map, nx, ny)) {
        startScroll(dir, nx, ny);
        return;
      } else {
        // clamp at world edge
        clampRoom(p);
      }
    }
  } else {
    clampRoom(p);
  }

  if (G.toastT > 0) G.toastT--;
  if (G.shake > 0) G.shake--;
}

function updateGates(hadEnemies) {
  if (!G.gates.length) return;
  const alive = G.enemies.filter(e => !e.dead).length > 0;
  const p = G.player;
  if (!G.gatesClosed && alive) {
    // close once player clear of all gate tiles
    const clear = G.gates.every(([tx, ty]) =>
      Math.hypot(p.cx - (tx * 16 + 8), p.cy - (ty * 16 + 8)) > 22);
    if (clear) {
      for (const [tx, ty] of G.gates) G.roomTiles[ty][tx] = T.DOOR_SHUT;
      G.gatesClosed = true;
      AudioSys.sfx('shutter');
      G.shake = 4;
    }
  } else if (G.gatesClosed && !alive && G.bossDying <= 0) {
    for (const [tx, ty] of G.gates) G.roomTiles[ty][tx] = T.DOOR_OPEN;
    G.gatesClosed = false;
    G.gates = [];
    G.flags.add(`clear:${G.map}:${G.sx},${G.sy}`);
    AudioSys.sfx('secret');
    G.save();
  } else if (!alive && !G.gatesClosed) {
    G.gates = [];
    G.flags.add(`clear:${G.map}:${G.sx},${G.sy}`);
    G.save();
  }
}

// interact with NPC / sign / locked door in front of player
function tryInteract() {
  const p = G.player;
  const v = DIR_VEC[p.facing];
  const fx = p.cx + v[0] * 14, fy = p.cy + v[1] * 14;
  // NPC
  for (const n of G.npcs) {
    if (Math.hypot(n.cx - p.cx, n.cy - p.cy) < 22) {
      npcTalk(n);
      return true;
    }
  }
  // sign
  const tx = Math.floor(fx / 16), ty = Math.floor(fy / 16);
  if (tx >= 0 && ty >= 0 && tx < 16 && ty < 11) {
    const id = G.roomTiles[ty][tx];
    if (id === T.SIGN) {
      const s = (G.roomDef.signs || []).find(s => s.tx === tx && s.ty === ty);
      G.openDialog(s ? s.text : 'THE WRITING HAS FADED.');
      return true;
    }
  }
  return false;
}

function npcTalk(n) {
  const d = n.def.dialog;
  AudioSys.sfx('cursor');
  if (d === 'elder') {
    if (!G.inv.sword) {
      G.openDialog(DIALOG.elder_pre, () => {
        G.openDialog(DIALOG.elder_sword, () => G.itemGet('sword'));
      });
    } else G.openDialog(DIALOG.elder_post);
  } else if (d === 'granny') {
    G._grannyAlt = !G._grannyAlt;
    G.openDialog(G._grannyAlt ? DIALOG.granny1 : DIALOG.granny2);
  } else if (d === 'fairy') {
    G.hp = G.maxHp;
    AudioSys.sfx('fairy');
    Particles.spawn(G.player.cx, G.player.cy, 14, { color: ['#5ad8e8', '#fff', '#f47070'], speed: 1.5, life: 26 });
    G.openDialog(DIALOG.fairy);
  } else {
    G.openDialog(DIALOG[d] || '...');
  }
}

// try opening locked doors by walking into them
function checkDoorPush() {
  const p = G.player;
  if (!(Input.left || Input.right || Input.up || Input.down)) return;
  const v = DIR_VEC[p.facing];
  const fx = p.cx + v[0] * 10, fy = p.cy + v[1] * 10;
  const tx = Math.floor(fx / 16), ty = Math.floor(fy / 16);
  if (tx < 0 || ty < 0 || tx > 15 || ty > 10) return;
  const id = G.roomTiles[ty][tx];
  if (id === T.DOOR_LOCK) {
    if (G.keys > 0) {
      G.keys--;
      openDoorTiles(tx, ty, T.DOOR_LOCK);
      AudioSys.sfx('door');
    } else if (!G._lockToastCd || G.stats.time - G._lockToastCd > 90) {
      G.toast('LOCKED. A SMALL KEY WOULD FIT.');
      G._lockToastCd = G.stats.time;
    }
  } else if (id === T.DOOR_BOSS) {
    if (G.inv.bosskey) {
      openDoorTiles(tx, ty, T.DOOR_BOSS);
      AudioSys.sfx('door');
      AudioSys.sfx('bossRoar');
    } else if (!G._lockToastCd || G.stats.time - G._lockToastCd > 90) {
      G.toast('SEALED BY GLOOM. A DARK KEY TURNS IT.');
      G._lockToastCd = G.stats.time;
    }
  }
}

function openDoorTiles(tx, ty, doorType) {
  const side = ty === 0 ? 'n' : ty === 10 ? 's' : tx === 0 ? 'w' : 'e';
  for (let j = 0; j < 11; j++)
    for (let i = 0; i < 16; i++)
      if (G.roomTiles[j][i] === doorType) {
        const s2 = j === 0 ? 'n' : j === 10 ? 's' : i === 0 ? 'w' : 'e';
        if (s2 === side) G.roomTiles[j][i] = T.DOOR_OPEN;
      }
  G.openDoorPair(side);
  G.save();
}

function useItem() {
  const p = G.player;
  if (G.equipped === 'bow' && G.inv.bow) {
    if (G.inv.arrows > 0) {
      G.inv.arrows--;
      const v = DIR_VEC[p.facing];
      G.projectiles.push(new Arrow(p.cx - 4 + v[0] * 6, p.cy - 4 + v[1] * 6, v[0] * 2.6, v[1] * 2.6));
      AudioSys.sfx('arrow');
    } else { AudioSys.sfx('denied'); G.toast('OUT OF ARROWS!'); }
  } else if (G.equipped === 'bombs' && G.inv.maxBombs > 0) {
    if (G.inv.bombs > 0) {
      G.inv.bombs--;
      const v = DIR_VEC[p.facing];
      G.bombs.push(new Bomb(p.cx - 4 + v[0] * 14, p.cy - 4 + v[1] * 14));
      AudioSys.sfx('bombSet');
    } else { AudioSys.sfx('denied'); G.toast('OUT OF BOMBS!'); }
  }
}

// ============================================================
// TRANSITIONS
// ============================================================
function startFade(cb) {
  G.state = 'fade';
  G.fade = 0; G.fadeDir = 1; G.fadeCb = cb;
}
function updateFade() {
  G.fade += G.fadeDir * 0.07;
  if (G.fadeDir > 0 && G.fade >= 1) {
    G.fade = 1;
    if (G.fadeCb) { G.fadeCb(); G.fadeCb = null; }
    G.fadeDir = -1;
  } else if (G.fadeDir < 0 && G.fade <= 0) {
    G.fade = 0;
    G.state = 'play';
  }
}

function startScroll(dir, nx, ny) {
  // snapshot old room
  const sctx = pfSnap.getContext('2d');
  renderPlayfield(sctx);
  const p = G.player;
  const oldPP = { x: p.x, y: p.y };
  G.loadRoom(G.map, nx, ny);
  // place player at opposite edge
  if (dir === 'w') p.x = PF_W - 17;
  if (dir === 'e') p.x = 1 - p.hx + 0;
  if (dir === 'n') p.y = PF_H - 17;
  if (dir === 's') p.y = 1 - p.hy;
  if (dir === 'w' || dir === 'e') p.y = Math.max(0, Math.min(PF_H - 16, oldPP.y));
  else p.x = Math.max(0, Math.min(PF_W - 16, oldPP.x));
  // snapshot new room
  const sctx2 = pfSnap2.getContext('2d');
  renderPlayfield(sctx2, true);
  G.scroll = { dir, t: 0, dur: dir === 'w' || dir === 'e' ? 30 : 24 };
  G.state = 'scroll';
}
function updateScroll() {
  const s = G.scroll;
  s.t++;
  if (s.t >= s.dur) {
    G.scroll = null;
    G.state = 'play';
    // remember where we entered this screen so Continue resumes here
    const p = G.player;
    G.lastPos = {
      map: G.map, sx: G.sx, sy: G.sy,
      px: Math.max(0, Math.min(15, Math.floor(p.cx / TILE))),
      py: Math.max(0, Math.min(10, Math.floor(p.cy / TILE)))
    };
    G.save();
  }
}

// ============================================================
// RENDER
// ============================================================
function renderPlayfield(c, skipPlayer = false) {
  // tiles
  const frame = (G.animT / 30 | 0) % 2;
  for (let ty = 0; ty < 11; ty++)
    for (let tx = 0; tx < 16; tx++)
      TileArt.drawTile(c, G.roomTiles[ty][tx], tx * 16, ty * 16, frame);
  // entities
  for (const ch of G.chests) ch.draw(c);
  for (const s of G.shopItems) s.draw(c);
  for (const pk of G.pickups) pk.draw(c);
  for (const n of G.npcs) n.draw(c);
  for (const b of G.bombs) if (!b.exploded) b.draw(c);
  for (const e of G.enemies) if (!e.dead) e.draw(c);
  G.player.draw(c);
  for (const b of G.bombs) if (b.exploded) b.draw(c);
  for (const pr of G.projectiles) pr.draw(c);
  Particles.draw(c);
  // darkness
  if (G.dark) renderDarkness(c);
}

const darkCv = document.createElement('canvas');
darkCv.width = PF_W; darkCv.height = PF_H;
function renderDarkness(c) {
  const d = darkCv.getContext('2d');
  d.clearRect(0, 0, PF_W, PF_H);
  d.fillStyle = 'rgba(4,5,12,0.94)';
  d.fillRect(0, 0, PF_W, PF_H);
  d.globalCompositeOperation = 'destination-out';
  const lights = [[G.player.cx, G.player.cy, G.inv.lantern ? 64 : 34]];
  // torches glow
  for (let ty = 0; ty < 11; ty++)
    for (let tx = 0; tx < 16; tx++)
      if (G.roomTiles[ty][tx] === T.TORCH) lights.push([tx * 16 + 8, ty * 16 + 8, 26]);
  for (const b of G.bombs) if (b.exploded) lights.push([b.x + 4, b.y + 4, 60]);
  for (const [lx, ly, r0] of lights) {
    const r = r0 + Math.sin(G.animT / 7) * 2;
    const g = d.createRadialGradient(lx, ly, r * 0.25, lx, ly, r);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(0.7, 'rgba(0,0,0,0.85)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    d.fillStyle = g;
    d.beginPath(); d.arc(lx, ly, r, 0, 7); d.fill();
  }
  d.globalCompositeOperation = 'source-over';
  c.drawImage(darkCv, 0, 0);
}

function renderHUD() {
  ctx.fillStyle = '#10121a';
  ctx.fillRect(0, 0, 256, HUD_H);
  ctx.fillStyle = '#2a3040';
  ctx.fillRect(0, HUD_H - 2, 256, 1);

  // hearts
  FONT5.draw(ctx, 'LIFE', 8, 4, '#f47070');
  for (let i = 0; i < G.maxHp; i++) {
    const hx = 8 + (i % 4) * 9, hy = 13 + Math.floor(i / 4) * 9;
    const fill = G.hp - i;
    drawHeart(ctx, hx, hy, fill >= 1 ? 'full' : fill >= 0.5 ? 'half' : 'empty');
  }

  // counters
  ctx.drawImage(SPR.gem, 52, 12);
  FONT5.draw(ctx, String(G.gems).padStart(3, '0'), 62, 13, '#fff');
  ctx.drawImage(SPR.key, 52, 22);
  FONT5.draw(ctx, 'X' + G.keys, 62, 23, '#fff');
  if (G.inv.maxBombs > 0) {
    ctx.drawImage(SPR.bomb_pickup, 52, 32);
    FONT5.draw(ctx, 'X' + G.inv.bombs, 62, 33, '#fff');
  }
  if (G.inv.bow) {
    ctx.drawImage(SPR.arrow_pickup, 80, 32);
    FONT5.draw(ctx, 'X' + G.inv.arrows, 89, 33, '#fff');
  }
  if (G.inv.bosskey) ctx.drawImage(SPR.it_bosskey, 162, 14);

  // weapon boxes
  drawSlot(ctx, 108, 8, 'Z', G.inv.sword ? 'it_sword' : null);
  if (G.inv.emberblade) FONT.draw(ctx, 'FIRE', 110, 35, '#ff924a');
  const itemSpr = G.equipped === 'bow' ? 'it_bow' : G.equipped === 'bombs' ? 'bomb_pickup' : null;
  drawSlot(ctx, 134, 8, 'X', itemSpr);

  // minimap
  renderMinimap();

  // crown indicator
  if (G.inv.crown) ctx.drawImage(SPR.it_crown, 86, 2);
}

function drawSlot(c, x, y, label, sprKey) {
  c.fillStyle = '#2a3040';
  c.fillRect(x, y, 22, 26);
  c.fillStyle = '#10121a';
  c.fillRect(x + 1, y + 1, 20, 24);
  c.strokeStyle = '#3e4a66';
  if (sprKey) {
    const s = SPR[sprKey];
    c.drawImage(s, x + 11 - s.width / 2, y + 13 - s.height / 2);
  }
  FONT.draw(c, label, x + 9, y + 27 - 7, '#8a96b0');
}

function drawHeart(c, x, y, kind) {
  c.fillStyle = kind === 'empty' ? '#3a2030' : '#d83838';
  // 7x6 heart
  if (kind === 'empty') {
    heartShape(c, x, y, '#3a2030');
  } else if (kind === 'half') {
    heartShape(c, x, y, '#3a2030');
    c.save();
    c.beginPath(); c.rect(x, y, 4, 8); c.clip();
    heartShape(c, x, y, '#d83838');
    c.restore();
  } else {
    heartShape(c, x, y, '#d83838');
    c.fillStyle = '#f47070';
    c.fillRect(x + 1, y + 1, 2, 1);
  }
}
function heartShape(c, x, y, col) {
  c.fillStyle = col;
  c.fillRect(x + 1, y, 2, 1); c.fillRect(x + 4, y, 2, 1);
  c.fillRect(x, y + 1, 7, 2);
  c.fillRect(x + 1, y + 3, 5, 1);
  c.fillRect(x + 2, y + 4, 3, 1);
  c.fillRect(x + 3, y + 5, 1, 1);
}

function renderMinimap() {
  const dungeonMap = G.map === 'dungeon' || G.map === 'emberkeep';
  const mapName = MAPS[G.map] ? G.map : 'overworld';
  const M = MAPS[mapName];
  const cw = dungeonMap ? 8 : 6, chh = dungeonMap ? 7 : 6;
  const ox = 256 - M.w * cw - 8, oy = 10;
  const mapLabel = G.map === 'emberkeep' ? 'CINDER KEEP' : G.map === 'dungeon' ? 'RUINS' : 'EMBERVALE';
  FONT.draw(ctx, mapLabel, ox + (M.w * cw) / 2 - FONT.width(mapLabel) / 2, 3, '#8a96b0');
  for (let j = 0; j < M.h; j++) {
    for (let i = 0; i < M.w; i++) {
      if (!getScreenDef(mapName, i, j)) continue;
      const vis = G.visited.has(mapName + ':' + i + ',' + j);
      ctx.fillStyle = vis ? '#3e4a66' : '#1c2230';
      ctx.fillRect(ox + i * cw, oy + j * chh, cw - 1, chh - 1);
    }
  }
  if (G.map === mapName || (!MAPS[G.map] && mapName === 'overworld')) {
    // blink player position (interiors show overworld pos)
    let px = G.sx, py = G.sy;
    if (!MAPS[G.map]) { px = 1; py = 2; }
    if ((G.animT >> 4) % 2 === 0) {
      ctx.fillStyle = '#f2cf4a';
      ctx.fillRect(ox + px * cw + 2, oy + py * chh + 1, cw - 5, chh - 3);
    }
  }
}

// wrap text to fit the dialog box; '\n' forces a hard break
const DIALOG_TEXT_W = 224;
function wrapText(text) {
  const out = [];
  for (const para of String(text).split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      const t = line ? line + ' ' + word : word;
      if (line && FONT5.width(t) > DIALOG_TEXT_W) { out.push(line); line = word; }
      else line = t;
    }
    out.push(line);
  }
  return out;
}

// shared dialog/item text box: dark panel, roomy padding, 5x7 font
function drawTextBox(lines, shownChars, borderColor) {
  const bh = 13 + lines.length * 9;
  const by = 224 - bh - 6;
  ctx.fillStyle = 'rgba(8,10,18,0.95)';
  ctx.fillRect(6, by, 244, bh);
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(6.5, by + 0.5, 243, bh - 1);
  let shown = 0;
  for (let li = 0; li < lines.length; li++) {
    if (shownChars !== null && shown >= shownChars) break;
    const line = shownChars === null ? lines[li]
      : lines[li].slice(0, Math.max(0, shownChars - shown));
    FONT5.draw(ctx, line, 14, by + 7 + li * 9, '#f4f4f0');
    shown += lines[li].length;
  }
  return { by, bh };
}

function renderDialogBox() {
  const d = G.dialog;
  if (!d) return;
  const { by, bh } = drawTextBox(d.lines, d.shown, '#5a6a8a');
  if (d.done && (G.animT >> 4) % 2 === 0) {
    FONT5.draw(ctx, '>', 238, by + bh - 10, '#f2cf4a');
  }
}

function renderToast() {
  if (G.toastT <= 0 || G.state === 'dialog' || G.state === 'itemget') return;
  const a = Math.min(1, G.toastT / 30);
  ctx.globalAlpha = a;
  const w = FONT5.width(G.toastMsg) + 12;
  ctx.fillStyle = 'rgba(8,10,18,0.85)';
  ctx.fillRect(128 - w / 2, 202, w, 13);
  FONT5.draw(ctx, G.toastMsg, 128 - FONT5.width(G.toastMsg) / 2 + 1, 205, '#f2cf4a');
  ctx.globalAlpha = 1;
}

// ============================================================
// TITLE / PAUSE / ITEMGET / GAMEOVER / WIN
// ============================================================
function updateTitle() {
  G.titleT++;
  if (G.titleT === 2) AudioSys.playSong('title');
  if (G.hasSave()) {
    if (Input.pressed['KeyZ'] || Input.start) { G.continueGame(); return; }
    if (Input.pressed['KeyX']) G.newGame();
  } else if (Input.start || Input.pressed['KeyX'] || Input.pressed['KeyZ']) {
    G.newGame();
  }
}

function renderTitle() {
  // sky gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 224);
  grad.addColorStop(0, '#1a1f33');
  grad.addColorStop(0.55, '#33304f');
  grad.addColorStop(0.75, '#6e4a63');
  grad.addColorStop(1, '#2a4434');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 224);
  // stars
  const r = makeRng(7);
  for (let i = 0; i < 40; i++) {
    const x = r() * 256, y = r() * 120;
    const tw = Math.sin(G.titleT / 20 + i * 1.7) * 0.5 + 0.5;
    ctx.globalAlpha = 0.25 + tw * 0.5;
    ctx.fillStyle = '#f4f4f0';
    ctx.fillRect(x, y, 1, 1);
  }
  ctx.globalAlpha = 1;
  // ground
  ctx.fillStyle = '#21381f';
  ctx.fillRect(0, 184, 256, 40);
  for (let i = 0; i < 32; i++) {
    const x = (i * 8 + 3);
    ctx.fillStyle = i % 2 ? '#2a4527' : '#1c3019';
    ctx.fillRect(x, 182 + Math.sin(i * 2.4) * 2, 2, 4);
  }
  // fox on hill
  ctx.drawImage(SPR.fox_r0, 60, 166);
  // floating embers
  for (let i = 0; i < 12; i++) {
    const t = (G.titleT + i * 67) % 260;
    const x = (i * 47 + Math.sin((G.titleT + i * 40) / 35) * 14 + 256) % 256;
    const y = 200 - t * 0.6;
    if (y > 0 && y < 224) {
      ctx.globalAlpha = Math.max(0, 1 - t / 240) * 0.8;
      ctx.fillStyle = i % 3 === 0 ? '#f2cf4a' : '#e8843c';
      ctx.fillRect(x, y, i % 2 + 1, i % 2 + 1);
    }
  }
  ctx.globalAlpha = 1;

  // LOGO — big scaled bitmap text
  drawBigText('EMBERVALE', 128, 52, 3, '#f2cf4a', '#8c5a1f');
  drawBigText('A FOX TALE', 128, 86, 1, '#cdd4e0', null);
  // crown above logo
  ctx.drawImage(SPR.it_crown, 120, 26);

  if ((G.titleT >> 5) % 2 === 0) {
    if (G.hasSave()) {
      FONT5.draw(ctx, 'Z: CONTINUE', 128 - FONT5.width('Z: CONTINUE') / 2, 138, '#f4f4f0');
      FONT5.draw(ctx, 'X: NEW GAME', 128 - FONT5.width('X: NEW GAME') / 2, 152, '#8a96b0');
    } else {
      FONT5.draw(ctx, 'PRESS ENTER', 128 - FONT5.width('PRESS ENTER') / 2, 144, '#f4f4f0');
    }
  }
  FONT5.draw(ctx, 'ARROWS MOVE - Z SWORD - X ITEM', 128 - FONT5.width('ARROWS MOVE - Z SWORD - X ITEM') / 2, 204, '#5a6a8a');
}

const bigTextCache = {};
function drawBigText(text, cx, y, scale, color, shadow) {
  const key = text + scale + color;
  let cv = bigTextCache[key];
  if (!cv) {
    cv = document.createElement('canvas');
    cv.width = FONT5.width(text) + 2; cv.height = 8;
    FONT5.draw(cv.getContext('2d'), text, 0, 0, color);
    bigTextCache[key] = cv;
  }
  const w = cv.width * scale, h = cv.height * scale;
  if (shadow) {
    const sk = text + scale + 'sh';
    let sv = bigTextCache[sk];
    if (!sv) {
      sv = document.createElement('canvas');
      sv.width = cv.width; sv.height = 8;
      FONT5.draw(sv.getContext('2d'), text, 0, 0, shadow);
      bigTextCache[sk] = sv;
    }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sv, cx - w / 2 + scale, y + scale, w, h);
  }
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(cv, cx - w / 2, y, w, h);
}

function updateDialog() {
  const d = G.dialog;
  G.animT++;
  const total = d.total;
  if (!d.done) {
    d.shown += 2;
    if (d.shown % 6 < 2) AudioSys.sfx('text');
    if (d.shown >= total) { d.shown = total; d.done = true; }
    if (Input.attack || Input.start) { d.shown = total; d.done = true; }
  } else if (Input.attack || Input.start) {
    const cb = d.cb;
    G.dialog = null;
    G.state = 'play';
    if (cb) cb();
  }
}

function updateItemGet() {
  const ig = G.itemGetData;
  G.animT++;
  ig.t++;
  if (ig.t === 1 && !ig.applied) { ig.applied = true; ig.apply(); }
  if (ig.t === 20) {
    // none
  }
  if (ig.t > 30 && (Input.attack || Input.start)) {
    G.itemGetData = null;
    G.state = 'play';
    if (ig.item === 'sword') G.toast('Z TO SWING!');
  }
}

function renderItemGet() {
  const ig = G.itemGetData;
  // player holds item overhead
  const p = G.player;
  const spr = SPR[ig.spr];
  const ix = Math.round(p.x + 8 - spr.width / 2);
  const iy = Math.round(p.y - spr.height + 2 - Math.min(6, ig.t / 3));
  ctx.save();
  ctx.translate(0, HUD_H);
  // sparkle ring
  if (ig.big) {
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4 + ig.t / 18;
      const rr = 16 + Math.sin(ig.t / 9) * 3;
      ctx.fillStyle = i % 2 ? '#f2cf4a' : '#fff';
      ctx.globalAlpha = 0.7;
      ctx.fillRect(ix + spr.width / 2 + Math.cos(a) * rr, iy + spr.height / 2 + Math.sin(a) * rr, 2, 2);
    }
    ctx.globalAlpha = 1;
  }
  ctx.drawImage(spr, ix, iy);
  ctx.restore();
  // text box
  if (ig.t > 14) {
    drawTextBox(wrapText(DIALOG[ig.textKey] || ''), null, '#f2cf4a');
  }
}

function updatePause() {
  G.animT++;
  if (Input.start) { G.state = 'play'; AudioSys.sfx('cursor'); return; }
  const items = pauseItems();
  if (items.length > 0) {
    if (Input.pressed['ArrowLeft'] || Input.pressed['KeyA']) { G.pauseCursor = (G.pauseCursor + items.length - 1) % items.length; AudioSys.sfx('cursor'); }
    if (Input.pressed['ArrowRight'] || Input.pressed['KeyD']) { G.pauseCursor = (G.pauseCursor + 1) % items.length; AudioSys.sfx('cursor'); }
    if (Input.attack || Input.item) {
      const it = items[G.pauseCursor];
      if (it.equip) { G.equipped = it.equip; AudioSys.sfx('key'); G.state = 'play'; }
    }
  }
}

function pauseItems() {
  const list = [];
  if (G.inv.emberblade) list.push({ spr: 'it_sword', label: 'EMBER BLADE', equip: null });
  if (G.inv.bow) list.push({ spr: 'it_bow', label: 'FERN BOW', equip: 'bow' });
  if (G.inv.maxBombs > 0) list.push({ spr: 'bomb_pickup', label: 'BOMBS', equip: 'bombs' });
  if (G.inv.lantern) list.push({ spr: 'it_lantern', label: 'LANTERN', equip: null });
  if (G.inv.bosskey) list.push({ spr: 'it_bosskey', label: 'GLOOM KEY', equip: null });
  return list;
}

function renderPause() {
  ctx.fillStyle = 'rgba(6,8,14,0.88)';
  ctx.fillRect(12, 30, 232, 164);
  ctx.strokeStyle = '#5a6a8a';
  ctx.strokeRect(12.5, 30.5, 231, 163);
  FONT5.draw(ctx, '- INVENTORY -', 128 - FONT5.width('- INVENTORY -') / 2, 38, '#f2cf4a');

  const items = pauseItems();
  if (items.length === 0) {
    FONT5.draw(ctx, 'NOTHING YET...', 128 - FONT5.width('NOTHING YET...') / 2, 80, '#8a96b0');
  }
  items.forEach((it, i) => {
    const x = 40 + i * 41, y = 60;
    ctx.fillStyle = i === G.pauseCursor ? '#3e4a66' : '#1c2230';
    ctx.fillRect(x - 4, y - 4, 26, 26);
    if (i === G.pauseCursor && (G.animT >> 3) % 2 === 0) {
      ctx.strokeStyle = '#f2cf4a';
      ctx.strokeRect(x - 4.5, y - 4.5, 27, 27);
    }
    ctx.drawImage(SPR[it.spr], x + 1, y + 1);
    if (it.equip && G.equipped === it.equip) FONT5.draw(ctx, 'X', x + 16, y + 15, '#f2cf4a');
  });
  if (items[G.pauseCursor]) {
    const it = items[G.pauseCursor];
    FONT5.draw(ctx, it.label, 128 - FONT5.width(it.label) / 2, 94, '#fff');
    if (it.equip) FONT5.draw(ctx, 'Z: SET TO X BUTTON', 128 - FONT5.width('Z: SET TO X BUTTON') / 2, 106, '#8a96b0');
  }

  // quest hint
  let hint;
  if (!G.inv.sword) hint = 'FIND THE ELDER IN THE WEST CAVE';
  else if (!G.inv.lantern && !G.inv.bow) hint = 'SEEK THE HOLLOW RUINS UP NORTH';
  else if (!G.inv.bow) hint = 'A ROYAL BEAST GUARDS THE BOW';
  else if (!G.inv.bosskey) hint = 'FIND THE GLOOM KEY IN THE EAST WING';
  else if (!G.inv.crown) hint = 'FACE THE GLOOM KNIGHT';
  else if (!G.flags.has('cinderwarden_defeated')) hint = 'EASTERN ROAD: CINDER KEEP';
  else hint = 'EMBERVALE IS SAVED!';
  FONT5.draw(ctx, hint, 128 - FONT5.width(hint) / 2, 128, '#5ad8e8');

  // stats
  const mins = Math.floor(G.stats.time / 3600);
  FONT5.draw(ctx, 'TIME ' + mins + 'M', 24, 158, '#8a96b0');
  FONT5.draw(ctx, 'KILLS ' + G.stats.kills, 98, 158, '#8a96b0');
  FONT5.draw(ctx, 'DEATHS ' + G.stats.deaths, 168, 158, '#8a96b0');
  FONT5.draw(ctx, 'ENTER: RESUME', 128 - FONT5.width('ENTER: RESUME') / 2, 178, '#f4f4f0');
}

function updateGameover() {
  G.gameoverT++;
  if (G.gameoverT > 60 && (Input.start || Input.attack)) {
    G.respawn();
  }
}
function renderGameover() {
  ctx.fillStyle = '#0a0508';
  ctx.fillRect(0, 0, 256, 224);
  drawBigText('YOU FELL...', 128, 70, 2, '#d83838', '#3a0a0a');
  if (G.gameoverT > 60 && (G.gameoverT >> 5) % 2 === 0) {
    FONT5.draw(ctx, 'PRESS ENTER TO RISE AGAIN', 128 - FONT5.width('PRESS ENTER TO RISE AGAIN') / 2, 128, '#f4f4f0');
  }
  FONT5.draw(ctx, 'YOUR GEAR REMAINS YOURS', 128 - FONT5.width('YOUR GEAR REMAINS YOURS') / 2, 150, '#5a6a8a');
}

function updateWin() {
  G.winT++;
}
function renderWin() {
  const t = G.winT;
  const grad = ctx.createLinearGradient(0, 0, 0, 224);
  grad.addColorStop(0, '#2a4434');
  grad.addColorStop(0.5, '#33304f');
  grad.addColorStop(1, '#1a1f33');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 224);
  // rising sparkles
  for (let i = 0; i < 24; i++) {
    const yy = (224 - ((t * 0.7 + i * 31) % 260));
    const xx = (i * 37 + Math.sin((t + i * 30) / 25) * 10 + 256) % 256;
    ctx.globalAlpha = 0.5 + Math.sin(t / 10 + i) * 0.3;
    ctx.fillStyle = i % 3 === 0 ? '#f2cf4a' : i % 3 === 1 ? '#5ad8e8' : '#fff';
    ctx.fillRect(xx, yy, 1, 1);
  }
  ctx.globalAlpha = 1;
  // crown + fox
  const fl = Math.min(1, t / 90);
  ctx.drawImage(SPR.it_crown, 120, 50 - Math.sin(t / 30) * 3);
  ctx.drawImage(SPR.fox_d0, 120, 80);
  ctx.globalAlpha = 0.3 + Math.sin(t / 16) * 0.15;
  ctx.fillStyle = '#f2cf4a';
  ctx.beginPath(); ctx.arc(128, 60, 22 + Math.sin(t / 12) * 3, 0, 7); ctx.fill();
  ctx.globalAlpha = 1;

  if (t > 60) drawBigText('THE CROWN RETURNS', 128, 108, 2, '#f2cf4a', '#8c5a1f');
  if (t > 120) {
    FONT5.draw(ctx, 'GLOOM LIFTS FROM EMBERVALE.', 128 - FONT5.width('GLOOM LIFTS FROM EMBERVALE.') / 2, 132, '#f4f4f0');
    FONT5.draw(ctx, 'THE FORESTS BREATHE AGAIN.', 128 - FONT5.width('THE FORESTS BREATHE AGAIN.') / 2, 143, '#f4f4f0');
  }
  if (t > 180) {
    const mins = Math.floor(G.stats.time / 3600);
    const statLine = 'TIME ' + mins + 'M  DEATHS ' + G.stats.deaths + '  KILLS ' + G.stats.kills;
    FONT5.draw(ctx, statLine, 128 - FONT5.width(statLine) / 2, 162, '#8a96b0');
  }
  if (t > 240 && (t >> 5) % 2 === 0) {
    FONT5.draw(ctx, 'THANK YOU FOR PLAYING', 128 - FONT5.width('THANK YOU FOR PLAYING') / 2, 184, '#5ad8e8');
  }
}

// ============================================================
// MAIN LOOP
// ============================================================
let lastT = 0, acc = 0;
function frame(now) {
  requestAnimationFrame(frame);
  if (!lastT) lastT = now;
  let dt = now - lastT;
  lastT = now;
  if (dt > 100) dt = 100;
  acc += dt;
  let steps = 0;
  while (acc >= 16.66 && steps < 4) {
    update();
    acc -= 16.66;
    steps++;
    Input.flush();
  }
  render();
}

function update() {
  switch (G.state) {
    case 'title': updateTitle(); break;
    case 'play': updatePlay(); if (G.state === 'play') checkDoorPush(); break;
    case 'scroll': updateScroll(); break;
    case 'fade': updateFade(); break;
    case 'dialog': updateDialog(); break;
    case 'itemget': updateItemGet(); break;
    case 'pause': updatePause(); break;
    case 'gameover': updateGameover(); break;
    case 'win': updateWin(); break;
  }
}

function render() {
  ctx.clearRect(0, 0, 256, 224);
  if (G.state === 'title') { renderTitle(); return; }
  if (G.state === 'gameover') { renderGameover(); return; }
  if (G.state === 'win') { renderWin(); return; }

  // playfield
  ctx.save();
  let shx = 0, shy = 0;
  if (G.shake > 0) {
    shx = (Math.random() - 0.5) * Math.min(6, G.shake);
    shy = (Math.random() - 0.5) * Math.min(6, G.shake);
  }
  ctx.translate(shx, HUD_H + shy);
  ctx.beginPath(); ctx.rect(0, 0, PF_W, PF_H); ctx.clip();

  if (G.state === 'scroll' && G.scroll) {
    const s = G.scroll;
    const prog = s.t / s.dur;
    let ox = 0, oy = 0;
    if (s.dir === 'e') ox = -PF_W * prog;
    if (s.dir === 'w') ox = PF_W * prog;
    if (s.dir === 's') oy = -PF_H * prog;
    if (s.dir === 'n') oy = PF_H * prog;
    ctx.drawImage(pfSnap, ox, oy);
    let nx = ox, ny = oy;
    if (s.dir === 'e') nx = ox + PF_W;
    if (s.dir === 'w') nx = ox - PF_W;
    if (s.dir === 's') ny = oy + PF_H;
    if (s.dir === 'n') ny = oy - PF_H;
    ctx.drawImage(pfSnap2, nx, ny);
  } else {
    renderPlayfield(ctx);
  }
  ctx.restore();

  // HUD
  renderHUD();

  // overlays
  if (G.state === 'dialog') renderDialogBox();
  if (G.state === 'itemget') renderItemGet();
  if (G.state === 'pause') renderPause();
  renderToast();

  // fade
  if (G.fade > 0) {
    ctx.fillStyle = 'rgba(4,5,10,' + G.fade + ')';
    ctx.fillRect(0, 0, 256, 224);
  }
}

// ============================================================
// BOOT
// ============================================================
Input.init();
G.player = new Player();
requestAnimationFrame(frame);
console.log('[EMBERVALE] ready');
