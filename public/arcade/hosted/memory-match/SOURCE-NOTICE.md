# Memory Match: upstream source notice

- Upstream project: https://github.com/mashukui/web-games
- Upstream file: `memory-match/index.html`
- License: MIT
- Copyright: © 2026 mashukui (马哥python说). See `LICENSE.txt`.
- Local file: `/arcade/hosted/memory-match/index.html`

## Changes for Ash-Fall

- Preserved upstream single-file card matching, three difficulty levels, timer, sound synthesis, and emoji deck.
- Removed the shared upstream `i18n.js` dependency, which also initializes third-party analytics.
- Added a local English text fallback.
- Applied the Ash-Fall dark pink/green cabinet theme and replaced the upstream collection footer.
- Namespaced the local best-results key.
- Added optional leaderboard submission after a completed deck. Scores are bounded to 1,000 and weighted by difficulty and moves.
- No external game assets are required.

This is an adapted upstream import, not an original Ash-Fall reimplementation. The upstream MIT license is retained.
