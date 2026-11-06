# Knightfall Task Run: November 6, 2026

This report records checked repository and production evidence. **Present in code** is not the same as **tested on a real phone**.

## Completed and verified in this run

- [x] **One primary branch:** `main` is the only remaining branch; zero open PRs. The old `staging/advanced-static-games` commit was retained as a second merge parent without reverting newer fixes. Cleanup workflow completed successfully (GitHub run 42175401867).
- [x] **Four-seat card game:** 1–4 humans; Lydibug, Butters and Eddie fill unclaimed seats. Server-side secret hands, invitations, scoring, optimistic versioning, and friend/block checks exist and have automated regression coverage.
- [x] **Cards turn notices:** new-action comparison prevents repeated prompts when another human acts but recipient's turn has not changed. Commit `cc4bee8`, tested by `backend/src/chaos-card-matches.test.mjs`.
- [x] **Pet registration:** Butters, Trouble, and Skunk Riot are present in production pet market, with species costs 1400, 1750, and 2000 cinders respectively; `0121_skunk_riot_pet.sql` applied.
- [x] **Production D1 schema:** `0119_butters_trouble_pets.sql`, `0120_four_seat_chaos_cards.sql` and `0121_skunk_riot_pet.sql` recorded in `d1_migrations` on `knightfall-forum`. Table `arcade_chaos_four_matches` exists.
- [x] **CI regression repair:** local static directory URLs such as `/admin-offline/` accepted when a corresponding `index.html` exists.
- [x] **CI arcade repair:** mock browser `window` for vector-engine save tests; update Connect Four and Sudoku save fixtures; update pet roster tests from an out-of-date 30-character assumption.
- [x] **Green CI:** Card and Board Game Integrity run 42175081165 and Knightfall smoke/regression run 42175401822 succeeded. Runtime smoke run 42175096647 passed on `cabda858` revision. Later runtime smoke run 42175255374 pending at time of this report.
- [x] **Site deployment evidence:** Cloudflare Pages `knightfall` production deployment `2cd1fada-3a39-413f-a0a4-c75b39a66b38` completed successfully and aliased `ash-fall.com`; a more recent deployment `402ae1f6-7638-4ae7-8985-01813ff3bae0` was queued at last check.

## Needs controlled production verification (do not close yet)

- [ ] **Cards Against Chaos multiplayer on separate human accounts:** no saved game rows in production at time of review. Create real invitation from the Messages friend shortcut, have recipient accept, then verify private hands, 4 total seats, alternate turn and judge resolution, refresh/reconnection, notifications and final scores. Test 1, 2, 3 and 4 human configurations.
- [ ] **Mobile push delivery:** site notification creation and backend deployment do not certify Android push subscription, permissions, or service worker deliveries. Verify with two opted-in mobile users.
- [ ] **Admin offline installation:** validate the actual `/admin-offline/` URL, PWA install prompt, service-worker scope, JSON auth, cache/play offline on Android. Fixing the static audit does not fix an install problem by itself.
- [ ] **Owner and authorization audits:** GitHub workflows fail if dedicated production audit credentials are missing. Supply scoped test accounts/secrets in GitHub Actions and rerun.
- [ ] **Arcade fleet:** rerun full current `main` ten-shard test fleet after browser-mock and save-fixture fixes. Audit playable interactions and save restoration, not just HTTP 200.
- [ ] **Remaining P0:** navigation/sidebar and pink/green theme; profiles/friends and mobile messaging; Hell & High Orbit combat/captures; Sanctuary/ARPG gameplay; three four-seat fish tables and network multiplayer.
- [ ] **Miss Chaos and platform:** overlay obstruction, memory/personality and offline personal bot testing; storefront, monetization, community moderation and OAuth.

## Review links

- [Card and Board CI](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions/runs/42175081165)
- [Latest green regression CI](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions/runs/42175401822)
- [Reviewed-branch cleanup CI](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions/runs/42175401867)
- [Runtime smoke on previous revision](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions/runs/42175096647)
- [Current ongoing runtime smoke](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions/runs/42175255374)
- [Recovered complete backlog](./ASH-FALL-RECOVERED-BACKLOG.md)

**Guardrails:** do not invent test outcomes; do not merge obsolete game snapshots over current stable source; do not manually mutate production game rows to fabricate successful sessions.

## Continuation: arcade reliability and Cinder Eights (November 6, 2026, evening)

This pass carried forward the first group of master-list tasks rather than marking all remaining arcade work complete.

### Implemented in `main`

