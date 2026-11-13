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

## Additional arcade save polish — November 11, 2026

- [x] Local-only Resume now applies the same missing-price legacy save normalization as cloud Resume for Cinder Collider, without resetting particles, boosts or scientists.
- [x] The asynchronous cloud-save availability hint now checks schema/game, saved-state validity and whether a run or resume attempt has already started before updating the status.
- [x] Added targeted regression assertions for offline resume normalization and stale cloud-save hints, extending the smoke workflow's existing mini-game test suite.
- [ ] Run fresh GitHub Actions smoke checks and verify these changes on the deployed mobile site. Public GitHub Actions and ash-fall.com browsing were unavailable to this session; no CI or production success is claimed.

## Verification retry and cloud-save polish — November 11, 2026

- [x] Confirmed Cloudflare Pages production deployment `29e3b5a8-c582-4108-bf28-bcfa695aec71` succeeded at commit `a5f66986f53a0ec0b07f3b010384d21d598bbd0f`, with `main` as source. This is deployment confirmation, not browser/device acceptance.
- [x] Retrieved artifact inventory for Arcade Test Bot Fleet run `43041879660` (ten sharded result archives plus summary/dashboard artifacts), proving evidence was uploaded. Full job logs and ZIP content could not be read due to connector timeout; root cause is not established.
- [x] Save Progress now captures its exact game snapshot before waiting for cloud readiness, avoiding accidental capture of later game state; stale save completion messages cannot replace a newer run's status.
- [x] Added targeted regression coverage for snapshot timing and stale status handling; existing runtime smoke workflow includes the mini-game test suite.
- [ ] Run the new CI and inspect fleet failure artifacts/logs to isolate an actionable first failure. Do not close #192 based on artifact presence.
- [ ] Confirm the latest post-fix Pages deployment and authenticated real-browser gameplay; browser requests to ash-fall.com remain blocked here.

## CI infrastructure diagnosis and mitigation — November 11, 2026

