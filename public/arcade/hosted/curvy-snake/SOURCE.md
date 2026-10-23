# Curvy Snake upstream import record

- Upstream repository: https://github.com/sausi-7/games
- Source path: `games/arcade/curve-snake/index.html`
- License: repository MIT, copyright (c) 2026 Saurabh Singh. Full license retained in `LICENSE.txt`.
- Adaptation: retained the single-file gameplay code and replaced the `config.json` fetch with local mechanics/text configuration.
- Assets: upstream background, food, and audio assets are not redistributed. Two simple SVG images are inline data URIs created for this adaptation; audio paths have no fallbacks and sound remains disabled.
- Dependencies: static HTML/CSS/JavaScript, canvas, browser input and timers only. No remote runtime CDN.
- Security: no external network calls, account credentials, or Cinders access.
- Limitations: local-only score/state; no account saves, currency rewards, or server leaderboard.
