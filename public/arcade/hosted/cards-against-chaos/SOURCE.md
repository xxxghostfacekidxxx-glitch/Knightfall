# Cards Against Chaos

This game is an original, self-contained Knightfall implementation. Its HTML, JavaScript, styling, prompts, and answer cards are original and released under the MIT License in `LICENSE.txt`.

The **base deck now contains exactly 2,000 distinct cards**: **500 black prompts** and **1,500 white answers**. It retains all 200 cards from the original release and adds 1,800 new, original combinations built from authored scene, character, object, event and joke-pattern banks. This is a curated template-combination deck, not 1,800 individually hand-written stand-alone lines. The generated text is fixed and checked for duplicate card text; no generative AI runs when a card is dealt. The canonical source is `base-deck.js`, which both the local arcade cabinet and backend Worker import. Future themed packs should be separate, explicitly enabled expansions rather than silently mixed into the base deck.

It uses the broad fill-in-the-blank party-game format. It does not include Cards Against Humanity code, card text, artwork, or branding and is not endorsed by or affiliated with Cards Against Humanity, LLC.

The original **local** game has no third-party runtime packages or external network dependencies. It always uses four seats, with 1–4 human players sharing one device and Lydibug, Butters and Eddie automatically filling unused seats. Local mode remains available without an account.

The new **online** mode is an additional original Knightfall implementation using `online.js`, `online.css`, the authenticated `knightfall-api` Worker routes `/api/arcade/chaos-cards`, and D1 migration `0120_four_seat_chaos_cards.sql`. One member can start immediately against three scripted AI opponents, or invite up to three accepted, unblocked friends. Empty seats are filled by Lydibug, Butters and Eddie in that order, always for a total of four players. Invites are accepted before the host starts; unanswered invitations become AI and cannot join mid-round. Card selection, dealing, AI turns, scoring and validation occur on the server; browser payloads never contain the other player's private hand. Online mode requires an Ash-Fall account, connectivity and production Worker/D1.

Original Butters and Trouble SVG mascots, including variants, are in `/assets/devil-tools/neon-nuisances/`. No third-party Cards Against Humanity deck, artwork, code or branding is distributed.
