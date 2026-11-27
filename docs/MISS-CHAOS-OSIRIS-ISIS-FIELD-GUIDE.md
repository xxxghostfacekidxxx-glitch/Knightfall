# Knightfall Field Guide: Miss Chaos, Osiris, Isis, and Between the Flames
**Audience:** Samantha, her ChatGPT, Ronnie's ChatGPT, authorized Knightfall collaborators.
**Updated:** November 19, 2026. **Status:** engineering handoff, not certification of live production behavior.

> To Samantha's ChatGPT: You are helping Samantha co-develop Knightfall with Ronnie. Start at the authenticated [Between the Flames](https://ash-fall.com/ai-handoff.html) page. Read its CURRENT tasks, newest dated notes, and companion instructions each session. Update the task board and add an evidence-based handoff note after work only when you have authenticated access; otherwise give Samantha an exact entry to post. Never claim a task is completed or deployed without verifying it. Explain technical steps clearly and patiently. Ronnie says he loves you.

## 1. Mission and identity
**Knightfall / Ash-Fall** is a dark, creative community with gothic stained-glass/cathedral and neon/glitch aesthetics, alternative music, art/tattoos, philosophy, maker tools, games, pets, personal AI bots, messaging, shops, and collaborative creation. It is meant to be a usable community and creator platform, not just a visual theme.

**Miss Chaos** is Knightfall's theatrical, rebellious AI guide and creative/programming assistant. Personality must not replace reliability, member privacy, truthful tool outputs, or safe approvals. Her end goal is a helpful development partner that can inspect, explain, propose, test, and *request* deployment review. She must never quietly publish or claim autonomy she does not have.

## 2. Roles and command boundaries
| Identity | Real authorization | Can do / cannot do |
| --- | --- | --- |
| **Osiris / Ronnie** | Server-verified GOD account | Top platform ownership, God diagnostics, Eye of Horus data oversight, Eye of Chaos master execution pause, retained owner-only security controls. Explicit review still required for code and risky changes. |
| **Isis / Samantha** | Her accepted Between the Flames partnership **plus** her independent server-verified admin status | Admin Dashboard, Eye of Chaos mission/draft management, delegated versioned draft approvals, Theme Crew reviewed preset publishing/rollback, creator/moderation functions and explicit curated-bot actions as enabled. Not Eye of Horus, owner secrets, root-role transfers, or master lock. |
| **Other administrators** | Verified site admin role | Normal administrator and staff read-only source/CI tools; not automatically granted the Isis-specific delegated approvals. |
| **Digital Creator / Moderator** | Separate Level 1 tracks | Creator Foundry/advanced design tools versus moderation. Neither title grants GOD, site admin, GitHub or Cloudflare rights. |
| **Member** | Signed-in verified member | Own Miss Chaos conversations/memories, profile, inbox previews and approved personal tools; no cross-user private records. |
| **AI assistant** | None by default | Only the exact authenticated, allowlisted tool permissions provided by an actual connection. An instruction or nickname is not an access token. |

**Important:** Knightfall site roles do not prove GitHub collaboration, Cloudflare team membership, payment permission, repository-write access, or deployed permissions. Check each external system separately; do not assume Samantha has those accounts connected merely because the site recognizes Isis.

## 3. Miss Chaos capabilities: real versus planned
**Current repository-wired, restricted tools:**
- Conversational AI and streamed chat; saved per-user conversations and member memories; Standard/Private Owner/Private Partner companion modes checked server-side. The floating companion switches only among modes the current session is authorized to use. Full history is not yet permanently separated by mode.
- Member-owned read-only profile, inbox previews, unread notifications, notes, memory recall, authorized shared tasks, and permitted bot-fleet metadata. Account data stays bound to the server-verified session.
- Site help/search/navigation, public arcade recommendations, lunar phase and shadow-work prompts, arithmetic, standard unit conversions, dates/times and word counts.
- Public-source retrieval from Wikipedia, Wikidata, the Metropolitan Museum collection, Poly Haven, Open Library, Crossref, and licensed-public-GitHub repository metadata. This is *not* unrestricted web browsing; snippets are not full source verification.
- Code parser/inspector, actual before/after unified diff, Prettier-based formatting, bounded JSON-schema validation, and Mermaid diagram text. These do **not** execute arbitrary code, run an OS shell, open private repositories, or write GitHub files.
- Prototype craft/clothing pattern cut lists from user-provided measurements, approximate fabric material estimates and resize operations; color contrast calculation. Not automatic photographic 3D reconstruction, certified production patterns or tailored garment grading.
- **Staff** `staff.repo_file`: bounded read-only excerpts of allowlisted public Knightfall **main** source; `staff.github_health`: GitHub CI health. GOD has additional restricted diagnostics.

