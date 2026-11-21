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

## Workflow

1. Create/edit the source art in Pixelorama, LibreSprite, Krita, or Blender.
2. Export transparent PNG sprite sheets or optimized SVG/PNG assets as appropriate.
3. Store source files separately from web exports when practical.
4. Add attribution/license metadata to the asset manifest.
5. Integrate the exported assets and test at native size, mobile scale, and fullscreen.
6. Check frame timing, memory use, image dimensions, and keyboard/touch behavior before release.

## Original Egyptian Eclipse and Dark Lord Ascendant artwork (2026-11-20)

The original six PNG files are saved in `public/assets/knightfall/theme-collections/`, separated by named collections and inventoried in `manifest.json` with SHA-256 checksums, dimensions, and original roles.

| Art set | Files | Usage |
| --- | ---: | --- |
| Egyptian Eclipse | 3 | Cinematic temple hero, celestial throne background, preview concept |
| Dark Lord Ascendant | 2 | Original dark space-opera figure and crimson command chamber |
| Theme Forge selector concept | 1 | Design reference for future selectable site themes |

In the **Creator Foundry**, staff and authorized Digital Creators can open **Original Theme Artwork Vault**, filter the six originals, preview high-resolution art, download local files, and copy first-party asset paths. This is separate from `Site Image Library`'s member R2 uploads, which are not automatically backed up by Git.

The actual original files were imported by `.github/workflows/knightfall-theme-art-import.yml` from durable transport copies, with exact-byte checksum and dimensions verification. `scripts/knightfall-theme-art-import.mjs --verify` runs offline and fails if anything changes. `scripts/knightfall-theme-art.test.mjs` tests the Foundry gallery, permissions, all six PNG hashes, and path safety. These files and the gallery code are in the Knightfall Creations Vault's required-preservation set, and are included in its recoverable archives.

**Important:** artwork previews do not make these new named designs an active Theme Forge preset. Theme publication must follow the existing reviewed palette, realm isolation, access, rollback, and visual-testing workflow. The dark-lord collection uses original character art and a descriptive generic name, not official franchise imagery or logos. Large full-resolution originals intentionally stay out of the PWA's install-time precache to avoid 14 MB of needless downloads.
