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
