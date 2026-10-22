# Ash-Fall Creator Foundry

The admin-facing launchpad is `public/dev-toolkit.html`. God account and administrator access is checked against `GET /api/auth/me`; it is a curated external-tool directory, not a server-side sandbox.

## Recommended production toolchain

| Tool | Best use | Project/source | License note |
|---|---|---|---|
| Pixelorama | Primary pixel-art and sprite animation | https://github.com/Orama-Interactive/Pixelorama | MIT |
| LibreSprite | Sprite sheets and frame animation | https://github.com/LibreSprite/LibreSprite | GPL-2.0 |
| Piskel | Fast browser-based pixel sprites | https://github.com/piskelapp/piskel | Apache-2.0 |
| Krita | Painted concept art and detailed backgrounds | https://github.com/KDE/krita | GPL-3.0-or-later |
| Tiled | Tile maps and layered environments | https://github.com/mapeditor/tiled | Check current release license |
| LDtk | Structured 2D level design | https://github.com/deepnight/ldtk | Check current release and dependency licenses |
| Blender | 3D models, props, lighting, sprite renders | https://github.com/blender/blender | GPL-3.0-or-later |
| Godot | Larger standalone 2D/3D games | https://github.com/godotengine/godot | MIT |
| Audacity | Sound effects and audio editing | https://github.com/audacity/audacity | GPL-3.0-or-later |
| Kenney | UI, icons, environment and prototype assets | https://kenney.nl/assets | License varies by pack; many packs are CC0 |
| OpenGameArt | Community sprites, tiles, effects and audio | https://opengameart.org/ | License varies by individual asset |
| itch.io assets | Specialist sprite, background, sound and UI packs | https://itch.io/game-assets | Creator-specific; free does not imply reusable |

## Integration policy

- Do not commit third-party application binaries or entire editor source trees into the production `public/` directory. It bloats the site, creates update/security overhead, and can accidentally redistribute code under incompatible terms.
- Use the linked official release/source pages to install desktop tools locally. Use browser editors only through their official sites.
- Import only the assets we actually choose for a game into `public/assets/`, with optimized sizes and transparent backgrounds where appropriate.
- Keep an asset manifest for every imported third-party item with: asset name, author, original URL, download date, exact license, required attribution, modifications, and games using it.
- Preserve each editor's source/license notices if redistributing its code. The editor's license does not automatically apply to artwork made with it.
- Run imported SVGs through review and sanitize untrusted SVG markup before use. Do not use remote image URLs as permanent production dependencies.
- Keep the existing browser games on HTML/CSS/JavaScript unless a specific game has a justified migration plan. Godot is an option for future standalone titles, not a mandatory rewrite.

## Current Knightfall asset areas

- `public/assets/arcade/`: existing original SVG arcade assets.
- `public/abyssal-arsenal.html`: Abyssal Arsenal fish table.
- `public/neon-kelp-reef-rush.html`: Neon Kelp Reef Rush.
- `public/magma-trench-relic-hunt.html`: Magma Trench Relic Hunt.

## Workflow

1. Create/edit the source art in Pixelorama, LibreSprite, Krita, or Blender.
2. Export transparent PNG sprite sheets or optimized SVG/PNG assets as appropriate.
3. Store source files separately from web exports when practical.
4. Add attribution/license metadata to the asset manifest.
5. Integrate the exported assets and test at native size, mobile scale, and fullscreen.
6. Check frame timing, memory use, image dimensions, and keyboard/touch behavior before release.
