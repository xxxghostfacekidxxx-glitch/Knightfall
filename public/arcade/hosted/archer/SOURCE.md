# Archer upstream import record

- Upstream repository: https://github.com/sausi-7/games
- Source path: `games/sports/archer/` (`index.html`, `script.js`, `style.css`)
- License: repository MIT, copyright (c) 2026 Saurabh Singh. Full license retained in `LICENSE.txt`.
- Adaptation: replaced the `config.json` fetch with local text/gameplay settings; removed the unused font-loader block; retained inline SVG game artwork; re-themed UI and background.
- Assets: upstream background PNG, font, and all audio files are not redistributed. CSS uses a local gradient and audio is disabled by an empty audio config.
- Dependencies: local HTML/CSS/JS and inline SVG only; no external runtime scripts or CDN.
- Security: no external network calls, account credentials, or Cinders access.
- Limitations: local session score only; no account saves, currency rewards, or server leaderboard.
