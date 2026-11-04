# Neon Nuisances · Species Trials

## Release scope

The original Knightfall Species Trials arcade is accessible at `/mascot-trials.html` and listed as `neon-nuisances-species-trials` in `public/arcade/catalog.json`. It uses all 28 canonical species listed in `public/assets/devil-tools/neon-nuisances/manifest.json`, with four original game engines:

- **Toxic Catch:** timed falling-crystal collection, pink hazard avoidance, pet avatar movement
- **Crypt Memory:** animated hidden matching card grid
- **Rune Signal:** progressively longer visual sequence memorization and replay
- **Night Dodge:** timed moving-hazard survival

Per-species titles, difficulties, and family-to-mode mappings live in `public/mascot-trials-engine.mjs`. The self-hosted background vectors are at `public/assets/devil-tools/neon-nuisances/trials/*.svg`. All games have touch controls; catch/dodge additionally support left/right arrows and A/D. Fullscreen has an in-stage exit control.

## Account and reward rules

The arcade requires an authenticated Knightfall session and at least one adopted Neon Nuisance. It obtains owned companions through `GET /api/mascot-pets/me`; a `?pet=NUMBER` deep link selects an owned pet only.

Challenge scores and failures are **client-side entertainment state**. A victory attempts `POST /api/mascot-pets/{petId}/care` with `{"action":"play"}`, which is already limited by the persistent, owner-verified 10-minute pet-care cooldown. Scores never grant independent wallet currency, egg fragments, Passport achievement rewards, or valuable inventory. A failed or interrupted challenge grants nothing and never harms pets.

## Verification

Automated test: `node --test scripts/mascot-trials.test.mjs`. Browser syntax: `node --check public/mascot-trials.js && node --check public/mascot-trials-engine.mjs`. End-to-end account, device, and checkout tests cannot be inferred from static tests.

Manual signed-in acceptance checks:
1. Adopt a pet, open Species Trials from its collection card, and confirm that pet is preselected.
2. Play one match of every mode using mouse, keyboard, and mobile touch. Check that win/lose states and timers reset properly.
3. Try a second win during the pet Play cooldown. Confirm no second XP and no independent Cinders.
4. Start each mode, background the tab, then return. Confirm it stops without grants.
5. Enter and exit fullscreen on desktop and mobile using the in-stage control.
6. Confirm a blocked/guest user cannot obtain someone else's pet from a crafted deep link.
7. Open Chaos Cartridge and locate the Species Trials arcade listing.

## Related features

`/mascot-room.html` is the interactive room editor with the existing `0108_mascot_room_layouts.sql` schema. Do not create a second 0108 migration or rename its columns. Sanctuary's other earnable features remain in migrations 0103–0107. The older Wrangler migration ledger may need reconciliation before any new D1 migrations. No Stripe requirement for these games or art.

Copyright: all trial code, game rules, spritesheets, and illustrated stage vectors are first-party Knightfall assets. The source-provenance record is retained in `public/arcade/import-manifest.json`.
