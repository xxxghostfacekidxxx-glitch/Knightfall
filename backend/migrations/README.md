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


## Monster MMO staging migrations (0030–0031)

`0030_monster_game_saves.sql` creates authenticated player saves with optimistic versions. `0031_monster_game_battles.sql` persists the active battle state. These follow the existing production migration sequence and the planned `0029_arcade_save_revisions.sql`; do not renumber them without checking the current migration directory. Apply only to an isolated staging database until MMO authorization, reconnect, battle, rate-limit, and two-account world tests pass.
