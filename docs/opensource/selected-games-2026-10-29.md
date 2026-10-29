# Selected open-source games: hosting review (2026-10-29)

User-selected candidates: **BrowserQuest (#2), Freeciv-web (#3), Radius Raid (#5), Progress Knight (#9)**. Source links and licensing below. **Do not describe a game as deployed until its Pages deployment succeeds and its route is smoke-tested.**

## 5. Radius Raid: imported as static arcade game
- Upstream: https://github.com/js13kGames/radius-raid
- Upstream license: MIT, copyright (c) 2014 Jack Rugile, preserved verbatim in `public/arcade/hosted/radius-raid/LICENSE.md`.
- Source: original `index.html` and all 17 ordered JavaScript dependencies, served from `public/arcade/hosted/radius-raid/`. No server or paid service required. An Ash-Fall navigation/attribution link is the only intended HTML change.
- Caveat: upstream README warns of browser-performance differences; touch support is not established. Do not advertise account save integration until separately tested.

## 9. Progress Knight: imported as static arcade game
- Upstream: https://github.com/ihtasham42/progress-knight
- Upstream license: Unlicense, preserved in `public/arcade/hosted/progress-knight/LICENSE`.
- Source: original HTML, three JavaScript dependencies and two CSS files; external W3CSS dependency replaced with a small local compatibility stylesheet. External Discord image removed. The original game remains a wide desktop-oriented layout; mobile UX needs further work.
- No server or paid service required. Upstream local save mechanism remains intact; Ash-Fall account sync not yet integrated.

## 2. BrowserQuest: NOT yet hostable as a static-only import
- Upstream: https://github.com/mozilla/BrowserQuest
- Code: Mozilla Public License 2.0. Art/content: Creative Commons Attribution-ShareAlike 3.0, requiring attribution and share-alike compliance for derivatives. See upstream LICENSE.
- The upstream server documentation targets legacy Node.js and WebSocket libraries, with a separate build step for the client. The server is not a drop-in Cloudflare Worker; multiplayer requires a rewrite or maintained compatible server, WebSocket state management, abuse controls, and tested persistence.
- Safe next implementation: prototype a Worker + Durable Object multiplayer adapter **only if compatible with free-plan limits** and verify the build, asset attributions, and socket protocol before publishing. No external game iframe masquerading as a local install.

## 3. Freeciv-web: NOT yet hostable on static Cloudflare Pages
- Upstream: https://github.com/freeciv/freeciv-web
- Web client: GNU AGPL v3; Freeciv C server: GNU GPL. See upstream LICENSE.txt and README. A modified network-served AGPL client must provide corresponding source as required by the license.
- Requires a substantial server stack, not merely static HTML. Do not copy its Java/C server into Workers or claim the entire game can run on the Cloudflare free tier without a validated architecture.
- Safe next implementation: isolated infrastructure feasibility proof and licensing/asset audit. Do not deploy unverified server code or introduce paid services.

## Integration rules
- Preserve original notices and upstream source links; do not relabel these upstream games as Ash-Fall originals.
- Treat local browser saves as distinct from authenticated Ash-Fall cloud saves.
- Keep selected hosted games under separate paths and avoid overwriting current arcade games.
- Use free Cloudflare Pages for static games; do not provision paid infrastructure for multiplayer titles.
- Verify script paths, licenses, syntax, browser gameplay, and production deployment independently.
