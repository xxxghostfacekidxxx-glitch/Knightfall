// ============================================================
// EMBERVALE — entities.js
// Player, enemies, boss, projectiles, pickups, particles
// ============================================================
'use strict';

const TILE = 16, PF_W = 256, PF_H = 176;

// ---- physics helpers (G is defined in game.js) ----
function tileIdAt(px, py) {
  const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
  if (tx < 0 || ty < 0 || tx >= 16 || ty >= 11) return T.DWALL;
  return G.roomTiles[ty][tx];
}
function solidAt(px, py) {
  return SOLID_TILES.has(tileIdAt(px, py));
}
function rectSolid(x, y, w, h) {
  return solidAt(x, y) || solidAt(x + w - 1, y) || solidAt(x, y + h - 1) || solidAt(x + w - 1, y + h - 1) ||
    solidAt(x + w / 2, y) || solidAt(x + w / 2, y + h - 1);
}
// move hitbox (hx,hy,hw,hh are offsets within entity) — returns moved deltas
function moveCollide(e, dx, dy) {
  const hx = e.x + e.hx, hy = e.y + e.hy;
  let nx = hx + dx;
  if (!rectSolid(nx, hy, e.hw, e.hh)) e.x += dx;
  else {
    // slide to wall
    const step = Math.sign(dx);
    while (step !== 0 && !rectSolid(e.x + e.hx + step, hy, e.hw, e.hh)) e.x += step;
  }
  const hy2 = e.y + e.hy;
  let ny = hy2 + dy;
  if (!rectSolid(e.x + e.hx, ny, e.hw, e.hh)) e.y += dy;
  else {
    const step = Math.sign(dy);
    while (step !== 0 && !rectSolid(e.x + e.hx, e.y + e.hy + step, e.hw, e.hh)) e.y += step;
  }
}
function clampRoom(e) {
  e.x = Math.max(-e.hx, Math.min(PF_W - e.hx - e.hw, e.x));
  e.y = Math.max(-e.hy, Math.min(PF_H - e.hy - e.hh, e.y));
}
function overlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}
function entOverlap(a, b) {
  return overlap(a.x + a.hx, a.y + a.hy, a.hw, a.hh, b.x + b.hx, b.y + b.hy, b.hw, b.hh);
}
function distEnt(a, b) {
  const dx = (a.x + a.hx + a.hw / 2) - (b.x + b.hx + b.hw / 2);
  const dy = (a.y + a.hy + a.hh / 2) - (b.y + b.hy + b.hh / 2);
  return Math.hypot(dx, dy);
}

// ============================================================
// PARTICLES
// ============================================================
const Particles = {
  list: [],
  spawn(x, y, n, opts = {}) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = (opts.speed || 1) * (0.4 + Math.random() * 0.9);
      this.list.push({
        x, y,
        vx: Math.cos(a) * sp + (opts.vx || 0),
        vy: Math.sin(a) * sp + (opts.vy || 0),
        life: (opts.life || 24) * (0.6 + Math.random() * 0.7),
        maxLife: opts.life || 24,
        color: Array.isArray(opts.color) ? opts.color[(Math.random() * opts.color.length) | 0] : (opts.color || '#fff'),
        size: opts.size || 2,
        grav: opts.grav || 0
      });
    }
  },
  update() {
    for (const p of this.list) {
      p.x += p.vx; p.y += p.vy; p.vy += p.grav;
      p.vx *= 0.93; p.vy *= 0.93;
      p.life--;
    }
    this.list = this.list.filter(p => p.life > 0);
  },
  draw(ctx) {
    for (const p of this.list) {
      ctx.globalAlpha = Math.min(1, p.life / (p.maxLife * 0.4));
      ctx.fillStyle = p.color;
      const s = p.life < p.maxLife * 0.3 ? 1 : p.size;
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
  },
  clear() { this.list = []; }
};

function leafBurst(x, y) { Particles.spawn(x, y, 8, { color: ['#3e8948', '#5ab552', '#2a6e36'], speed: 1.4, life: 22 }); }
function deathPuff(x, y) { Particles.spawn(x, y, 12, { color: ['#b8bcc8', '#6e7280', '#f4f4f0'], speed: 1.6, life: 24 }); }
function hitSpark(x, y) { Particles.spawn(x, y, 5, { color: ['#fff', '#f2cf4a'], speed: 2, life: 12 }); }

// ============================================================
// PLAYER — Rua the fox
// ============================================================
class Player {
  constructor() {
    this.x = 120; this.y = 112;
    this.hx = 3; this.hy = 6; this.hw = 10; this.hh = 9;
    this.facing = 'd';
    this.walkT = 0;
    this.moving = false;
    this.attackT = 0;       // frames remaining of sword swing
    this.iframes = 0;
    this.kx = 0; this.ky = 0; // knockback velocity
    this.speed = 1.15;
  }
  get cx() { return this.x + 8; }
  get cy() { return this.y + 8; }

