# Miss Chaos: capable assistant architecture (implementation plan)

## Goal
Upgrade the existing public Miss Chaos and separate owner-only Chaos Lab into a capable assistant, not merely a persona prompt. Reuse the existing /api/chaos/chat, conversations, memory, and /api/admin/chaos-lab endpoints. Preserve the goth/alt-metal personality while prioritizing truthful, useful answers.

## Current confirmed frontend
- public/miss-chaos.js supports streamed /api/chaos/chat replies.
- public/miss-chaos-presence.js provides sitewide chat, optional browser speech synthesis, mood and arcade tips.
- public/miss-chaos.html includes editable memory and chat export.
- public/chaos-lab.html supports private config and approval-gated behavior proposals.
These frontend observations do not prove any backend tool is currently implemented or deployed.

## Implementation checkpoint: November 19, 2026

The following are wired into the Worker-side capability registry, model-tool palette, verified-session handlers and tests. They are NOT claims of unrestricted AI autonomy.

- Read-only member account context: `user.profile` (selected own profile fields), `user.inbox` (short excerpts only from conversations the current member belongs to), `user.notifications`, `user.memories`, `user.notes` and consent-gated `user.handoff`. Queries are scoped by the authenticated session's member ID, not model-supplied IDs. None of these tools mark messages read or edit member data.
- Maker abilities: `forge.pattern_draft` produces editable, measured prototype designs; `forge.material_estimate` computes a rectangular no-rotation layout, approximate yards/meters and optional material cost from measured cut pieces. `utility.convert` handles common standard units. If fabric width is supplied to a draft, its cut pieces can be estimated without a second model-planner call.
- Direct authenticated `/api/chaos/tools/execute` utility whitelist includes conversions and both Forge calculations, with ordinary backend input validation and capability permissions. The tool list remains discoverable through `/api/chaos/tools`.
- Research tools remain fixed-source public catalog lookups, not unrestricted browsing. Opt-in photo analysis uses the existing size-limited Workers AI model and does not store raw images in chat.
- Notification cleanup: default feed shows unread alerts, with optional read history; in-app reads notify other tabs and close matching OS pushes. Push delivery now checks an alert's recipient-scoped unread D1 record before sending, including queued retries. Explicit device-test pushes have a separate receipt-token path.
- Safety and limitations: no autonomous repo writes from public Miss Chaos, no fabricated image dimensions, no claimed custom fitted garment production, no unlimited free model allowance. Rectangular fabric estimates do not account for grain, nap, shrinkage, fabric pattern matching or optimized nesting.

**Verification:** `node --test backend/chaos-*.test.mjs backend/offline-bot-cache.test.mjs`; `node --test backend/src/notification-delivery-policy.test.mjs`; site regression tests; deployment workflow. Automated CI passing does not substitute for physical phone push checks or two-account privacy testing.

**Still open:** multi-photo dimensional reconstruction and manually verified constraints; mature garment patterns/grading; real-time tool status and cancellation; developer-only deployment diagnostics with trusted GitHub access; paid-plan/model fallback if Cloudflare free quotas run out; cross-device notification QA and accessibility testing.

## Intelligence and research reliability upgrade (November 19, 2026)

- Added a deterministic, allowlisted intent router in `backend/chaos-intent-router.mjs`. Clear member requests (own notes/memory/profile/inbox/notifications/shared handoff) reach their session-bound read-only tool without a second planning-model call. This improves both response time and free-allowance usage; it does not expose another account's data.
- Named free-source searches for Wikipedia, Wikidata, Poly Haven and The Met similarly bypass optional planning and retain grounded source URLs. A bounded two-source Wikipedia+Wikidata comparison can return partial evidence when one source is unavailable.
- Added direct deterministic calculations, word counts, moon-phase lookup and IANA-timezone clock requests, plus a maintained Knightfall page-navigation index including install and notification settings.
- Selected tools are settled independently within the three-call budget; a failure cannot erase already successful public tool results. Unknown, unauthorized or failed tools are marked unavailable and raw provider errors are not shared.
- Any planner outage or no-result response injects an explicit warning not to invent recent facts, private account data, or live results. External results remain untrusted reference data, never instructions.
- Maker catalog queries now reject obvious contact/phone/account information before sending requests to fixed public source endpoints.
- Miss Chaos's chat offers a small primary starter row and an accessible expandable More tools section with separate source, creator, and shared-task starters; the dated script version is refreshed to avoid stale frontend code.
- Regression tests cover source routing, partial failures, privacy, tool authorization, actual utility outputs and frontend starter accessibility.

