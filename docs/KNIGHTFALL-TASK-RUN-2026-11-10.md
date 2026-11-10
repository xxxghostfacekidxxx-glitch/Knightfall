# Knightfall task run: 2026-11-10

> Evidence-based snapshot, reviewed from the connected GitHub repository and Cloudflare account. Code, CI, Cloudflare deployment and real-device acceptance are distinct milestones. This file does not certify future deployments or purchases.

## Verified at start of run

- Repository: `xxxghostfacekidxxx-glitch/Knightfall`; only `main` branch and **zero** open pull requests. Baseline `3992795c958f23d69b94625c95e6c2f298568dea`.
- Six initially open issues: [#18](../issues/18), [#94](../issues/94), [#150](../issues/150), [#153](../issues/153), [#163](../issues/163), [#166](../issues/166). #163 was an older arcade fleet failure; review current ten-shard evidence before closure.
- Arcade Test Bot Fleet [42862970842](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions/runs/42862970842) passed **all ten shards and consolidated coverage** at `32a1c0d`. The arcade fleet is a set of automated browser checks, not real players or universal gameplay certification.
- Smoke/regression [42863270360](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions/runs/42863270360) succeeded at `990fca4`; runtime smoke [42863270174](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions/runs/42863270174) succeeded at the same revision. The prior runtime failure was a mobile-push test timing assertion and has a later green rerun.
- Nightly security/arcade [42827556737](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions/runs/42827556737) failed at an earlier revision on a Devil Tools role-badge assertion and a broken `/homepage` local-asset link in the memorial page. Later overall regression is green; verify the next nightly run before clearing this gate.
- Authenticated authorization/ownership workflows [42621157407](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions/runs/42621157407), [42624365178](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions/runs/42624365178) **failed because the six dedicated role-test secrets are missing**. The role matrices were skipped, **not passed**. Never use real owner credentials as test fixtures.
- Cloudflare Pages project `knightfall` targets `main`, with `ash-fall.com` and `www.ash-fall.com` custom domains. Latest confirmed successful production Pages revision at inspection: `32a1c0d`; `990fca4` and `3992795` were queued, not yet confirmed deployed.
- `knightfall-api` Worker has production D1, KV, media R2 and `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` configured. VAPID configuration is **not** proof of an actual Android notification delivery.
- Production D1 `knightfall-forum` has applied migrations through `0123_crush_pet.sql`. Do not apply or reset production migrations without evaluating pending schema and backup impact.

## Changes in this task run

- Replace remaining warm/brown account deletion, privacy notice and shop preview styling with readable neon/violet treatment. Do not change account deletion logic, purchase state or payment acceptance.
- Add a `node:test` regression guard for those four public surfaces and run it in the main smoke/regression workflow.
- Record the current blockers, verification evidence and priority order in this source-controlled task report.

## Updated priority backlog

### P0: launch and safety gates

- [ ] Confirm the latest Pages revision finishes deployment and validate the homepage, registration, community page, account management, shop and API health in a real browser.
- [ ] Create **dedicated** member/moderator/admin test accounts and configure all six GitHub Actions `KNIGHTFALL_*_USERNAME/PASSWORD` secrets; rerun the authenticated authorization and ownership matrices. Do not store passwords in this file.
- [ ] Complete verified account deletion, public off-app request/contact path, accurate privacy policy and full data cleanup. [Issue #150](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/issues/150) stays open. No Play Store readiness claim.
- [ ] Verify guest registration, authenticated login, email recovery, cross-account permission boundaries, moderation and secure media delivery; configure Turnstile/OAuth email provider credentials as needed.
- [ ] Android device delivery: test push in foreground/background/closed browser with two opted-in accounts; verify settings and notification-click routing. [Issue #153](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/issues/153).
- [ ] Test mobile composer, older messages/history, friend invitations, profiles and saved theme on 360/390px Android and desktop; keep account-owned media and messages inaccessible cross-account.

### P0: arcade player experience

- [x] Ten-shard fleet and consolidated browser coverage green on `32a1c0d`. Does not certify every game/device.
- [ ] Re-test flaky full-screen, touch interactions, scoring, leaderboard persistence and startup performance on physical Android for priority titles. Confirm Neon Surge, Cinder Eights and Reversi specifically.
- [ ] Finish weak cabinets (Not Dead Yet, Rooftop Riot, Game of Life replacement), check real gameplay quality, continue art/visual modernization and duplicate-family retirements.
- [ ] Four-seat Cards Against Chaos: test 1-4 actual human players with filler bots, reconnections, private hands, friend invites and notification delivery.
- [ ] Verify Deck Locker settings and cosmetic unlock sync between two independent signed-in devices.
- [ ] Four-player fish tables: network-authoritative rooms/credits, four cannons and hold-to-fire, multitouch, reconnect and fairness checks. No gambling or paid winnings.
- [ ] Confirm local-hosted imported games actually start and obey upstream licenses; no unauthorized artwork/code distribution. Verify mobile controls and offline downloads.

### P1: community, economy, AI and creator tools

- [ ] Fix remaining nav/sidebar inconsistencies and Miss Chaos panel overlapping page actions; confirm no orange overrides after this color cleanup.
- [ ] Verify creator roles and access for the two Alexx digital creators, sprite workshop, Devil Tools, bot creator permissions, God/admin role inheritance; audit actual server checks, not only UI titles.
- [ ] Finalize pet/sanctuary care, species evolution, mascot art, inventory, quests and score rewards; check account ownership.
- [ ] Hell & High Orbit [#166](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/issues/166): four legal move slots, level learnsets, PP, evolution, captures, mobile battle HUD, authenticated online turns. Staging-first [#94](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/issues/94), no production DB mixing.
- [ ] Finish Miss Chaos conversations, site-specific responses, user-controllable memory, moderation boundaries and optional personal-bot offline mode. Public AI and private admin tools remain separate.
- [ ] Moderate and recruit community members; improve onboarding, groups/discovery, creator materials and forums before purchasing ads.

### P1: first revenue

- [x] Public voluntary-support path exists on `/support.html` and previews of the shop/expansions are explicit about **no checkout yet**.
- [ ] Verify the public support links and recipient details in a real browser; donations must never imply purchase of in-game goods or special rights.
- [ ] Configure Stripe/business billing and paid SKU policies **only when merchant setup is ready**. No fabricated completed checkout.
- [ ] Server-verified Stripe webhooks, signed entitlement grants/revocations, refund handling, taxes and order support before premium bots, deck skins, expansion bubbles, shop stalls or membership sales.
- [ ] Secure paid card content: currently the After Hours deck is publicly available as a **free preview**. Remove paid plaintext from public JS before selling access; verify age/content/payment policies.
- [ ] Distinguish creator catalog publishing from actual orders, suppliers and fulfillment; do not advertise dropshipping checkout before it exists.

### P2: long-range roadmap

- [ ] Progressive Web App, genuine Android package and Play Store compliance; offline admin install on real Android.
- [ ] Improve game engines, full-screen responsive graphics, open-source provenance, monster art, cinematic site assets and remaining catalog modernization.
- [ ] Finalize Sanctum of Inferno writing/store/app, forum lore, site branding and memorial experience without publishing private family content.
- [ ] Consolidate God dashboard monitoring, deploy/health signals, test fleet status, account reports and privacy-safe logs.

## Release rule

Green static tests are valuable; they do not prove real-device use. Do not label a feature complete until code, tests, deployed version and (where relevant) authenticated/manual user acceptance all pass.

## Creator-access follow-up (2026-11-10)

- Production D1 shows two distinct Alexx profiles: `alexmayfield_0213` (existing Digital Creator title, member role) and `alexxmayfield_1302` (member role, title not yet granted at initial audit).
- Devil Tools previously accepted only numeric account ID `216`. It now checks the authenticated backend's `public_title === 'Digital Creator'`; admins and God retain their separate access. This is a local workshop gate and does **not** authorize creators to publish arbitrary server assets. The Worker still requires an administrator for `/api/devil-tools/assets`.
- Added CI regression to prevent single-ID creator gating from returning. Production title assignment for the second account is a separate D1 operation and must be verified after writing. No unlimited bot slots or admin powers are granted by the creator title.

- [x] Production D1 grant confirmed: both `alexxmayfield_1302` and `alexmayfield_0213` now have `Digital Creator` public title, remain ordinary `member` accounts, and have `unlimited_slots=0` and `advanced_builder=0`. The title allows the signed-in local Devil Tools workshop; server-side publication remains admin-only. The new title-gate regression passed in [run 42868955300](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions/runs/42868955300). A separate logged-in mobile acceptance check is still pending.
