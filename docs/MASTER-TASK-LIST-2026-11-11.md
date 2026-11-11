# Ash-Fall / Knightfall master task list — 2026-11-11

Status convention: **Implemented** means present in source; **CI verified** means a named automated check passed; **production verified** and **device accepted** require separate evidence. Unchecked entries must not be described as absent.

## Completed in repository — 2026-11-11 quick-fix batch

- [x] Corrected mini-game saved-state validation to return a synchronous boolean for Cinder Collider (Particle Clicker), Crypt Conduits and Ash Slope. Previously the async validator returned a truthy Promise, which could bypass corruption checks.
- [x] Added `scripts/arcade-mini-save-validation.test.mjs` covering valid and malformed save snapshots and linked it into the GitHub Runtime Smoke Test workflow.
- [ ] Confirm the new CI job passes on main, then verify save/resume and Particle Clicker upgrades in the deployed mobile browser before closing related gameplay reports. Source changes are not physical-device certification.

## Cleanup batch — 2026-11-11

- [x] **Repository hygiene:** GitHub branch search returned only `main` (pagination checked); open pull-request search returned zero. No branch deletion or PR closure was necessary. This is a point-in-time audit.
- [x] **Historical arcade issue reconciliation:** #144 (Particle Clicker), #145/#146 (Freeciv Web), and #147 (Tetris) were absent from the open-issue search. Preserve historical reports as evidence; verify live gameplay before claiming their underlying defects fixed.
- [x] **Admin navigation:** added an admin-only `Master Task List` link targeting `/admin.html#master-task-list`. The shortcut stays hidden from signed-out/non-admin visitors; it follows the existing admin link's reveal/error handling, not a new authorization mechanism.
- [x] **God Mode task visibility:** gave the task section a stable anchor, added a link to PRs, refreshed historical arcade wording, and displayed the dated branch/PR snapshot.
- [x] Added `scripts/admin-task-navigation.test.mjs` and registered it in Runtime Smoke Test workflow.
- [ ] Confirm fresh CI is green, Pages deployment includes these commits, and the task link works in an authenticated admin browser.
- [ ] Live-game retests remain open; site could not be independently browsed through the available web connection during this batch.

## Continued quick fixes — November 11, 2026

- [x] **Cinder Collider legacy-save repair:** restore missing research/scientist purchase-price fields when resuming old local/cloud snapshots, preserving particles and purchased boosts. This prevents the controls showing a price that the purchase handler cannot use.
- [x] **Regression coverage:** added test cases for older missing-price saves and current saves with existing prices; kept the mini-game tests in the Runtime Smoke workflow.
- [ ] Validate the new tests in CI and verify a legacy save's upgrade controls in mobile Chromium and physical Android. Do not close the historical Particle Clicker issue as a verified gameplay fix without deployed acceptance.
- [ ] Check current Cloudflare Pages deployment against the new commits; the public site fetch from this environment was unavailable.

## Arcade reliability batch — November 11, 2026 (continued)

- [x] **Cancelled stale cloud resumes:** a pending resume no longer overwrites a freshly started game; overlapping resumes use a request token and generation guard.
- [x] **Added async race regression coverage:** requests aborted before loading or while a cloud response is pending must not read local saves or restore stale game state.
- [ ] Verify the runtime smoke test results and manual restart-versus-resume behavior on a deployed mobile browser. Tests committed in source are not a CI pass.
- [ ] Confirm exact deployed Pages revision before changing live status.

