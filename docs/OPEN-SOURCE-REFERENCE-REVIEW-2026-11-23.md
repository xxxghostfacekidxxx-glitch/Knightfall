# Knightfall source and reference review · 2026-11-23

This is a repository-level review, **not** a legal opinion or an assertion that upstream projects were reverified online today. Existing catalog license labels are provisional until the exact upstream revision, dependency tree and media licenses are checked.

## Deployment boundary

Knightfall runs on Cloudflare Pages and Workers. A game, PHP panel, Docker service, or JVM application is **not** automatically deployable to that runtime. Do not import upstream code, images, music, fonts, trademarks or database contents based on a catalog entry.

| Source | Current use | Release decision | Required before import |
| --- | --- | --- | --- |
| Mindustry | Mechanics and game-system reference | Reference only | Confirm upstream GPL terms, engine feasibility, art and dependencies |
| BrowserQuest Solo | Local hosted game | Existing import; audit ongoing | Confirm bundled license and third-party sprites/audio |
| OpenFront Solo | Local hosted game | Existing import; audit ongoing | Review both LICENSE and LICENSE-ASSETS and dependencies |
| Terravia | Local hosted game | Existing import; audit ongoing | Confirm upstream version, license and assets |
| Freeciv | Historical/research reference | No new import authorized | Verify version-specific GPL and architecture |
| Pterodactyl | Game-server administration reference | Reference only | Requires external service; verify notices, security and trademark use |
| Pelican | Game-server administration reference | Reference only | Review AGPL/network obligations and separate hosting |
| Umami | Analytics interface reference | Reference only | Check current source and license; privacy, telemetry and Workers compatibility |
| Elgg | Social platform architecture reference | Reference only | Review PHP architecture and current license |
| Flarum | Forum UX architecture reference | Reference only | Review PHP architecture, extension ecosystem and current license |

## Source-of-truth artifacts

- `toolkit/catalog.json`: research candidates and no-automatic-deployment policy.
- `toolkit/LICENSE-REVIEW.md`: notice, asset, security and hosting review requirements.
- `public/arcade/import-manifest.json`: actual imported, original and not-yet-imported games.
- `public/arcade/arcade-license-guide.html`: public source transparency.
- `public/arcade/hosted/**/LICENSE*`: preserved notices for local hosted games.
- `scripts/knightfall-provenance-support.test.mjs`: CI checks for provenance boundaries.

## Release checklist

1. Record exact upstream URL, immutable commit and source archive checksum.
2. Inspect license texts for code, dependencies, assets, fonts and sound separately.
3. Document source changes and required notices, attribution and source-offer obligations.
4. Confirm compatibility with Pages/Workers or explicitly design a separately hosted service.
5. Check security, data collection, account integration, maintenance and accessibility.
6. Obtain project-owner approval before changing a reference-only item to imported.
7. Test production behavior and keep the public provenance manifest accurate.

## Donations

`public/support.html` currently points to external Ko-fi and Cash App destinations. The code confirms link syntax and transparent wording, **not** account ownership. Owner must sign in to both providers and independently verify the actual payee, payout account, provider availability and payment processing before marking task #123 complete. Donations do not grant site privileges or digital items.

## CI evidence

The November 23 regression workflow at commit `1a4b69b0` passed its new social/provenance suite and CSS route inventory, but failed a separate legacy Digital Creator role assertion. A follow-up role-test commit `7ce65c468` exists; rerun evidence is required. Runtime smoke and theme-crew workflows still have independent failures and must not be marked verified.
