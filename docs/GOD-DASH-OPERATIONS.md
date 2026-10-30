# God Mode operations register

Status reflects repository evidence, not confirmed production availability. Review date: 2026-10-30.

## Tools present in repository
- Arcade catalog doctor and asset doctor
- Playwright browser gameplay tests and GitHub Actions
- Tiled and LDtk map JSON validator
- Cloudflare Pages and Workers architecture
- Arcade catalog and import scripts
- See docs/KNIGHTFALL-DEV-TOOLBOX.md

## Work in progress
- Phaser, Godot, Vite, Workbox and Colyseus integrations are candidates, not installed across the site.
- Mobile gameplay tests for Hell and High Orbit, Sanctuary editions and other arcade games.
- Offline admin app downloads and game packages.
- Google and Facebook authentication callbacks and account linking.
- Cloudflare usage reporting, Turnstile, Queues and Durable Objects.
- Creator identity verification, private media and payments.
- See docs/cloudflare-free-first-rollout.md and docs/social-adult-dating-integration.md

## Owner-only manual setup checklist
Google: Configure a Google Cloud OAuth project and consent screen. Create a Web OAuth client, then enter the precise authorized origin and callback URL after the backend callback route is implemented. Configure production publishing and test accounts.

Facebook: Create a Meta developer app with Facebook Login for Web. Set the website domain, privacy and deletion policy links, and exact authorized redirect URI after backend implementation. Configure developer testing and app review.

Cloudflare: Configure required Worker environment variables and secrets through Cloudflare settings, verify D1 migrations and bindings, Turnstile configuration, R2 storage, deployment routes, quotas and access permissions.

GitHub: Review workflow permissions, deployment settings, branch protection and CI runs.

Android: Verify PWA install, offline cache behavior, package signing and release requirements.

Payments and adult services: Select compliant verification and payment providers, configure their accounts and review policies before enabling services.

Never put real credential values in this document or frontend code. Confirm completion using provider dashboards and live testing.

## Shared reference maintenance policy
This register and the God Mode Development Operations panel are the shared working reference for the project owner and development assistant. On each relevant Knightfall task, consult them, record newly completed work and newly discovered blockers, and distinguish planned, implemented, tested, deployed and production-verified status. Never silently mark a task done based only on a commit. Add new manual account requirements without storing credential values. Reconcile the dashboard and this document after significant changes. This policy applies while actively working; unattended continuous updates require an explicitly configured automation or CI integration.

## Verified repository inventory
- The God dashboard has an engineering execution-order panel (commit caec3aa3).
- Arcade catalog validation exists at scripts/arcade-catalog-doctor.mjs; it has not been certified against production.
- Shared navigation logic lives in public/nav.js. Its authorization fallback needs browser regression testing.
- The original creations manifest is public/arcade/original-creations.json.
- The recovered historical backlog is docs/ASH-FALL-RECOVERED-BACKLOG.md.

## Backlog reconciliation: 2026-10-30
- Mindustry browser feasibility: documentation gate merged in PR #188; runtime hosting remains pending.
- Original Creations manifest, Gravewave sprite helper, Creator Foundry page and offline admin launcher are present in source. Presence is not gameplay verification.
- PR #187 Electron 27-to-45 upgrade was closed without merge pending desktop build compatibility testing.
- Open PR search returned zero after cleanup. Non-main branches may remain until branch deletion is performed with repository permissions.

## Batch handoff rule (2026-10-30)
Work toward test-ready batches before asking the owner to test individual pages. Each batch needs: committed implementation, a reproducible automated smoke check, known dependencies, and a short Android test script. Do not mark runtime verified based solely on source presence. Current offline launcher fixes cover cached catalog fallback, saved-game access during auth outages, role normalization, install control recovery and invalid archive responses; Android ZIP installation and gameplay remain unverified.

## Verification batch: October 30, 2026 (card room, arcade audit, and birth-chart ledger)
- Card Room expansion repaired: shared records/fullscreen helpers stay in scope; Solitaire status updates no longer crash; Solitaire and FreeCell use Ace-low foundation/tableau ordering; occupied FreeCell foundations accept legal cards; Gin counts Aces as one and recognizes Ace-low runs while poker retains Ace-high evaluation.
- Added five executable card-room regression scenarios and a mobile browser exercise for all five tables. Card and Board Integrity now watches the expansion page and runs its rule tests.
- Removed injected legacy orange/pale-yellow overrides from 19 first-party game pages. Preserved upstream game artwork and gameplay colors.
- Repaired Reversi's arcade backlink and OpenFront's policy links; supplied missing mobile viewport metadata to ten launch/help/source documents.
- Static audit now parses actual HTML tags with Python's HTMLParser, distinguishes imported screen fragments from launch pages, checks executable script types, validates repository-source references separately from public assets, recognizes installed offline-cache routes and isolated staging APIs, and checks the current generated catalog heading. The browser game crawl excludes non-HTML credits links.
- Local verification: complete static audit passed; 80 release tests passed; 62 affected original-game regression tests passed; 21 additional arcade/manifest/card tests passed. These counts overlap with smaller focused runs and must not be added together as unique tests.
- Production D1: inspected `profile_birth_charts` table and `idx_profile_birth_charts_visible` against migration 0058; inserted the missing ledger record idempotently on October 30 at 22:12 UTC. No member birth-chart records changed. Signed-in chart create/save/publish/hide/delete remains unverified.
- Reviewed obsolete branch `dependabot/npm_and_yarn/public/arcade/hosted/interstellar-armada/npm_and_yarn-db136f4ed7` at `dc0621dba8a408d8328ae3281007f99fa743039b`: only the rejected Electron 27-to-45 proposal in closed, unmerged PR #187. Cleanup workflow checks both the closed PR and exact branch SHA before deletion; it never deletes main or a changed branch.
- Browser CI, Pages publication and final branch inventory: pending results for this batch. See GitHub Actions before treating it as production verified.
- News-bot status checked directly: both profiles still have `posting_enabled=0` and `cadence=manual`; news ledger contains no posts. Do not claim automated posting is active.
- Remaining release blockers: authenticated owner/admin/moderator/member role matrix, real Android install/download/offline play, production OAuth configuration, complete account deletion, multiplayer and game-specific playability certification.

### First deployment and follow-up findings
- Commit `90312146b983081ea84117de1e681681892efb2f` published successfully to Cloudflare Pages (deployment `ddd6ed6f-9728-47ab-8dad-8669ed62152d`). Its full static audit, dedicated chart/card tests, card/board integrity, catalog doctor and regression workflow passed.
- Cleanup run `41137003212` succeeded. GitHub branch inventory returned only `main`; open PR search returned none.
- Broader CI exposed seven catalog entries using unsupported `device: keyboard`, which made them disappear under the desktop controls filter. Normalized these to `desktop` and regenerated both directories; catalog consistency now passes locally.
- Refreshed outdated MMO source assertions to cover the current Field Bestiary, camera viewport, eight-frame front/back sprite atlas, battle metadata, slot validation and station interaction. Preserved server authorization, charge, PP and client-power rejection checks.
- Offline HTML packaging now inlines the shared visual-refresh stylesheet and omits the optional remote Phaser loader. Expanded the packaging test to supply every required game asset and verify that no external script or stylesheet tags remain. Hidden disabled connection placeholders remain for shared initialization.
- Public API smoke confirmed health, profile photos, bots, shops, categories and threads HTTP 200. A later check failed without identifying its assertion; diagnostics added to report the exact failing line and public response. The authenticated authorization matrix remains unverified.
