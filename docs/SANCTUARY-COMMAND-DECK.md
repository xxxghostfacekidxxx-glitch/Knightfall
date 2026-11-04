# Neon Nuisances Sanctuary: November 2026 gameplay and UI pass

## Shipped source changes
- **Collection first:** the owned companion grid is now above activities and quests, with search, sorting and useful care/ownership filters.
- **28 personalities:** every server-authoritative species has a temperament, favorite interest and public lore. The same information appears in adoption browsing, the pet room and member profile showcases.
- **Care and bonds:** each owned pet serializes time-decaying needs, mood, mood guidance and bond tier derived from existing XP. Level progress uses the same 40 × level² thresholds as the server. Nothing in the browser can grant XP.
- **Crew care:** `POST /api/mascot-pets/care-all` with `{"action":"feed"|"play"|"rest"}` atomically updates all pets belonging to the authenticated member that are past the action cooldown. It reports count and total awarded XP; the same accepted actions progress existing daily quests. No new Cinders, paid rewards or blind loot is created by bulk care.
- **Wardrobe:** existing paid and earned cosmetics are searchable by availability/slot; owned pets tuck equipment and habitat controls behind an accessible disclosure to avoid 28 fully expanded editor panels.
- **Rooms:** display mood, needs, personality and care cooldowns while keeping public room visitors read-only and omitting private vitals.
- **Profiles:** collectible cards show personalities and an owner-selected featured companion without leaking health/cooldowns or wallet.
- **Regression coverage:** `scripts/mascot-sanctuary-deck.test.mjs` and extended `backend/src/mascot-pets.test.mjs`, wired into `.github/workflows/mascot-sanctuary-tests.yml`.

## Deployment and schema
The new UI is static Cloudflare Pages content. Bulk care and personality fields require the corresponding Cloudflare Worker deployment. Existing D1 tables are reused; **this pass introduces no D1 migration**. Existing sanctuary features still require their previously documented migrations (0103–0109) to be applied in the environment.

Do **not** report the feature as live until the Pages and Worker deployment checks succeed; GitHub source commits alone are not production confirmation.

## Manual acceptance checklist
1. Logged-out mobile: browse all 28 species; adopting redirects to sign-in, and the dashboard never claims private stats are public.
2. New account: rescue the first species free; see its name, personality, mood, XP progress and personal room.
3. Two pets: use crew care; verify only cooldown-eligible pets gain the expected action XP once, even after repeating/reloading.
4. Start a species quest and complete its required action through crew care; verify normal quest progression, without duplicating claim rewards.
5. With several pets: search by nickname or species; sort by level, needs or name; toggle wardrobe/habitat disclosure and equip owned items.
6. Filter adoption by locked/ready/owned and cosmetics by currency, slot or owned status; changing filters never deletes collection data.
7. Enter a room after using care, confirm cooldown labels and low-needs indicators, then verify friend/public room visitors see no private needs or save controls.
8. Check 360 px Android, 390 px Android and desktop widths for overflow, readable inputs and working touch targets.
9. Verify existing rescue eggs, expeditions, Passport, furniture placements, Stripe-entitled cosmetics and profile privacy continue functioning.

## Next phase proposals (not shipped here)
- Server-persisted affection interactions, achievements and care streaks with forgiving absence rules.
- More skill-based pet activities and meaningful exploration/story unlocks, not paid stat boosts.
- Additional illustrated cosmetics and themed furniture, only after catalog asset validation and D1 catalog migrations are paired safely.
- Opt-in friend visiting, pet guestbooks and social gifting with spam controls and non-tradable premium purchase protections.
- Optional humane reminders after Android notification reliability is confirmed, never guilt-driven pet decay.
