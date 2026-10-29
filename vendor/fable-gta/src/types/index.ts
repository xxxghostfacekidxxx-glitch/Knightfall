export type TileTypeId =
  | 'road'
  | 'road_h'
  | 'road_v'
  | 'intersection'
  | 'sidewalk'
  | 'grass'
  | 'water'
  | 'building'
  | 'building_tall';

export interface TileType {
  id: TileTypeId;
  name: string;
  /** Height of the extruded box for this tile (0 = flat plane) */
  height: number;
  /** Default flat color used when no texture is uploaded */
  color: string;
  /** Optional procedural texture kind rendered to a canvas */
  texture: 'asphalt_h' | 'asphalt_v' | 'asphalt_x' | 'pavement' | 'grass' | 'water' | 'facade' | 'none';
  /** Whether vehicles/players collide with this tile */
  solid: boolean;
  /** Whether vehicles drive normally here (false = slowdown terrain) */
  drivable: boolean;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface PresetTransform {
  position: Vec3;
  /** Euler rotation in radians (Y is the main axis) */
  rotation: Vec3;
  scale: Vec3;
}

export type AssetCategory = 'player' | 'vehicle' | 'prop' | 'weapon';

export interface AssetPreset {
  id: string;
  name: string;
  category: AssetCategory;
  /** URL/path to a GLB. Empty string = use built-in procedural model */
  modelUrl: string;
  /** Built-in procedural model key used when modelUrl is empty */
  builtin: string;
  transform: PresetTransform;
}

export interface VehicleConfig {
  presetId: string;
  name: string;
  maxSpeed: number;
  maxReverseSpeed: number;
  acceleration: number;
  brakeForce: number;
  /** Turn rate at full speed, radians/sec */
  turnRate: number;
  /** Velocity damping per second when no input */
  friction: number;
  /** Lateral grip 0..1 (1 = rails, low = drifty) */
  grip: number;
  handbrakeGripMultiplier: number;
  /** Approx collision half-extents */
  halfExtents: { x: number; z: number };
}

export interface WeaponConfig {
  id: string;
  name: string;
  damage: number;
  /** Shots per second */
  fireRate: number;
  range: number;
  projectileSpeed: number;
  ammo: number;
}

export interface MapObjectPlacement {
  presetId: string;
  position: Vec3;
  rotationY: number;
  /** Vehicles only: spawn as AI traffic instead of parked */
  traffic?: boolean;
}

export interface MapData {
  name: string;
  width: number;
  height: number;
  /** Row-major tile ids, length = width * height */
  tiles: TileTypeId[];
  objects: MapObjectPlacement[];
  playerSpawn: { position: Vec3; rotationY: number };
  vehicleSpawns: MapObjectPlacement[];
  pedestrianSpawns: Vec3[];
}

export type GameMode = 'game' | 'editor' | 'config';

export interface PedestrianState {
  id: number;
  position: Vec3;
  heading: number;
  alive: boolean;
}

export interface TrafficCarState {
  id: number;
  presetId: string;
  position: Vec3;
  heading: number;
  speed: number;
  alive: boolean;
}
