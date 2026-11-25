# Knightfall Theme Kit System

**Last updated:** November 21, 2026  
**Source of truth:** one `main` branch. Files remain backed up in the Creator's Foundry Creations Vault.

## Switch a live theme

1. Open **[Eye of Chaos / Theme Forge](https://ash-fall.com/theme-crew.html)** as a verified Osiris/GOD or delegated Isis account.
2. Select **Knightfall / Shared** to change the public site's main theme, or select a specific realm: Madhouse, Chaos Cartridge, Chaosphere, or Eye of Chaos.
3. Choose **Original Art Realms**. Nine art-backed presets are available: **Egyptian Eclipse**, **Dark Lord Ascendant**, **Korriban · Red Necropolis**, **Mustafar · Obsidian Forge**, **Jedi Sanctuary**, **Neon Dystopia**, **The Asylum**, **Arcade Anarchy**, and **Astral Dominion**. Selecting a card previews it for your browser session, without publication.
4. Select **Open selected realm preview**, or **Publish selected realm** if you hold verified publisher permission. Publication requires confirmation and an expected-revision check. The previous preset remains available through **Rollback last change**.
5. Switch to **Classic Styles** to access existing Blood Moon, Verdant Crypt, Iron Eclipse, Royal Abyss, and Black Sun Temple. **All Reviewed Themes** shows every preset.

Theme switching never uploads, replaces, or deletes original artwork. Switching does not grant access to admin-only controls. Existing full-page canvas games, member-created profile themes, and private message content retain their independent styling. The currently published Egyptian Eclipse main-site theme is not overridden simply by adding these other presets.

## The four original-art recipes

| Theme preset | Preserved painting collection | Shared UI vector kit |
| --- | --- | --- |
| `egyptian_eclipse` | `egyptian-eclipse` / 4 PNGs | 8 Egyptian SVGs, standalone Egyptian finish |
| `dark_lord_ascendant` | `dark-lord-ascendant` / 3 PNGs | 8 crimson gunmetal SVGs |
| `korriban_necropolis` | `korriban` / 1 PNG | 8 crimson sandstone SVGs |
| `mustafar_forge` | `mustafar` / 1 PNG | 8 lava/obsidian SVGs |

All eight vector roles are used by each design: **header**, **frame**, **divider**, **corner**, **emblem**, **panel**, **button**, and **side-rail**. The four art collections are first-party original dark-fantasy environments, not licensed franchise artwork.

**Asset library:** `public/assets/knightfall/theme-collections/`. The high-resolution images are not bundled into every mobile PWA shell. The initial HTML and art collection selector can render quickly, while actual artwork loads as needed.

## Five recovered theme packs

The recovered artwork archive adds **Jedi Sanctuary**, **Neon Dystopia**, **The Asylum**, **Arcade Anarchy**, and **Astral Dominion**. Each pack preserves three exact archive files: a WebP asset sheet, a WebP environment preview, and a PNG original sheet. The existing five SVG components per pack (header ornament, alternate header, card border, corner, and panel frame) are also indexed in `recovered-artwork-manifest.json` and shown in the Creator Foundry vault.

The five previews are wired into Theme Forge thumbnails and the shared art-theme background tokens. `Jedi Sanctuary` supplies a visual style for the Force Realms' Jedi Temple; it does not change the separate Jedi and Sith teaching areas or the shared Force Library. The Force Realms remain an independent spiritual and fan community, distinct from the theme artwork.

`scripts/knightfall-recovered-theme-art-import.mjs --import --archive <zip>` checks the archive member list and each SHA-256 before preserving exact files. `--verify` checks the tracked images, SVGs, and combined vault manifest offline. The new images are loaded on demand and remain outside PWA install-time precache.

## Build a new theme without copying CSS

The files are intentionally split:

- `theme-recipes.json`: the single original-art **design recipe catalog**, with name, identity, palette, hero, background, and picture lineup.
- `manifest.json` and `ornaments.json`: immutable-preserved original media and SVG indexes. They must contain each file before it can be used in a recipe.
- `knightfall-art-theme-variables.css`: generated from the recipe catalog; never edit it by hand.
- `knightfall-art-theme-template.css`: **shared layout and ornament composition**, reused across any future art theme.
- `knightfall-art-theme-showcase.js`: reads the catalog to render an original-art gallery safely on the homepage, without inserting untrusted HTML.
- `egyptian-eclipse-theme.css`: protected standalone Egyptian skin, preserved to avoid regressions.
- `scripts/build-knightfall-theme-kits.mjs`: validates all registered original PNG/SVG assets and produces/compares the generated CSS.
- `scripts/scaffold-knightfall-theme.mjs`: constructs a new kit recipe from an existing saved original-art collection.

**Template:** download `/assets/knightfall/theme-collections/theme-blueprint-template.json` through Creator's Foundry.

A new theme must contain at least one original PNG in the paintings inventory and the eight original SVG ornaments in the ornaments inventory. After registering those sources:

```bash
# Preview a theme recipe without modifying anything:
node scripts/scaffold-knightfall-theme.mjs \
  --preset=moonlit_ruins \
  --collection=moonlit-ruins \
  --name="Moonlit Ruins"

# After inspecting the preview, append the recipe and generate token CSS:
node scripts/scaffold-knightfall-theme.mjs \
  --preset=moonlit_ruins \
  --collection=moonlit-ruins \
  --name="Moonlit Ruins" --write

# Verify exactly reproducible CSS and all saved originals:
node scripts/build-knightfall-theme-kits.mjs --check
node --test scripts/knightfall-art-themes.test.mjs
```

The scaffold is not an authorization bypass. **A human reviewer must still register the new preset in three places**: `THEME_CREW_PRESETS` in `backend/src/theme-crew.js`, `KNOWN` and `ART_KITS` in `public/theme-crew-runtime.js`, and `PREVIEW_ART` and `ART_THEMES` in `public/theme-crew-ui.js`. Those explicit allowlists are deliberate: no member-supplied JSON or bot-generated theme gets live publication privilege by merely existing in the artwork catalog.

After review and tests, deploy **Worker and Pages**, confirm both SHA/release results, then publish through the authenticated Theme Forge.

## Quality checks and rollback

```bash
node --test backend/src/theme-crew.test.mjs
node --test scripts/theme-forge-fast-switch.test.mjs
node --test scripts/realm-theme-engine.test.mjs
node --test scripts/egyptian-eclipse-theme.test.mjs
node --test scripts/knightfall-art-themes.test.mjs
node --test scripts/theme-style-ownership.test.mjs
node scripts/build-knightfall-theme-kits.mjs --check
node scripts/pages-release-guard.mjs
```

The release guard blocks Pages deployment on missing original artwork, malformed templates, runtime/backend preset drift, unsafe style ownership, or missing generated art tokens. The GitHub vault workflow archives the preserved art and template files and rejects unreviewed deletion. Cloudflare Pages and GitHub Actions are separate; neither is proof of a change to the live server until their exact success is verified.

**Existing themes stay intact:** the shared template does not replace the Egyptian design or legacy classic presets. All new themes use ordinary scoped CSS (no additional forced specificity), and decorative overlays have `pointer-events:none`. Users can switch the main shared realm once or leave individual realms with their own published selections. Rollback goes to the previous approved preset for the selected realm.

**Limits:** A design recipe does not create new original images automatically. It reuses artwork that has already been saved and verified. The template does not create an unrestricted CSS editor or give Miss Chaos autonomous publication rights.
