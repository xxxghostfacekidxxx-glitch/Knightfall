import type { MapData, TileType, VehicleConfig, WeaponConfig } from '../types';
import { CollisionGrid } from './collision';
import { stepVehicle, type VehicleState } from './vehiclePhysics';
import { TILE_SIZE } from '../config/constants';
import { PLAYER_RADIUS } from '../config/constants';

export interface PlayerState {
  x: number; z: number; heading: number;
  health: number;
  inVehicle: number | null; // vehicle id
  weaponId: string | null;
  ammo: number;
  walkSpeed: number;
}

export interface WorldVehicle {
  id: number;
  presetId: string;
  state: VehicleState;
  health: number;
  alive: boolean;
  /** AI traffic car (true) vs parked/player (false) */
  traffic: boolean;
}

export interface Ped {
  id: number; x: number; z: number; heading: number;
  alive: boolean; timer: number;
}

export interface Projectile {
  x: number; z: number; dx: number; dz: number; life: number; damage: number;
}

export interface Barrel {
  id: number; x: number; z: number; alive: boolean; explodeTimer: number;
}

export interface Pickup {
  id: number; x: number; z: number; weaponId: string; taken: boolean;
}

export interface WorldInput {
  forward: number; // -1..1
  steer: number; // -1..1 (1 = left)
  handbrake: boolean;
  fire: boolean;
  interact: boolean; // enter/exit pressed this frame
}

const PLAYER_WALK_SPEED = 6;
const ENTER_RANGE = 3.5;
const EXPLOSION_RADIUS = 5;
const EXPLOSION_DAMAGE = 80;

export class World {
  grid: CollisionGrid;
  player: PlayerState;
  vehicles: WorldVehicle[] = [];
  peds: Ped[] = [];
  projectiles: Projectile[] = [];
  barrels: Barrel[] = [];
  pickups: Pickup[] = [];
  score = 0;
  private fireCooldown = 0;
  private nextId = 1;

  map: MapData;
  vehicleConfigs: Record<string, VehicleConfig>;
  weaponConfigs: Record<string, WeaponConfig>;

  constructor(
    map: MapData,
    tileTypes: TileType[],
    vehicleConfigs: Record<string, VehicleConfig>,
    weaponConfigs: Record<string, WeaponConfig>,
  ) {
    this.map = map;
    this.vehicleConfigs = vehicleConfigs;
    this.weaponConfigs = weaponConfigs;
    this.grid = new CollisionGrid(map, tileTypes);
    this.player = {
      x: map.playerSpawn.position.x,
      z: map.playerSpawn.position.z,
      heading: map.playerSpawn.rotationY,
      health: 100,
      inVehicle: null,
      weaponId: null,
      ammo: 0,
      walkSpeed: PLAYER_WALK_SPEED,
    };
    for (const v of map.vehicleSpawns) {
      this.vehicles.push({
        id: this.nextId++,
        presetId: v.presetId,
        state: { x: v.position.x, z: v.position.z, heading: v.rotationY, speed: 0, lateral: 0 },
        health: 100,
        alive: true,
        traffic: v.traffic ?? false,
      });
    }
    for (const p of map.pedestrianSpawns) {
      this.peds.push({ id: this.nextId++, x: p.x, z: p.z, heading: 0, alive: true, timer: 0 });
    }
    for (const o of map.objects) {
      if (o.presetId === 'barrel') {
        this.barrels.push({ id: this.nextId++, x: o.position.x, z: o.position.z, alive: true, explodeTimer: -1 });
      } else if (this.weaponConfigs[o.presetId]) {
        this.pickups.push({ id: this.nextId++, x: o.position.x, z: o.position.z, weaponId: o.presetId, taken: false });
      }
    }
  }

  private dist2(ax: number, az: number, bx: number, bz: number): number {
    const dx = ax - bx, dz = az - bz;
    return dx * dx + dz * dz;
  }

