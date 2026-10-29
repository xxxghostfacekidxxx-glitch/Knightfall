import type { MapData, MapObjectPlacement, TileTypeId, Vec3 } from '../types';
import { TILE_SIZE } from '../config/constants';

// Tiled .tmj (JSON) importer.
// Conventions for the content team:
//  - One tile layer named "ground" whose tileset tile ids map to TileTypeId
//    via the tileset's per-tile "type"/"class" property, OR a layer property
//    "legend" = JSON object { "1": "road_h", ... } (gid -> tile type id).
//  - One object layer named "objects": each object's type/class = presetId.
//    Special types: "playerSpawn", "vehicleSpawn" (property presetId),
//    "pedestrianSpawn".

interface TmjLayer {
  type: 'tilelayer' | 'objectgroup';
  name: string;
  width?: number;
  height?: number;
  data?: number[];
  objects?: TmjObject[];
  properties?: { name: string; value: unknown }[];
}

interface TmjObject {
  type?: string;
  class?: string;
  x: number;
  y: number;
  rotation?: number;
  properties?: { name: string; value: unknown }[];
}

interface Tmj {
  width: number;
  height: number;
  layers: TmjLayer[];
}

function prop(obj: { properties?: { name: string; value: unknown }[] }, name: string): unknown {
  return obj.properties?.find((p) => p.name === name)?.value;
}

export function importTiledMap(tmj: Tmj, fallbackTile: TileTypeId = 'grass'): MapData {
  const ground = tmj.layers.find((l) => l.type === 'tilelayer' && l.name === 'ground');
  if (!ground?.data) throw new Error('Tiled map needs a tile layer named "ground"');

  const legendRaw = prop(ground, 'legend');
  if (!legendRaw) throw new Error('ground layer needs a "legend" property (gid -> tile type JSON)');
  const legend = JSON.parse(String(legendRaw)) as Record<string, TileTypeId>;

  const tiles: TileTypeId[] = ground.data.map((gid) => legend[String(gid)] ?? fallbackTile);

  const objects: MapObjectPlacement[] = [];
  const vehicleSpawns: MapObjectPlacement[] = [];
  const pedestrianSpawns: Vec3[] = [];
  let playerSpawn = { position: { x: TILE_SIZE, y: 0, z: TILE_SIZE }, rotationY: 0 };

  const objLayer = tmj.layers.find((l) => l.type === 'objectgroup' && l.name === 'objects');
  for (const o of objLayer?.objects ?? []) {
    const kind = o.class ?? o.type ?? '';
    // Tiled pixel coords -> world: assume tileset tile = 32px = one TILE_SIZE
    const wx = (o.x / 32) * TILE_SIZE;
    const wz = (o.y / 32) * TILE_SIZE;
    const rotY = -((o.rotation ?? 0) * Math.PI) / 180;
    if (kind === 'playerSpawn') {
      playerSpawn = { position: { x: wx, y: 0, z: wz }, rotationY: rotY };
    } else if (kind === 'vehicleSpawn') {
      vehicleSpawns.push({
        presetId: String(prop(o, 'presetId') ?? 'sedan'),
        position: { x: wx, y: 0, z: wz },
        rotationY: rotY,
        traffic: Boolean(prop(o, 'traffic') ?? false),
      });
    } else if (kind === 'pedestrianSpawn') {
      pedestrianSpawns.push({ x: wx, y: 0, z: wz });
    } else if (kind) {
      objects.push({ presetId: kind, position: { x: wx, y: 0, z: wz }, rotationY: rotY });
    }
  }

  return {
    name: 'tiled-import',
    width: tmj.width,
    height: tmj.height,
    tiles,
    objects,
    playerSpawn,
    vehicleSpawns,
    pedestrianSpawns,
  };
}