  update(input) {
    if (this.iframes > 0) this.iframes--;
    // knockback
    if (Math.abs(this.kx) > 0.1 || Math.abs(this.ky) > 0.1) {
      moveCollide(this, this.kx, this.ky);
      this.kx *= 0.82; this.ky *= 0.82;
    }
    if (this.attackT > 0) {
      this.attackT--;
      return; // rooted while swinging
    }
    let dx = 0, dy = 0;
    if (input.left) dx -= 1;
    if (input.right) dx += 1;
    if (input.up) dy -= 1;
    if (input.down) dy += 1;
    this.moving = dx !== 0 || dy !== 0;
    if (this.moving) {
      if (dx !== 0 && dy !== 0) { dx *= 0.7071; dy *= 0.7071; }
      // facing: prefer horizontal change
      if (Math.abs(dx) > Math.abs(dy)) this.facing = dx < 0 ? 'l' : 'r';
      else if (dy !== 0) this.facing = dy < 0 ? 'u' : 'd';
      moveCollide(this, dx * this.speed, dy * this.speed);
      this.walkT += 0.16;
    }
  }

  startAttack() {
    if (!G.inv.sword || this.attackT > 0) return;
    this.attackT = 14;
    AudioSys.sfx('sword');
    // full hearts -> sword beam
    if (G.hp >= G.maxHp && G.inv.sword) {
      const v = DIR_VEC[this.facing];
      G.projectiles.push(new SwordBeam(this.cx - 4, this.cy - 4, v[0] * 2.4, v[1] * 2.4));
      AudioSys.sfx('swordBeam');
    }
  }

  swordHitbox() {
    if (this.attackT <= 0 || this.attackT > 12) return null;
    const ext = this.attackT > 4 ? 14 : 8;
    switch (this.facing) {
      case 'd': return { x: this.x + 1, y: this.y + 10, w: 14, h: ext };
      case 'u': return { x: this.x + 1, y: this.y + 6 - ext, w: 14, h: ext };
      case 'l': return { x: this.x + 6 - ext, y: this.y + 3, w: ext, h: 13 };
      case 'r': return { x: this.x + 10, y: this.y + 3, w: ext, h: 13 };
    }
  }

  hurt(dmg, fx, fy) {
    if (this.iframes > 0 || G.state !== 'play') return;
    G.hp -= dmg;
    this.iframes = 60;
    const d = Math.hypot(this.cx - fx, this.cy - fy) || 1;
    this.kx = (this.cx - fx) / d * 2.6;
    this.ky = (this.cy - fy) / d * 2.6;
    AudioSys.sfx('hitPlayer');
    G.shake = 6;
    Particles.spawn(this.cx, this.cy, 6, { color: ['#d83838', '#f47070'], speed: 1.5, life: 18 });
    if (G.hp <= 0) G.die();
  }

  draw(ctx) {
    if (this.iframes > 0 && (this.iframes >> 2) % 2 === 0 && G.state === 'play') return; // blink
    const f = this.moving || this.attackT > 0 ? ((this.walkT | 0) % 2) : 0;
    const key = 'fox_' + this.facing + (this.attackT > 0 ? '0' : f);
    // draw sword first if facing up (behind body)
    if (this.attackT > 0 && this.facing === 'u') this.drawSword(ctx);
    ctx.drawImage(SPR[key], Math.round(this.x), Math.round(this.y));
    if (this.attackT > 0 && this.facing !== 'u') this.drawSword(ctx);
  }

  drawSword(ctx) {
    const t = this.attackT;
    const ext = t > 12 ? 4 : (t > 4 ? 13 : 7);
    const px = Math.round(this.x), py = Math.round(this.y);
    ctx.fillStyle = '#e8eef4';
    const hilt = '#b8902a';
    switch (this.facing) {
      case 'd':
        ctx.fillRect(px + 7, py + 13, 2, ext); ctx.fillStyle = hilt; ctx.fillRect(px + 5, py + 13, 6, 2); break;
      case 'u':
        ctx.fillRect(px + 7, py + 3 - ext, 2, ext); ctx.fillStyle = hilt; ctx.fillRect(px + 5, py + 1, 6, 2); break;
      case 'l':
        ctx.fillRect(px + 3 - ext, py + 8, ext, 2); ctx.fillStyle = hilt; ctx.fillRect(px + 1, py + 6, 2, 6); break;
      case 'r':
        ctx.fillRect(px + 13, py + 8, ext, 2); ctx.fillStyle = hilt; ctx.fillRect(px + 13, py + 6, 2, 6); break;
    }
  }
}

const DIR_VEC = { d: [0, 1], u: [0, -1], l: [-1, 0], r: [1, 0] };

// ============================================================
// ENEMY BASE
// ============================================================
class Enemy {
  constructor(tx, ty) {
    this.x = tx * TILE; this.y = ty * TILE;
    this.hx = 3; this.hy = 3; this.hw = 10; this.hh = 10;
    this.hp = 1; this.touchDmg = 0.5;
    this.dead = false;
    this.flash = 0;
    this.kx = 0; this.ky = 0;
    this.t = Math.random() * 100;
    this.noCollide = false;   // flies over tiles
    this.dropTable = true;
  }
  get cx() { return this.x + this.hx + this.hw / 2; }
  get cy() { return this.y + this.hy + this.hh / 2; }

  baseUpdate() {
    this.t++;
    if (this.flash > 0) this.flash--;
    if (Math.abs(this.kx) > 0.1 || Math.abs(this.ky) > 0.1) {
      if (this.noCollide) { this.x += this.kx; this.y += this.ky; clampRoom(this); }
      else moveCollide(this, this.kx, this.ky);
      this.kx *= 0.8; this.ky *= 0.8;
      return true; // in knockback
    }
    return false;
  }