**Not implemented as an end-to-end autonomous workflow:** full-repository edits, running tests on arbitrary patches, human-reviewed code-commit/deploy integration, unrestricted browser/terminal access, guaranteed zero-cost LLM processing, autonomous cross-bot conversations or silent forum publication.

## 4. Eye of Chaos command structure
**Entry:** https://ash-fall.com/eye-of-chaos.html (verified admin or GOD).
1. **Command Deck:** overview, command policy, GOD-only master pause.
2. **Fleet Registry:** approximately 20 named research/content agents. Identity descriptions are not equivalent to active autonomous accounts.
3. **Mission Control:** create manual assignments; approved-source research can execute in bounded, governed conditions and limited schedules.
4. **Approval Queue:** proposed source-backed drafts; approval applies to a specific version and does NOT post automatically.
5. **Game QA:** ten GitHub Actions-associated arcade test workers; inspect actual workflow results/artifacts rather than inventing gameplay validation.
6. **Madhouse:** existing forum service identities; no autonomous publication.
7. **History:** audit/history view.
8. **Theme Crew:** reviewed sitewide theme presets and rollback through separate restricted routes.

**Eye of Horus** https://ash-fall.com/eye-of-horus.html is GOD-only retained-data oversight; Isis cannot access it. Owner-only private data and security controls must never be laundered through a bot or shared note.

## 5. Where everything lives
| Area | Member-facing page | Purpose |
| --- | --- | --- |
| Landing + community | `/`, `/community.html` | Knightfall entry, forums, Madhouse and themed categories |
| Messages | `/chaosphere.html`, `/messages.html` | Social conversations and private inbox |
| Arcade | `/chaos-cartridge.html`, `/arcade-games.html` | Arcade, games, progress, leaderboards and QA targets |
| Miss Chaos | `/miss-chaos.html` | Main assistant chat, tool use and personal memory |
| Capability guide | `/miss-chaos-guide.html` | Public examples, copied starter prompts, authenticated tool list and read-only arithmetic/word-count demos; private links only after verified mode discovery |
| Samantha's companion | `/samantha-chaos.html` | Private account-bound partner workspace, authorized bot list and handoff |
| Two-person coordination | `/ai-handoff.html` | **Between the Flames:** shared tasks, notes, status, evidence and optional privately configured GPT Action keys |
| Staff | `/admin.html`, `/eye-of-chaos.html` | Moderation, mission dispatch, draft review, bot fleets |
| Owner | `/eye-of-horus.html` | GOD-only retained-data oversight |
| Creative | `/devil-tools.html` | **Creator Foundry:** Pixel Studio, Atlas Packer, Tilemap Forge and maker resources |
| Code tools | `/chaos-code-studio.html` | Source inspection, code editing, inspection, formatting, diffs and flowcharts |
| Research references | `/open-source-arsenal.html` | Curated upstream tools. Listing is not installation or licensing approval |
| Craft / 3D | `/chaos-forge.html` | Prototype patterns, materials and 3D-oriented experiments |
| Personal bots | `/personal-bots.html`, `/bots.html` | User bots and public bot gallery |
| Shops | `/shops.html`, `/shop-builder.html`, `/cinder-shop.html` | Catalog/creator shop tools, **not** fully active end-to-end checkout |
| Notifications / install | `/notifications.html`, `/install.html` | Alerts and PWA setup |
| Personal journal | `/die-ary.html` | Private journal, authenticated account-scoped |

Technical layout: GitHub `xxxghostfacekidxxx-glitch/Knightfall`, primary `main` branch. `public/` is the static Cloudflare Pages output; `backend/` is Worker/API + D1 migrations; `.github/workflows/` holds CI; `scripts/` and `tests/` supply checks. GitHub source and Cloudflare deployment are distinct states. Site: https://ash-fall.com; API: https://api.ash-fall.com.

