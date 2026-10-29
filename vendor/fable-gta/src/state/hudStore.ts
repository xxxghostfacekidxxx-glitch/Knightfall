import { create } from 'zustand';

export interface HudState {
  health: number;
  weapon: string | null;
  ammo: number;
  score: number;
  inVehicle: boolean;
  speed: number;
}

interface HudStore extends HudState {
  update: (s: HudState) => void;
}

export const useHudStore = create<HudStore>((set) => ({
  health: 100,
  weapon: null,
  ammo: 0,
  score: 0,
  inVehicle: false,
  speed: 0,
  update: (s) => set(s),
}));
