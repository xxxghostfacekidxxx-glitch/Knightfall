# Swipe Assassin upstream import record

- Upstream repository: https://github.com/sausi-7/games
- Source path: `games/arcade/swipe-assassin/index.html`
- License: repository MIT, copyright (c) 2026 Saurabh Singh. Full license retained in `LICENSE.txt`.
- Adaptation: replaced the `config.json` fetch with local gameplay/text settings, removed audio source assignments/playback, and applied the Knightfall theme.
- Assets: original player/enemy PNG sprites and all audio are not redistributed. They are replaced with simple inline SVG data-URI characters; sound is disabled.
- Dependencies: single-file HTML/CSS/JavaScript and canvas only; no external runtime scripts or CDN.
- Security: no network calls, account credentials, or Cinders access.
- Limitations: local session only; no account save, currency rewards, or server leaderboard.