- [x] Inspected arcade fleet run [43041879660](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions/runs/43041879660), job steps and Cinder Scout's full log.
- [x] Confirmed first failure: Playwright's system dependency installer on Ubuntu 26.04 encountered DNS resolution failures against Ubuntu apt mirrors. The later live browser step failed because Chromium was missing. The game browser tests did not successfully run.
- [x] Committed [d13cb61](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/commit/d13cb61d0b91f9742eaf046be2d52b7dfae27f8f) on main: pin all five fleet jobs to Ubuntu 24.04 and avoid the apt-dependent Chromium bootstrap in both browser fleet and safe repair steps.
- [ ] Verify new fleet run installs Chromium and passes all ten shards; diagnose any missing Linux shared libraries separately.
- [ ] Retest actual local/live game behavior before closing [#192](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/issues/192). Mobile device acceptance still outstanding.

## Arcade fleet follow-up — November 11, 2026

- [x] Reviewed new [run 43106340803](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions/runs/43106340803) after pinning Ubuntu 24.04: Chromium installed and launched; all ten live shards covered 132/132 hosted routes with zero reported live route failures.
- [x] Identified the shared new CI failure: gameplay doctor `async-resume-syntax` invariant expected the older unguarded `async function resume(){try{await...` shape; newer source correctly adds `resumeRequest` and `loopGeneration` guards.
- [x] Corrected the invariant in [96b14f9](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/commit/96b14f9bba358006562a0235268ba3e0ad9979d7) without altering arcade gameplay. Re-read both repository files and checked the new regex matches protected Resume and rejects legacy unguarded Resume.
- [ ] Full arcade CI remains red for run 43106340803: local shards were never executed because validation exited early, so fleet summary `passed` is false despite 132/132 live route coverage.
- [ ] Await a new complete run of all ten local and live shards, specialized tests and coverage consolidation before resolving #192. A green summary and mobile acceptance are distinct requirements.

## Arcade CI regression hardening — November 11, 2026

- [x] Added a regression assertion in `scripts/arcade-mini-save-validation.test.mjs` ensuring the gameplay-doctor `async-resume-syntax` pattern accepts guarded cloud Resume, rejects legacy unguarded Resume, and preserves pre/post-cloud race checks (commits dc88ea9 and c96d6a3).
- [x] Added the focused mini-game save/resume regression test to the arcade-fleet validation step before the gameplay-doctor audit ([6001989](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/commit/6001989d9fbdb8875ba05832ba7d0bd6f8c6704d)).
- [x] Re-read committed files and independently confirmed the required test reference, matching invariant and race guards are present.
- [ ] Obtain a fresh passing arcade-fleet run for these commits; the last published run 43106340803 remains failed with full local browser coverage absent. CI, production and physical-device acceptance remain separate.

## Sanctuary's End import-map recovery — November 11, 2026

- [x] Examined arcade run [43109837240](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions/runs/43109837240): all ten local shards covered 132/132 routes with no errors; live coverage was 132/132 but one route failed (`sanctuary-original/sanctuary.html`), so fleet still failed.
- [x] Tower Keeper log captured the live root symptom: `Failed to resolve module specifier "three/webgpu"`, followed by `THREE is not defined` in legacy render/wild scripts. No network errors were recorded in that route result.
- [x] Cloudflare Pages project `knightfall` was reachable; its latest recorded deployment revision was `065960fa8de163771328740dca1b0a4c00c06f47` and the `ash-fall.com` domain was assigned. Zone Rocket Loader was verified off.
- [x] Identified that Sanctuary's End placed its import map after early Three.js modulepreload requests; moved the existing map into the document head before preloads without changing the imports or game logic ([deeea7f](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/commit/deeea7fe69f0155fd149b42e25e69fa7f551da6b)). This is a plausible mitigation, not yet a proven production repair.
- [x] Added `scripts/sanctuary-importmap.test.mjs` to validate map count, ordering and Three.js mappings ([1cb9dbe](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/commit/1cb9dbeb2d0a486c447b7f6da41b279b46ac3ac9)); wired it into ten-shard fleet validation ([720edf5](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/commit/720edf5bc876e214c58809cfb9d6d41e74730d2f)).
- [ ] Verify production deploy includes these commits and that a new live browser fleet run succeeds for Sanctuary's End. Preserve failed screenshot and diagnostic logs until resolved; keep issue #192 open.

## Verified full arcade fleet recovery — November 11, 2026

- [x] **Arcade Test Bot Fleet green:** [GitHub Actions run 43111248176](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions/runs/43111248176) completed all ten named browser-bot jobs successfully; the consolidated coverage step and dashboard publication also succeeded.
- [x] **Complete route coverage:** all ten local shards and all ten live shards covered 132/132 hosted routes apiece, with zero missing/duplicate/malformed reports or failed routes. Published `public/arcade/arcade-fleet-latest.json` reports `passed: true` and `sourceRunId: 43111248176`.
- [x] **Sanctuary's End:** the formerly failing live route passed in the subsequent full fleet after the import-map order correction. This verifies the browser-test path, not every physical-device interaction or online save.
- [x] Closed [issue #192](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/issues/192) as completed with linked success evidence.
- [x] Updated God Mode's on-site master task panel to show the resolved CI issue and shift remaining acceptance tasks to real devices and authenticated saves.
- [ ] Retain device/browser signoff: Android touchscreen and fullscreen, logged-in cloud saves, notification/resume behavior, and production API ownership remain distinct from the public arcade route audit.

## Verified production auth/email configuration — November 11, 2026

- [x] Read the active `knightfall-api` Cloudflare Worker version settings and secret-name inventory without retrieving secret values.
- [x] Confirmed Worker has bound D1 `DB`, KV `SESSIONS`, R2 media buckets and three Web Push VAPID secret bindings. This confirms bindings exist, not that every flow works.
- [x] **Email setup blocker:** no `RESEND_API_KEY` secret or `PASSWORD_RESET_FROM` sender-address variable appears on the production `knightfall-api` Worker. `backend/README.md` says both are required for Resend password-recovery email.
- [ ] Verify a sender domain with Resend, set `RESEND_API_KEY` as a Cloudflare Worker secret and `PASSWORD_RESET_FROM` to a sender on that verified domain. Never put keys in Git or log their values.
- [ ] Verify provider setup and callbacks for Google/Meta separately; current Worker binding inventory does not show OAuth credential bindings, but do not infer actual provider coverage from variable names alone.
- [ ] Perform authenticated/unauthenticated end-to-end recovery tests after configuration, including 30-minute expiry, one-time token invalidation and generic response for unknown accounts.
- [ ] Public API HTTP fetches from this session were unavailable; a binding audit alone cannot certify `/api/auth/me` JSON behavior or email delivery.

## Account deletion UX accuracy — November 11, 2026

- [x] Compared the actual deletion POST handler against the member account form and public deletion instructions. The backend requires the current account password plus username for every signed-in request; it does **not** accept username-only social login confirmation.
- [x] Fixed `public/account.html` to clearly explain the password requirement and link Google/Facebook-only or locked-out accounts to the public assistance form. Password verification was not relaxed ([752a1d6](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/commit/752a1d6f1e70d28e75cc28c692228adfe0244c74)).
- [x] Corrected `public/account-deletion.html` public instructions and added a stable `#deletion-assistance` anchor ([9db9d8f](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/commit/9db9d8f0299b352d7c393aff0bdd9fd4b9bb5b05)).
- [x] Extended account deletion static audit to ensure the social-login assistance route is present and that password verification remains enforced ([6ebc68b](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/commit/6ebc68bdd281501d04342e54092547666b891461)).
- [ ] Full erasure across D1/KV/R2, authenticated social sign-in deletion acceptance, and staff identity-verification workflow remain release blockers under #150. Public assistance requests do not automatically erase an account.

## Privacy assistance retention hardening — November 11, 2026

- [x] Audited public deletion assistance tickets stored in Cloudflare KV. Newly created tickets used a 90-day TTL, but staff PATCH updates incorrectly reset that 90-day TTL each time.
- [x] Fixed `backend/src/privacy-assistance.js` to use an absolute KV expiration based on the ticket's original `created_at` time, rather than extending retention on every staff status edit ([83e1bbf](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/commit/83e1bbf1d2e4dddb964fb964d917f5952d8d9fdb)).
- [x] Expired, invalid-date, and future-dated assistance records now fail closed on PATCH with HTTP 410 rather than refreshing retention.
- [x] Added regression tests verifying original expiration after multiple staff edits, old tickets nearing 90 days, and rejection of invalid/expired dates ([53fe3a3](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/commit/53fe3a334b7f506041912b194462c503a8cb53ae)).
- [x] Guarded the final 60 seconds before expiry because Cloudflare KV rejects expiration timestamps too close to the current time ([f893b68](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/commit/f893b68474e46c8c3d13573507762131ad4a9b55)); added a final-minute regression test ([8267546](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/commit/82675463c157206de17807216036bd33164ae41b)).
- [x] Directly evaluated the committed deadline helper against fresh, 89-day-old, final-minute, expired and future-dated timestamps; all five source-level checks matched expectations.
- [x] Staff verification-note preservation: updating status alone previously overwrote the existing `operator_note` with an empty string. `backend/src/privacy-assistance.js` now retains the earlier note unless staff explicitly supply a replacement ([458458b](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/commit/458458be8ae1b4197464a907dfe924948526cdad)). Closing still requires a nonempty note; no new deletion authority was added.
- [x] Added behavior tests for successive status edits, keeping notes, explicitly clearing notes, and rejecting closure without a note ([029d756](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/commit/029d75644a0ce9a0c4670e78dd03b64f6c16034a)).
- [ ] CI execution, Worker deployment and live ticket behavior need independent verification. No pre-existing ticket data or staff notes were manually accessed or deleted.
- [ ] Full verified account deletion across D1/KV/R2 still pending (#150); expiring assistance tickets do not complete erasure of member accounts.

## Public deletion-assistance request-size validation — November 11, 2026

- [x] **Backend size-limit fix:** The public `POST /api/privacy/deletion-assistance` handler previously relied on an optional `Content-Length` header to enforce its 2,048-byte limit. It now reads and limits the actual streamed request bytes and rejects oversized bodies even when no length header is supplied ([86f3111](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/commit/86f3111e07546f4a686c93b67152594c596eebb5)).
- [x] Added tests for a 3,000-character payload with no `Content-Length`, ordinary valid requests, and malformed JSON without saving a ticket ([55a823e](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/commit/55a823e69bcf6a92e6e09df8044d4e5295059e0e)).
- [ ] Execute regression suite in CI and verify Worker deployment plus live request-size enforcement. Source changes do not prove production behavior.
- [ ] Full account-erasure implementation, verification and processing across D1/KV/R2 still remain P0 (#150).

## Account deletion state-transition hardening — November 11, 2026

- [x] Prevent false-positive cancellation: `DELETE /api/account/deletion-request` now checks D1 `meta.changes===1` after its conditional owner-only pending update, and returns HTTP 409 for a concurrent state change ([2cf5b36](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/commit/2cf5b36595c50d3dad641726c1685e6e1bbad3f9)).
- [x] Protect terminal requests: admin PATCH rejects requests already marked `rejected` or `completed`, requires a reason when rejecting, and updates only rows still in `pending` or `in_progress`; zero affected rows produce a conflict rather than a success or misleading audit event.
- [x] Added source regression assertions for owner-specific cancellation, affected-row guards, terminal-state rejection, admin conditional updates and change history in audit records ([9ecb0e3](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/commit/9ecb0e38d480d81be59f4c3a1b9c574c07f54c43)).
- [x] Admin deletion-request status-only edits now preserve the prior operator note rather than replacing it with an empty string ([9517748](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/commit/9517748460c50d62ebc1732605a5c80f92b237a0)); extended static regression checks ([0009052](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/commit/000905239ef56d7e36ffebde208da5c19186632f)).
- [ ] Full CI suite and live Worker deployment verification remain pending. No existing deletion requests, accounts or records were modified by this source change.
- [ ] Full verified D1/KV/R2 erasure, session invalidation and staff identity-verification procedure remain open under #150.

## Deletion request concurrent staff updates — November 11, 2026

- [x] Identified that admin status PATCH previously guarded only by `status IN ('pending','in_progress')`, which could overwrite a newer staff note or decision after reading a stale row.
- [x] Changed the account-deletion request update into a compare-and-swap matching the exact previous status **and** operator note. Changed rows produce HTTP 409 rather than silently overwriting evidence ([ca91bba](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/commit/ca91bbab65f8cb6ab9147c48a4e8030ecfc206f9)).
- [x] Corrected the admin deletion queue to omit `operator_note` entirely for untouched note fields rather than explicitly submitting an empty string ([7e69bd8](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/commit/7e69bd8c8157d1a99fa2586b771aeedd58277efa)).
- [x] Extended account-deletion regression assertions for conditional SQL, snapshot binding and frontend omitted-note behavior ([150dec3](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/commit/150dec390233c4989ed7ad25aa999ef163709713)).
- [x] Rejection explicitly requires a newly supplied nonempty `operator_note`, not an unrelated historical note ([aa0a628](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/commit/aa0a6280088f71b08b754269f0e028e28d184cd1)); updated the static audit ([95cc9ef](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/commit/95cc9eff949a10c997a12f36e3b8b8854ee462fe)).
- [ ] Execute CI and authenticated concurrent-admin acceptance tests. Source review is not a deployed functional test.
- [ ] The create-request path still needs a database-enforced uniqueness strategy for duplicate concurrent requests; do not introduce a unique index without auditing existing records and migrations.
- [ ] Actual account erasure and retention cleanup across D1/KV/R2 are still P0 (#150).

## Production D1 account-deletion request repair — November 11, 2026

- [x] **Found production blocker:** `account_deletion_requests` did not exist in production D1 `knightfall-forum`. Its earlier `0033_account_deletion_requests.sql` source file had not been recorded as applied; a different migration occupied the 0033 ledger slot. This explains why the website could display a request form but the backend could fail on SQL.
- [x] Confirmed a D1 Time Travel bookmark before the additive database change. Created `backend/migrations/0128_account_deletion_requests_unique.sql` to install the absent table, two indexes and a partial UNIQUE index guaranteeing one `pending`/`in_progress` request per user ([31fd8a0](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/commit/31fd8a0ecd3af69047464bbda0544e38f59be256)).
- [x] **Applied and read-verified in production:** zero existing requests, all three indexes including the active-user partial unique constraint, both `users` foreign keys and ledger ID **73** (`0128_account_deletion_requests_unique.sql`, applied `2026-11-12 03:54:02` UTC). No member accounts or request records were deleted.
- [x] Changed the authenticated request insert to `INSERT OR IGNORE` with affected-row checking and an existing-active-request lookup, avoiding duplicate notifications/audit events when two valid submissions race ([90eb834](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/commit/90eb8341367c4091e32ea8e56d4f5b98e8a6b4a9)).
- [x] Added in-memory SQLite tests of uniqueness, active transitions, terminal historical requests and replay safety ([bdcb4e3](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/commit/bdcb4e37679f139cb6adb0a419718d1379305b73)); wired them into the main smoke workflow ([68426ca](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/commit/68426ca9a1ba717c407b150e7d52b4fde34b0653)) and extended static backend auditing ([fb70f50](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/commit/fb70f50c6bb9fed2160ac3ce7323daa1d3d16909)).
- [x] Corrected Python unittest discovery naming to `scripts/test_account_deletion_migration.py` and wired the matching command into the smoke workflow ([97ef284](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/commit/97ef284b8ab97ca7fc955c25647449234175e834)); four cases now match Python's test discovery pattern. CI run verdict still needs checking.
- [x] Extended production smoke workflow anonymous authorization probes for deletion-request GET/POST/DELETE and staff privacy assistance GET ([8e0ad28](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/commit/8e0ad286819850ca95f679a3a1a5dd8fb4f643c2)). No signed-in data is modified by these probes.
- [x] Made staff-notification fanout best-effort after durable creation, so an unavailable notification subsystem does not falsely report that a stored deletion request failed. The staff queue remains authoritative and errors are logged ([3b7c27a](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/commit/3b7c27a7f21c426abb457176a0fed70fca6232f3)); static guard added ([9e9e486](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/commit/9e9e4867e4295a338b1967fe278efaa06426d6fa)).
- [x] Added a **schema-readiness health flag** `deletion_requests_ready` backed by a read-only D1 sqlite_master check for the active-request UNIQUE index. The API can now distinguish mere D1 connectivity from presence of the deletion-request schema ([35bb8d4](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/commit/35bb8d49cbeb2a90217d88b1c87556e43b8f54e8)).
- [x] The production smoke workflow now requires `"deletion_requests_ready":true` ([86d729f](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/commit/86d729f87641a03fe0d7bb16a438d6a7b7151afa)); the independent read-only production checker and static account-deletion audit also enforce the readiness contract ([7152272](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/commit/71522729254ea73d8411d56a3df40bd7fb695fcc), [e1dfe18](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/commit/e1dfe184a10d48dd9738c856c0aac2b49e796a2a)).
- [ ] Verify fresh GitHub Actions CI and exact Worker deployed revision, then perform an authenticated disposable-account request/create/duplicate/cancel test. No real member data should be touched during acceptance.
- [ ] Full account erasure, cross-store retention/revocation and independent social-account identity verification remain unresolved in [#150](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/issues/150).

## P0 — Immediate reliability and release blockers
- [x] Arcade fleet #192 triaged and closed; full ten-agent local/live route sweep passed in [run 43111248176](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions/runs/43111248176). Physical-device and authenticated gameplay acceptance remain separately open.
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
- [x] Rebuild Misfit Avatar Studio with a responsive visual editor, nine lookbook presets, 67 new character options across six additional detailed traits, individual remix locks, fast single-trait editing, sticky mobile save controls, ten illustrated worlds, upgraded layered SVG art, undo/redo, compare mode, PNG/SVG exports and draft-state visibility. Preserve existing slot/purchase/profile integration and extend backend allowlists; avatar regression workflow passed on main (2026-11-11).
- [x] Misfit character-art pass: eye colors now affect distinct styles, layered rear hair adds volume, six new hair silhouettes and five fantasy/mechanical ear choices are API-validated; 13 lookbook presets, including four new themed looks. Renderer smoke-tested against all 30 new hair/ear combinations; physical-device visual review remains open.
- [x] Misfit Studio Playwright acceptance passed in desktop Chromium and Android-sized Chromium, covering customization, lock/remix, undo/redo, saved slots, profile activation, SVG/PNG downloads, and layout checks (GitHub Actions [run 43151460782](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions/runs/43151460782)); simulated phone viewport, not physical-device certification.
- [x] **2026-11-13 Misfit Ink 5 illustrated avatar pass:** rebuilt SVG portraits with six additional art layers (face-paint lighting, hair and clothing ink, eye detailing, textured scenes, collector frames), refined large profile/avatar-editor cards, studio portrait-focus toggle, current-character trait thumbnails, and live look readouts. All existing avatar traits, slots, server validation, and PNG/SVG downloads remain compatible. Browser acceptance passed on desktop Chromium and Android-sized Chromium: [Avatar Studio Regression run 43394341238](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions/runs/43394341238). Real-device artwork review remains open.
- [ ] Accept Misfit Avatar Studio in a real Android browser and desktop browser: test every tab/style, first-load account state, save/activate/photo fallback, old avatars, Cinders purchase, downloaded image quality and touch comparison. Confirm Pages production deployment and Worker are both serving the updated version.
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

## Creator Arsenal implementation batch — November 13, 2026

- [x] **Pixel Studio:** original local 32×32 pixel art editor integrated into Creator Foundry (brush, erase, fill, picker, undo, up to 12 frames, PNG import, frame-strip PNG and frame metadata exports). Functionality replaces the **missing in-site pixel editor workflow**, not upstream Pixelorama/Piskel.
- [x] **Atlas Packer:** local browser sprite-sheet packing (max 48 images, 2048px dimension, PNG atlas and JSON frames); inspired by FreeTexPacker but implemented natively to avoid unreviewed upstream code/assets.
- [x] **Tilemap Forge:** editable 2D tile painter with wall/hazard/spawn tokens, Tiled-style map import/export, prototype tileset PNG, preview PNG; original code, no Tiled or LDtk binaries installed.
- [x] Kept one user-facing authoring route (`/devil-tools.html#production-workbench`) rather than creating duplicate tool pages. Updated public Arsenal feature status and the on-site God dashboard task summary.
- [x] Added source tests for atlas packing, flood fill and map schema; integrated mobile creator/admin/god browser checks and verified the complete [Developer Arsenal run 43409139644](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions/runs/43409139644) passed (syntax, source, mobile browser role fixtures, security audit). [Main regression run 43409139544](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions/runs/43409139544) also passed. This is **CI verified**, not physical Android acceptance.
- [ ] Verify Android touch drawing, multi-image atlas imports, map exports in actual Tiled and browser downloads across devices. Review accessibility and file size limits before publishing assets.
- [ ] Continue native SVG authoring and animation editor or integrate audited upstream modules where redistribution licensing/asset provenance is verified. These desktop/advanced tools remain external candidates.
- [ ] Complete remaining Gravewave sprites, pet evolution-specific drawings, production asset publishing permissions and cross-account review; these were not completed by the lab.

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