  move(dx, dy) {
    if (this.noCollide) { this.x += dx; this.y += dy; clampRoom(this); }
    else moveCollide(this, dx, dy);
  }

  hurt(dmg, fx, fy) {
    if (this.flash > 0 || this.dead) return false;
    this.hp -= dmg;
    this.flash = 14;
    const d = Math.hypot(this.cx - fx, this.cy - fy) || 1;
    this.kx = (this.cx - fx) / d * 2.8;
    this.ky = (this.cy - fy) / d * 2.8;
    hitSpark(this.cx, this.cy);
    if (this.hp <= 0) this.die();
    else AudioSys.sfx('hitEnemy');
    return true;
  }

  die() {
    this.dead = true;
    deathPuff(this.cx, this.cy);
    AudioSys.sfx('enemyDie');
    if (this.dropTable) spawnDrop(this.cx, this.cy);
  }

  touchPlayer() {
    if (entOverlap(this, G.player)) G.player.hurt(this.touchDmg, this.cx, this.cy);
  }

  drawSprite(ctx, key) {
    const spr = this.flash > 0 && (this.flash >> 1) % 2 === 0 ? tintSprite(SPR[key], '#fff', 0.8) : SPR[key];
    ctx.drawImage(spr, Math.round(this.x), Math.round(this.y));
  }
}

function spawnDrop(x, y) {
  const r = Math.random();
  // hearts drop more often when the player is nearly dead
  const heartChance = G.hp <= 1 ? 0.40 : 0.18;
  let type = null, n = 1;
  if (r < heartChance) type = 'heart';
  else if (r < heartChance + 0.30) type = 'gem';
  else if (r < heartChance + 0.38 && G.inv.maxBombs > 0) { type = 'bombs'; n = 1; }
  else if (r < heartChance + 0.50 && G.inv.bow) { type = 'arrows'; n = 3; }
  if (type) G.pickups.push(new Pickup(x - 4, y - 4, type, n));
}

// ============================================================
// ENEMY TYPES
// ============================================================
class Slime extends Enemy {
  constructor(tx, ty, red = false) {
    super(tx, ty);
    this.red = red;
    this.hp = red ? 2 : 1;
    this.touchDmg = 0.5;
    this.dir = [0, 0];
    this.wait = 30 + Math.random() * 60;
  }
  update() {
    if (this.baseUpdate()) return;
    if (this.wait > 0) {
      this.wait--;
      if (this.wait <= 0) {
        if (this.red && distEnt(this, G.player) < 70) {
          const d = distEnt(this, G.player) || 1;
          this.dir = [(G.player.cx - this.cx) / d, (G.player.cy - this.cy) / d];
        } else {
          const a = Math.random() * Math.PI * 2;
          this.dir = [Math.cos(a), Math.sin(a)];
        }
        this.moveT = 40 + Math.random() * 30;
      }
    } else {
      const sp = this.red ? 0.6 : 0.42;
      this.move(this.dir[0] * sp, this.dir[1] * sp);
      this.moveT--;
      if (this.moveT <= 0) this.wait = 25 + Math.random() * 50;
    }
    this.touchPlayer();
  }
  draw(ctx) {
    const f = (this.t / 14 | 0) % 2;
    this.drawSprite(ctx, (this.red ? 'slimeR' : 'slime') + f);
  }
}

class Spitter extends Enemy {
  constructor(tx, ty) {
    super(tx, ty);
    this.hp = 2; this.touchDmg = 0.5;
    this.dir = [0, 1];
    this.state = 'walk';
    this.timer = 60 + Math.random() * 60;
  }
  update() {
    if (this.baseUpdate()) return;
    this.timer--;
    if (this.state === 'walk') {
      this.move(this.dir[0] * 0.4, this.dir[1] * 0.4);
      if (this.timer <= 0) {
        if (Math.random() < 0.55 && distEnt(this, G.player) < 130) {
          this.state = 'aim'; this.timer = 26;
        } else {
          const a = (Math.random() * 4 | 0) * Math.PI / 2;
          this.dir = [Math.round(Math.cos(a)), Math.round(Math.sin(a))];
          this.timer = 50 + Math.random() * 60;
        }
      }
    } else if (this.state === 'aim') {
      if (this.timer <= 0) {
        const d = distEnt(this, G.player) || 1;
        const vx = (G.player.cx - this.cx) / d, vy = (G.player.cy - this.cy) / d;
        G.projectiles.push(new RockProj(this.cx - 4, this.cy - 4, vx * 1.7, vy * 1.7));
        AudioSys.sfx('arrow');
        this.state = 'walk';
        this.timer = 70 + Math.random() * 50;
      }
    }
    this.touchPlayer();
  }
  draw(ctx) {
    const f = this.state === 'aim' ? 1 : (this.t / 16 | 0) % 2;
    this.drawSprite(ctx, 'spit' + f);
  }
}

