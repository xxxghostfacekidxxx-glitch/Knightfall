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
- `0104_mascot_economy.sql` adds all 22 rescue species, level-gated Cinders prices, twelve cosmetics, wardrobe entitlements and equipment slots. Atomic SQLite triggers perform wallet debits and prevent duplicate or unauthorized acquisitions.
- Both schemas were created in the production D1 database through the authorized Cloudflare API on November 2, 2026 and their tables, indexes, and triggers were subsequently read-verified. **This does not imply that Wrangler's `d1_migrations` ledger records either migration.** Reconcile the ledger using the reviewed Wrangler migration process before the next routine migration. Both files use idempotent table, trigger, index creation and catalog inserts; still inspect actual schema and ledger before applying.
- No Stripe secrets are configured on the production Worker at launch. Premium cosmetic checkout must remain disabled until `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are securely configured and the signed webhook endpoint is tested. Never fulfill payment based solely on browser redirect success.
- Run `python3 scripts/mascot-economy-sql.test.py` and `node --test backend/src/mascot-pets.test.mjs backend/src/mascot-payments.test.mjs` before economy or payment changes.

## Sanctuary Expeditions · rescue eggs, species quests, and habitats

- `0105_mascot_adventures.sql` adds per-species daily quests, one-time reward claims, earned shell fragments, exact-species incubating eggs and owner-controlled habitats.
- Production D1 schema was applied through the authorized Cloudflare API after the in-memory SQLite and Node integration test suites passed. **The Wrangler migration ledger may still need reconciliation** before future routine migration commands. The SQL is additive and uses idempotent CREATE statements, but always inspect ledger and actual schema before applying.
- Quests are limited to three starts and three successful claims per UTC day. A reward pays 75 Cinders plus one Rescue Shell only when a legitimate post-quest care action completes. Three earned shells craft a chosen-species egg with at least 35 minutes of incubation. No paid random eggs or irreversible loss of pets.
- Habitats and decorative scenes are free level-based unlocks. Habitat ownership is verified against the authenticated user's pet, and both eggs and rewards have D1 triggers guarding against replay and cross-account access.
- Validate with `python3 scripts/mascot-adventures-sql.test.py` and `node --test backend/src/mascot-adventures.test.mjs`, in addition to the existing Sanctuary suites.

- `0106_mascot_egg_reservations.sql` adds a database-level reservation guard so members cannot spend Cinders rescuing the exact same mascot while its earned egg is incubating. Applied to production D1 after the isolation and integration tests passed. Its migration-ledger entry also requires review before any further Wrangler migrations.

## Sanctuary Passport and Cinder Catch · November 2, 2026

- `0107_mascot_passport.sql` creates eight lifetime achievements for collecting pets, hatching eggs, finishing quests and equipping cosmetics. Achievements reward a combined maximum of 4,075 Cinders per account, only once per badge. The claim trigger calculates qualification from authenticated account records; client progress, score and requested reward amounts are never trusted.
- Production D1 was updated through the authorized Cloudflare API and read-verified with eight badge definitions, two protection triggers and no existing claims at migration time. **Wrangler's `d1_migrations` ledger still needs reconciliation** before routine migration runs.
- `public/mascot-cinder-catch.js` is an optional touch/keyboard game; winning calls the already protected `/api/mascot-pets/:id/care` endpoint with `action:play` and its existing 10-minute cooldown. The game never grants wallet currency from client-reported scores. Pets still have the existing care buttons for accessibility.
- Test with `node --test backend/src/mascot-passport.test.mjs`, `python3 scripts/mascot-passport-sql.test.py`, plus the full Sanctuary workflow.

## Little Madhouse interactive rooms · November 2, 2026

- `0108_mascot_room_layouts.sql` stores one saved position (8–92% X, 25–85% Y) and one pose (`idle`, `bounce`, or `mischief`) per account-owned pet. Database triggers reject cross-account inserts, owner transfers, and invalid values; room changes award no Cinders.
- Production D1 room table and both ownership triggers were installed and read-verified through the authorized Cloudflare API. There were zero saved rooms at installation. **Wrangler's migration ledger must be reconciled against migrations 0103–0108 before any routine migration runs**; do not blindly replay them.
- `/mascot-room.html` supports touch drag, keyboard repositioning, level-locked habitats and decorations, layered account-owned accessories, and the existing protected Feed/Play/Rest actions.
- The read-only `/mascot-room.html?user=<username>&pet=<id>` mode uses the preexisting `/api/mascot-pets/profile/:username` route. That route enforces private/friends visibility and blocks. Visitors have no write controls; only authenticated owners can call the room update endpoint.
- Run `python3 scripts/mascot-room-sql.test.py`, `node --test backend/src/mascot-room.test.mjs`, and the full Sanctuary workflow before future room changes.
