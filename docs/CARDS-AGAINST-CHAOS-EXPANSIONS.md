# Cards Against Chaos · expansion bubbles

## Current release

- Base deck: 500 black and 1,500 white cards, always free.
- Madhouse After Hours: 50 hand-written black prompts and 150 hand-written white answers; original Knightfall writing, 18+ opt-in.
- The product is listed in `public/cinder-shop.html#madhouse-after-hours` at a **proposed** one-time US$2.99 price. Checkout is disabled; no money can be collected from this listing.
- Players can temporarily enable the pack as a **free preview** from both local arcade setup and online match setup. Host confirms 18+; invited friends must separately confirm 18+ before accepting.
- A checkbox is only a self-attestation, **not identity-based age verification**.
- Every match saves its own array of selected pack IDs. New games default to the free base; existing matches remain on their original deck.
- The canonical content lives in `public/arcade/hosted/cards-against-chaos/expansion-packs.js`. Both the local game and Worker import this same module.
- `deck-mixer.js`: 75% probability of an answer/prompt draw from the union of selected expansions, divided evenly among selected packs (each active pack has the same probability). The free base contributes the remaining 25% of draws. No packs means 100% base. Each pool gets its own shuffle/refill, so small packs are recycled without dropping their intended weighting.
- The backend persists numeric shuffled indexes instead of duplicating thousands of card strings in the match row.

## Payment integration intentionally deferred

The user will configure Stripe later. Do **not** add a checkout button that pretends to grant a purchase, accept client-supplied prices, or treat redirect success as fulfillment.

Before making this a real paid product:

1. Create a **server-owned SKU and fixed price** in the existing member-shop checkout catalog (review proposed pricing).
2. Add a D1 ownership/entitlement table keyed by authenticated user ID + pack ID, migration reviewed separately. Grant in idempotent, Stripe-signature-verified webhooks, with refunds/disputes/revocation and reconciliation.
3. Move paid pack plaintext **out of publicly served JavaScript**. Currently `expansion-packs.js` is public because the pack is a free preview. A genuinely paid pack requires server-authoritative draw and secure per-viewer card delivery; avoid shipping the entire deck to unentitled browsers.
4. Enforce ownership for the host **and invited players** before exposing paid cards in online tables. Define a fair rule when just the host owns a pack (e.g. every human must own it, or host can share paid packs). Do not silently charge or lock invited players.
5. For local paid play, require an authenticated, entitled member and a supportable offline entitlement mechanism or clearly require connection. Do not leave a downloadable unrestricted paid deck.
6. Replace self-attestation with suitable age-gating and review payment-provider content rules before enabling real-money purchases of adult-themed digital goods. Do not store raw identity documents.
7. Regression test webhook duplicates, chargebacks, replay attempts, unauthorized clients, historical matches, multiple simultaneous packs, and the no-payment configuration.
8. Disable the pre-checkout preview only after paid entitlements, age gates, and card delivery all work on live production.

## Adding additional themes

Add a uniquely named pack in a **protected, entitlement-aware content source**. Register its metadata and 50/150 cards or your chosen pack size; maintain the same `active_packs` IDs across game UI and Worker. Add a new expansion-bubble checkbox to local and online match setup. The weighted draw logic already handles multiple selected pack IDs without changing how the free base plays.

Current live status must always be verified against the latest Cloudflare Pages and Worker deployments before telling users the shop or paid experience is available.