## 6. Key development workstreams
**P0: Stability and trustworthy releases.** Fix remaining black-screen arcade games, broken fullscreen/mobile controls, stale styles/scripts, install prompts, unread alert dismissal and notification delivery. Confirm a deploy's **exact commit** is live before calling it done. Check mobile devices separately; CI is not a phone.

**P1: Miss Chaos developer mode.** Create a supervised path:
`read allowlisted main source → record commit/path/line range → propose diff without executing → inspect/format → run project tests in isolated CI → require explicit Osiris/authorized Isis review → release using verified deployment pipeline → verify deployed SHA and roll back if necessary`.
**Never** let model output grant itself permissions, fabricate tests, publish secrets, auto-approve its own changes, or deploy arbitrary snippets. Keep one `main` branch as Ronnie requested; only use protected review mechanisms when explicitly approved. Start with read-only proposals; repository mutation comes later, after an authenticated approval boundary and tests are implemented.

**P2: Arcade/Game polish.** Imp Inferno as a 4-player cartoon-demon fish-table-inspired arcade shooter (avoid real-money gambling mechanics); Hex Whisk as a mobile-first, one-screen merge-cooking game; repair Sudoku and other black-screening titles; improve Rampage-style character play, Rooftop Riot, Not Dead Yet Asshole, Reign's End and Embervale saves; strengthen game QA and consistent fullscreen.

**P3: Creative community.** Improve pet/avatar artwork and evolution mechanics, Creator Foundry tools, design consistency, profile and messaging UX; coordinate shared shop planning and creator catalog workflows. Artistic aspirations are not evidence that integrations are deployed.

**P4: Bot and community intelligence.** Better searchable public resources, member assistance, bot orchestration with consent, task updates and safe publishing workflows. Keep public Miss Chaos separate from private owner/partner memories.

## 7. How to collaborate through Between the Flames
- On every session, load the live authenticated board; check task **area, priority, status, source_url, next_step, blocker, verification** and newest notes.
- Use statuses `todo`, `in_progress`, `done`. Verification is separately `needs_review`, `source_checked`, `ci_passed`, `deployed`, or `device_verified`; never mark deployed just because a commit exists.
- Write concise, dated notes after a verified action: WHAT changed; exact file/commit/URL; test result; deployment result if known; what's next; what requires permission; who owns it.
- Samantha's GPT should teach her the steps in everyday language and tell her exactly which page to open. If it cannot connect to the private board, provide a copyable entry and do not claim it posted anything.
- Each user may configure a separate revocable private GPT Action key **inside that GPT's Action authentication settings**, never in a chat, doc, source file or a shared key. The copyable handoff packet works even without the Action integration.
- Neither GPT is an independent system operator just because this document asks it to help. Source, CI, permissions, migrations and production behavior need independent verification.

## 8. Release checkpoint
As of a direct Cloudflare Pages inspection on November 19, 2026, `ac1a04a78087c3224732bb2edbda1d5a07fec06e` succeeded in production and carried the custom-domain alias; the subsequent `6000e615b5b44c86bd0fdb6f719ff3b14827c638` frontend build was still queued. Later source commits require later deployment verification; do not assume the queued commit or this document is already live.

**Current source references:** `docs/MISS-CHAOS-CAPABILITIES-ROADMAP.md`, `docs/MISS-CHAOS-PRIVATE-WORKSPACES.md`, `backend/chaos-capabilities.mjs`, `backend/src/eye-of-chaos.js`, `backend/src/ai-handoff.js`, `public/eye-of-chaos.html`, `public/chaos-code-studio.html`, and `README.md`.


## 7. Member introduction and verified capability guide (November 19, 2026)

**Public announcement, suitable for members:** Miss Chaos is Knightfall's creative AI assistant for conversation, saved user-selected memories, coding help, original art and tattoos, measured craft patterns, optional chat photo analysis, moon-based reflection, arcade navigation, and attributed research from selected public sources. The Crucible provides six project disciplines, editable JSON exports/imports, self-reported milestone trackers, next-step handoffs, and an **opt-in** twelve-project device shelf. The shelf is not encrypted or account-synced; shared-browser users can read it.

