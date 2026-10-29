import { TILE_SIZE } from '../config/constants';
import type { MapData, TileType, TileTypeId } from '../types';

export class CollisionGrid {
  private solid: boolean[];
  private drivable: boolean[];
  readonly width: number;
  readonly height: number;

  constructor(map: MapData, tileTypes: TileType[]) {
    const byId = new Map<TileTypeId, TileType>(tileTypes.map((t) => [t.id, t]));
    this.width = map.width;
    this.height = map.height;
    this.solid = map.tiles.map((id) => byId.get(id)?.solid ?? true);
    this.drivable = map.tiles.map((id) => byId.get(id)?.drivable ?? false);
  }

  private index(wx: number, wz: number): number {
    const tx = Math.floor(wx / TILE_SIZE);
    const tz = Math.floor(wz / TILE_SIZE);
    if (tx < 0 || tz < 0 || tx >= this.width || tz >= this.height) return -1;
    return tz * this.width + tx;
  }

  isSolidAt(wx: number, wz: number): boolean {
    const i = this.index(wx, wz);
    return i === -1 ? true : this.solid[i];
  }

  isDrivableAt(wx: number, wz: number): boolean {
    const i = this.index(wx, wz);
    return i === -1 ? false : this.drivable[i];
  }

  /**
   * Circle-vs-grid resolve: returns corrected position.
   * Checks the 4 cardinal sample points of the circle.
   */
  resolveCircle(x: number, z: number, radius: number, prevX: number, prevZ: number): [number, number] {
    let nx = x;
    let nz = z;
    if (this.isSolidAt(nx + radius, nz) || this.isSolidAt(nx - radius, nz)) nx = prevX;
    if (this.isSolidAt(nx, nz + radius) || this.isSolidAt(nx, nz - radius)) nz = prevZ;
    if (this.isSolidAt(nx + radius * 0.7, nz + radius * 0.7) ||
        this.isSolidAt(nx - radius * 0.7, nz - radius * 0.7) ||
        this.isSolidAt(nx + radius * 0.7, nz - radius * 0.7) ||
        this.isSolidAt(nx - radius * 0.7, nz + radius * 0.7)) {
      nx = prevX;
      nz = prevZ;
    }
    return [nx, nz];
  }
}
