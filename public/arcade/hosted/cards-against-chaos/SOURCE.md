# Cards Against Chaos

This game is an original, self-contained Knightfall implementation. Its HTML, JavaScript, styling, prompts, and answer cards are original and released under the MIT License in `LICENSE.txt`.

It uses the broad fill-in-the-blank party-game format. It does not include Cards Against Humanity code, card text, artwork, or branding and is not endorsed by or affiliated with Cards Against Humanity, LLC.

The original **local** game has no third-party runtime packages or external network dependencies. It supports 3–8 people playing pass-and-play on one device and remains available without an account.

The new **online** mode is an additional original Knightfall implementation using `online.js`, `online.css`, the authenticated `knightfall-api` Worker routes `/api/arcade/chaos-cards`, and D1 migration `0118_chaos_card_matches.sql`. Two accepted, unblocked friends play asynchronously with three scripted AI opponents named Lydibug, Butters and Eddie. Card selection, dealing, AI turns, scoring and validation occur on the server; browser payloads never contain the other player's private hand. Online mode requires an Ash-Fall account, connectivity and production Worker/D1.

Original Butters and Trouble SVG mascots, including variants, are in `/assets/devil-tools/neon-nuisances/`. No third-party Cards Against Humanity deck, artwork, code or branding is distributed.
