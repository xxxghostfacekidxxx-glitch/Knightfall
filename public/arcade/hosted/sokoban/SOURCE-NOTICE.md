# Sokoban: upstream source notice

- Upstream project: https://github.com/mashukui/web-games
- Upstream file: `sokoban/index.html`
- License: MIT
- Copyright: © 2026 mashukui (马哥python说). See `LICENSE.txt`.
- Local file: `/arcade/hosted/sokoban/index.html`

## Changes for Ash-Fall

- Preserved the upstream single-file Sokoban game and its authored levels.
- Removed the shared upstream `i18n.js` dependency, which also bootstraps third-party analytics.
- Added a local English text fallback.
- Applied an Ash-Fall dark pink/green cabinet skin and replaced the upstream collection footer.
- Namespaced the local progress key for Ash-Fall.
- Added optional account leaderboard submissions on level completion. The score represents the highest level cleared; the attached progress summary stores moves, pushes, and total cleared levels.
- No external game assets are required by this single-file game.

This is an adapted upstream import, not an original Ash-Fall reimplementation. The upstream MIT license is retained.
