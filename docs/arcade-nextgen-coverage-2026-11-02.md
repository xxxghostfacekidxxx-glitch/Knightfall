# Chaos Cartridge NextGen visual-overhaul coverage

Updated: 2026-11-02

## Scope and status

- **122 HTML pages** were wired into the first shared styling/effects pass: 97 pages in `original-creations.json`, 12 additional hosted pages, 12 standalone/support pages, and Chaos Connect Four. Two of the 12 standalone/support pages are arcade information hubs, not distinct games.
- Additional main arcade catalogs and supporting game hubs use NextGen styling or the shared catalog loader. The primary `chaos-cartridge.html` and secondary `arcade-30-games.html` must remain generated from `catalog.json`.
- Shared layer: `/arcade/nextgen.css`, `/arcade/nextgen.js`. This changes visual skins, HUD treatments and optional reactive effects, **not every individual game's graphics engine**.
- Deeper engine/impact upgrades: Neon Drift and Cinder Defense (original shared canvas renderer), Shatterpocalypse (brick explosions), Crypt Smash (hit sparks), and Cinder Drift, Cinder Lander, Particle Panic, Cinder Crossing, Cinder Squadron, and Cinder Invaders (procedural backdrops, in-game neon lighting, local trail and hit effects via the new `/arcade/canvas-fx.js`). Cinder Merge, Ash Tiles, Cursed Circuit and several other originals have game-specific CSS treatments.
- CanvasFX is an original dependency-free 2D helper loaded by those six games; in Cinder Invaders, the shared action engine enables FX only for that game to preserve the other two games using the same script before their scripts. It does not intercept the game loop, uses capped particle arrays, clears transient effects when hidden, and suppresses motion effects when reduced-motion or reduced-data is requested. The graphics do not change scoring or game rules. Dedicated `arcade-canvas-fx.test.mjs` checks helper API and integration wiring.
- Third-party games not listed here have **not** all received in-engine modernization. Browser runtime and mobile fullscreen testing remain necessary.
- **Neon Surge** was imported afterward as a separate MIT-licensed original game: `/arcade/hosted/neon-surge/index.html`. Its graphics were not authored by the shared visual pass; the source credits and MIT license are preserved. Its Three.js dependency is currently CDN-loaded, so full offline support is pending.

## Original games (97 pages)

### Action (1)

| Game | Play route |
|---|---|
| Colossus Clash | `/arcade/hosted/colossus-clash/index.html` |

### Adventure (2)

| Game | Play route |
|---|---|
| Last Ember | `/arcade/hosted/last-ember/index.html` |
| Ruinwalkers | `/arcade/hosted/ruinwalkers/index.html` |

### Arcade (26)

| Game | Play route |
|---|---|
| Ash Serpent | `/arcade/hosted/ash-serpent/index.html` |
| Ember Pop | `/arcade/hosted/ember-pop/index.html` |
| Ash Veil | `/arcade/hosted/ash-veil/index.html` |
| Crypt Smash | `/arcade/hosted/crypt-smash/index.html` |
| Cinder Maze | `/arcade/hosted/cinder-maze/index.html` |
| Ember Ricochet | `/arcade/hosted/ember-ricochet/index.html` |
| Ash Fallout | `/arcade/hosted/ash-fallout/index.html` |
| Cinder Slots | `/arcade/hosted/cinder-slots/index.html` |
| Void Target | `/arcade/hosted/void-target/index.html` |
| Ash Dash | `/arcade/hosted/ash-dash/index.html` |
| Void Pulse | `/arcade/hosted/void-pulse/index.html` |
| Ash Cannon | `/arcade/hosted/ash-cannon/index.html` |
| Cinder Lanes | `/arcade/hosted/cinder-lanes/index.html` |
| Ash Siege | `/arcade/hosted/ash-siege/index.html` |
| Ashfall Balancer | `/arcade/hosted/balance-stack/index.html` |
| Ash Spire | `/arcade/hosted/stack-tower/index.html` |
| Cinder Crossing | `/arcade/hosted/cinder-crossing/index.html` |
| Shatterpocalypse | `/arcade/hosted/afterburn-breakout/index.html` |
| Particle Panic | `/arcade/hosted/particle-panic/index.html` |
| Cinder Vector | `/arcade/hosted/neon-vector/index.html` |
| Burrow Blitz | `/arcade/hosted/burrow-blitz/index.html` |
| Rustwing Flight | `/arcade/hosted/rusty-sky/index.html` |
| Ashslide Rush | `/arcade/hosted/slush-rush/index.html` |
| Glitch Munch | `/arcade/hosted/glitch-munch/index.html` |
| Ash Slope | `/arcade/hosted/skifree/index.html` |
| Reaction Ritual | `/arcade/hosted/reaction-ritual/index.html` |