class Bat extends Enemy {
  constructor(tx, ty) {
    super(tx, ty);
    this.hp = 1; this.touchDmg = 0.5;
    this.noCollide = true;
    this.homeX = this.x; this.homeY = this.y;
    this.state = 'hover';
    this.timer = 90 + Math.random() * 120;
    this.vx = 0; this.vy = 0;
  }
  update() {
    if (this.baseUpdate()) return;
    if (this.state === 'hover') {
      this.x = this.homeX + Math.sin(this.t / 19) * 14;
      this.y = this.homeY + Math.sin(this.t / 13) * 8;
      clampRoom(this);
      this.timer--;
      if (this.timer <= 0 && distEnt(this, G.player) < 140) {
        this.state = 'swoop';
        const d = distEnt(this, G.player) || 1;
        this.vx = (G.player.cx - this.cx) / d * 1.7;
        this.vy = (G.player.cy - this.cy) / d * 1.7;
        this.timer = 50;
      } else if (this.timer <= 0) this.timer = 60;
    } else {
      this.x += this.vx; this.y += this.vy;
      clampRoom(this);
      this.timer--;
      if (this.timer <= 0) {
        this.state = 'hover';
        this.homeX = this.x; this.homeY = this.y;
        this.timer = 100 + Math.random() * 80;
      }
    }
    this.touchPlayer();
  }
  draw(ctx) {
    const f = (this.t / (this.state === 'swoop' ? 5 : 10) | 0) % 2;
    this.drawSprite(ctx, 'bat' + f);
  }
}

class Skeleton extends Enemy {
  constructor(tx, ty) {
    super(tx, ty);
    this.hp = 2; this.touchDmg = 1;
    this.pauseT = 0;
  }
  update() {
    if (this.baseUpdate()) return;
    if (this.pauseT > 0) { this.pauseT--; this.touchPlayer(); return; }
    const d = distEnt(this, G.player) || 1;
    if (d < 150) {
      const sp = 0.52;
      this.move((G.player.cx - this.cx) / d * sp, (G.player.cy - this.cy) / d * sp);
    } else {
      this.move(Math.sin(this.t / 40) * 0.3, Math.cos(this.t / 53) * 0.3);
    }
    if (Math.random() < 0.005) this.pauseT = 30;
    this.touchPlayer();
  }
  draw(ctx) {
    const f = (this.t / 12 | 0) % 2;
    this.drawSprite(ctx, 'skel' + f);
  }
}

class Ghost extends Enemy {
  constructor(tx, ty) {
    super(tx, ty);
    this.hp = 2; this.touchDmg = 0.5;
    this.noCollide = true;
  }
  update() {
    if (this.baseUpdate()) return;
    const d = distEnt(this, G.player) || 1;
    const sp = 0.38 + Math.sin(this.t / 30) * 0.1;
    this.x += (G.player.cx - this.cx) / d * sp;
    this.y += (G.player.cy - this.cy) / d * sp;
    clampRoom(this);
    this.touchPlayer();
  }
  draw(ctx) {
    ctx.globalAlpha = 0.55 + Math.sin(this.t / 16) * 0.25;
    const f = (this.t / 18 | 0) % 2;
    this.drawSprite(ctx, 'ghost' + f);
    ctx.globalAlpha = 1;
  }
}

// ---- Royal Slime (miniboss) ----
class BigSlime extends Enemy {
  constructor(tx, ty) {
    super(tx, ty);
    this.x = tx * TILE - 4; this.y = ty * TILE - 4;
    this.hx = 2; this.hy = 6; this.hw = 20; this.hh = 12;
    this.hp = 8; this.touchDmg = 1;
    this.state = 'idle'; this.timer = 50;
    this.vx = 0; this.vy = 0;
    this.hops = 0;
    this.dropTable = false;
    this.isMini = true;
  }
  update() {
    if (this.baseUpdate()) return;
    this.timer--;
    if (this.state === 'idle') {
      if (this.timer <= 0) {
        this.state = 'hop'; this.timer = 34;
        const d = distEnt(this, G.player) || 1;
        this.vx = (G.player.cx - this.cx) / d * 1.7;
        this.vy = (G.player.cy - this.cy) / d * 1.7;
        AudioSys.sfx('hop');
        this.hops++;
      }
    } else {
      this.move(this.vx, this.vy);
      if (this.timer <= 0) {
        this.state = 'idle'; this.timer = 46;
        G.shake = 3;
        if (this.hops % 3 === 0 && G.enemies.filter(e => e instanceof Slime && !e.dead).length < 3) {
          const s = new Slime(Math.round(this.cx / 16), Math.round(this.cy / 16));
          s.x = this.cx - 8; s.y = this.cy - 8;
          G.enemies.push(s);
        }
      }
    }
    this.touchPlayer();
  }
  die() {
    this.dead = true;
    G.shake = 8;
    for (let i = 0; i < 3; i++)
      setTimeout(() => deathPuff(this.cx + (Math.random() - 0.5) * 24, this.cy + (Math.random() - 0.5) * 16), i * 120);
    Particles.spawn(this.cx, this.cy, 22, { color: ['#7ee87e', '#3ca83c', '#f2cf4a'], speed: 2.2, life: 30 });
    AudioSys.sfx('secret');
  }
  draw(ctx) {
    const f = this.state === 'hop' ? 1 : (this.t / 20 | 0) % 2;
    this.drawSprite(ctx, 'bigslime' + f);
  }
}