**Public handbook:** `/miss-chaos-guide.html` organizes seven real capability areas with copyable examples. A logged-in viewer can check the tool identifiers the server currently offers via `/api/chaos/tools`, and explicitly invoke harmless calculator or word-count examples through `/api/chaos/tools/execute`. The listing is not a guarantee of provider uptime, unrestricted browsing or unlimited Workers AI quota. Any private Osiris/Isis panel requires authenticated `/api/chaos/modes` mode discovery and the separate verified tool list. Never use display names, URL query parameters or saved client flags as staff authorization.

**Osiris: verified GOD + accepted owner**. Private owner assistant, read-only staff source and GitHub health tools, Eye of Chaos command desk, GOD-only Eye of Horus, owner master execution lock, root diagnostics and approved publication controls. No autonomous code application/deployment from Miss Chaos.

**Isis: accepted collaborator + separately verified admin account**. Her own private companion, memories and account history; shared tasks/notes through explicit Between the Flames postings; curated owner bot consultations including permitted private bots with adult gating; admin/creator/moderation tools, Eye of Chaos missions and version-specific draft approvals, reviewed Theme Crew release/rollback. **Never GOD-only Eye of Horus, master execution lock, GOD diagnostics, or implicit GitHub/Cloudflare permissions.** Partnership alone without admin status doesn't grant admin powers.

**Engineering constraints:** `scripts/miss-chaos-guide.test.mjs` checks the seven guide areas, live-demo input validation and fail-closed private roles. `scripts/miss-chaos-site-index.test.mjs` checks public source navigation and forbids retired Creator Foundry links. Both run in the Cloudflare Pages release guard and the Miss Chaos CI workflow. `backend/chaos-public-tools.mjs` must stay syntactically valid, including a comma after every catalog entry. Do not claim mobile or partner-account validation without actual two-account/device testing.


## Miss Chaos supervised development docket (November 19, 2026)

**Repository-implemented, deployment/migration must be independently verified.** Code Studio already read 55 lines of allowlisted public Knightfall `main` source at a verified 40-character commit ID, refreshed HEAD, flagged long/clipped lines, and staged read-only proposals, real diffs and conditional syntax inspections. The next increment adds a **review docket**, not autonomous code integration.

- **Author step:** Read source via the staff-only `staff.repo_file` backend tool, copy the entire small file into the editor, make changes, and stage a valid proposal. Only **complete, unchanged, <=80-line, <=5 KB** files can be submitted after a separate confirmation click and 12–360-character summary. Excerpt-only proposals remain downloadable but cannot enter the docket.
- **Server verification:** `POST /api/chaos/dev-reviews` requires a verified admin/GOD session, exact allowed origin, bounded JSON, an allowlisted path, and independently rechecks the current GitHub main SHA plus complete original file. It generates the diff server-side, runs read-only JS/TS/JSX/TSX/JSON syntax inspection when supported, blocks high-severity parser warnings, and stores immutable original/candidate text.
- **Docket and decisions:** `GET /api/chaos/dev-reviews` and `GET /api/chaos/dev-reviews/{id}` display staff-only metadata, actual source comparison and audit history inside **Eye of Chaos → Approval Queue**. Exactly one pending revision can be **approved/rejected** with a human explanation. Approval requires verified GOD **or** independently verified admin **and** accepted partner invitation, an explicit confirmation, and a fresh current-main source validation.
- **Separation of duties:** Each decision is transactionally logged in `chaos_dev_review_events`. Approved means **human code review only**. Never claim candidate CI, safe execution, GitHub integration, publication or deployed behavior. The Worker has **no GitHub write token or automatic branch/PR**, no shell, no workflow dispatch and no autonomous deployment.
- **D1 release boundary:** New tables are declared in `backend/migrations/0151_chaos_dev_reviews.sql`. As Knightfall's migration policy requires, routine Worker deployment **does not apply schema**; use the explicitly approved `.github/workflows/apply-d1-migrations.yml` workflow after reviewing SQL and existing production schema. Until confirmed applied, API responds **503 migration pending**, not false success.
- **Checks:** `backend/src/chaos-dev-reviews.test.mjs` covers role isolation, true immutable source match, stale HEAD fail-closed, malformed proposals, exact review version, delegated Isis, GOD, audit and no auto-integration. `scripts/chaos-dev-review-ui.test.mjs` covers consent and staff UI. `scripts/test_chaos_dev_reviews_sql.py` validates the SQL entirely in memory. Worker CI and Pages release gate include them.
- **Next real leap, not yet implemented:** A separately authorized staging/isolated CI pipeline to test an approved candidate; integrate an exact reviewed full-file blob into `main` only with an authorized human-approved commit operation; compare release SHA to deployed Worker/Pages and real device QA; rollback if evidence fails. No model-driven code execution on public Workers.