### Board (3)

| Game | Play route |
|---|---|
| Rock, Paper, Ruin | `/arcade/hosted/ember-clash/index.html` |
| Ash Circuit | `/arcade/hosted/ash-circuit/index.html` |
| Cinder Dice | `/arcade/hosted/cinder-dice/index.html` |

### Casual (2)

| Game | Play route |
|---|---|
| Ember Bubbles | `/arcade/hosted/bubble-pop/index.html` |
| Cinder Confection | `/arcade/hosted/candy-crush/index.html` |

### Idle (1)

| Game | Play route |
|---|---|
| Cinder Collider | `/arcade/hosted/particle-clicker/index.html` |

### Platformer (4)

| Game | Play route |
|---|---|
| Ashbound Runner | `/arcade/hosted/ashbound-runner/index.html` |
| Cinder Ascension | `/arcade/hosted/doodle-jump/index.html` |
| Cinder Hopper | `/arcade/hosted/cinder-hopper/index.html` |
| Rooftop Riot | `/arcade/hosted/rooftop-riot/index.html` |

### Puzzle (35)

| Game | Play route |
|---|---|
| Cinder Merge | `/arcade/hosted/cinder-merge/index.html` |
| Pyre Stacks | `/arcade/hosted/pyre-stacks/index.html` |
| Ash Sudoku | `/arcade/hosted/ash-sudoku/index.html` |
| Ashfall Foundry | `/arcade/hosted/ashfall-foundry/index.html` |
| Cinder Enclosure | `/arcade/hosted/cinder-enclosure/index.html` |
| Hex Embers | `/arcade/hosted/hex-embers/index.html` |
| Cinder Columns | `/arcade/hosted/cinder-columns/index.html` |
| Madhouse Memory | `/arcade/hosted/crypt-pairs/index.html` |
| Chaos Minesweeper | `/arcade/hosted/cinder-mines/index.html` |
| Ash Crateworks | `/arcade/hosted/ash-crateworks/index.html` |
| Pyre Hex | `/arcade/hosted/pyre-hex/index.html` |
| Ash Orbit | `/arcade/hosted/ash-orbit/index.html` |
| Crypt Count | `/arcade/hosted/crypt-count/index.html` |
| Ember Path | `/arcade/hosted/ember-path/index.html` |
| Rune Rush | `/arcade/hosted/rune-rush/index.html` |
| Ash Tiles | `/arcade/hosted/ash-tiles/index.html` |
| Crypt Hunt | `/arcade/hosted/crypt-hunt/index.html` |
| Void Bridge | `/arcade/hosted/void-bridge/index.html` |
| Crypt Caldera | `/arcade/hosted/crypt-caldera/index.html` |
| Ember Vault | `/arcade/hosted/ember-vault/index.html` |
| Ember Sort | `/arcade/hosted/ember-sort/index.html` |
| Crypt Shift | `/arcade/hosted/crypt-shift/index.html` |
| Crypt Labyrinth | `/arcade/hosted/crypt-labyrinth/index.html` |
| Void Constellation | `/arcade/hosted/void-constellation/index.html` |
| Crypt Balance | `/arcade/hosted/crypt-balance/index.html` |
| Hexa Havoc | `/arcade/hosted/hexa-havoc/index.html` |
| Ashen Blocks | `/arcade/hosted/ashen-blocks/index.html` |
| Prism Siege | `/arcade/hosted/prism-panic/index.html` |
| Cinder Circuit | `/arcade/hosted/cinder-circuit/index.html` |
| Crypt Mahjong | `/arcade/hosted/neon-mahjong/index.html` |
| Bubble Barrage | `/arcade/hosted/bubble-barrage/index.html` |
| Tether Tangle | `/arcade/hosted/tether-tangle/index.html` |
| Crypt Conduits | `/arcade/hosted/cube-composer/index.html` |
| Cursed Circuit | `/arcade/hosted/cursed-circuit/index.html` |
| Lights Out: Afterburn | `/arcade/hosted/lights-out-afterburn/index.html` |

### Racing (2)

| Game | Play route |
|---|---|
| Inferno Speedway | `/arcade/hosted/car-race/index.html` |
| Twin Inferno | `/arcade/hosted/two-cars/index.html` |

### Runner (1)

| Game | Play route |
|---|---|
| Ash-Fall: Endless Run | `/arcade/hosted/endless-runner/index.html` |

### Shooter (4)