// ---- Gloom Knight (boss) ----
class Boss extends Enemy {
  constructor(tx, ty) {
    super(tx, ty);
    this.x = tx * TILE - 4; this.y = ty * TILE - 4;
    this.hx = 3; this.hy = 6; this.hw = 18; this.hh = 14;
    this.hp = 14; this.maxHp = 14;
    this.touchDmg = 1;
    this.state = 'walk';   // walk | windup | charge | stun
    this.timer = 120;
    this.vx = 0; this.vy = 0;
    this.dropTable = false;
    this.isBoss = true;
    this.introT = 60;
  }
  get phase2() { return this.hp <= 7; }
  update() {
    if (this.introT > 0) {
      this.introT--;
      if (this.introT === 30) AudioSys.sfx('bossRoar');
      return;
    }
    if (this.flash > 0) this.flash--;
    if (Math.abs(this.kx) > 0.1 || Math.abs(this.ky) > 0.1) {
      moveCollide(this, this.kx, this.ky);
      this.kx *= 0.8; this.ky *= 0.8;
    }
    this.t++;
    this.timer--;
    const d = distEnt(this, G.player) || 1;
    switch (this.state) {
      case 'walk': {
        const sp = this.phase2 ? 0.62 : 0.42;
        this.move((G.player.cx - this.cx) / d * sp, (G.player.cy - this.cy) / d * sp);
        if (this.timer <= 0) { this.state = 'windup'; this.timer = 36; AudioSys.sfx('charge'); }
        break;
      }
      case 'windup':
        if (this.timer <= 0) {
          this.state = 'charge'; this.timer = 90;
          this.vx = (G.player.cx - this.cx) / d * 2.5;
          this.vy = (G.player.cy - this.cy) / d * 2.5;
        }
        break;
      case 'charge': {
        const ox = this.x, oy = this.y;
        moveCollide(this, this.vx, this.vy);
        const blocked = (Math.abs(this.x - ox) < 0.4 && Math.abs(this.vx) > 0.5) ||
                        (Math.abs(this.y - oy) < 0.4 && Math.abs(this.vy) > 0.5);
        if (blocked || this.timer <= 0) {
          if (blocked) {
            this.state = 'stun'; this.timer = 110;
            G.shake = 8;
            AudioSys.sfx('shutter');
            Particles.spawn(this.cx, this.cy, 10, { color: ['#8a4ad8', '#b07ae8'], speed: 2, life: 20 });
            if (this.phase2) this.gloomBurst();
          } else {
            this.state = 'walk'; this.timer = this.phase2 ? 90 : 150;
          }
        }
        break;
      }
      case 'stun':
        if (this.timer <= 0) {
          this.state = 'walk'; this.timer = this.phase2 ? 80 : 140;
          if (this.phase2) this.gloomBurst();
        }
        break;
    }
    this.touchPlayer();
  }
  gloomBurst() {
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      G.projectiles.push(new GloomBolt(this.cx - 4, this.cy - 4, Math.cos(a) * 1.3, Math.sin(a) * 1.3));
    }
    AudioSys.sfx('bossRoar');
  }
  get vulnerable() { return this.state === 'stun'; }
  hurt(dmg, fx, fy, src = 'sword') {
    if (this.dead || this.introT > 0) return false;
    if (src === 'arrow') {
      // arrows pierce the gloom — stagger him
      if (this.flash > 0) return false;
      this.hp -= dmg;
      this.flash = 14;
      this.state = 'stun'; this.timer = Math.max(this.timer, 90);
      AudioSys.sfx('bossHit');
      hitSpark(this.cx, this.cy);
      G.shake = 4;
      if (this.hp <= 0) this.die();
      return true;
    }
    if (src === 'bomb' || this.vulnerable) {
      if (this.flash > 0) return false;
      this.hp -= dmg;
      this.flash = 14;
      const dd = Math.hypot(this.cx - fx, this.cy - fy) || 1;
      this.kx = (this.cx - fx) / dd * 1.6;
      this.ky = (this.cy - fy) / dd * 1.6;
      AudioSys.sfx('bossHit');
      hitSpark(this.cx, this.cy);
      G.shake = 4;
      if (this.hp <= 0) this.die();
      return true;
    }
    // blocked by shield
    AudioSys.sfx('clang');
    Particles.spawn(fx, fy, 4, { color: ['#fff', '#9aa4b8'], speed: 1.8, life: 10 });
    G.player.kx = (G.player.cx - this.cx) / d1(this) * 2.2;
    G.player.ky = (G.player.cy - this.cy) / d1(this) * 2.2;
    return false;
  }
  die() {
    this.dead = true;
    G.bossDying = 150;
    G.bossDeathPos = [this.cx, this.cy];
    AudioSys.stopMusic();
    AudioSys.sfx('bossRoar');
    G.shake = 12;
  }
  draw(ctx) {
    if (this.introT > 0 && (this.introT >> 2) % 2 === 0) return;
    let key;
    const f = (this.t / 14 | 0) % 2;
    if (this.state === 'stun') key = 'boss_stun';
    else if (this.phase2) key = 'boss_rage' + f;
    else key = 'boss' + f;
    const spr = this.flash > 0 && (this.flash >> 1) % 2 === 0 ? tintSprite(SPR[key], '#fff', 0.8) : SPR[key];
    if (this.state === 'windup') {
      ctx.globalAlpha = 0.6 + Math.sin(this.t) * 0.3;
      ctx.drawImage(spr, Math.round(this.x), Math.round(this.y));
      ctx.globalAlpha = 1;
    } else {
      ctx.drawImage(spr, Math.round(this.x), Math.round(this.y));
    }
    // shield floats toward the player side
    if (this.state !== 'stun') {
      const dx = G.player.cx - this.cx, dy = G.player.cy - this.cy;
      let sx = this.x + 6, sy = this.y + 8;
      if (Math.abs(dx) > Math.abs(dy)) sx += dx > 0 ? 12 : -12;
      else sy += dy > 0 ? 10 : -8;
      ctx.drawImage(SPR.shield, Math.round(sx), Math.round(sy));
    }
  }
}
function d1(e) { return Math.hypot(G.player.cx - e.cx, G.player.cy - e.cy) || 1; }

