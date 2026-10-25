# Maze Muncher: upstream source notice

- Upstream project: https://github.com/mashukui/web-games
- Upstream file: `maze-muncher/index.html`
- License: MIT
- Copyright: © 2026 mashukui (马哥python说). See `LICENSE.txt`.
- Local file: `/arcade/hosted/maze-muncher/index.html`

## Changes made for Ash-Fall

- Preserved the upstream single-file maze-chase gameplay and procedural Canvas drawing.
- Removed the shared upstream `i18n.js` dependency. That shared file also bootstraps analytics; this import does not load it.
- Added a small local English text fallback for dynamic messages.
- Restyled the page to the Ash-Fall pink/green dark cabinet theme.
- Changed the best-score storage key to an Ash-Fall-specific key.
- Added optional Ash-Fall account leaderboard reporting on completed runs.
- Replaced the original collection footer with a local Chaos Cartridge return link and upstream attribution.
- No external images, audio files, or third-party game assets are copied; audio is synthesized by the game.

This is an adapted upstream import, not an original Ash-Fall reimplementation. The upstream MIT license is retained.
