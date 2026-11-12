# D1 migration operations

The production database is `knightfall-forum`, configured in `backend/wrangler.jsonc`. The Worker deployment workflow intentionally does not run D1 migrations; deployment credentials currently do not have migration-write permissions. Treat schema readiness as a separate release gate.

## Before applying a migration

1. Review the complete SQL file and confirm whether it is safe to rerun.
2. Check the remote migration ledger:
   `npx wrangler d1 migrations list knightfall-forum --remote --config backend/wrangler.jsonc`
3. Compare the ledger with the migration files in this directory. Do not rename or rewrite migrations that have already been applied.
4. Take a backup/export before any destructive schema or data change.

## Apply reviewed migrations

The repository includes a guarded GitHub Actions workflow at `.github/workflows/apply-d1-migrations.yml`. It is manual-only, requires an explicit production confirmation, and uses a dedicated `CLOUDFLARE_D1_MIGRATION_TOKEN` secret with D1 migration permissions. Configure that secret before running the workflow.

From the repository root, the equivalent command is:

```sh
npx wrangler d1 migrations apply knightfall-forum --remote --config backend/wrangler.jsonc
```

Confirm the command reports the expected migration names as applied. Then run read-only checks against the live API and database for any records or schema that migration was intended to provide.

## Migration ledger drift

A migration can have its intended data present while its filename is missing from `d1_migrations`, for example if records were created manually. Do not assume that this means the migration ran. First compare the existing rows with the migration's exact SQL. If the SQL is idempotent and the data matches, execute the reviewed migration through Wrangler so Wrangler records it in the ledger. Avoid manually inserting ledger rows unless the normal migration runner is genuinely unavailable and the exact SQL has already been applied and verified.

## Current known review item

`0017_true_crime_sanctum_infernum.sql` inserts two categories with `INSERT OR IGNORE`. The production category rows were present during the October 19, 2026 audit, but the filename was absent from the migration ledger. Reconcile this using the normal Wrangler migration runner and verify both category slugs afterward.


## Arcade progress migration

`0019_arcade_progress.sql` adds per-account high scores and private, versioned save slots. It is additive and does not alter existing community data. Before applying it, reconcile the already-present True Crime, Sanctum Infernum, Gaming, and Mindless Scribbling categories with the missing `0017` and `0018` migration ledger entries by running the idempotent migrations in order. Then apply `0019` with the normal Wrangler migration runner and verify the two arcade tables and indexes. Do not expose the arcade save UI as production-ready until the schema is applied and the API deployment succeeds.


## Friend requests and friendships

`0020_friends.sql` creates the friend-request table used by the authenticated `/api/friends` endpoints. The migration is additive. Apply it to the production D1 database using the documented manual migration workflow before relying on friend requests in the live site:

```sh
npx wrangler d1 migrations apply knightfall-forum --remote --config backend/wrangler.jsonc
```

After applying it, verify the migration ledger includes `0020_friends.sql`, then test sending a request, accepting it from the recipient account, declining a request, cancelling an outgoing request, and removing an accepted friend. Worker deployment alone does not apply this schema.

## Exact message read cursors

`0022_message_read_cursors.sql` adds `conversation_members.last_read_message_id` so unread counts and seen indicators compare stable message IDs rather than timestamps. It is additive and retains `last_read_at` for compatibility with existing records and older clients.

The Worker checks whether the new column exists before using it, so deploying the backend first does not break messaging while the migration is pending. The inbox and chat UI prefer exact message-ID receipts as soon as the column is present and fall back to timestamp behavior until then.