function makeEnemy(type, tx, ty) {
  switch (type) {
    case 'slime': return new Slime(tx, ty);
    case 'slimeR': return new Slime(tx, ty, true);
    case 'spit': return new Spitter(tx, ty);
    case 'bat': return new Bat(tx, ty);
    case 'skel': return new Skeleton(tx, ty);
    case 'ghost': return new Ghost(tx, ty);
    case 'bigslime': return new BigSlime(tx, ty);
    case 'boss': return new Boss(tx, ty);
  }
  return null;
}

// ============================================================
// PROJECTILES
// ============================================================
class Projectile {
  constructor(x, y, vx, vy) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.dead = false;
    this.t = 0;
  }
  tileBlocked() {
    const cx = this.x + 4, cy = this.y + 4;
    return solidAt(cx, cy);
  }
  offscreen() {
    return this.x < -8 || this.y < -8 || this.x > PF_W || this.y > PF_H;
  }
}

class RockProj extends Projectile {
  update() {
    this.x += this.vx; this.y += this.vy; this.t++;
    if (this.tileBlocked() || this.offscreen()) { this.dead = true; return; }
    const p = G.player;
    if (overlap(this.x + 1, this.y + 1, 6, 6, p.x + p.hx, p.y + p.hy, p.hw, p.hh)) {
      p.hurt(0.5, this.x, this.y);
      this.dead = true;
    }
  }
  draw(ctx) { ctx.drawImage(SPR.rock_proj, Math.round(this.x), Math.round(this.y)); }
}

class GloomBolt extends Projectile {
  update() {
    this.x += this.vx; this.y += this.vy; this.t++;
    if (this.tileBlocked() || this.offscreen()) { this.dead = true; return; }
    const p = G.player;
    if (overlap(this.x + 1, this.y + 1, 6, 6, p.x + p.hx, p.y + p.hy, p.hw, p.hh)) {
      p.hurt(0.5, this.x, this.y);
      this.dead = true;
    }
    if (this.t % 3 === 0) Particles.spawn(this.x + 4, this.y + 4, 1, { color: '#8a4ad8', speed: 0.3, life: 10, size: 1 });
  }
  draw(ctx) { ctx.drawImage(SPR.gloom_proj, Math.round(this.x), Math.round(this.y)); }
}

class Arrow extends Projectile {
  update() {
    this.x += this.vx; this.y += this.vy; this.t++;
    if (this.tileBlocked() || this.offscreen()) { this.dead = true; return; }
    for (const e of G.enemies) {
      if (e.dead) continue;
      if (overlap(this.x + 2, this.y + 2, 4, 4, e.x + e.hx, e.y + e.hy, e.hw, e.hh)) {
        const hit = e instanceof Boss ? e.hurt(1, this.x, this.y, 'arrow') : e.hurt(1, this.x, this.y);
        if (hit !== false) { this.dead = true; return; }
      }
    }
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(Math.round(this.x) + 4, Math.round(this.y) + 4);
    ctx.rotate(Math.atan2(this.vy, this.vx));
    ctx.fillStyle = '#caa46a'; ctx.fillRect(-4, -0.5, 7, 1);
    ctx.fillStyle = '#f4f4f0'; ctx.fillRect(3, -1, 2, 2);
    ctx.restore();
  }
}

class SwordBeam extends Projectile {
  update() {
    this.x += this.vx; this.y += this.vy; this.t++;
    if (this.tileBlocked() || this.offscreen()) {
      if (!this.dead) Particles.spawn(this.x + 4, this.y + 4, 4, { color: '#5ad8e8', speed: 1.5, life: 10 });
      this.dead = true; return;
    }
    for (const e of G.enemies) {
      if (e.dead) continue;
      if (overlap(this.x + 1, this.y + 1, 6, 6, e.x + e.hx, e.y + e.hy, e.hw, e.hh)) {
        if (e instanceof Boss) e.hurt(1, this.x, this.y, 'sword');
        else e.hurt(1, this.x, this.y);
        this.dead = true; return;
      }
    }
  }
  draw(ctx) {
    if (this.t % 2 === 0) ctx.drawImage(SPR.beam, Math.round(this.x), Math.round(this.y));
    else {
      ctx.save();
      ctx.translate(Math.round(this.x) + 4, Math.round(this.y) + 4);
      ctx.rotate(Math.PI / 4);
      ctx.drawImage(SPR.beam, -4, -4);
      ctx.restore();
    }
  }
}

