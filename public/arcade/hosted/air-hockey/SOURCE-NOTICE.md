# Air Hockey: upstream source notice

- Upstream project: https://github.com/mashukui/web-games
- Upstream file: `air-hockey/index.html`
- License: MIT
- Copyright: © 2026 mashukui (马哥python说). See `LICENSE.txt`.
- Local file: `/arcade/hosted/air-hockey/index.html`

## Changes for Ash-Fall

- Preserved the upstream single-file air-hockey physics, AI opponent, and gameplay.
- Removed the shared upstream `i18n.js` dependency, which also bootstraps third-party analytics.
- Added a local English text fallback.
- Applied the Ash-Fall dark pink/green cabinet theme and replaced the upstream collection footer.
- Namespaced the local best-streak storage key.
- Added optional account leaderboard submission when a match ends. The score ranks player goals (100 points each) minus opponent goals, floored at zero; the submitted summary includes the final score, win/loss, difficulty, and streak.
- No external game assets are required; the game renders and synthesizes sound in-browser.

This is an adapted upstream import, not an original Ash-Fall reimplementation. The upstream MIT license is retained.
