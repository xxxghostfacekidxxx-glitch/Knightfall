# Open-source creature RPG intake (2026-10-29)

## Terravia — approved for hosted static build
- Source: https://github.com/maxgfr/terravia
- License: MIT, copyright 2026 Maxime Golfier. Upstream README says original creatures, designs, names and setting share the same license.
- Runtime: Vite/TypeScript, static browser app. Build with Node 22 and `npm ci && npm test -- --run --testTimeout=60000 && npm run build -- --base=/arcade/hosted/terravia/`.
- Deployment: `.github/workflows/import-terravia.yml` vendors the built static output under `public/arcade/hosted/terravia` and includes upstream license and commit SHA.
- First CI failures: root npm cache incorrectly referenced missing root lockfile; subsequently upstream world generation stress test exceeded Vitest's default 5s limit on CI. Both addressed in importer.
- Do not claim live until workflow, Pages deployment and gameplay are confirmed.
- Keep the original game and credits intact. Any Ash-Fall redesign should live in a separate dev copy.

## Monster Tamer — code approved, runtime and art not cleared
- Source: https://github.com/devshareacademy/monster-tamer
- MIT LICENSE applies to the repository's code.
- README explicitly says audio/image assets are omitted and must be downloaded separately. Do not assume those assets are MIT.
- index.html loads Phaser and WebFontLoader from CDNs; not offline-capable without bundling dependencies and checking their licenses.
- Do NOT import or publish a broken asset-less copy. For a playable Ash-Fall edition: obtain permitted assets or replace with Ash-Fall originals, vendor appropriately licensed JS dependencies, verify mobile controls, then build and test.

## Tuxemon — open-source but not a static web game
- Source: https://github.com/Tuxemon/Tuxemon
- Code: GPL-3.0; check artwork and other content licensing individually.
- Python desktop game; Cloudflare Pages cannot execute it as-is. Hosting a download requires preserving applicable GPL source and notices, not presenting a dead browser-play link.
- Keep as reference for creature progression, move variety, and evolution mechanics; no code copied into proprietary modules without a license review.

## SpiritCollector — source visible, license unverified
- Source: https://github.com/chrisdfennell/SpiritCollector
- No confirmed redistribution license. Do not mirror, rebrand or bundle until permission is documented.

## Integration policy
1. Only label a cabinet 'locally playable' after its built index and assets exist and a browser smoke test passes.
2. Separate third-party original copies from Ash-Fall experimental forks; retain attribution and license.
3. Offline God Mode packaging needs an explicit dependency audit and private R2 distribution; a browser-hosted game is not automatically an offline app.
4. Avoid Pokemon names, copyrighted monsters, sprites and music. Use original Ash-Fall monsters and art.
