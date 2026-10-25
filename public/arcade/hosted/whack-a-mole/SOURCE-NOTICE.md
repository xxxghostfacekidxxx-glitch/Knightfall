# Whack-a-Mole: upstream source notice

- Upstream project: https://github.com/mashukui/web-games
- Upstream file: `whack-a-mole/index.html`
- License: MIT
- Copyright: © 2026 mashukui (马哥python说). See `LICENSE.txt`.
- Local file: `/arcade/hosted/whack-a-mole/index.html`

## Changes for Ash-Fall

- Preserved the upstream single-file reaction game, mole/star/bomb scoring, spawn pacing, and synthesized sound effects.
- Removed the upstream shared `i18n.js` dependency, which also initializes third-party analytics.
- Added a local English text fallback.
- Applied the Ash-Fall dark pink/green cabinet theme and replaced the upstream collection footer.
- Namespaced the local best-score key.
- Added optional account leaderboard reporting at the end of a round, with score, hits, bomb count, and round duration. Submitted score is clamped to the backend's 1,000-point limit.
- No external game assets are required.

This is an adapted upstream import, not an original Ash-Fall reimplementation. The upstream MIT license is retained.
