# Knightfall cinematic artwork pipeline

Last updated: 2026-11-14

## Shipped components

- Official brand crest: `public/icons/knightfall-crest-192.png` / `512.png` / maskable app icon.
- Two original concept art collections: `public/assets/knightfall/horror-space-characters.png` and `relics-and-icons.png`.
- Asset regions and category metadata: `public/assets/knightfall/manifest.json`. It currently indexes 16 character regions and 12 relic regions.
- Render API: `public/knightfall-art-runtime.js`. Game integrations should **opt in** and keep their original sprites as fallbacks.
- Creator preview/export: `public/creator-motion-preview.js` and `public/devil-tools.html#knightfall-art-collection`.
- Arcade cabinet artwork: `public/knightfall-arcade-covers.js`; does not change game controls or cards' destination URLs.
- City of Cinders: optional cinematic art for six established monsters. Gameplay unlocks, mutation modifiers and collision are unchanged.
- Not Dead Yet: optional cinematic enemy art, with original zombie sprite fallback.
- Cinder Crossing and Marshland Marksman: separate cosmetic motion settings.

## Rendering API

```js
import {loadKnightfallArt} from '/knightfall-art-runtime.js';
const art=await loadKnightfallArt();
art.draw(ctx,'bone-raccoon',x,y,w,h); // static crop
art.drawMotion(ctx,'bone-raccoon',x,y,w,h,{
  time:performance.now()/1000,
  state:'walk',              // idle, walk, run, jump, attack, hurt
  flipX:false,
  reducedMotion:window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  alpha:1,
  glow:false
});
```

The animation renderer transforms an existing **single-frame** original illustration by breathing, bobbing, leaning and stretching the image. It is **not** a new articulated walk cycle, a skeleton rig, or a multi-cel animation. The game owns collision boxes and scores. Motion drawing keeps image scaling smooth and restores Canvas state.

### Creator exports

1. Choose a character and pose in Motion Studio.
2. **Export PNG pose** saves a single transparent illustration.
3. **Export 8-frame PNG** exports eight transformed poses in a horizontal atlas, each 200x260 pixels.
4. **Frame JSON** exports matching frame coordinates, durations in milliseconds and export metadata. Save alongside the PNG.
5. To generate actual limb animation, create additional hand-drawn frames or a properly rigged character and review each new asset before use.

## Integration safety

- Do not replace sprite regions in an unrelated third-party/hosted game. Confirm permission and native dimensions first.
- If the async asset load fails or device is offline, continue running gameplay with original art.
- Do not apply smoothing rules globally to existing pixel-art games. Smooth the cinematic illustration only.
- Honor reduced-motion preferences for live game animations; static atlas exports may contain poses.
- Preserve gameplay hitboxes, movement speed, item values, timers, scoring and checkpoint keys when changing visual art.
- Ensure app and Creator publication privileges stay enforced in the backend. The Creator export tool is client-only.
- Avoid using or distributing exact copies of any recognizable franchise character, mask, weapon or logo. These artworks are original genre archetypes, not licensed franchise assets.

## Follow-on artwork work

- Create true articulated or frame-by-frame motion where justified, starting with playable characters and major boss enemies.
- Convert relic sheet crops into reviewed transparent files, with QA against adjacent bleed.
- Extend optional artwork modes to other original games one cabinet at a time, verifying mobile performance and touch controls.
- Profile large atlases on lower-memory mobile devices and progressively load only collections needed by the current game.
- Run `node --test scripts/knightfall-art-motion.test.mjs` and `node --test scripts/knightfall-art-rollout.test.mjs`, plus arcade regression workflows.
