# Ash-Fall arcade: first-party verification queue

Updated 2026-10-26. This is a technical triage record, **not a copyright clearance or proof of authorship**.

## Scope

The original-creations catalog contains 104 entries. Its current metadata groups 55 as previously committed implementations pending browser QA, 20 as newly authored/replaced engines (including Cinder Lander), and 29 with unresolved source/asset provenance. The 29 were inspected at the game-page level.

All 29 inspected pages load no remote JavaScript URLs and contain no iframe gameplay. This is only evidence of local hosting; copied code and unlicensed bundled assets are still possible. The existing `scripts/arcade-provenance-audit.mjs --report` performs a broader hash/reference inventory. The new `scripts/arcade-provenance-runtime.test.mjs` checks script syntax and local dependencies, and is included in the arcade CI fleet.

## Review queue

### Tier 1: verify source history and licensing before claiming originality

- Existing SVG-art integration, 10: `cinder-crossing`, `afterburn-breakout`, `hexa-havoc`, `last-ember`, `cinder-hopper`, `lift-riot`, `ashen-blocks`, `skyline-foundry`, `particle-panic`, `ashen-dominion`.
- Emblem-only integration, 6: `cinder-circuit`, `hexforge-command`, `neon-mahjong`, `ruinwalkers`, `burrow-blitz`, `endless-runner`.
- Cataloged, 13: `bubble-barrage`, `cinder-chess`, `tether-tangle`, `space-fighter`, `glitch-munch`, `rift-wardens`, `colossus-clash`, `rooftop-riot`, `marshland-marksman`, `particle-clicker`, `cube-composer`, `skifree`, `ball-and-wall`.

For each: inspect first introduction commit and any copied files, identify upstream sources and licenses, review every bundled image/audio/font, preserve required notices, and replace code or assets only where needed. An original emblem does not make an imported engine original.

### Tier 2: scoring integration

- `cinder-crossing`, `afterburn-breakout`, `colossus-clash`, `marshland-marksman`, and the four `ashfall-mini-games.js` cartridges use `/arcade-save.js` without the generic account bridge. Inspect their direct score submission paths before adding any bridge, to avoid double submissions.
- The other 21 provenance-pending pages currently load the account bridge. Verify actual `data-game-id` values, score selectors, and run-completion signals in a browser.

### Tier 3: browser QA

Test desktop and mobile: start/restart, controls, scoring, game-over, high-score persistence, sign-in/out, navigation, asset 404s, and pause/resume. Use the ten-user test fleet where supported. **Do not mark a game production-verified based on static tests alone.**

## Release rule

A game may be marked **independently authored and production verified** only after (1) code and asset origin review, (2) appropriate license/notice handling, (3) automated tests, and (4) real browser/mobile verification. A local-hosted page or a passing JavaScript parser is insufficient.
