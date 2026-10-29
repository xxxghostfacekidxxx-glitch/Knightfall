import type { MapData, TileTypeId, MapObjectPlacement, Vec3 } from '../types';
import rawMap from '../data/map.json';

interface RawMapJson {
  name: string;
  legend: Record<string, TileTypeId>;
  rows: string[];
  playerSpawn: { position: Vec3; rotationY: number };
  objects: MapObjectPlacement[];
  vehicleSpawns: MapObjectPlacement[];
  pedestrianSpawns: Vec3[];
}

export function parseMap(raw: RawMapJson): MapData {
  const height = raw.rows.length;
  const width = raw.rows[0].length;
  const tiles: TileTypeId[] = [];
  for (const row of raw.rows) {
    if (row.length !== width) {
      throw new Error(`Map row length mismatch: expected ${width}, got ${row.length} in "${row}"`);
    }
    for (const ch of row) {
      const tile = raw.legend[ch];
      if (!tile) throw new Error(`Unknown map legend char "${ch}"`);
      tiles.push(tile);
    }
  }
  return {
    name: raw.name,
    width,
    height,
    tiles,
    objects: raw.objects,
    playerSpawn: raw.playerSpawn,
    vehicleSpawns: raw.vehicleSpawns,
    pedestrianSpawns: raw.pedestrianSpawns,
  };
}

export const defaultMap: MapData = parseMap(rawMap as RawMapJson);