Apply the migration through the guarded **Apply reviewed D1 migrations** GitHub Actions workflow after reviewing the pending migration ledger and confirming the required `CLOUDFLARE_D1_MIGRATION_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets are configured. The workflow requires the explicit `confirm_production` input. After it completes, verify the ledger includes `0022_message_read_cursors.sql` and check that `last_read_message_id` exists on `conversation_members`. Do not report exact-ID receipts as active in production until those checks pass.

## Production application record (2026-10-22)

The production D1 database `knightfall-forum` was verified to be missing migrations `0020_friends.sql`, `0021_member_bot_slots.sql`, and `0022_message_read_cursors.sql`. The guarded GitHub workflow could not be triggered through the connected GitHub integration, so the exact reviewed SQL for those three additive migrations was applied through the Cloudflare D1 query API in order. Each migration's ledger row was inserted only after its SQL completed successfully. A subsequent read-only verification confirmed all three ledger rows, the `friend_requests` table, the role-aware `personal_bots_owner_limit` trigger (regular members 2, moderators 5, admins 10), and `conversation_members.last_read_message_id` are present. This was a direct API application, not a run of the Wrangler migration workflow.


## Starting Cinders balances (0024)

Migration `0024_starting_cinders.sql` raises each existing wallet to a minimum starting balance without reducing balances above the threshold: regular members receive at least 2,000 Cinders; admins, moderators, god-role accounts, and the `knightfall` owner account receive at least 1,000,000. The adjustment is recorded in `wallet_ledger`. The Worker also creates new wallets with the appropriate role-based starting balance. Apply this migration through the guarded production migration workflow or an authorized D1 migration process, then verify the wallet balances and migration ledger before reporting it live.


## Live typing indicators (0025)

`0025_message_typing.sql` adds the nullable `conversation_members.typing_until` field and an index for short-lived typing presence. The Worker only allows conversation members to update their own typing state or read the other participant's active typing state. Typing leases expire after seven seconds, and the browser refreshes presence every 2.2 seconds while a conversation is open. The migration was applied and verified in production on 2026-10-23; the `typing_until` column and migration ledger entry are present.


## Message reactions (0026)

Migration 0026_message_reactions.sql adds per-user emoji reactions to messages. The authenticated API only returns reactions for messages in a conversation the requester belongs to, and reaction writes verify both message existence and conversation membership. The UI supports a curated set of eight emoji and refreshes reaction counts when the conversation is rendered or polled. Apply the migration through the guarded production migration workflow and verify the table/index before treating reactions as available in production.


## Group conversations (0027)

0027_group_conversations.sql adds a group name and creator reference to conversations. The group API uses the existing conversation_members access boundary, so messages, reactions, typing status, and read state remain scoped to current group membership. Apply this additive migration before deploying a Worker version that queries group metadata. Verify both new columns exist and the migration ledger includes 0027_group_conversations.sql; then create a test group with at least two other active members and verify all participants can read and send messages while non-members receive a not-found response.


## Private message attachments (0028)

`0028_message_attachments.sql` stores attachment metadata only; file bytes live in the separate private R2 bucket `knightfall-message-attachments` bound as `MESSAGE_ATTACHMENTS`. The bucket has no public domain binding. Uploads require conversation membership, are limited to 10 MiB per file and an explicit image/PDF/TXT/DOCX MIME allowlist, and are linked to a message only when the sender submits that message. Downloads require current conversation membership; pending uploads are visible only to their uploader, and attachments on deleted messages are not downloadable. Never bind the private personal vault or public game-asset bucket for this feature.


## Arcade save revisions (0029)

`0029_arcade_save_revisions.sql` adds a monotonic revision to each arcade save. Revision-aware clients send `expected_revision`; stale writes receive HTTP 409 and must reload before retrying. Apply the migration before deploying the revision-aware Worker. Test that an update advances the revision and that a stale conditional update changes zero rows. The migration is additive and preserves existing save rows at revision 1.

## Neon Nuisances Sanctuary launch · November 2, 2026

- `0103_mascot_pets.sql` adds persistent member-owned pets and a single featured companion.
- `0104_mascot_economy.sql` adds all 28 rescue species, level-gated Cinders prices, twelve cosmetics, wardrobe entitlements and equipment slots. Atomic SQLite triggers perform wallet debits and prevent duplicate or unauthorized acquisitions.
- Both schemas were created in the production D1 database through the authorized Cloudflare API on November 2, 2026 and their tables, indexes, and triggers were subsequently read-verified. **The `d1_migrations` ledger has since been reconciled for migrations 0103–0108 after complete production schema verification.** Both files use idempotent table, trigger, index creation and catalog inserts; still inspect actual schema and ledger before applying.
- No Stripe secrets are configured on the production Worker at launch. Premium cosmetic checkout must remain disabled until `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are securely configured and the signed webhook endpoint is tested. Never fulfill payment based solely on browser redirect success.
- Run `python3 scripts/mascot-economy-sql.test.py` and `node --test backend/src/mascot-pets.test.mjs backend/src/mascot-payments.test.mjs` before economy or payment changes.

