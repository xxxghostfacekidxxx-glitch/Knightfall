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


## Arcade save revision migration (0029)

`0029_arcade_save_revisions.sql` adds a monotonic revision to each arcade save slot so clients can detect stale concurrent writes. It is additive and initializes existing saves at revision `1`. Apply it through the guarded production migration workflow using `CLOUDFLARE_D1_MIGRATION_TOKEN`, then verify the production migration ledger includes `0029_arcade_save_revisions.sql` and the `arcade_saves.revision` column exists. Do not deploy the revision-aware Worker before that migration succeeds; the standard Worker deployment intentionally does not apply D1 migrations.
