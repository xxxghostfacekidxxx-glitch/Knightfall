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
