# Gravewave site-wide theme and sprite integration

## Scope

- `public/design-system.css`: canonical pink and acid-green design tokens.
- `public/neon-global.css`: shared neon overrides for legacy orange page styles.
- `public/nav.js`: loads neon CSS and Gravewave decoration script for pages that use shared navigation.
- `public/gravewave-decor.js`: adds decorative original SVGs to the shared footer, public headings, and supported game cards.
- Original characters: `public/assets/devil-tools/neon-nuisances/`.
- Game-ready sprites: `public/assets/arcade/gravewave/`.
- Gameplay sprite loader: `public/gravewave-sprites.js`.

## Visual behavior

The theme uses neon pink `#ff55d8`, acid green `#c6ff45`, dark purple-black `#070710`, and accessible light text. Decorative assets use local static files, are `aria-hidden`, do not accept pointer events, and respect reduced-motion settings. Only selected public pages receive heading/card decorations. Private messaging, accounts, admin, moderation, adult, vault, and editing paths are excluded from those decorations; shared footers may still display mascots.

No game logic or player state is modified. Existing game sprites continue to work; the new assets can be integrated into game canvases through `GravewaveSprites.draw`.

## Follow-up QA

1. Inspect login, community, profiles, messaging, arcade, shop, and Devil Tools on narrow and wide screens.
2. Check contrast, buttons, forms, nav dropdowns, profile customization, and custom theme precedence.
3. Verify sprite images load on Cloudflare Pages, including routes with nested URLs.
4. Audit remaining page-local orange inline styles and pages that do not load `nav.js`.
5. Verify gameplay canvas remains unobstructed, and reduced-motion works.
6. If Cloudflare Pages is deployed from the default branch, confirm the build and cache have updated before declaring the live site complete.

The shared styling is intentionally a broad pass, not a guarantee that every legacy inline color or independently styled page has been converted.