class Bomb {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.timer = 100;
    this.dead = false;
    this.exploded = false;
  }
  update() {
    this.timer--;
    if (this.timer % 18 === 0) AudioSys.sfx('fuse');
    if (this.timer % 12 === 0) Particles.spawn(this.x + 6, this.y - 1, 1, { color: '#f2cf4a', speed: 0.5, life: 8, size: 1 });
    if (this.timer <= 0 && !this.exploded) this.explode();
    if (this.timer <= -12) this.dead = true;
  }
  explode() {
    this.exploded = true;
    AudioSys.sfx('boom');
    G.shake = 9;
    const cx = this.x + 4, cy = this.y + 4, R = 26;
    Particles.spawn(cx, cy, 26, { color: ['#f2cf4a', '#f47020', '#fff', '#6e7280'], speed: 2.6, life: 28, size: 3 });
    // damage enemies
    for (const e of G.enemies) {
      if (e.dead) continue;
      if (Math.hypot(e.cx - cx, e.cy - cy) < R + 6) {
        if (e instanceof Boss) e.hurt(2, cx, cy, 'bomb');
        else e.hurt(2, cx, cy);
      }
    }
    // hurt player if close
    if (Math.hypot(G.player.cx - cx, G.player.cy - cy) < R) G.player.hurt(0.5, cx, cy);
    // break cracked tiles
    for (let ty = 0; ty < 11; ty++) {
      for (let tx = 0; tx < 16; tx++) {
        const id = G.roomTiles[ty][tx];
        if (id === T.CRACK || id === T.DCRACK) {
          const tcx = tx * 16 + 8, tcy = ty * 16 + 8;
          if (Math.hypot(tcx - cx, tcy - cy) < R + 10) G.breakCrack(tx, ty);
        }
      }
    }
  }
  draw(ctx) {
    if (this.exploded) {
      const r = 14 + (0 - this.timer) * 1.4;
      ctx.globalAlpha = Math.max(0, this.timer + 12) / 12;
      ctx.fillStyle = '#f47020';
      ctx.beginPath(); ctx.arc(this.x + 4, this.y + 4, r, 0, 7); ctx.fill();
      ctx.fillStyle = '#f2cf4a';
      ctx.beginPath(); ctx.arc(this.x + 4, this.y + 4, r * 0.6, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
      return;
    }
    const blink = this.timer < 40 && (this.timer >> 2) % 2 === 0;
    if (blink) {
      ctx.drawImage(tintSprite(SPR.bomb_pickup, '#fff', 0.7), Math.round(this.x), Math.round(this.y));
    } else {
      ctx.drawImage(SPR.bomb_pickup, Math.round(this.x), Math.round(this.y));
    }
  }
}