  step(input: WorldInput, dt: number) {
    this.fireCooldown = Math.max(0, this.fireCooldown - dt);
    if (input.interact) this.toggleVehicle();
    if (this.player.inVehicle !== null) this.stepDriving(input, dt);
    else this.stepOnFoot(input, dt);
    this.stepTraffic(dt);
    this.stepPeds(dt);
    this.stepProjectiles(dt);
    this.stepBarrels(dt);
    this.checkPickups();
  }

  private toggleVehicle() {
    const p = this.player;
    if (p.inVehicle !== null) {
      const v = this.vehicles.find((v) => v.id === p.inVehicle)!;
      p.inVehicle = null;
      p.x = v.state.x + Math.cos(v.state.heading) * 2.2;
      p.z = v.state.z - Math.sin(v.state.heading) * 2.2;
      return;
    }
    let best: WorldVehicle | null = null;
    let bestD = ENTER_RANGE * ENTER_RANGE;
    for (const v of this.vehicles) {
      if (!v.alive) continue;
      const d = this.dist2(p.x, p.z, v.state.x, v.state.z);
      if (d < bestD) { bestD = d; best = v; }
    }
    if (best) {
      p.inVehicle = best.id;
      best.traffic = false;
    }
  }

  private stepOnFoot(input: WorldInput, dt: number) {
    const p = this.player;
    if (input.steer !== 0) p.heading += input.steer * 3.2 * dt;
    if (input.forward !== 0) {
      const speed = p.walkSpeed * input.forward * (input.forward < 0 ? 0.6 : 1);
      const nx = p.x + Math.sin(p.heading) * speed * dt;
      const nz = p.z + Math.cos(p.heading) * speed * dt;
      [p.x, p.z] = this.grid.resolveCircle(nx, nz, PLAYER_RADIUS, p.x, p.z);
    }
    if (input.fire && p.weaponId && this.fireCooldown === 0 && p.ammo > 0) {
      const w = this.weaponConfigs[p.weaponId];
      this.fireCooldown = 1 / w.fireRate;
      p.ammo--;
      this.projectiles.push({
        x: p.x + Math.sin(p.heading) * 0.8,
        z: p.z + Math.cos(p.heading) * 0.8,
        dx: Math.sin(p.heading) * w.projectileSpeed,
        dz: Math.cos(p.heading) * w.projectileSpeed,
        life: w.range / w.projectileSpeed,
        damage: w.damage,
      });
    }
  }

  private stepDriving(input: WorldInput, dt: number) {
    const v = this.vehicles.find((v) => v.id === this.player.inVehicle);
    if (!v || !v.alive) { this.player.inVehicle = null; return; }
    const cfg = this.vehicleConfigs[v.presetId];
    v.state = stepVehicle(v.state, { throttle: input.forward, steer: input.steer, handbrake: input.handbrake }, cfg, this.grid, dt);
    this.player.x = v.state.x;
    this.player.z = v.state.z;
    this.player.heading = v.state.heading;
    // run over peds
    for (const ped of this.peds) {
      if (ped.alive && Math.abs(v.state.speed) > 3 && this.dist2(ped.x, ped.z, v.state.x, v.state.z) < 2.2) {
        ped.alive = false;
        this.score += 10;
      }
    }
    // hit barrels
    for (const b of this.barrels) {
      if (b.alive && b.explodeTimer < 0 && this.dist2(b.x, b.z, v.state.x, v.state.z) < 2.5) {
        b.explodeTimer = 0.2;
      }
    }
  }

  private stepTraffic(dt: number) {
    for (const v of this.vehicles) {
      if (!v.alive || !v.traffic || v.id === this.player.inVehicle) continue;
      const cfg = this.vehicleConfigs[v.presetId];
      const s = v.state;
      const aheadX = s.x + Math.sin(s.heading) * TILE_SIZE;
      const aheadZ = s.z + Math.cos(s.heading) * TILE_SIZE;
      let steer = 0;
      if (!this.grid.isDrivableAt(aheadX, aheadZ)) steer = 1; // turn at junctions / dead-ends
      v.state = stepVehicle(s, { throttle: 0.4, steer, handbrake: false }, cfg, this.grid, dt);
    }
  }