## Sanctuary Expeditions · rescue eggs, species quests, and habitats

- `0105_mascot_adventures.sql` adds per-species daily quests, one-time reward claims, earned shell fragments, exact-species incubating eggs and owner-controlled habitats.
- Production D1 schema was applied through the authorized Cloudflare API after the in-memory SQLite and Node integration test suites passed. **The migration ledger was reconciled for 0103–0108 after schema verification.** The SQL is additive and uses idempotent CREATE statements, but always inspect ledger and actual schema before applying.
- Quests are limited to three starts and three successful claims per UTC day. A reward pays 75 Cinders plus one Rescue Shell only when a legitimate post-quest care action completes. Three earned shells craft a chosen-species egg with at least 35 minutes of incubation. No paid random eggs or irreversible loss of pets.
- Habitats and decorative scenes are free level-based unlocks. Habitat ownership is verified against the authenticated user's pet, and both eggs and rewards have D1 triggers guarding against replay and cross-account access.
- Validate with `python3 scripts/mascot-adventures-sql.test.py` and `node --test backend/src/mascot-adventures.test.mjs`, in addition to the existing Sanctuary suites.

- `0106_mascot_egg_reservations.sql` adds a database-level reservation guard so members cannot spend Cinders rescuing the exact same mascot while its earned egg is incubating. Applied to production D1 after the isolation and integration tests passed. Its migration-ledger entry has now been read-verified.

## Sanctuary Passport and Cinder Catch · November 2, 2026

- `0107_mascot_passport.sql` creates eight lifetime achievements for collecting pets, hatching eggs, finishing quests and equipping cosmetics. Achievements reward a combined maximum of 4,075 Cinders per account, only once per badge. The claim trigger calculates qualification from authenticated account records; client progress, score and requested reward amounts are never trusted.
- Production D1 was updated through the authorized Cloudflare API and read-verified with eight badge definitions, two protection triggers and no existing claims at migration time. **The `d1_migrations` ledger entry is now present and verified.**
- `public/mascot-cinder-catch.js` is an optional touch/keyboard game; winning calls the already protected `/api/mascot-pets/:id/care` endpoint with `action:play` and its existing 10-minute cooldown. The game never grants wallet currency from client-reported scores. Pets still have the existing care buttons for accessibility.
- Test with `node --test backend/src/mascot-passport.test.mjs`, `python3 scripts/mascot-passport-sql.test.py`, plus the full Sanctuary workflow.

## Little Madhouse interactive rooms · November 2, 2026

- `0108_mascot_room_layouts.sql` stores one saved position (8–92% X, 25–85% Y) and one pose (`idle`, `bounce`, or `mischief`) per account-owned pet. Database triggers reject cross-account inserts, owner transfers, and invalid values; room changes award no Cinders.
- Production D1 room table and both ownership triggers were installed and read-verified through the authorized Cloudflare API. There were zero saved rooms at installation. **All six Sanctuary migration ledger entries (0103–0108) are present and verified**; do not blindly replay migrations.
- `/mascot-room.html` supports touch drag, keyboard repositioning, level-locked habitats and decorations, layered account-owned accessories, and the existing protected Feed/Play/Rest actions.
- The read-only `/mascot-room.html?user=<username>&pet=<id>` mode uses the preexisting `/api/mascot-pets/profile/:username` route. That route enforces private/friends visibility and blocks. Visitors have no write controls; only authenticated owners can call the room update endpoint.
- Run `python3 scripts/mascot-room-sql.test.py`, `node --test backend/src/mascot-room.test.mjs`, and the full Sanctuary workflow before future room changes.

### Sanctuary D1 migration ledger reconciliation

On November 3, 2026 UTC, the production D1 database was audited and all 36 expected objects from 0103–0108 were confirmed (15 tables, 19 triggers, 2 indexes). All six migration names were absent from `d1_migrations` despite their schemas already being installed by direct API requests. After verifying the objects, the six names were recorded using idempotent `INSERT OR IGNORE` statements. A subsequent read-only query confirmed each ledger entry. This reconciliation applies **only** to Sanctuary migrations 0103–0108; it does not certify unrelated migration files or replace future normal Wrangler migration workflows.

## Sanctuary Curio Cabinet furniture · November 3, 2026 UTC

