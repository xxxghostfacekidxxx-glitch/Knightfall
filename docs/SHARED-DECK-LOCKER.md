# Knightfall Deck Atelier · shared card skins

## November 15, 2026: all existing styles free

The **12 current card cosmetics are permanently free** to every member and guest. There are no price tags, play-to-unlock conditions, premium entitlements, or paid checkout links for these finishes. The game shop may still sell separate card *content* expansions, which do not change cosmetic availability.

| Skin | Appearance | Availability |
| --- | --- | --- |
| Ash Classic | Charcoal linen, fractured halo and bone-gold crest | Free |
| Neon Riot | Electric street-art streaks and contrasting lacquer | Free |
| Bone White | Vintage ivory engraving and black filigree | Free |
| Grave Velvet | Silver damask on royal plum | Free |
| Glitch Circuit | Digital circuitry and fractured light trails | Free |
| Ghost Orchid | Spectral botanical engravings and misted jade | Free |
| Infernal Foil | Forged copper and glowing ember cracks | Free |
| Void Royalty | Obsidian enamel and regal heraldry | Free |
| Crimson Rite | Ritual geometry and crimson wax-seal finish | Free |
| Holo Wraith | Iridescent prism foil | Free |
| Toxic Pop | Acid-green comic ink and splashes | Free |
| Eclipse Noir | Black embossed lunar eclipse with satin-silver detail | Free |

## Implementation

- `public/card-deck-skins.js`: the one 12-skin catalog, account/device selection, single shared gallery, and no cosmetic locks.
- `public/card-deck-skins.css`: 12 original CSS illustrated backs, readable card-face palettes, matching two-card previews, accessible labels, and mobile responsive gallery.
- `backend/src/arcade-deck-locker.js`: authoritative allowlist and account selection, all current skin IDs free; unknown IDs remain rejected.
- `public/cinder-shop.html#deck-skins`: links to choose free finishes instead of disabled checkout offers.
- Four card-game entrypoints all load the versioned shared assets: Cards Against Chaos, Card Room, Card Expansion, and Cinder Eights. The single setting applies to all supported playing-card games.

Choosing a free skin does not alter shuffling, hidden card information, scoring, odds, or card content. Legacy recorded-deal counters remain optional play statistics and do not gate cosmetics.

Signed-in users can save the cosmetic choice through the authenticated account API when available; guests keep their choice on the current device. The backend still requires authentication for account sync and retains optimistic revision conflict protection. Unknown skin IDs remain invalid. Historical paid entitlement data is no longer necessary for any of these twelve skins.

Future, *new* cosmetic releases can be evaluated separately, but these twelve must not be reclassified as paid without an explicit change in product policy.

## Verification

`scripts/deck-locker-integrity.test.mjs`, `scripts/deck-locker-account-sync.test.mjs`, and `backend/src/arcade-deck-locker.test.mjs` cover free access, cross-game persistence, account conflicts and visual asset presence. Browser smoke testing should verify card-back rendering and mobile layout on each of the four game entrypoints.

## Current release: Cinders + VIP Deck Atelier (November 15, 2026)

This section supersedes the November 6 pricing/availability descriptions above. The complete Deck Locker now contains **42 finishes**:

- **12 original skins remain free forever**, including the five designs previously marked premium.
- **12 separate collector skins cost $1.00–$1.99 USD**, with account-owned Stripe entitlements, stored in `arcade_deck_paid_entitlements`; no purchase can be claimed from browser state.
- **12 public Cinders skins cost 300–900 Cinders** and are available for purchase to any signed-in member with a sufficient wallet balance.
- **6 VIP-exclusive Cinders skins cost 1,200–2,500 Cinders**, available to purchase and equip only while `member_premium_memberships.status='active'` with an unexpired membership. Purchased skins remain owned if VIP lapses, but cannot be equipped until reactivation.

**Cinders security:** `backend/src/deck-cinder-products.js` defines the trusted product catalog and `0142_deck_cinders_vip.sql` defines matching SQLite prices. The atomic `arcade_deck_cinder_purchase_guard` trigger verifies that prices match the catalog, rejects duplicate purchases, checks active VIP and sufficient wallet balance, debits `user_wallets`, and writes a matching negative `wallet_ledger` entry. Each account can buy a design only once. Neither client-supplied prices nor local storage grant entitlement. The backend reads `arcade_deck_cinder_purchases` as account-owned inventory and rechecks VIP when equipping. The database migration was applied to production D1 and recorded in `d1_migrations` on November 15, 2026.

**Display:** `public/card-deck-skins.js` has free, collector, Cinders, and VIP filters, individually illustrated CSS backs/faces, account wallet status, and direct purchase requests through `POST /api/arcade/deck-locker` with `action:'buy_cinders'`. `public/cinder-shop.html#deck-cinders` lists the 18 Cinders designs and links to the Deck Locker. All four shared card-game entry points load the same asset version.

**Automated gates:** `scripts/deck-locker-integrity.test.mjs`, `scripts/deck-locker-account-sync.test.mjs`, `backend/src/arcade-deck-locker.test.mjs`, and `scripts/test_deck_cinders_sql.py` cover catalog alignment, ownership and wallet integrity; `.github/workflows/card-board-integrity.yml` runs them on relevant changes. Live mobile browser checks verified 42 skins, 6/12 tier filters, shop previews, and no horizontal overflow. A full signed-in two-account production purchase test remains to be performed before calling the whole purchase flow end-to-end verified.
