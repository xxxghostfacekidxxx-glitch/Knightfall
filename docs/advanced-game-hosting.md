# Requested advanced games — hosting record

The static editions are built from pinned sources by `stage-advanced-static-games.yml` and are not advertised as live until that workflow has passed, its staging PR has merged, and Cloudflare has deployed the production revision.

| Game | Edition | Source and remaining work |
| --- | --- | --- |
| Interstellar Armada | Singleplayer missions, local mission editor | `PB2204/Interstellar-Armada` at `fd3804acfec7862d77f157202aa0b5df93d71043`. GPL-3.0 code; CC BY assets; original BY-NC collision recording excluded and replaced by a synthesized CC0 WAV. Remote services disabled. |
| BrowserQuest | Browser-local solo world simulation | `mozilla/BrowserQuest` at `af32d247cac3495ca430d0effbb88dd5f3250b2c`. MPL-2.0 code; CC BY-SA 3.0 content. Original server logic runs in a local Worker. Online multiplayer is not deployed. |
| OpenFront | Solo matches against bots | `openfrontio/OpenFrontIO` at `c2cf2ce65f74ac91859f68a84aec89aeda5722ee`, a fully open snapshot before the proprietary asset split. AGPL-3.0 code and CC BY-SA 4.0 assets. Official APIs, multiplayer, accounts, commerce and analytics are not provided. |
| Freeciv-web | Blocked on server hosting | The inspected upstream stack requires a native Freeciv server, WebSocket proxy, Tomcat/web application, and supporting services. A static client by itself cannot play a match. No paid host has been provisioned. It needs a compatible external server or a substantial WebAssembly/server port. |
| Kaetram | Blocked on integration clearance and runtime | The legacy open snapshot uses a Node/uWebSockets server and optional MongoDB. Its additional `LICENSE_OPL` prohibits AI-related use without creator permission. Because Knightfall integrates AI features, clearance is needed before integration. A server port is also required. |
| Space Huggers | Blocked on redistribution clarification | The upstream repository contains GPL-3.0, but its README expressly says the game is only for learning and not intended for redistribution. The conflicting statements need author clarification before a hosted copy is published. |

For every distributed edition, original credits are retained and `source.html` links every modified-source archive. Extract all source ZIPs into the same directory to reconstruct the complete source tree. Each archive stays below the Cloudflare Pages per-file limit. The `prepare-*` scripts record reproducible hosting changes. Static does not mean unlimited: users' browser performance and Cloudflare's free usage limits still apply.