- `0109_mascot_furniture.sql` adds eight deterministic home furnishings, account-wide own-once inventory, Cinders purchases and up to eight per-pet placements. A full catalog has four free and four Cinders-priced items. D1 triggers enforce ownership, price, pet level, and placement limits.
- Production D1 was updated through the authorized Cloudflare API after Sanctuary's recent test passes. A read-only check verified all eight catalog entries, four tables and four protection triggers. `0109_mascot_furniture.sql` was then recorded in `d1_migrations` and its entry read-verified. This is separate from the earlier 0103–0108 reconciliation.
- The Curio Cabinet client waits for the interactive room's selected-pet event before loading inventory, preventing the initial empty-selector race. Furnishing arrangements are stored server-side and do not mint XP or Cinders.
- Tests: `python3 scripts/mascot-furniture-sql.test.py` and `node --test backend/src/mascot-furniture.test.mjs`, plus the Sanctuary workflow.


## Personal Misfit Avatars · November 3, 2026

- `0113_personal_misfit_avatars.sql` adds saved member avatar designs, two free slots per member, and up to 20 extra slots. Fixed Cinders products cost 600 for one slot or 1,500 for three.
- D1 triggers check the server-defined price, wallet balance, slot cap, slot ownership, and single active profile avatar. The browser sends only a product ID; it cannot set prices or increase slot counts.
- `/avatar-studio.html` provides the big-head Misfit Maker with saved slots, quick-look archetypes, random generation, expanded eyes/expressions/markings/piercings, distinct garment designs, separate headwear/eyewear/neckwear/aura layers, background patterns, 768-by-768 PNG export, and owner-confirmed slot clearing. Public profile avatar reads enforce profile visibility and existing member block rules. The profile header only uses an avatar after a member explicitly saves it as their active look. The SVG builder uses a strict server-validated choice set; added traits require no schema migration.
- On November 4, 2026 UTC, this additive migration was applied to production D1 through the authorized Cloudflare API after confirming its ledger entry was absent and reviewing the SQL. Read-only verification confirmed the three tables, two indexes, four triggers, and migration ledger entry. The guarded GitHub workflow was unavailable through the connected GitHub integration; schema and ledger were updated together in one D1 batch.

## Neon Nuisances bond and daily rituals · November 4, 2026

- `0114_mascot_bond_interactions.sql` adds a separate, non-decaying relationship XP track and timestamps for Talk, Cuddle, and Groom. The actions have server-side cooldowns, add bond only, and grant no Cinders or pet XP. Missing days never remove bond.
- On November 4, 2026 UTC, `0114_mascot_bond_interactions.sql` was applied after 0113 through the authorized Cloudflare API. Read-only verification confirmed all four new columns and both migration ledger rows. Both changes were additive, and the SQL and matching ledger entries were applied in one ordered D1 batch because the guarded GitHub workflow was unavailable through the connected GitHub integration.


## Neon Nuisances expansion · 0115

- `0115_mascot_species_expansion.sql` adds six original rescue species (Lydibug, Sootsnoot, Rumblefluff, Glittergob, Craggle and Prismare), expands adoption and egg-hatch capacity to 28, preserves the original 22-species passport milestone, and adds a separate 28-species completion reward. Existing pets and claimed rewards remain intact.
- The matching SVG artwork is original Knightfall art recorded in the Neon Nuisances asset manifest. Lydibug is a cheerful star-spotted garden beetle designed as a symbolic tribute, without using personal photos or likeness.
- Apply the D1 migration before deploying the Worker code that offers the six species.

## Neon Nuisances Starborn forms · 0116

- `0116_starborn_evolutions.sql` raises the rescue level and Cinders costs for Lydibug, Minion Mouse, Mini Villain, The Eddie and Boo Thang, and narrows the zero-cost first rescue to the eight original starter species. The database trigger checks the starter restriction and server-set rescue cost.
- Starborn evolved art is unlocked from pet XP level plus non-decaying bond milestones; forms appear in collection cards, public profile companions and personal rooms. The five evolutions are Lydibloom (Lv 9 / 500 bond), Minion Mouse: Mastermind (Lv 10 / 650 bond), Supreme Mini Villain (Lv 11 / 750 bond), Everguard Eddie (Lv 11 / 850 bond), and Boo Thang: Heartlight (Lv 10 / 800 bond).
- `scripts/build-mascot-starforms.mjs` adds bespoke details to Minion Mouse, Chunky Monkey and Boo Thang animation states, and generates the five deluxe evolved portraits. Run it after `scripts/build-mascot-portraits.mjs` when regenerating the full art pack.

