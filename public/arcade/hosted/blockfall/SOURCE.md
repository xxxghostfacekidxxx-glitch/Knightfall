# Blockfall upstream import record

- Upstream repository: https://github.com/sausi-7/games
- Source path: `games/puzzle/tetris/index.html`
- License: repository MIT, copyright (c) 2026 Saurabh Singh. Full license retained in `LICENSE.txt`.
- Adaptation: renamed the cabinet Blockfall, replaced the `config.json` fetch with local default settings, removed background image loading, and re-themed block colors and UI.
- Assets: upstream background image and audio files are not redistributed; the page uses CSS gradients and audio is disabled because no audio URLs are configured.
- Dependencies: single-file HTML/CSS/JavaScript, canvas, and browser input only; no external runtime script/CDN.
- Security: no network calls, account credentials, or Cinders access.
- Limitations: local session score only; no account save, currency rewards, or server leaderboard.
- Naming note: Blockfall is Knightfall's renamed cabinet; no upstream Tetris branding or images are included.