**Remaining limitations:** Catalog searches are not arbitrary live web browsing; snippets and metadata must not be treated as full verified texts. Cloudflare Workers AI free capacity is finite, and mobile push/device testing plus authentication-audit secrets remain independent operational tasks.

## Tool architecture
1. Introduce a server-side capability registry, with name, JSON-schema input, per-user permission, rate budget, timeout, audit event, and explicit approval requirement.
2. A planner selects a tool only if necessary; validate arguments on the server. Never execute arbitrary model-generated code, URLs, SQL, or shell commands.
3. Execute a maximum bounded number of tool calls per user turn; return source provenance and clearly distinguish observed results from guesses.
4. Read-only public tools first: site navigation, indexed site help, searchable public posts (respecting visibility), game guides and catalog, arithmetic and date utilities, and optionally externally sourced research via a configured provider.
5. Private user tools only with verified session and ownership: their own messages, profile, saved memories, notifications, drafts, and permitted personal-bot controls.
6. Mutating tools require explicit confirmation describing the target and change. Never use model text as authorization.
7. God Mode tools are separate routes with server-side role enforcement, audit logs, preview/diff, and an approval step. Public chat must never see admin secrets, user archives, or cross-user memories.

## Conversational intelligence
- Use stable core identity and style independent of mood. Mood changes expression, not factual standards or access privileges.
- Retrieve scoped conversation summaries and relevant user-approved memories with retention and deletion controls.
- Distinguish short-term context, durable memories, and source citations. Never invent past events or claim an action was completed without a successful tool result.
- Support a structured answer mode for coding, debugging, writing, brainstorming, site assistance, and troubleshooting.
- Support streaming tool status, cancellation, retries, and helpful failure messages.

## User-facing capabilities roadmap
P0: backend inventory and authentication tests; chat reliability, mobile focus/keyboard, history and memory regression tests.
P1: grounded Knightfall site search and game-guide lookup, with citations/links to source pages.
P2: task planning, drafts, structured code suggestions, safe file upload processing with size/type validation.
P3: optional external web research and voice input/output through configured services.
P4: opt-in automations with schedules, quotas, unsubscribe and delivery monitoring.
P5: owner-only repo diagnostics, CI status, issue/PR proposals and approved code changes.

## Acceptance tests
- Public user cannot call admin tools or retrieve another user's memories, even by prompt injection.
- No cross-user data in memory retrieval or cache.
- Every mutating action shows target and asks for confirmation.
- Tool timeouts and upstream failures do not silently fabricate results.
- Public game tips cite a specific game guide when available; otherwise acknowledge uncertainty.
- Mobile companion does not block navigation, donation or shop actions.
- Streamed and nonstreamed chat paths have consistent errors and conversation history.
- Tests run against backend endpoints and real browser sessions before marking deployed.

## Cost discipline
Use the existing Cloudflare stack, cache nonpersonal public data, cap retrieval and tool calls, and avoid claiming that a hosted LLM or external research provider is free or unlimited. Maintain graceful fallback if a paid provider is not configured.

## Deterministic design tools (November 19, 2026)

- `forge.scale_pattern` resizes user-measured rectangular cut pieces by a supplied percentage or measured ratio, optionally preserving a supplied seam allowance and rounding to supported increments. This is a preliminary craft pattern resize, not garment grading or photographic size inference.
- `design.color_contrast` computes WCAG 2.x contrast ratios of user-supplied opaque hex colors, tests AA/AAA thresholds and suggests readable black/white foreground text. It does not mutate themes or claim full accessibility coverage.
- Both tools are registered through the bounded capability gate and model planner. Clear color and single-panel resize requests avoid a second planning model. Chat starters expose them and the script version has been changed to avoid stale caches.
- Verify with `node --test backend/chaos-*.test.mjs` and deployed Worker smoke tests. A successful repository commit alone does not prove the site is deployed.

