# Chaos Cartridge Sprite System

The shared neon sprite set lives in `public/assets/arcade/chaos-sprite-sheet.svg` (the labeled workshop sheet) and `public/assets/arcade/chaos-sprite-atlas.svg` (transparent 12 × 2 atlas used by gameplay).

## Runtime

- `public/arcade-sprites.js` exposes `window.ChaosSprites`.
- `ChaosSprites.draw(ctx, name, x, y, width, height, options)` draws a sprite without changing game state.
- `ChaosSprites.burst(ctx, x, y, frame, scale)` draws a small decorative effect.
- Pixel smoothing is disabled only inside the sprite draw operation and restored by canvas state save/restore.
- The helper also decorates arcade cartridge cards with small sprite stamps.

Sprite names: `imp`, `skull`, `glitch`, `heart`, `coin`, `bolt`, `boom`, `fish`, `jelly`, `cannon`, `bat`, `crown`, `orb`, `rocket`, `crab`, `portal`, `skullfish`, `heartbreak`, `star`, `bug`, `flame`, `diamond`, `trophy`, and `eye`.

## Integrated game pages

- `arcade-originals.html`: rocket sprite for Ashes of the Void.
- `arcade-fresh-meat.html`: scrap pickups in Graveyard Shift.
- `arcade-after-dark.html`: snake head/food, Breakout ball, and Pong ball.
- `arcade-vault.html`: Ember Breaker orb.
- `arcade-games.html`: Cinder Clicker flame and original sprite pairs in Madhouse Memory; the Whack-a-Glitch target uses the glitch sprite.
- `abyssal-arsenal.html`, `neon-kelp-reef-rush.html`, and `magma-trench-relic-hunt.html`: fish/boss sprite badges.
- `not-dead-yet.html`: medkit, shield, and scrap pickup sprites; its dedicated character and enemy artwork remains in place.
- `city-of-cinders.html`: character flame accent.
- Arcade index, mini-game, open-source, card-room, Spades, card-expansion, and casino pages load the shared neon theme and animated sprite-card decoration. The card stamps are decorative and do not cover interactive controls.

## Devil Tools

`public/devil-tools.html` is an administrator-only workshop. It provides the sprite catalog, preview effects, speed and scale controls, local image inspection, atlas diagnostics, full-sheet export, individual transparent SVG export, and PNG preview export. Local uploads remain in the browser; they are not silently published to production.

## Safety and testing notes

The renderer is visual-only and does not change scores, balances, saves, collision boxes, or game controls. JavaScript syntax checks should be run against the modified game pages before deployment. A live browser and Cloudflare Pages deployment test is still required to verify image loading, layout, and gameplay in production.
