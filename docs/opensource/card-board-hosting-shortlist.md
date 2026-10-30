# Card and board hosting shortlist — 2026-10-30

## Already in Knightfall (verify playability before marking complete)
The arcade catalog includes Cinder Chess, Cinder Checkers, Cinder Reversi, Cinder Gomoku, Cinder Mancala, Cinder Four, Cinder Fleet (Battleship-style), Cinder Eights, Neon Mahjong, Ash Sudoku, Ludo, 15 Puzzle, Chaos Card Room and Chaos Card Expansion. Card Room and Expansion bundle multiple rulesets. These are existing routes, not evidence that each game is functional.

## Low-friction open-source candidates
| Candidate | Upstream | Hosting considerations |
|---|---|---|
| Chessground | https://github.com/lichess-org/chessground | GPL-3.0; browser chess UI only, requires rules/engine and GPL compliance |
| chess.js | https://github.com/jhlywa/chess.js | BSD-2-Clause; rules library, not standalone game; pair with local board UI |
| Stockfish.js | https://github.com/nmrugg/stockfish.js | GPL-3.0 chess AI; sizable WASM/worker; publish source and license |
| Boardgame.io | https://github.com/boardgameio/boardgame.io | MIT framework; build actual games, local hotseat easy, network mode requires server |
| js-chess-engine | https://github.com/josefjadrny/js-chess-engine | Check current license and build; chess AI engine |
| 2048 | https://github.com/gabrielecirulli/2048 | MIT; static browser game, simple Pages import |
| Hextris | https://github.com/Hextris/hextris | GPL-3.0; static puzzle, license obligations |
| 3D Hartwig Chess | https://github.com/juliangarnier/3D-Hartwig-chess-set | MIT visual chess set; not a rules-complete game |

## Highest value original implementations (no third-party asset dependencies)
Checkers variants, Connect Four, Gomoku, Reversi, Mancala, Minesweeper, Yahtzee-style dice, memory matching, 15-puzzle, Sudoku, War, Crazy Eights, Hearts, Spades, Gin Rummy, Solitaire, FreeCell, cribbage, dominoes, and chess. Prioritize finishing existing Knightfall games over duplicating them.

## Import gates
1. Inspect actual upstream LICENSE and embedded assets separately. Public repository does not imply redistribution permission.
2. Prefer self-contained HTML/CSS/JS with no login, server, remote assets or build-time secrets.
3. Preserve attribution and full license, pin an upstream commit, and vendor required assets locally.
4. Check Android touch input, reset/new game, win/loss logic, fullscreen, console errors and offline asset paths.
5. Add catalog entry only after the files are in public/arcade/hosted/<slug>/ and the generated catalog and deployment are verified.

## Franchise projects
The 11 Star Wars / Dragon Ball projects are separately tracked at /arcade/franchise-imports.html. Franchise character art, music and game data require additional rights review; do not import just because the code has an MIT license.
