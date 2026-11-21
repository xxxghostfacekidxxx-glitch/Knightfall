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

## Four-realm theme artwork expansion: Egyptian, Dark Lord, Korriban and Mustafar

The existing six original PNGs stay immutable. Seven additional high-resolution paintings are transferred by `.github/workflows/knightfall-theme-art-expansion-import.yml` and checksum-verified into `public/assets/knightfall/theme-collections/<collection>/`. The combined painting inventory is `manifest.json`, covering 13 preserved original images once the expansion import succeeds.

The **original SVG ornament kit** contains 32 independent scalable files, with **eight unique designs for each of four collections**:

| Collection | Signature materials | Vector components |
| --- | --- | --- |
| Egyptian Eclipse | Gold, turquoise, eclipse and winged solar/ankh geometry | header, frame, divider, corner, emblem, panel, button, side-rail |
| Dark Lord Ascendant | Brushed gunmetal, crimson energy and angular star-citadel geometry | header, frame, divider, corner, emblem, panel, button, side-rail |
| Korriban: Red Necropolis | Sandstone, iron and crimson tomb sigils | header, frame, divider, corner, emblem, panel, button, side-rail |
| Mustafar: Obsidian Forge | Black basalt, copper and volcanic fire sigils | header, frame, divider, corner, emblem, panel, button, side-rail |

These SVGs are actual vector graphics, not raster images wrapped in SVG. Each contains a unique abstract original crest, geometric engravings, gradients and ornamental lines, with no remote image links or scripts. The master inventory is `public/assets/knightfall/theme-collections/ornaments.json`.

### Creator Foundry use

Visit `/devil-tools.html#theme-art-collection` with a permitted Creator Foundry account. Filter by **collection** and **PNG / SVG**, preview the full original, download the file or copy a first-party path. The copied CSS option makes it easy to reuse artwork in an authorized style:

```css
.kf-themed-preview .ornament-banner {
  background: url("/assets/knightfall/theme-collections/korriban/svg/header.svg") center / 100% 100% no-repeat;
}
.kf-themed-preview .frame {
  background: url("/assets/knightfall/theme-collections/mustafar/svg/frame.svg") center / 100% 100% no-repeat;
}
```

The transparent frames and corners must not capture clicks or cover message bubbles. For decorative overlays use `pointer-events:none`, while always preserving content contrast. Header artwork and illustrations are separate sources. Do not precache all the full-resolution images into the PWA shell. Asset metadata does not grant permission to bypass moderation or expose private member uploads.

### Backups and guarantees

Both `scripts/knightfall-theme-art-import.mjs --verify` (immutable first six) and `scripts/knightfall-theme-art-expansion-import.mjs --verify` (seven additional paintings) validate offline by SHA-256 and image dimensions. `scripts/knightfall-theme-art.test.mjs` verifies all 13 PNGs plus all 32 SVG entries. The preservation vault's required file list includes all 45 art assets and both manifests. Creations Vault's scheduled GitHub archive includes these sources and their gallery code, subject to workflow success and artifact retention.

**Scope:** Korriban and Mustafar are user-selected collection labels for original dark-fantasy environments; this archive is not a licensed Star Wars art package. The artwork gallery and selector concept images are **not** proof that these site presets have been made switchable in the production Theme Forge.
