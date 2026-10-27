# Gravewave: game-ready sprite pack

Original Ash-Fall / Knightfall SVG game assets live in `public/assets/arcade/gravewave/`. The manifest is `manifest.json` (16 sprites, 96×96 viewBox, transparent). Use these IDs: bone-drone, toxic-turret, void-eye, skull-missile, plasma-bolt, hex-flame, cinder-heart, bone-coin, chaos-shield, ghost-key, grave-platform, grave-crate, acid-spikes, neon-portal, impact-burst, warning-skull.

## Canvas integration

Add `<script src="/gravewave-sprites.js" defer></script>` to the game page. On initialization, call `await GravewaveSprites.preloadAll()` (or `await GravewaveSprites.preload('bone-drone')` for one sprite). During the draw loop call:

```js
GravewaveSprites.draw(ctx, 'bone-drone', enemy.x, enemy.y, 48, 48, {glow:'#ff55d8'});
GravewaveSprites.draw(ctx, 'plasma-bolt', shot.x, shot.y, 24, 24, {rotation:shot.angle});
```

`draw` returns `false` until the sprite loads, and automatically triggers loading. Coordinates are top-left. Available options: `alpha`, `glow`, `blur`, `rotation` (radians), `flipX`. The loader caches each image, handles loading failures, and never changes gameplay state or collision logic. Set hitboxes separately based on the game design; transparent margins are not collision boundaries.

For DOM usage, `GravewaveSprites.element('ghost-key')` returns an `HTMLImageElement`. Invalid IDs return `null`; they never form arbitrary paths. For metadata, fetch `/assets/arcade/gravewave/manifest.json`.

## Existing renderer

`ChaosSprites` in `public/arcade-sprites.js` remains unchanged and available for legacy atlas sprites. `GravewaveSprites` is additive and does not alter existing games. All files are static and require no additional Cloudflare services.

## Testing checklist

- Open Devil Tools and confirm all 16 previews and downloads work.
- Verify `GravewaveSprites.preloadAll()` resolves to sixteen `true` results.
- Draw a sprite at several sizes, rotations, and glow settings on desktop and mobile.
- Confirm games remain functional without the Gravewave loader loaded.
- Confirm no browser errors on missing sprite/network failures.