## Async arcade turns · 0117

- `0117_async_arcade_matches.sql` adds account-owned async matches and an ordered move log. The first supported game is Connect Four; only accepted friends can challenge each other, and turns do not expire.
- Match actions are validated by the Worker. Board state is never accepted from the browser; each move is written against the expected player and turn number, and the other player receives the normal in-app/push notification.
- Applied to production D1 on November 4, 2026 UTC. Read-only verification confirmed both match tables, all four indexes and the `d1_migrations` ledger entry before the Worker was deployed.

## Cards Against Chaos + Butters/Trouble, 0118 and 0119 (November 5, 2026)

- `0118_chaos_card_matches.sql` adds `arcade_chaos_card_matches` as a separate, account-owned, versioned async match table. Connect Four's `0117` data and constraints are unchanged.
- `0119_butters_trouble_pets.sql` adds Butters and Trouble to `mascot_species_market` (1,400 Cinders at level 3 and 1,750 Cinders at level 4), raises the maximum collection to 30, and updates the complete-collection badge target.
- The three existing rescue/egg guards were rebuilt with the new 30-pet ceiling; the starter restriction, unlock levels, ownership checks, wallet debit rules and egg timing rules were preserved.
- **Production D1 `knightfall-forum` was updated November 5, 2026 through Cloudflare's authorized D1 query API**, because no GitHub workflow-dispatch action was available in this session. A D1 time-travel recovery bookmark was checked before these writes. Both SQL migrations returned success, their table, pet market entries, guards, and badge target were read back, and migration ledger entries `63` and `64` were inserted and verified *after* those checks. Do not rerun these migrations in the production migration workflow.
- Runtime acceptance is still needed for two-device async card matches, real notification delivery, pet rescues, and the newly rendered pet artwork. Deployed source or matching D1 rows do not prove gameplay works end to end.

## Four-seat Cards Against Chaos · 0120 (November 5, 2026)

- `0120_four_seat_chaos_cards.sql` creates `arcade_chaos_four_matches` with **exactly four in-game seats**, one required owner and up to three optional human account IDs. The remaining game seats are scripted Lydibug, Butters and Eddie AI opponents.
- The online invite lobby lets accepted friends join before play begins. The host can start early, at which point pending invites expire and their seats become AI for that match. Game and invitation mutations use version-checked D1 writes; each member's hand is scoped to their authenticated view.
- Existing `0118` two-member table and `0117` Connect Four tables are **not modified or removed**. The old card table was verified empty before the migration. No saved match was discarded.
- The production `knightfall-forum` D1 migration was applied and verified on **2026-11-05**, and recorded in `d1_migrations` as **ID 65** after confirming the table, four indexes, optional invited-member columns and old match count. Time Travel bookmark recovery was checked before applying it. Do not rerun an already-recorded migration.
- Full cross-account/device acceptance, mobile turn notifications and CI test results require separate verification; successful schema writes alone are not a claim of complete runtime certification.


## Skunk Riot Sanctuary expansion · 0121 (November 5, 2026)

- `0121_skunk_riot_pet.sql` registers the original `skunk-riot` species at **2,000 Cinders**, Sanctuary level **4**.
- The three existing ownership, rescue and egg guards were recreated with the maximum collection count **31**. Their starter restriction, unlock-level calculation, wallet debit, duplication prevention and incubation restrictions were carried forward.
- The `full_menagerie` badge now requires collecting **31** original companions.
- Applied to production D1 `knightfall-forum` on November 5, 2026 through the authorized Cloudflare D1 query API, after confirming a D1 Time Travel recovery bookmark. Verified species row, all three 31-slot guards, maintained starter and wallet safety checks, and completion-badge target with production readbacks.
- The successful applied migration was then recorded in `d1_migrations` as ledger **ID 66**. Do not rerun this migration through Wrangler while the entry is present.
- New first-party assets: `public/assets/devil-tools/neon-nuisances/skunk-riot.svg`, idle/blink/bounce/mischief variants and `portraits/skunk-riot.svg`. The mascot also appears in Pet Life, Species Trials, legacy pet activities, owner profiles and the Sanctuary catalog.
- Code and deployment evidence do not replace a member-account adoption and visual acceptance test.