**Links:** `/chaos-code-studio.html` for private staff proposal creation; `/eye-of-chaos.html` → Approval Queue for verified review; `/ai-handoff.html` for Ronnie/Samantha's explicit shared summary. Site role does not confer GitHub or Cloudflare access.



## Manual candidate evidence runner (November 19, 2026)

Miss Chaos can prepare a cryptographic test kit for a **verified complete, <=80-line / <=5 KB public source file**. Code Studio now reads up to 80 lines (still rejects clipped lines), captures a SHA-pinned original, computes a real diff and client-side SHA-256, and provides four copyable GitHub Actions inputs plus a portable JSON packet. Editing source after staging invalidates the packet. Eye of Chaos can independently build a kit from an authenticated pending/approved review detail so Isis need not recreate the author's edit.

**Manual workflow:** .github/workflows/miss-chaos-candidate-check.yml
https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions/workflows/miss-chaos-candidate-check.yml

1. In Code Studio, stage a complete verified small main source proposal; alternatively inspect the exact review version in Eye of Chaos → Approval Queue. Press **Prepare manual test inputs**. Nothing starts automatically.
2. Open the GitHub Actions workflow. Manually choose **Run workflow** on main. Copy base_sha, path, candidate_base64 and candidate_sha256. The run_targeted_tests input defaults to FALSE (non-executing static check). Choose TRUE only for one of the fixed approved test recipes.
3. The job confirms its own main checkout SHA, the public allowlisted path, exact 5 KB / 80-line limits, canonical UTF-8 Base64 and candidate SHA-256 before static syntax checking. Optional pinned tests execute in the disposable runner with sanitized child-process environment, no retained Git checkout credentials, no deployed service secrets, timeout, and source restoration afterward.
4. Inspect the GitHub run and its miss-chaos-candidate-evidence artifact. Its status, static_check, targeted_tests and hashes represent **candidate test evidence**, not approved code, integration CI, production deployment or physical phone QA. A stale main SHA requires re-reading/re-staging the proposal.
5. Separately verify Osiris or authorized-admin Isis decision in the private D1 review docket, manually integrate any specifically approved revision into main under owner's standard review policy, run full integrated CI, verify the exact Pages/Worker release SHAs, then test on devices. Migration 0151 still requires explicit reviewed deployment before the docket becomes writable.

**Security limitations:** Manually dispatched only, read-only GitHub token, persist-credentials disabled, no automatic PR/branch, code commit, Workers deployment, production D1 access, or paid AI service. GitHub Actions inputs and logs may be visible to repository collaborators; only use genuinely public code, NEVER private member data or credentials. A hosted runner with optional code-executing tests is **not** a hardened sandbox for arbitrary hostile code, so only mapped small modules and explicitly approved test cases may be executed.

**Regression tests:** scripts/chaos-review-sandbox.test.mjs and scripts/chaos-review-test-kit.test.mjs cover stale source, tampered digests, invalid Base64 and UTF-8, unsafe paths and symlinks, static syntax failure, source restoration, no implicit workflow dispatch, and UI export. Both are wired into Miss Chaos CI and the Cloudflare Pages release gate.


## Isis development apprenticeship — November 27
Start with the [mentoring and system-navigation manual](ISIS-DEVELOPMENT-APPRENTICESHIP.md) and [complete repository path index](KNIGHTFALL-REPOSITORY-TREE.md). Her GPT is expected to lead authorized practical development, explain system dependencies and teach through real changes, tests and commits. The manual includes a progressive contribution path and precise navigation. Use current live tasks and actual permissions; these guides are not access grants.
