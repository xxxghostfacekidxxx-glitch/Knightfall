# Ten more visually ambitious browser-game candidates

Selected earlier: #14 A Dark Room and #15 The Evolution of Trust. This list prioritizes style, game systems, and realistic browser delivery. **Candidates only; not deployed or imported.** Cloudflare Pages hosts static clients, but multiplayer game servers require separate engineering and cost validation.

| # | Game | Upstream | License | Gameplay | Cloudflare feasibility |
|---|---|---|---|---|---|
| 21 | HexGL | [BKcore/HexGL](https://github.com/BKcore/HexGL) | MIT | 3D hover racing | Static WebGL, inspect textures and browser compatibility |
| 22 | Kaetram | [Kaetram/Kaetram-Open](https://github.com/Kaetram/Kaetram-Open) | MPL-2.0 | Multiplayer fantasy RPG | Requires a persistent multiplayer backend |
| 23 | shapez.io | [tobspr-games/shapez.io](https://github.com/tobspr-games/shapez.io) | GPL-3.0 | Factory/automation builder | Browser build and source/license obligations |
| 24 | OpenFront | [openfrontio/OpenFrontIO](https://github.com/openfrontio/OpenFrontIO) | AGPL-3.0 | Large-scale real-time strategy | Client/server, source disclosure and server cost testing |
| 25 | mk48.io | [SoftbearStudios/mk48](https://github.com/SoftbearStudios/mk48) | AGPL-3.0 | Multiplayer naval combat | WebAssembly/server stack; free-tier feasibility unverified |
| 26 | Space Huggers | [KilledByAPixel/SpaceHuggers](https://github.com/KilledByAPixel/SpaceHuggers) | GPL-3.0 | Stylish run-and-gun platform shooter | Browser build, inspect asset notices |
| 27 | City Builder Starter Kit | [KenneyNL/Starter-Kit-City-Builder](https://github.com/KenneyNL/Starter-Kit-City-Builder) | MIT | City-building starter game | Starter kit, not complete city simulation; inspect engine/build |
| 28 | Interstellar Armada | [PB2204/Interstellar-Armada](https://github.com/PB2204/Interstellar-Armada) | mixed / per-file terms | 3D space combat | Review repository license file by asset category before copying |
| 29 | Agar.io Clone | [owenashurst/agar.io-clone](https://github.com/owenashurst/agar.io-clone) | MIT | Multiplayer cell-eating arena | Node/socket.io backend needs Cloudflare port |
| 30 | Sandspiel | [MaxBittker/sandspiel](https://github.com/MaxBittker/sandspiel) | MIT | Particle-physics sandbox simulation | Browser build uses WebAssembly/Rust tooling; static output can be served on Pages |

#14 and #15 import staging script: `scripts/import-selected-open-source-games.sh`. It downloads upstream sources to separate hosted routes, preserves upstream license files and credits, removes upstream tracking from A Dark Room, and switches its jQuery reference to the bundled local copy. It does **not** run automatically, commit files, or prove gameplay. Pin `ADR_COMMIT` and `TRUST_COMMIT` to audited upstream commit SHAs before running; review dependency and media licenses after download. Avoid publishing an untested import.

Interstellar Armada is not a blanket permissive license: review individual file terms. No game is an Ash-Fall original simply because it is hosted here.