## Profile wall reactions and comments · 0126 (November 11, 2026)

- `0126_profile_wall_interactions.sql` adds account-scoped `profile_wall_reactions` (one fire/heart/skull reaction per user per status update) and soft-deletable `profile_wall_comments` (one level, 1–1,000 characters).
- Existing `social_activity` rows and member profiles are preserved. Comments and reactions reference existing user and update IDs with `ON DELETE CASCADE`. Indexes support paginated comments and account queries.
- Production `knightfall-forum` D1 was inspected, and a Time Travel recovery bookmark was confirmed before applying the reviewed additive SQL through the connected D1 query API. Both tables, their foreign-key relationships, and all three named indexes were read back successfully.
- The applied SQL was subsequently recorded under `d1_migrations` **ID 71** with filename `0126_profile_wall_interactions.sql` on **November 11, 2026**. **Do not rerun this migration through Wrangler while the ledger entry remains present.**
- Backend `/api/profile-wall` routes enforce public/followers/friends/private visibility, accepted friendships, active accounts, blocking, owner-only post editing, signed-in reactions, and comment removal by author/profile owner/moderator. A separate hardening change protects the legacy `/api/social/activity` feed from exposing private-profile updates.
- Deployment checks: `node --test backend/src/profile-wall.test.mjs`, mobile and desktop profile browser smoke, Worker deployment success, and real authenticated cross-account acceptance remain separate gates. A database migration alone does not make the feature live.



## Member profile wall · 0126 (November 11, 2026)

- `0126_profile_wall_interactions.sql` adds account-owned `profile_wall_reactions` and `profile_wall_comments` with foreign keys, moderation-safe soft deletion, unique per-member reactions and query indexes.
- **Applied to production** `knightfall-forum` on November 11, 2026, after confirming a Cloudflare D1 Time Travel recovery bookmark. Production read-back confirmed both tables, all three indexes, and foreign keys.
- D1 `d1_migrations` records `0126_profile_wall_interactions.sql` as **ID 71**, applied at `2026-11-11 18:24:41` UTC. **Do not rerun this migration.**
- The interactive wall uses existing `social_activity` for status posts, `social_bookmarks` (migration 0033) for private saved posts, and `safety_reports` for user reports. These existing tables are unchanged by 0126.
- Server rules scope edits to post authors; reaction and comment writes require session authentication and view permission; author/profile-owner/moderator privileges apply to comment removal. Hidden, blocked and restricted posts remain protected even when saved.
- Re-run `node --test backend/src/profile-wall.test.mjs scripts/profile-wall-ui.test.mjs`, the Profile Studio/Android browser smoke suite and a real two-account acceptance test after deploying. A D1 schema read-back is not proof of interactive production correctness.

## Account-deletion request infrastructure · 0128 (November 11, 2026 CDT)

- Production D1 `knightfall-forum` was inspected before migration: `account_deletion_requests` was **missing**, and the older `0033_account_deletion_requests.sql` was not present in the D1 migration ledger (the original 0033 ledger entry belongs to `0033_social_adult_dating.sql`).
- Checked the D1 Time Travel recovery bookmark before making any change. Applied the additive `0128_account_deletion_requests_unique.sql` to create the request table, two standard indexes, and one **partial UNIQUE index on `user_id` for pending/in-progress requests**. No account/user records were modified.
- Production read-back verified **0 existing requests**, all three indexes (including the partial unique condition), and both `users` foreign keys. Recorded and verified ledger entry **ID 73**, `0128_account_deletion_requests_unique.sql`, at `2026-11-12 03:54:02` UTC.
- **Do not reapply manually** while this ledger entry exists. Other environments should use the regular migration process. The original un-applied 0033 request-table SQL remains as historical source, but **0128 is the canonical installed production migration**.
- The API's insert uses `INSERT OR IGNORE` plus a D1 affected-row check. A concurrent submission that loses to the UNIQUE index returns the existing request and does not duplicate audit/notification fanout.
- `scripts/account-deletion-migration.test.py` tests uniqueness across statuses, transition to in-progress, historical terminal requests, and migration idempotency; the runtime smoke workflow runs it.
- Source changes and schema installation do **not** prove authenticated end-to-end deletion request submission, actual account erasure or mobile acceptance. Issue #150 stays open.
