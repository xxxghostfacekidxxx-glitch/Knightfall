# Breakout: upstream source notice

- Upstream project: https://github.com/mashukui/web-games
- Upstream file: `breakout/index.html`
- License: MIT
- Copyright: © 2026 mashukui (马哥python说). See `LICENSE.txt`.
- Local file: `/arcade/hosted/breakout/index.html`

## Changes for Ash-Fall

- Preserved upstream Canvas brick-breaker gameplay, paddle physics, particle effects, levels, and synthesized sound.
- Removed the upstream shared `i18n.js` dependency, which also initializes third-party analytics.
- Added a local English text fallback.
- Applied the Ash-Fall dark pink/green cabinet theme and replaced the upstream collection footer.
- Namespaced the local best-score key.
- Added optional account leaderboard submission at game over; the submitted score is clamped to 1,000 and the attached summary retains the original score, level, lives, and brick count.
- No external game assets are required.

This is an adapted upstream import, not an original Ash-Fall reimplementation. The upstream MIT license is retained.
