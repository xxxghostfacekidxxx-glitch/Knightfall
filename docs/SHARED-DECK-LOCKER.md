# Shared Deck Locker · Knightfall Arcade

## Launch implementation, Nov 6, 2026

A **single card finish** is applied to all of the card-game entry points in the canonical `public/arcade/catalog.json`. Do not install a separate skin store in each mini-game.

**Files:** `public/card-deck-skins.js` (catalog, access rules, UI, local progression, shared preference); `public/card-deck-skins.css` (card faces, backs, prompt and answer cards, 12 illustrated miniature previews); `scripts/deck-locker-integrity.test.mjs` (cross-game regression). The same two assets are included in:

- `/arcade/hosted/cards-against-chaos/index.html` — local four-seat/online table faces and black prompts
- `/arcade-card-room.html` — Blackjack, Five-Card Draw Poker and War
- `/arcade-card-expansion.html` — Klondike Solitaire, FreeCell, Crazy Eights, Gin Rummy and Texas Hold'em
- `/arcade/hosted/cinder-eights/index.html` — independently hosted Crazy Eights

The Card & Board directory advertises the Deck Locker and links to a deep-link that opens it. Board-only games that do not render playing cards are intentionally excluded.

### Current 12 finishes

| ID | Display name | Type | Condition |
| --- | --- | --- | --- |
| `ash-classic` | Ash Classic | Free | Default |
| `neon-riot` | Neon Riot | Free | Always accessible |
| `bone-white` | Bone White | Free | Always accessible |
| `grave-velvet` | Grave Velvet | Play-to-unlock | 3 recorded deals |
| `glitch-circuit` | Glitch Circuit | Play-to-unlock | 10 recorded deals |
| `ghost-orchid` | Ghost Orchid | Play-to-unlock | 25 recorded deals |
| `infernal-foil` | Infernal Foil | Play-to-unlock | 50 recorded deals |
| `void-royalty` | Void Royalty | Premium preview | Proposed $1.99 one-time |
| `crimson-rite` | Crimson Rite | Premium preview | Proposed $1.99 one-time |
| `holo-wraith` | Holo Wraith | Premium preview | Proposed $2.99 one-time |
| `toxic-pop` | Toxic Pop | Premium preview | Proposed $2.99 one-time |
| `eclipse-noir` | Eclipse Noir | Premium preview | Proposed $3.99 one-time |

**IMPORTANT:** Premium entries are *not purchasable or equipable yet*. The disabled listings in `public/cinder-shop.html#deck-skins` advertise proposed prices and forthcoming checkout; no fake Stripe transactions or synthetic ownership flags exist. Free and play-unlocked finishes work now, and all 12 artwork previews render in the shared wardrobe.

### State and progression

The UI saves the selected finish in browser localStorage under `ashfall:deck-locker:selected:v1`, and a simple play counter under `ashfall:deck-locker:deals:v1`. Those values are shared among pages at the same site origin. Every recognized card-game route records the progress of a real local deal, card play, or a newly created online table. Record calls in initialization are explicitly avoided so merely opening pages does not grant achievements.

**This is device/browser-local progress, NOT secure server-issued unlocks.** Clearing browser data or changing devices resets this wardrobe. This is suitable for free cosmetic rewards but must not be repurposed to validate a real-money purchase. Global preference persists across all card games **on the same device and origin**. Cross-device account synchronization and authoritative progression remain future tasks.

### Implementation guarantees

- Card styles modify CSS only. They must never change deck order, secrecy of hidden cards, suit/rank text, randomness, game scoring or the four-seat rules.
- Card-face suits remain readable, including red suit colors; card backs remain hidden.
- CSS targets true card surfaces only: `.playing-card`, `.playing-card.back`, `.playing-card.backside`, Cinder Eights `#hand button.af-deck-card`, and Cards Against Chaos black prompts and white answers. It must **not** paint chess/checkers/board-game cells.
- The wardrobe is an expandable inline `details` at the top of each card game's main content, not a floating panel covering buttons or mobile keyboards.
- All pages read the same two localStorage keys, and storage change events propagate updates between simultaneously open tabs.
- The server currently does not provide a paid-skin entitlement API. Client-side flags, URL parameters, localStorage and CSS tokens must never be interpreted as evidence of purchase.

### Before enabling real-money premium cosmetics

1. Decide purchase prices and checkout eligibility with the user (prices above are drafts).
2. Use the existing authenticated Stripe/member-shop order pipeline; register fixed server-owned product SKUs for the five premium finishes, with idempotent signed-webhook fulfillment.
3. Store ownership in an authenticated D1 entitlement table keyed by user ID and skin SKU; never accept an owner ID from client requests. Add refund, dispute, revocation and reconciliation.
4. Add authenticated entitlement read endpoint and server verification for enabling premium skins; treat localStorage strictly as the desired selection. Prevent selector spoofing, including if game code accepts externally provided skin IDs.
5. Synchronize earned progress and selected style to account saves with safe conflict resolution, and specify offline behavior. Locking a style must never destroy an in-progress match.
6. Test purchases, payment retries, double webhooks, cross-account access, store previews, offline mode, refund/revocation, visual clipping and all ten card-game variants. Only then enable the five checkout buttons.

### Regression commands

```sh
node --test scripts/deck-locker-integrity.test.mjs
node --test backend/src/chaos-card-matches.test.mjs scripts/chaos-cards-integration.test.mjs scripts/cards-cabinet-ui.test.mjs
node scripts/static-audit.mjs
```

The shared mobile browser exercise is also in `scripts/arcade-browser-smoke.mjs`, which checks all four card-game pages and a persisted selected style in one browser context.