  private stepPeds(dt: number) {
    for (const ped of this.peds) {
      if (!ped.alive) continue;
      ped.timer -= dt;
      if (ped.timer <= 0) {
        ped.heading = (((ped.id * 2654435761) % 628) / 100) + ped.timer; // pseudo-random new heading
        ped.timer = 2 + ((ped.id * 7919) % 30) / 10;
      }
      const speed = 1.4;
      const nx = ped.x + Math.sin(ped.heading) * speed * dt;
      const nz = ped.z + Math.cos(ped.heading) * speed * dt;
      if (!this.grid.isSolidAt(nx, nz) && !this.grid.isDrivableAt(nx, nz)) {
        ped.x = nx; ped.z = nz;
      } else {
        ped.heading += Math.PI / 2;
        ped.timer = 1;
      }
    }
  }

  private stepProjectiles(dt: number) {
    for (const pr of this.projectiles) {
      pr.x += pr.dx * dt;
      pr.z += pr.dz * dt;
      pr.life -= dt;
      if (pr.life <= 0) continue;
      if (this.grid.isSolidAt(pr.x, pr.z)) { pr.life = 0; continue; }
      for (const ped of this.peds) {
        if (ped.alive && this.dist2(ped.x, ped.z, pr.x, pr.z) < 0.5) {
          ped.alive = false; pr.life = 0; this.score += 10;
        }
      }
      for (const b of this.barrels) {
        if (b.alive && b.explodeTimer < 0 && this.dist2(b.x, b.z, pr.x, pr.z) < 0.7) {
          b.explodeTimer = 0.05; pr.life = 0;
        }
      }
      for (const v of this.vehicles) {
        if (v.alive && v.id !== this.player.inVehicle && this.dist2(v.state.x, v.state.z, pr.x, pr.z) < 2.5) {
          v.health -= pr.damage; pr.life = 0;
          if (v.health <= 0) { v.alive = false; this.score += 50; }
        }
      }
    }
    this.projectiles = this.projectiles.filter((p) => p.life > 0);
  }

  private stepBarrels(dt: number) {
    for (const b of this.barrels) {
      if (!b.alive || b.explodeTimer < 0) continue;
      b.explodeTimer -= dt;
      if (b.explodeTimer <= 0) {
        b.alive = false;
        const r2 = EXPLOSION_RADIUS * EXPLOSION_RADIUS;
        for (const ped of this.peds) {
          if (ped.alive && this.dist2(ped.x, ped.z, b.x, b.z) < r2) { ped.alive = false; this.score += 10; }
        }
        for (const v of this.vehicles) {
          if (v.alive && this.dist2(v.state.x, v.state.z, b.x, b.z) < r2) {
            v.health -= EXPLOSION_DAMAGE;
            if (v.health <= 0) v.alive = false;
          }
        }
        if (this.dist2(this.player.x, this.player.z, b.x, b.z) < r2 && this.player.inVehicle === null) {
          this.player.health -= EXPLOSION_DAMAGE;
        }
        for (const other of this.barrels) {
          if (other.alive && other.explodeTimer < 0 && this.dist2(other.x, other.z, b.x, b.z) < r2) {
            other.explodeTimer = 0.3;
          }
        }
      }
    }
  }

  private checkPickups() {
    if (this.player.inVehicle !== null) return;
    for (const pk of this.pickups) {
      if (!pk.taken && this.dist2(pk.x, pk.z, this.player.x, this.player.z) < 1.2) {
        pk.taken = true;
        this.player.weaponId = pk.weaponId;
        this.player.ammo += this.weaponConfigs[pk.weaponId].ammo;
      }
    }
  }
}
