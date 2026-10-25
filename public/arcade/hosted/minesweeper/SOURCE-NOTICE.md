# Minesweeper: upstream source notice

- Upstream project: https://github.com/mashukui/web-games
- Upstream file: `minesweeper/index.html`
- License: MIT
- Copyright: © 2026 mashukui (马哥python说). See `LICENSE.txt`.
- Local file: `/arcade/hosted/minesweeper/index.html`

## Changes for Ash-Fall

- Preserved upstream first-click-safe mine placement, flood-fill reveal, chord reveal, difficulty settings, timer, and mobile long-press flag handling.
- Removed the upstream shared `i18n.js` dependency, which also initializes third-party analytics.
- Added a local English text fallback.
- Applied the Ash-Fall dark pink/green cabinet theme and replaced the upstream collection footer.
- Namespaced local best-time keys.
- Added optional account leaderboard submissions on successful clears only. Scores are clamped to the backend limit and weighted toward harder boards and faster clears.
- No external game assets are required.

This is an adapted upstream import, not an original Ash-Fall reimplementation. The upstream MIT license is retained.