| Game | Play route |
|---|---|
| Cinder Drift | `/arcade/hosted/cinder-drift/index.html` |
| Cinder Invasion | `/arcade/hosted/alien-battle/index.html` |
| Cinder Squadron | `/arcade/hosted/space-fighter/index.html` |
| Marshland Marksman | `/arcade/hosted/marshland-marksman/index.html` |

### Simulation (1)

| Game | Play route |
|---|---|
| Cinder Lander | `/arcade/hosted/cinder-lander/index.html` |

### Sports (6)

| Game | Play route |
|---|---|
| Cinder Archer | `/arcade/hosted/cinder-archer/index.html` |
| Cinder Kickoff | `/arcade/hosted/cinder-kickoff/index.html` |
| Void Hockey | `/arcade/hosted/void-hockey/index.html` |
| Inferno Hoops | `/arcade/hosted/basketball/index.html` |
| Crypt Bowling | `/arcade/hosted/bowling/index.html` |
| Cinder Shootout | `/arcade/hosted/penalty-shootout/index.html` |

### Strategy (6)

| Game | Play route |
|---|---|
| Lift Riot | `/arcade/hosted/lift-riot/index.html` |
| Skyline Foundry | `/arcade/hosted/skyline-foundry/index.html` |
| Ashen Dominion | `/arcade/hosted/ashen-dominion/index.html` |
| Hexforge Command | `/arcade/hosted/hexforge-command/index.html` |
| Cinder Chess | `/arcade/hosted/cinder-chess/index.html` |
| Rift Wardens | `/arcade/hosted/rift-wardens/index.html` |

### Survival (1)

| Game | Play route |
|---|---|
| Last Cinder Standing | `/arcade/hosted/survivor/index.html` |

### Word (2)

| Game | Play route |
|---|---|
| Crypt Words | `/arcade/hosted/crypt-words/index.html` |
| Ashen Lexicon | `/arcade/hosted/words-of-wonder/index.html` |

## Additional hosted pages (12)

| Game | Play route |
|---|---|
| Mutation Merge | `/arcade/hosted/mutation-merge/index.html` |
| Pikkuautot 3D: City Edition | `/arcade/hosted/pikkuautot-city/index.html` |
| Goalmouth Mayhem | `/arcade/hosted/goalmouth-mayhem/index.html` |
| Hex Puzzle | `/arcade/hosted/hex-puzzle/index.html` |
| Line Trap | `/arcade/hosted/line-trap/index.html` |
| Ludo | `/arcade/hosted/ludo/index.html` |
| Swipe Assassin | `/arcade/hosted/swipe-assassin/index.html` |
| Cinder Reversi | `/arcade/hosted/cinder-reversi/index.html` |
| Cinder Eights | `/arcade/hosted/cinder-eights/index.html` |
| Cinder Gomoku | `/arcade/hosted/cinder-gomoku/index.html` |
| Cinder Checkers | `/arcade/hosted/cinder-checkers/index.html` |
| Cinder Mancala | `/arcade/hosted/cinder-mancala/index.html` |

## Additional standalone and supporting pages (12)

| Game | Play route |
|---|---|
| Cinder Fleet | `/arcade/hosted/cinder-battleship/index.html` |
| Cinder Life | `/arcade/hosted/cinder-life/index.html` |
| Roads of Cinder | `/arcade/hosted/roads-of-cinder/index.html` |
| Cinder Gauntlet | `/arcade/hosted/cinder-gauntlet/index.html` |
| Cinder Defense | `/arcade/hosted/ashfall-neon-engine.html` |
| arcade-progress.html | `/arcade-progress.html` |
| arcade-spades.html | `/arcade-spades.html` |
| City of Cinders | `/city-of-cinders.html` |
| Last Drop Lemonade | `/last-drop-lemonade.html` |
| Not Dead Yet, Asshole! | `/not-dead-yet.html` |
| Wagonbound | `/wagonbound.html` |
| Trench Bounty | `/abyssal-arsenal.html` |

## Chaos Connect Four (1)

| Game | Play route |
|---|---|
| Chaos Connect Four | `/arcade/hosted/connect-four/index.html` |

## Change scope reference

Arcade hub pages refreshed: `/arcade-games.html`, `/arcade-originals.html`, `/arcade-card-board.html`, `/arcade-card-room.html`, `/arcade-fresh-meat.html`, `/arcade-card-expansion.html`, `/arcade-open-source.html`, `/arcade-after-dark.html`; plus the two generated catalog pages via the shared catalog loader.

Source repository: `xxxghostfacekidxxx-glitch/Knightfall`. Do not use this coverage report as proof that every game has new sprites, new 3D assets, or full playthrough certification.
