# GTA-2W — GTA 2 Web Clone (Three.js)

> 🤖 **A Fable 5 experiment.** One of a handful of silly side projects I had **Fable 5** build before the model was banned. I wanted to see how good Fable really was at game design — so I handed it a concept (a top-down GTA 2 tribute) and let it run. It's a fun prototype, not a finished product; if Fable ever comes back, or I find the free time, I may pick it up and finish it.

A top-down arcade driving/action game in the spirit of **GTA 2**, running entirely in the browser. Drive cars with responsive arcade physics, hop out on foot, pick up weapons, blow up barrels, plow through traffic, and rack up score — all rendered in real-time 3D with a fixed top-down chase camera.

The whole game is **data-driven**: every gameplay value (map layout, tile types, vehicle handling, weapons, asset transforms) lives in editable JSON, and the project ships with two in-browser editors — an **Asset Editor** (position/scale any model, upload your own GLB) and a **Config menu** (swap tile textures, tune vehicle handling live). Maps can be authored visually in [Tiled](https://www.mapeditor.org/) and imported as `.tmj`.

## Tech stack

- **React 19** + **TypeScript** (strict)
- **Three.js** via **@react-three/fiber** + **@react-three/drei**
- **Zustand** for shared state / live config hot-apply
- **Vite** build tooling

> Requires a browser with **WebGL** enabled (any modern desktop browser).

## Features

- 🚗 Arcade top-down driving — accel, braking, reverse, drift, handbrake (per-vehicle tuning)
- 🚶 On-foot player with enter/exit any nearby vehicle
- 🔫 Weapons + instanced projectiles, ammo pickups
- 💥 Explosive barrels with chain reactions
- 🚦 Wandering pedestrians + AI traffic cars
- 🏙️ Instanced city map (one InstancedMesh per tile type) with live custom PNG textures
- 🎛️ In-browser Asset Editor (gizmo + sliders + GLB upload, hot-apply to game)
- 🗺️ Tiled `.tmj` map import
- ⚡ Stable 60 fps

## Run

```bash
npm install
npm run dev      # start dev server (Vite prints the local URL)
```

Then open the printed URL (default http://localhost:5173) in a WebGL-capable browser.

### Other commands

```bash
npm run build    # type-check + production build to dist/
npm run preview  # serve the production build locally
npm run lint     # ESLint
```

## Controls

| Key | Action |
|---|---|
| W/S or ↑/↓ | Walk / throttle & brake-reverse |
| A/D or ←/→ | Turn / steer |
| E | Enter / exit nearest vehicle |
| Space | Fire weapon (on foot) / handbrake (in vehicle) |

Walk over the pistol pickup to arm yourself. Run over pedestrians, shoot barrels, steal cars. Score in the HUD.

## Architecture

```
src/
  config/constants.ts    Single source for TILE_SIZE, WORLD_SCALE, camera, lighting
  types/                 Strict interfaces: MapData, AssetPreset, VehicleConfig, TileType, WeaponConfig
  data/                  ALL gameplay values live here (JSON, editable without code)
    map.json             City layout (string rows + legend), spawns, object placements
    tile-types.json      Tile definitions (height, color, texture kind, solid, drivable)
    vehicle-configs.json Handling per vehicle (speed, accel, turn rate, grip, ...)
    weapon-configs.json  Weapon stats
    asset-presets.json   Per-asset transform presets (the editor edits these)
  render/                SHARED rendering used by BOTH game and editor (Golden Rule)
    SceneEnvironment     Lighting rig
    TileMapMesh          One InstancedMesh per tile type; live PNG texture swap
    AssetInstance        Transform-wrapper spawn pattern (see below)
    builtinModels        Procedural placeholder models (replace via GLB upload)
  game/                  Pure logic, React-free: World class, vehicle physics, collision, input
  scenes/                GameScene (play) and EditorScene (preview — same components)
  ui/                    HUD, AssetEditorPanel, ConfigMenu
  tiled/importTiled.ts   Tiled .tmj importer
```

### Asset spawn pattern (mandatory)

```
outer Group   <- world position/rotation from map data
  preset Group <- preset transform from asset-presets.json (editor-adjusted)
    model       <- GLTF or builtin, never mutated
```

### Golden Rule

`EditorScene` renders with the exact same `SceneEnvironment`, `TileMapMesh`, `AssetInstance`, and constants as `GameScene`. An asset positioned in the editor looks identical in the game.

## Editors

- **Asset Editor**: pick any asset, upload a GLB, position with gizmo (translate/rotate/scale) or sliders, *Save & Apply to Game* hot-applies, reset to default, export/import presets JSON.
- **Config**: upload a PNG per tile type (live InstancedMesh material swap), tune vehicle handling live, export vehicle JSON.

## Tiled import (.tmj)

- Tile layer named `ground` with a layer property `legend` = JSON mapping gid → tile type id (e.g. `{"1":"road_h","2":"sidewalk"}`).
- Object layer named `objects`; object class = asset preset id, or special: `playerSpawn`, `vehicleSpawn` (properties `presetId`, `traffic`), `pedestrianSpawn`.
- 32 px in Tiled = one tile (TILE_SIZE world units).

## Performance

One InstancedMesh per tile type, instanced projectiles, ref-based per-frame transform sync (no React re-render per frame). Measured 60 fps.