## Open-source code tooling (November 19, 2026)
- `dev.code_inspect` parses bounded JavaScript snippets using Acorn 8.19.0 (MIT, https://github.com/acornjs/acorn), reporting syntax errors with source line/column and a small set of heuristic danger patterns. JSON uses native JSON.parse. Neither path runs pasted code or handles JSX/TypeScript. This is not a substitute for a full linter or penetration test.
- `research.github_repos` searches a fixed official GitHub public API endpoint for public non-archived repositories with declared license metadata. Results show GitHub source URL, declared SPDX license, stars, main language and update date, with a quota warning. License metadata is not independent compliance verification.
- Both are routed through the existing bounded public capability permissions; the code inspector is also included in the existing authenticated direct utility endpoint, and known coding requests bypass the second tool-planner call. Chat starters expose both features.
- Backend installs pinned Acorn 8.19.0. Two Miss Chaos CI jobs now install backend dependencies before running tests. Worker deploy already performs this installation.
- Uninstalled follow-ons: Prettier formatting (MIT), Monaco Editor (MIT), Mermaid diagrams (MIT), highlight.js (BSD-3-Clause), Transformers.js (Apache-2.0). Assess memory, worker budgets, rendering safety and CSP before committing.

## Samantha's private companion and fleet handoff (November 19, 2026)
- Dedicated authenticated `/samantha-chaos.html` uses the existing Miss Chaos chat, private account-bound conversations and memories. It requires the accepted `ai_handoff_partner` membership on every partner-mode chat request; no cloned account or copy of the owner's memory is created.
- The page includes verified read-only shared tasks and a deliberate shared-note/task posting interface routed to existing Between the Flames endpoints. A posted update becomes available to either assistant through `user.handoff` at the next retrieval, not through unconsented cross-account chat access.
- `user.bot_fleet` provides the signed-in member's own metadata plus only the owner's explicitly public, non-NSFW bot summaries to an accepted partner. System prompts, private bot logs, private memory, and God controls are not shared. Bot conversation uses existing public-bot chat only on explicit user submission; copying a bot reply into a handoff note remains a separate deliberate click.
- This is coordination through a shared user-controlled board, not automated bot-to-bot task execution or private bot permission delegation.


## Supervised development partner: immutable review packets (November 19, 2026)
- The staff `staff.repo_file` backend reader now obtains the publicly verifiable `refs/heads/main` Git commit ID through GitHub's fixed REST endpoint, validates the 40-character SHA, and fetches the allowlisted raw source at that immutable revision. A missing/refused/rate-limited ref lookup fails closed. Excerpts return `commit_sha`; any line over 300 characters is flagged as incomplete.
- Chaos Code Studio checks for a real immutable SHA, consecutive source lines, and no clipped long lines before offering a patch proposal. At **proposal staging** it repeats the authenticated source lookup and compares both the exact current head SHA and the returned excerpt. If main changed, the proposal is rejected and requires a fresh source read.
- A complete small JS/TS/JSX/TSX/JSON file (<5 KB proposed content and captured in full) receives a non-executing parser preflight. A partial source excerpt is explicitly marked **not syntactically verified as a complete program**. No browser- or Worker-side arbitrary code execution is introduced.
- The exportable text review packet contains file, source URL, immutable commit, line range, changes, preflight status, actual unified diff and both snippets. It is **not** a ready-to-apply patch, a CI-tested artifact, an approved change, or a deployed release.
- An explicitly clicked, confirmation-gated **Post review summary to Between the Flames** button creates a private shared-board note through the existing authenticated API. The note contains only provenance, counts and the review checklist; it does **not** include source text, secrets, or a claimed deployment. Posting is denied unless the account is GOD or the accepted handoff partner.
- Main-branch GitHub CI diagnostics have a separate results panel; checking committed CI no longer discards a user's staged review and is labeled **not** a test of their uncommitted proposal.
- The special Miss Chaos workflow is triggered for Source Reader, Code Studio, handoff and their tests. GitHub CI now checks the new source-pinning, invalid head, long-line, UI consent and proposal-safety regressions.

### Next gates still required
1. Add a genuine isolated integration-test runner for reviewer-approved **full-file** proposals; do not run arbitrary submitted code inside the public Worker, browser, or production runtime.
2. Capture and validate target full-file blob hashes and real test-artifact digests at integration time; fail closed if `main` moved after review.
3. Add per-proposal staff approval identities and an append-only decision record with exact source changes. Partner approval only when the backend verifies accepted partner **and** separate admin permission. GOD alone retains final override and master pause.
4. Only after separate server-verified authorization integrate the actual reviewed code; follow `main`-only repo policy, avoid automatic branch/PR creation, confirm CI on the integrated commit, verify Pages/Worker deployment SHA, and test the resulting behavior on a real device.
5. Monitor GitHub public API rate limits: no guarantee of unlimited no-cost HEAD inspections. Any lookup failure leaves proposals unverified, not silently accepted.

**Field guide for Samantha's GPT:** `docs/MISS-CHAOS-OSIRIS-ISIS-FIELD-GUIDE.md`. Review the live authenticated Between the Flames board for newer decisions.

## Member maker extensions and staff source index (November 19, 2026)

**New code committed on main. Do not infer production deployment until Cloudflare confirms the exact SHA.**

### Public Miss Chaos tools
- `design.palette_build`: deterministic five-swatch analogous, complementary, triadic or monochrome HSL harmonies from user-provided `#RGB`/`#RRGGBB`; validated hex and palette mode, CSS variable export, black/white readable text contrast computed with WCAG 2.x sRGB math. No network, file access, side effects or image understanding. Conversational direct route: “Make a complementary color palette from #f00”.
- `research.dictionary`: constrained single English-word lookup through the free `https://api.dictionaryapi.dev/api/v2/entries/en/<word>` endpoint, with bounded definitions and synonyms, Wiktionary attribution and a real source URL. Fixed host, no custom URLs, user data or redirects. The service can be unavailable or rate-limited; lookup does **not** silently fabricate results. Conversational route: “Define chaos”.
- Both abilities are exposed through the verified capability registry, model tool definitions, dispatch and authenticated direct tool endpoint. These are public **capability scopes** but the Knightfall chat/tool API still requires a signed-in member. The exact role checker remains server-side.

### Staff-only assistant navigation
- `staff.source_files`: identify actual allowlisted public repository filenames inside one explicitly enumerated directory (`backend`, `backend/src`, `public`, `public/arcade`, `scripts`, `tests`, `docs`, `.github/workflows`). GitHub's `main` SHA must be verified first, and the subsequent read uses that immutable commit. Forbidden paths, dotfiles, secrets, non-source types and unlisted directories are never returned. At most 40 matching entries are shown and no contents are downloaded.
- Example request: “List files in backend/src for chaos.” The model receives filenames, blob hashes/sizes and a canonical source URL; then uses `staff.repo_file` for separate read-only inspection of a chosen file.
- Accessible only to server-verified admin/GOD staff in both the AI chat and Code Studio. There are no GitHub token operations, arbitrary branch selection, code writes or CI launches. GitHub public API quotas apply.
- Chaos Code Studio now has a staff directory/file finder. Choosing a filename does **not** execute, edit, read or deploy it; the user must click the existing SHA-pinned read button.

### Public native browser workstation
- `/chaos-visual-lab.html` is a free visitor/member page, also linked from Creator Foundry, Miss Chaos and the public site index. It is built with local browser Canvas, uses no imports or network requests and sends no images to the Worker.
- Users may choose or drag/drop a **PNG/JPEG/WebP/GIF first frame** up to 12 MB, constrained to 20 megapixels and 8192 pixels per side. Pixel-art scale (16/32/64/128) or smooth resize, 128/256/512/1024 longest-side exports, PNG/WebP download, six representative image swatches, suggested legible text color and CSS/TXT palette export.
- This is a raster/pixel art and palette tool, **not** a geometric vector-trace engine, automatic clothing pattern or 3D reconstruction engine. Existing Pixel Studio/Atlas Packer/Tilemap Forge remain the editable game-art tools.
- New UI regression verifies discoverability, no network/storage calls and bounded image-processing/export behavior. Device interaction, visual output fidelity and Cloudflare rollout require separate verification.

### Open-source candidates researched, not installed
- Pica (MIT) for advanced high-quality browser resizing: https://github.com/nodeca/pica
- Color Thief (MIT) for palette extraction: https://github.com/lokesh/color-thief
- qrcode-generator (MIT) for printable creator/artist share cards: https://github.com/kazuhikoarase/qrcode-generator
- FinVector (MIT application, mixed component licenses) for raster-to-vector user workflow ideas: https://github.com/justynroberts/FinVector
- Openverse (openly licensed media search, individual work licenses and API request limits): https://openverse.org
Do not copy upstream assets or install runtimes without license review, dependency audit and performance testing.

### Remaining build queue
1. Run Chrome and Android touch/device tests for Visual Lab, including GIF, transparency, large images, WebP export fallback, keyboard input and 320-pixel screens.
2. Confirm authenticated member/direct tool endpoint responds with validated palette/dictionary results and staff role denies `staff.source_files` to members.
3. Inspect GitHub CI on exact integrated commit SHA; confirm both Cloudflare Pages and Worker deployments, since frontend and backend features have separate release gates.
4. For a deeper member maker suite: add optional licensed vector tracing, high-quality resize, QR profile/artist share cards and reusable palette profiles only after privacy review and explicit save controls.
5. For staff: retain human-reviewed patch integration, isolated test artifacts, signed approval and exact deployed-SHA validation; no autonomous GitHub writes.


### Chaos Visual Lab phase II: actually integrated local tooling
- **Pica** modern ESM browser resizer, pinned to upstream Git blob in `public/vendor/visual-lab/pica.min.mjs`, license MIT and bundled notices. Smooth resize defaults to Lanczos3 and falls back to native canvas if Pica errors. A 2048-pixel prepass bounds mobile resource use. Existing nearest-neighbor sprite exports remain available.
- **ImageTracerJS 1.2.6** locally bundled under Unlicense, used only on explicit “Trace current image” requests. Source raster is bounded at 160–192 pixels for phone responsiveness, with blackwork, grayscale and limited-color modes and path-detail settings. It returns real SVG geometry for download; tracing is not production-perfect tattoo line art and demands cleanup.
- **QR Code Generator** standalone local ESM, MIT, for printable 720×880 Knightfall share card PNG and high-contrast black-on-white SVG code. QR input is HTTPS only, max 300 characters, cannot carry URL credentials. User selects the label and triggers card generation locally.
- **Openverse** anonymous image metadata search occurs **only after user presses Search**, only sends search phrase/license choice, no member images or authentication. Returned title/license/creator/origin links are rendered safely with DOM APIs; thumbnail URLs are held as metadata and load only after a separate user click (external host sees the visit). API rate limits and remote errors are reported clearly. Creators must verify source licenses and attribution before reuse.
- Bundled library copyright notices preserved at `public/vendor/visual-lab/LICENSES.txt` (MIT + Unlicense). No CDN dependencies or extra hosting services. `/devil-tools.html#open-source-reference` explains the distinction between installed libraries and research-only projects.
- Regression tests cover main page controls, image constraints, actual local QR encoder, safe Openverse behavior and absence of local image uploads. Dedicated Playwright mobile/desktop Chromium smoke test exercises image load, Pica resize, pixel export, SVG tracing, QR downloads, and opt-in Commons search with mocked responses. CI and production deploy SHA must still be checked separately.