## P0 — Immediate reliability and release blockers
- [ ] Triage [arcade fleet failure #192](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/issues/192), inspect failed artifacts and latest run, reproduce, fix root cause, rerun all ten shards and smoke tests. Prior fleet green does not override newer failure.
- [ ] Set up six dedicated member/mod/admin CI identity secrets and pass authorization, cross-account ownership and God Mode server-enforced role tests. Never store credentials in Git.
- [ ] Complete account deletion across D1/KV/R2, session/push revocation, retention, staff processing and off-app request flow. Current password check and public assistance ticket exist; completion remains open [#150](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/issues/150).
- [ ] Verify current production Pages and Worker versions, /api/auth/me JSON response, login, registration, password recovery, protected media, rate limits and CSRF/Turnstile; configure Google/Meta OAuth providers only with correct callback and consent setup.
- [ ] Real Android and desktop acceptance: message composer, older history, inbox switches, attachments, friends, profiles, themes, push background/closed-app delivery, notification click and permissions [#153](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/issues/153).
- [ ] Test admin offline launcher, authenticated ZIP retrieval, storage quota rollback, service worker cache and offline gameplay on physical Android.
- [ ] Verify security and privacy for adult-gated content, creator uploads, public/personal bots, admin panels and all account ownership paths.

## P1 — Arcade, games and creative systems
- [ ] Retest previously reported [Tetris controls #147](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/issues/147), [Particle Clicker upgrades #144](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/issues/144), [Freeciv Web #145](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/issues/145) and [#146](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/issues/146); close only after reproducible verification.
- [ ] Certify each arcade cabinet beyond HTTP 200: real controls, startup, pause/fullscreen, mobile portrait/landscape, score persistence, asset loading, accessible touch targets and truthful hosted/prototype labels.
- [ ] Continue original arcade consolidation and modern graphics: Ash Serpent, Shattershot, Chaos Connect Four, Madhouse Memory, Crypt Smash, Cursed Circuit, Cinder Merge, Ash Tiles, Afterburn, Crypt Words, Cinder Crossing, Neon Surge, Cinder Eights and remaining cabinets. Avoid deleting distinct playable versions without review.
- [ ] Fish tables: Trench Bounty, Neon Kelp and Magma Trench; four independent seats, hold-to-fire, multi-touch, server-authoritative rooms and credit/score fairness. No cash gambling.
- [ ] Hell & High Orbit: [four equipped moves #166](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/issues/166), level learnsets, PP, evolution, capture, creature switching, mobile battle UI, offline save migration, secure multiplayer and reconnect. Stage first.
- [ ] Verify Sanctuary's End editions, City of Cinders, The Descent, original zombie/space games and city-building prototypes before marketing as playable.
- [ ] Audit open-source game licensing, attribution and runtime feasibility; review Mindustry, Terravia, BrowserQuest, Freeciv, card/board games, and requested Star Wars/DBZ references without distributing unlicensed assets.
- [ ] Verify Deck Locker across two accounts/devices; card rooms with human players and bots; achievements, rewards and anti-duplicate scores.
- [ ] Complete Gravewave sprite integration, mascot sanctuary roster/tests, Devil Tools/Creator Foundry asset archive, icons and modern responsive artwork.

## P1 — Community, AI and operations
- [ ] Confirm shared navigation on category, arcade, profile and admin pages; eliminate legacy orange overrides and Miss Chaos overlay collisions.
- [ ] Test profile customization, friend requests, activity feed, groups, reporting, blocking, private journal, birth chart city picker and privacy boundaries.
- [ ] Verify member bot limits and owner/admin tools; finish Miss Chaos continuity, memory consent/clear, human conversational behavior, site knowledge and optional voice without claiming unsupported offline AI.
- [ ] Check forum news bots and game test fleet schedules, failure routing and God dashboard telemetry. Never describe disabled posting as active.
- [ ] Review D1 migration ledger and backups, R2 storage permissions, Worker/Pages deploy status, CI workflows, staging and rollback procedures.
- [ ] Test creator workshop permissions, catalog publishing and media ownership; keep public bot NSFW gating distinct from public Miss Chaos.

## P2 — Monetization and longer-range releases
- [ ] Verify donation links and clearly distinguish shop catalogs from active checkout.
- [ ] Configure merchant provider, tax/order/refund workflow, signed payment webhooks, entitlements, creator payouts and fulfillment before enabling sales.
- [ ] Complete PWA/Android release: signing, verified links, privacy and account deletion policies, Data safety and real-device acceptance.
- [ ] Expand creator marketplace, digital publishing, church codex/store and separate app only after core platform is stable.
- [ ] Consider Cloudflare Queues, Durable Objects, analytics and optional voice features only with cost, privacy and free-tier review.

## Evidence and references
- [November 10 audit](KNIGHTFALL-TASK-RUN-2026-11-10.md) records last confirmed deployment/migration/test facts, including partial privacy improvements and outstanding device checks.
- [Recovered backlog](ASH-FALL-RECOVERED-BACKLOG.md) retains older requests and superseded concepts for cross-checking.
- [God operations register](GOD-DASH-OPERATIONS.md) records operational requirements.
- [GitHub issues](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/issues) are issue-level records; not every historical report is an open, reproducible defect.
- Site panel: `public/admin.html`. This update is repository-side; live availability depends on Pages deployment.

## Owner-only acceptance needed
- [ ] Dedicated CI test identities and provider configuration, with secrets kept outside source.
- [ ] Android signed-in tests for push, messaging, offline launcher and priority games.
- [ ] Payment, age verification and app-store accounts only when ready to launch those services.
