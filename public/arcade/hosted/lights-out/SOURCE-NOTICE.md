# Lights Out: upstream source notice

- Upstream project: https://github.com/mashukui/web-games
- Upstream file: `lights-out/index.html`
- License: MIT
- Copyright: © 2026 mashukui (马哥python说). See `LICENSE.txt`.
- Local file: `/arcade/hosted/lights-out/index.html`

## Changes for Ash-Fall

- Preserved the upstream Lights Out puzzle logic and generated solvable boards.
- Removed the shared upstream `i18n.js` dependency, which also bootstraps third-party analytics.
- Added a local English text fallback.
- Applied the Ash-Fall dark pink/green cabinet skin and replaced the upstream collection footer.
- Namespaced local best-score and board-size storage keys.
- Added optional account leaderboard submissions when a puzzle is solved. Faster solutions earn more points; the attached summary includes board size, moves, par, and stars.
- No external game assets are required.

This is an adapted upstream import, not an original Ash-Fall reimplementation. The upstream MIT license is retained.
