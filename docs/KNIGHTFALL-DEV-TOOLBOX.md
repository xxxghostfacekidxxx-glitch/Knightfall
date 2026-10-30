# Knightfall developer toolbox

Project-wide reference for Ash-Fall / Knightfall. Last reviewed: 2026-10-30.

## Existing platform and tooling
- GitHub repository: xxxghostfacekidxxx-glitch/Knightfall
- Cloudflare Pages, Workers, and applicable D1/KV storage.
- Arcade catalog: public/arcade/catalog.json
- Automated tests: Playwright browser smoke tests, arcade asset doctor, catalog doctor, GitHub Actions.
- Existing game import tooling: scripts/advanced-games and scripts/import-advanced-static-games.sh.

## Tools to evaluate and integrate
| Tool | Purpose | Status |
| --- | --- | --- |
| Phaser | HTML5 2D games, animation, touch input | Candidate |
| Godot | Larger RPGs and browser exports | Candidate |
| Tiled | Tilemaps, collision, RPG world layouts | Candidate |
| LDtk | Level editor, structured entity and map data | Candidate |
| Vite | Static game bundling for Pages | Candidate |
| Playwright | Browser gameplay and mobile testing | Existing |
| Colyseus | Multiplayer rooms and synchronization | Candidate |
| Workbox | Offline cache and install support | Candidate |
| Cloudflare Durable Objects | Authoritative multiplayer state | Evaluate existing bindings |
| GitHub Actions | CI and automated quality checks | Existing |

## Standing engineering preference
For each relevant task, review the available tools and choose those best suited to the job. Prefer free Cloudflare-compatible solutions, mobile-friendly games, reusable code, legal asset licensing, reproducible builds, meaningful gameplay tests, and verified commits. Keep original and modified editions separate. Never report a game as working or deployed solely because it appears in the catalog. Avoid adding an unnecessary framework to a working game. Track which tools are only candidates versus genuinely installed and operational.

## Recommended applications
- Hell & High Orbit: Tiled or LDtk map pipeline, Phaser for new 2D modules only when justified.
- Sanctuary's End: improve and test existing renderer before considering a Godot rewrite.
- Arcade imports: Vite where needed, Playwright launch/input tests, asset and catalog doctors.
- Multiplayer: compare Durable Objects and Colyseus runtime requirements before committing.
- Offline Android: evaluate Workbox, storage limits, updates, and installability.

This document is the durable, recallable project inventory. Update it whenever a new tool is actually integrated.
