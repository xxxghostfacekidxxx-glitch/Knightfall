# BrowserQuest and Freeciv-web: Cloudflare-first implementation gates

These are engineering gates, **not claims that either game is deployed**. No paid services or third-party hosted game embeds are authorized.

## BrowserQuest (Mozilla, MPL 2.0 code / CC BY-SA 3.0 content)

Upstream server: `mozilla/BrowserQuest/server/js/main.js`; upstream README specifies legacy Node.js, WebSocket server libraries and a separate RequireJS client build. Do not copy the old Node server into a Cloudflare Worker and expect it to execute.

1. **Protocol inventory:** document client WebSocket events, entity IDs, combat movement, inventory and world initialization from the exact upstream commit. Separate wire protocol from Node-only implementation. Review dependency and asset notices.
2. **Isolated prototype:** implement one authenticated-or-guest room in a Cloudflare Worker backed by a Durable Object, subject to current free-tier availability and usage limits. WebSockets need lifecycle cleanup, heartbeat, bounded messages, per-player rate limits and room limits.
3. **Gameplay fidelity:** verify login, spawn, move, combat, item pickup, disconnect/reconnect, and simultaneous players in a staging environment. No production launch without tests for abuse, memory usage and state restoration.
4. **License:** retain MPL-covered source file notices and provide applicable source; credit art and meet CC BY-SA obligations on any adapted artwork.
5. **Operations:** monitor Cloudflare free-tier quotas and use a circuit breaker when room capacity is reached. Do not automatically enable billable overages.

## Freeciv-web (AGPL v3 client / GPL server)

Upstream: `freeciv/freeciv-web`. Freeciv's native server is not a static Pages asset. The AGPL has network source-sharing obligations for modified versions.

1. **Architecture decision:** identify whether a compliant Freeciv-compatible server can operate within the available free infrastructure. The original native C server cannot be executed directly inside Cloudflare Workers.
2. **License:** publish corresponding source and license notices for a modified AGPL client, and preserve GPL server obligations. Audit art, sound and data packs separately.
3. **Prototype:** only after a tested server approach exists, implement a small isolated client handshake and a single-player game initialization in staging.
4. **Operations:** estimate CPU, storage, concurrent players, session duration and outbound traffic. Do not activate production traffic or pay-as-you-go features until measured.

## Launch gates

- No game is called **playable on Ash-Fall** until its own origin route and gameplay are verified on a successful production deployment.
- No game is called **account-synced** until an authenticated save round-trip has passed automated tests.
- Upstream code and artwork must remain clearly attributed; new Ash-Fall-themed derivative artwork must be original or properly licensed.
- A staging prototype that needs paid Cloudflare features is paused, not silently upgraded.
