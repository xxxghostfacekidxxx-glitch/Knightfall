import { create } from 'zustand';
import type {
  AssetPreset,
  GameMode,
  MapData,
  TileType,
  TileTypeId,
  VehicleConfig,
  WeaponConfig,
} from '../types';
import tileTypesJson from '../data/tile-types.json';
import vehicleConfigsJson from '../data/vehicle-configs.json';
import weaponConfigsJson from '../data/weapon-configs.json';
import assetPresetsJson from '../data/asset-presets.json';
import { defaultMap } from '../game/mapLoader';

interface GameStore {
  mode: GameMode;
  setMode: (m: GameMode) => void;

  map: MapData;
  setMap: (m: MapData) => void;

  tileTypes: TileType[];
  /** Object URLs for user-uploaded tile textures, keyed by tile type id */
  tileTextureOverrides: Partial<Record<TileTypeId, string>>;
  setTileTextureOverride: (id: TileTypeId, url: string | null) => void;

  presets: Record<string, AssetPreset>;
  updatePreset: (preset: AssetPreset) => void;
  resetPreset: (id: string) => void;
  importPresets: (presets: AssetPreset[]) => void;

  vehicleConfigs: Record<string, VehicleConfig>;
  updateVehicleConfig: (cfg: VehicleConfig) => void;

  weaponConfigs: Record<string, WeaponConfig>;

  /** Editor: which preset is open */
  editingPresetId: string;
  setEditingPresetId: (id: string) => void;

  /** Bumped to force GameScene asset respawn after preset save */
  presetVersion: number;
  bumpPresetVersion: () => void;
}

const defaultPresets = Object.fromEntries(
  (assetPresetsJson as AssetPreset[]).map((p) => [p.id, p]),
);

function clonePreset(p: AssetPreset): AssetPreset {
  return JSON.parse(JSON.stringify(p)) as AssetPreset;
}

export const useGameStore = create<GameStore>((set) => ({
  mode: 'game',
  setMode: (mode) => set({ mode }),

  map: defaultMap,
  setMap: (map) => set({ map }),

  tileTypes: tileTypesJson as TileType[],
  tileTextureOverrides: {},
  setTileTextureOverride: (id, url) =>
    set((s) => {
      const next = { ...s.tileTextureOverrides };
      if (url === null) delete next[id];
      else next[id] = url;
      return { tileTextureOverrides: next };
    }),

  presets: Object.fromEntries(
    Object.entries(defaultPresets).map(([k, v]) => [k, clonePreset(v)]),
  ),
  updatePreset: (preset) =>
    set((s) => ({ presets: { ...s.presets, [preset.id]: preset } })),
  resetPreset: (id) =>
    set((s) => {
      const original = defaultPresets[id];
      if (!original) return s;
      return { presets: { ...s.presets, [id]: clonePreset(original) } };
    }),
  importPresets: (list) =>
    set((s) => ({
      presets: {
        ...s.presets,
        ...Object.fromEntries(list.map((p) => [p.id, p])),
      },
    })),

  vehicleConfigs: Object.fromEntries(
    (vehicleConfigsJson as VehicleConfig[]).map((c) => [c.presetId, c]),
  ),
  updateVehicleConfig: (cfg) =>
    set((s) => ({
      vehicleConfigs: { ...s.vehicleConfigs, [cfg.presetId]: cfg },
    })),

  weaponConfigs: Object.fromEntries(
    (weaponConfigsJson as WeaponConfig[]).map((w) => [w.id, w]),
  ),

  editingPresetId: 'sedan',
  setEditingPresetId: (editingPresetId) => set({ editingPresetId }),

  presetVersion: 0,
  bumpPresetVersion: () => set((s) => ({ presetVersion: s.presetVersion + 1 })),
}));