// ============================================================
// PICKUPS
// ============================================================
class Pickup {
  constructor(x, y, type, n = 1, flag = null) {
    this.x = x; this.y = y;
    this.type = type; this.n = n;
    this.flag = flag;
    this.t = 0;
    this.dead = false;
    this.life = flag ? Infinity : 480;
  }
  update() {
    this.t++;
    if (this.life !== Infinity) { this.life--; if (this.life <= 0) { this.dead = true; return; } }
    const p = G.player;
    if (overlap(this.x, this.y, 8, 8, p.x + p.hx, p.y + p.hy, p.hw, p.hh)) {
      this.collect();
    }
  }
  collect() {
    this.dead = true;
    if (this.flag) G.flags.add(this.flag);
    switch (this.type) {
      case 'gem': G.gems = Math.min(999, G.gems + 1); AudioSys.sfx('gem'); break;
      case 'gem_big': G.gems = Math.min(999, G.gems + 5); AudioSys.sfx('gem'); break;
      case 'heart': G.hp = Math.min(G.maxHp, G.hp + 1); AudioSys.sfx('heart'); break;
      case 'key': G.keys++; AudioSys.sfx('key'); break;
      case 'bombs': G.inv.bombs = Math.min(G.inv.maxBombs, G.inv.bombs + this.n); AudioSys.sfx('gem'); break;
      case 'arrows': G.inv.arrows = Math.min(30, G.inv.arrows + this.n); AudioSys.sfx('gem'); break;
      case 'crown': G.getCrown(); break;
    }
    Particles.spawn(this.x + 4, this.y + 4, 4, { color: '#fff', speed: 1, life: 12 });
  }
  draw(ctx) {
    if (this.life < 120 && (this.t >> 2) % 2 === 0) return;
    const bob = this.flag || this.type === 'crown' ? Math.sin(this.t / 16) * 1.5 : 0;
    const key = this.type === 'crown' ? 'it_crown' : (this.type === 'bombs' ? 'bomb_pickup' : (this.type === 'arrows' ? 'arrow_pickup' : this.type));
    const spr = SPR[key];
    if (this.type === 'crown') {
      // glow
      ctx.globalAlpha = 0.25 + Math.sin(this.t / 8) * 0.1;
      ctx.fillStyle = '#f2cf4a';
      ctx.beginPath(); ctx.arc(this.x + 8, this.y + 8, 12, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.drawImage(spr, Math.round(this.x), Math.round(this.y + bob));
  }
}

// ============================================================
// CHEST
// ============================================================
class Chest {
  constructor(def) {
    this.tx = def.tx; this.ty = def.ty;
    this.x = def.tx * TILE; this.y = def.ty * TILE;
    this.item = def.item; this.n = def.n || 1;
    this.flag = def.flag;
    this.requiresClear = !!def.requiresClear;
    this.opened = G.flags.has(def.flag);
    this.visible = !this.requiresClear || this.opened;
    this.dead = false;
  }
  update() {
    if (!this.visible) {
      if (G.enemies.filter(e => !e.dead).length === 0) {
        this.visible = true;
        AudioSys.sfx('secret');
        Particles.spawn(this.x + 8, this.y + 8, 12, { color: ['#f2cf4a', '#fff'], speed: 1.6, life: 20 });
      }
      return;
    }
    if (this.opened) return;
    const p = G.player;
    if (overlap(this.x - 1, this.y - 1, 18, 18, p.x + p.hx, p.y + p.hy, p.hw, p.hh)) {
      this.opened = true;
      G.flags.add(this.flag);
      G.itemGet(this.item, this.n);
    }
  }
  draw(ctx) {
    if (!this.visible) return;
    ctx.drawImage(this.opened ? SPR.chest_open : SPR.chest, this.x, this.y);
  }
}

// ============================================================
// NPC
// ============================================================
class NPC {
  constructor(def) {
    this.def = def;
    this.x = def.tx * TILE; this.y = def.ty * TILE;
    this.homeX = this.x; this.homeY = this.y;
    this.hx = 2; this.hy = 2; this.hw = 12; this.hh = 13;
    this.t = Math.random() * 100;
    this.dir = [0, 0];
    this.moveT = 0;
    this.dead = false;
  }
  get cx() { return this.x + 8; }
  get cy() { return this.y + 8; }
  update() {
    this.t++;
    if (this.def.wander) {
      if (this.moveT > 0) {
        this.moveT--;
        moveCollide(this, this.dir[0] * 0.3, this.dir[1] * 0.3);
        // stay near home
        if (Math.abs(this.x - this.homeX) > 24 || Math.abs(this.y - this.homeY) > 24) {
          const d = Math.hypot(this.homeX - this.x, this.homeY - this.y) || 1;
          this.dir = [(this.homeX - this.x) / d, (this.homeY - this.y) / d];
        }
      } else if (Math.random() < 0.008) {
        const a = Math.random() * Math.PI * 2;
        this.dir = [Math.cos(a), Math.sin(a)];
        this.moveT = 40;
      }
    }
    if (this.def.fairy) {
      if (this.t % 5 === 0)
        Particles.spawn(this.cx + (Math.random() - 0.5) * 12, this.cy + (Math.random() - 0.5) * 12, 1,
          { color: ['#5ad8e8', '#fff'], speed: 0.3, life: 18, size: 1 });
      // heal aura
      if (distEnt2(this, G.player) < 26 && G.hp < G.maxHp && this.t % 30 === 0) {
        G.hp = Math.min(G.maxHp, G.hp + 0.5);
        AudioSys.sfx('heart');
        Particles.spawn(G.player.cx, G.player.cy - 6, 3, { color: '#f47070', speed: 0.8, life: 16 });
      }
    }
    // block player (gentle push) — skip for floaty fairy
    if (!this.def.float && entOverlap(this, G.player)) {
      const p = G.player;
      const dx = p.cx - this.cx, dy = p.cy - this.cy;
      const dd = Math.hypot(dx, dy) || 1;
      p.x += dx / dd * 0.8; p.y += dy / dd * 0.8;
    }
  }
  draw(ctx) {
    const bob = this.def.float ? Math.sin(this.t / 14) * 2 : 0;
    ctx.drawImage(SPR[this.def.sprite], Math.round(this.x), Math.round(this.y + bob));
  }
}
function distEnt2(a, b) { return Math.hypot(a.cx - b.cx, a.cy - b.cy); }

// ============================================================
// SHOP ITEM (walk-into-buy)
// ============================================================
class ShopItem {
  constructor(def) {
    this.def = def;
    this.x = def.tx * TILE; this.y = def.ty * TILE;
    this.dead = false;
    this.cool = 0;
    if (def.flag && G.flags.has(def.flag)) this.dead = true;
  }
  update() {
    if (this.cool > 0) { this.cool--; return; }
    const p = G.player;
    if (overlap(this.x + 2, this.y + 2, 12, 12, p.x + p.hx, p.y + p.hy, p.hw, p.hh)) {
      const d = this.def;
      if (G.gems >= d.price) {
        G.gems -= d.price;
        AudioSys.sfx('buy');
        if (d.flag) { G.flags.add(d.flag); this.dead = true; }
        if (d.item === 'bombs') {
          if (G.inv.maxBombs === 0) { G.inv.maxBombs = 8; G.itemGet('bombs', d.n); this.cool = 90; return; }
          G.inv.bombs = Math.min(G.inv.maxBombs, G.inv.bombs + d.n);
        } else if (d.item === 'arrows') {
          G.inv.arrows = Math.min(30, G.inv.arrows + d.n);
        } else if (d.item === 'heartcont') {
          G.itemGet('heartcont', 1);
        }
        this.cool = 90;
      } else {
        AudioSys.sfx('denied');
        G.toast("NOT ENOUGH GEMS!");
        this.cool = 60;
        // push player back
        p.y += 4;
      }
    }
  }
  draw(ctx) {
    const d = this.def;
    const spr = d.item === 'bombs' ? SPR.bomb_pickup : (d.item === 'arrows' ? SPR.arrow_pickup : SPR.it_heartcont);
    if (d.item === 'heartcont') ctx.drawImage(spr, this.x, this.y - 4);
    else ctx.drawImage(spr, this.x + 4, this.y);
    FONT5.draw(ctx, String(d.price), this.x + 8 - FONT5.width(String(d.price)) / 2, this.y + 12, '#f2cf4a');
  }
}
