# 2048 upstream import record

- Upstream repository: https://github.com/gabrielecirulli/2048
- Source branch: `master`; tree commit observed during retrieval: `478b6ec346e3787f589e4af751378d06ded4cbbc`.
- License: MIT, copyright (c) 2014 Gabriele Cirulli. Full license text is retained in `LICENSE.txt`.
- Retrieved upstream runtime files: keyboard input manager, HTML actuator, grid, tile, local storage manager, game manager, and application bootstrap. Their contents are combined in `game-engine.js`, with source-file boundary comments retained.
- Styling and wrapper: replaced the upstream presentation with Knightfall's pink/green Chaos Cartridge styling. No upstream images, audio, icon, or font assets are redistributed; no font CDN is loaded.
- Dependencies: static HTML/CSS/JavaScript only; no package install, remote runtime CDN, or server process.
- Security boundary: client-only legacy game runtime. It receives no account tokens and has no Cinders/wallet API. It cannot award currency. Local storage is browser-scoped.
- Limitations: no authenticated account save, cross-device progress, or server-side leaderboard integration. Verify keyboard and touch controls in production browsers after deployment.
- Attribution and license must remain with redistributed source.
