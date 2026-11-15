# Eye of Chaos · GOD bot command center

**Status (November 15, 2026):** Implemented as a GOD-only command board, integrated with existing arcade CI and Madhouse service identities. All publication through the new control board remains **disabled**. All 20 Chaos Agent identities are registered but do not have autonomous accounts or unrestricted browsing access.

## Open the command board

- `/eye-of-chaos.html` from GOD account settings, the admin GOD operations panel, or Eye of Horus.
- `/god-bot-control.html` remains the existing, separately authorized Madhouse service-bot profile editor and **direct manual GOD publish** tool. Its automatic posting controls are disabled and its direct publish button now asks GOD to confirm the exact message.
- `/eye-of-horus.html` is a separate GOD-only retained-data console. Nothing in Eye of Chaos reads private conversations, journals, uploads, or private member profiles.
- `.github/workflows/arcade-test-fleet.yml` remains the canonical QA test runner. The 10 fleet names are real matrix jobs, not registered site users.

## Confirmed agent identities

1. Hexx Havoc
2. Grim Static
3. Riot Vex
4. Velvet Venom
5. Glitch Reaper
6. Moxie Mayhem
7. Nyx Nuisance
8. Rotten Halo
9. Dolly Dread
10. Vandal Vox
11. Pestilence Pete
12. Crypt Kidd
13. Oblivion Jack
14. Razor Rapture
15. Morgue Monroe
16. Killjoy.exe
17. Scarlet Scrawl
18. Pop Morgue
19. Spite Sprite
20. Nihil Nova

## Components and permissions

| Component | Role |
| --- | --- |
| `backend/src/eye-of-chaos.js` | Route handler, fixed fleet registry, research source allowlist, mission state transitions, approvals, source-linked leads, manual AI drafting and read-only GitHub QA |
| `backend/migrations/0142_eye_of_chaos.sql` | D1 missions, drafts (version-locked approval), and minimal operational events |
| `public/eye-of-chaos.html`, `.js`, `.css` | Mobile-friendly GOD dashboard, mission dispatcher, QA results, edit/review queue |
| `backend/src/index.js` | Route mounting, Worker scheduled research trigger, and explicit disablement of previous forum cron publishing |
| `backend/src/eye-of-chaos.test.mjs` | GOD access, schema availability, roster, mission controls, AI draft validation, version invalidation and QA results |
| `scripts/test_eye_of_chaos_sql.py` | In-memory D1/SQLite constraints and migration idempotence |
| `scripts/eye-of-chaos-ui.test.mjs` | GOD navigation, accessible layout, evidence links and no publishing controls |

GOD-only access is enforced by the Worker with an authenticated session and the existing `canAccessEyeOfHorus` capability. UI hiding is not the authorization boundary. Mutations also require the normal Knightfall site Origin. API replies are `no-store`.

**The API has no `publish` operation.** GOD approval records the exact draft version and approved-by identity; editing removes that approval. Publishing the approved draft is a separate, intentionally unimplemented integration. The legacy GOD direct-publishing endpoint remains available through its explicit manual workflow, so it is a separate administrative publishing action, not part of this approval queue.

## Mission and research capabilities

- **Manual research:** click *Research now* on a research mission with an allowed source. It fetches a public source and creates a pending **unverified lead**, with the origin URL. Repeated links are deduplicated per mission.
- **Scheduled research:** daily or weekly mission; Worker cron checks due missions and processes at most two per tick. New findings are pending drafts. Nothing publishes. Paused or cancelled missions are not executed.
- **Public Knightfall search:** reads only recent public forum thread IDs, titles and category names where thread is not deleted and category is not `adults-only`. No message, journal, private media or member profile data is requested.
- **Curated external feeds:** music, science, unusual science, space, technology, horror, entertainment and Star Wars. External requests are limited to fixed HTTPS sources; redirects are forbidden; source links are checked against the originating host.
- **Manual AI draft generation:** GOD clicks *AI draft* on a content or forum mission. Uses the existing Cloudflare Workers AI `@cf/meta/llama-3.1-8b-instruct-fast` binding. The prompt contains the named agent's identity, specialty and mission instructions, **not private member content**. A per-operator rate limit applies; invalid output fails closed; generated text is pending and must be reviewed and approved.
- **Game QA:** live results are read from public GitHub Actions endpoints using no browser token. Unreachable or missing evidence displays as unverified, not passed. Test execution and artifacts remain with GitHub.

## Deployment and migration notes

The additive D1 table statements in migration `0142_eye_of_chaos.sql` were applied using Cloudflare D1's query API on November 15, 2026. All three tables were independently verified to exist and initially contained **zero rows**. This does not touch users, messages, prior D1 tables, Stripe, or arcade saves.

**Important:** The separate Wrangler-managed `d1_migrations` history still last reported migration `0137` at the time of that verification. The pending `0141` premium deck migration was **not** applied as part of Eye of Chaos. The new `0142` migration is idempotent (`CREATE TABLE/INDEX IF NOT EXISTS`) and remains in the repository so it can be reconciled by the existing reviewed migrations workflow later. Do not manually mark Wrangler migrations applied without verifying which migrations have actually executed.

The GOD dashboard should report `schema_ready:true` when production's D1 binding sees the new tables. If unavailable, the fleet registry still renders but mission and approval forms remain disabled.

## Release validation checklist

- [x] GOD role-only API checks through isolated test fixtures
- [x] 20 registered agents, 10 verified QA matrix identities, existing forum identity lookups
- [x] Mission and draft persistence schema with approval-version integrity
- [x] Source allowlist, no-site-private-data research, manual and scheduled pending review drafts
- [x] Legacy scheduler posting call disabled and legacy configuration rejects auto-posting
- [x] GitHub QA results are independently verified rather than inferred from a workflow link
- [x] D1 additive schema applied and tables independently verified
- [ ] Authenticated production GOD UI acceptance on real member session
- [ ] End-to-end source execution and Workers AI draft generation on production
- [ ] Full current-main regression suite and mobile UI QA
- [ ] Destination-specific GOD-approved publishing integration, if desired
- [ ] Reconciliation of additive 0142 schema with Wrangler-managed D1 migration history

**Never simulate publication success from an approval response. Never schedule automated forum publication without a new explicit owner decision and updated access model.**