- [x] Repair the **Cinder Vector / Prism Siege regression harness**: its Node VM lacked the `window.addEventListener` stub required by the active browser engine. Change: `scripts/arcade-original-vector.test.mjs`, commit `7098331a`. The older ten-bot fleet had failed all shards at this common validation step.
- [x] Restore **legacy access links** from `/arcade-games.html` to Reaction Ritual Classic and Rock, Paper, Ruin variants, and from `/arcade-after-dark.html` to Reaction Ritual one-round mode. Commits `b43f3db` and `f107ebc`. The obsolete duplicate games were *not* re-added. Catalog tests that previously asserted these links are now meaningful again.
- [x] Prevent the shared **Deck Locker** from contacting the production account API on localhost or offline/test hosts; retain local/guest progress. Commit `8c7bf3e`; account-sync localhost regression added in `scripts/deck-locker-account-sync.test.mjs` commit `d3843a1`. An earlier local fleet shard had failed on unneeded `https://api.ash-fall.com/api/arcade/deck-locker` fetches, while that shard's live-site run passed.
- [x] Fix a **blank-accessible-body issue** on the imported Interstellar Armada WebGL splash and add a visible escape route back to Chaos Cartridge. Commit `55c7fe4`; the page's WebGL gameplay still requires a fresh browser-play test.
- [x] Update **Arcade Catalog Integrity** triggers so editing legacy arcade pages or their mode-routing tests invokes the catalog suite. Commit `e893021`.
- [x] Prevent the scheduled **arcade asset doctor** from creating review branches and pull requests. It now uploads a reviewed repair patch artifact. Commit `292481c`. No auto-created feature branch is expected from that workflow anymore.
- [x] Replace the basic **Cinder Eights** page with a modern 2-player, 1-human-vs-CPU, mobile-responsive neon tabletop: real fullscreen with focus fallback, suit and turn HUD, selectable wild suit, selectable playing-card finishes, swipeable hand, keyboard shortcuts, local win tracking. Rules refactored into `public/arcade/hosted/cinder-eights/engine.mjs` with CPU moves, shuffled 52-card deck, reshuffled discards, and a draw on two blocked no-draw turns. Frontend `game.js` and visual `game.css` added. Commits from `b9f7d9d` through `a947300`.
- [x] Add Cinder Eights deterministic gameplay rules and accessibility assertions in `scripts/cinder-eights-runtime.test.mjs` and require them in Card & Board Integrity and the ten-bot fleet. Update Deck Locker regression after refactoring card rendering into `game.js`. The dedicated card integrity workflow on commit `2948f1d`, run [42296180299](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions/runs/42296180299), passed.
- [x] Add a Playwright **Cinder Eights end-to-end acceptance case** to `scripts/arcade-browser-smoke.mjs`: verifies deal, hidden CPU cards, fullscreen, a draw and CPU turn, restart, global Deck Locker presence, and mobile overflow. Commit `31d6fa9`. This browser run is **not yet certified passing**.

### Most recent evidence checked

- [x] [Arcade Catalog Integrity run 42294904446](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions/runs/42294904446) passed after restoring legacy game-family links.
- [x] [Card & Board Integrity run 42296180299](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions/runs/42296180299) passed after the Cinder Eights refactor and stale selector assertion repair.
- [x] **Only branch `main` and zero open pull requests** when checked during this pass.
- [ ] [Ten-bot fleet run 42296113289](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions/runs/42296113289) was still in progress during the last review; do not close until consolidated coverage and current revision pass.
- [ ] [Latest specialized runtime smoke run](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions) must complete after the new Cinder Eights browser assertions.
- [ ] **Pages production**: some commits were queued in Cloudflare Pages after the latest verified successful alias. Confirm the exact final commit deployed before claiming the newly redesigned Cinder Eights is live on `ash-fall.com`.
- [ ] **Deck Locker two-device acceptance**: verified backend migration `0122` and automated account tests exist. Still require two real signed-in test accounts/devices to validate persistent wardrobe and server ownership end to end.
- [ ] **God/admin authorization and ownership audits**: production workflows report missing dedicated role-test GitHub secrets (six values, test accounts only). This is a setup blocker, not proof of a security test passing.
- [ ] **Full live arcade playability**: still requires all ten shards, mobile touch QA, Cinder Eights browser gameplay, legacy cabinet behavior and provenance check.

### Next execution order

1. Finish the current fleet and Chromium evidence checks; fix concrete failed routes before opening new features.
2. Confirm Cloudflare Pages latest production deployment and two-account Deck Locker synchronization.
3. Continue card/board quality, Android push and messaging, offline installation, missing sidebars/theme, priority broken games, and Hell & High Orbit.
4. Finish Store Stripe setup and secure premium unlocks **only after** the user connects/configures real-money payments.

**Release principle:** signed-off implementation is not the same as tested on real phones. No fabricated completed multiplayer matches, store purchases, or signed-in acceptance results.

## Continuation: local navigation, Reversi and Neon Surge (November 6, 2026)

### Completed and merged into the only branch, \`main\`

