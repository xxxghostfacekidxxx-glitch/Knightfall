# Sudoku upstream import record

- Upstream repository: https://github.com/sausi-7/games
- Source path: `games/puzzle/sudoku/index.html`
- Repository license: MIT, copyright (c) 2026 Saurabh Singh. Full repository MIT license is retained in `LICENSE.txt`.
- Adaptation: retained the self-contained HTML/CSS/JavaScript puzzle logic; removed a fetch of an external `config.json` for a decorative background and removed an unnecessary React Native / parent-window orientation message.
- Assets: no external images, fonts, audio, or scripts are loaded by the adapted page. Background and all visual styling are local CSS.
- Dependencies: static HTML/CSS/JavaScript only.
- Security boundary: no external network calls, no account tokens, no wallet integration. Local runtime only.
- Limitations: this upstream build includes a fixed puzzle and local timer; it has no authenticated saves or server leaderboard. Sudoku is included as source adaptation, not a claim of account integration.
- The source repository is MIT-licensed; retain this record and the included license when redistributing.
