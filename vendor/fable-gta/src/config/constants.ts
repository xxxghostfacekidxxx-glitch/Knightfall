// Single source of truth for world constants.
// Both GameScene and the Asset Editor preview MUST import from here.

export const TILE_SIZE = 4; // world units per map tile
export const WORLD_SCALE = 1; // global scale multiplier
export const PLAYER_HEIGHT = 1.8;
export const PLAYER_RADIUS = 0.4;

export const CAMERA = {
  /** Height of the top-down chase camera above the focus target */
  height: 26,
  /** Lag distance behind the target along -Z of travel */
  lag: 6,
  fov: 55,
  near: 0.1,
  far: 500,
  /** Smoothing factor for camera follow (per-second lerp rate) */
  followLerp: 4,
} as const;

export const LIGHTING = {
  ambientIntensity: 0.7,
  ambientColor: '#cfd8ff',
  sunIntensity: 1.6,
  sunColor: '#fff4e0',
  sunPosition: [40, 60, 25] as [number, number, number],
  shadowMapSize: 2048,
} as const;

export const PHYSICS = {
  fixedDelta: 1 / 60,
  maxSubSteps: 4,
} as const;