- [x] **Offline-safe shared navigation** (\`228e530\`): local, preview, or offline pages no longer attempt live member authentication, site-settings or notification API requests. Production Ash-Fall domains retain the full behavior. Regression test \`scripts/nav-offline-api.test.mjs\` and CI coverage were added. This targets the last failed Maze Warden shard (Cinder Reversi on localhost had attempted the real \`/api/site-settings\` request).
- [x] **Cinder Reversi rebuilt** (\`4f667b8\`): extracted original 8×8 rules into \`engine.mjs\`; responsive neon board, mouse/touch legal-move hints, 3 CPU modes, saved local session, undo that also rolls back credited wins, local records, fullscreen and focus fallback, keyboard shortcuts, pause/resume on tab visibility. No new paid unlocks or data collection.
- [x] **Reversi verification**: \`scripts/cinder-reversi-runtime.test.mjs\` exercises initial positions, 80 deterministic full games, CPU rules, undo, persistence and UI controls; included in Card & Board Integrity and the ten-bot fleet. Latest completed Card & Board Integrity, Arcade Catalog Integrity, Catalog Doctor and main regression suites on \`4f667b8\` passed.
- [x] **Cinder Reversi production deployment confirmed**: Cloudflare Pages successfully served the \`4f667b8\` revision with aliases \`https://ash-fall.com\` and \`https://www.ash-fall.com\`.
- [x] **Neon Surge start-button responsiveness improvement** (\`83d86a2\`): button hit-testing, deferred heavy WebGL initialization after click dispatch, and max ~24 FPS on idle/title screens while gameplay remains unconstrained. A source-regression test was added to the arcade fleet.
- [x] **One branch, no PRs**: confirmed on GitHub when this round of work was performed.

### Not yet certified

- [ ] **Ten-bot arcade fleet:** The earlier \`42302620780\` run had 9 successful game shards and a Tower Keeper failure on Neon Surge where the START button was visible but the WebGL-heavy page failed to accept a Playwright click. Fix \`83d86a2\` is committed but must pass a fresh live and local desktop shard before marking closed.
- [ ] **Reversi live browser acceptance:** in-depth mobile/desktop Chromium play, undo, fullscreen and reset steps were added to \`scripts/arcade-browser-smoke.mjs\`. The \`4f667b8\` browser job was cancelled after the subsequent Neon Surge push; a current passing run is required.
- [ ] **Neon Surge production deployment:** verify the \`83d86a2\` Cloudflare Pages alias and its desktop click regression before signing off.
- [ ] **Cloud account acceptance:** Deck Locker signed-in two-device manual testing remains blocked on test accounts; admin authorization and ownership audits still need dedicated role-test secrets.
- [ ] **Other queued work:** mobile push delivery, messaging, Android offline installer, underperforming games, fish-table networking, Hell & High Orbit, and remaining visual upgrades.

**No future work is presumed complete merely because a CI job is queued.**

## Reliability batch: November 6, 2026

- Verified prior arcade fleet run [42304170461](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions/runs/42304170461): all ten shards and consolidated local/live catalog coverage passed on `83d86a2`. Runtime smoke [42304170344](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions/runs/42304170344) also passed. These certify the automated scenarios, not every real-device interaction.
- Offline installer now publishes a complete game cache through a single installation pointer. Quota errors and malformed packages leave the previous game playable; legacy caches remain readable. Installs are serialized, failed authorization keeps install buttons disabled, and HTML auth responses have an actionable error.
- Messaging now retains separate in-memory text drafts across conversations, scopes send completion to its original conversation, rejects duplicate pending sends, and discards uploads completing after a conversation switch (including switching away and back).
- Older-history attachments and reactions are no longer cleared when the refresh request only covers newer messages. Stale history requests cannot unlock another conversation's active history load.
- Local verification: 21 focused installer, worker-path, messaging-race, history and Android notification tests pass; messaging palette audit and JavaScript syntax pass.
- Added these regressions to CI plus a controlled mobile Chromium ZIP installation/offline playback check. Local Chromium execution was blocked by workspace process/socket restrictions; CI browser result must be checked separately.
- Still open: real Android installation, real-account cross-device messaging/push, Deck Locker acceptance, role-test credentials, fish-table networking, Hell & High Orbit, OAuth/provider setup and Stripe configuration.

### Release verification follow-up

- Implementation commit `6bfb044ad34a05fa4fdfe1306af050ef3ffaf0d5` is deployed: Cloudflare Pages deployment `a4115bad-7b55-4aed-b84a-c88832a1f7e1` succeeded with ash-fall.com and www.ash-fall.com aliases.
- [Runtime smoke run 42314315419](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions/runs/42314315419): new controlled offline installation/disconnected-playback browser step passed; static and public API smoke jobs passed. Full arcade-browser job and fleet were still running at this follow-up.
- [Core regression run 42314315467](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions/runs/42314315467), card/board integrity and Monster MMO checks passed. In addition to the 21 focused local tests, 32 existing regression tests passed locally.
- SVG CI uncovered a stale 22-character assertion against the 31-character roster. The gallery test now validates unique current IDs and all registered files, retaining four-pose requirements except for the six explicitly idle-only additions. All 17 mascot/gallery regression tests pass locally.
- Repository inventory at release: only `main`, zero open pull requests.
