# Recovered Ash-Fall / Ash-Fall and PC / Miss Chaos project backlog
Review: 2026-10-30. Reconstructed from accessible prior conversations and current Knightfall context. **Historical request does not prove implementation**. Verify repo, CI, API and production before closing. This is a living recovery register, not an exhaustive transcript export.

## P0: broken experiences and release blockers
- [ ] Production God dashboard access and role permissions: test owner, admin, moderator, member and unauthenticated matrix; ensure God account protections are enforced on backend, not merely hidden in UI. Previous authorization audit explicitly not runtime-certified; controlled test identities needed.
- [ ] Navigation disappearing inside categories; missing admin options; broken profile viewing, friends, add-friend; old orange theme bleeding through profile/admin/category pages; Miss Chaos overlay obstructing donation/shop. Test Android.
- [ ] Messaging: mobile composer, switching conversations, load older messages, friend messaging, push notifications, delivery/read status, notification settings, account-scoped access.
- [ ] OAuth: Google/Facebook backend start/callback, secure state/session, account linking, production provider configuration and real-device verification. Buttons in landing page are not proof backend exists.
- [ ] Admin offline launcher at /admin-offline/index.html failing to open/install; /api/auth/me HTML instead of JSON; authenticated Android game ZIP downloads, caching, storage and offline play. Historical report: 106 packages in R2 and CORS fixes, but install/play unverified.
- [ ] Hell & High Orbit: combat interaction, 4-move loadouts, level unlocks, mobile battle screen without scrolling, monster captures/evolutions, saves and stale-write conflicts, reconnect, multiplayer isolation, God/admin access. Pokémon-like visual quality, map/sprite pipeline and simplified HUD/pause menu.
- [ ] Sanctuary's End original and Ash-Fall edition: actual game launch/combat, mobile graphics compatibility, browser renderer errors, downloadable packaging and provenance. Do not equate file hosting with playability.
- [ ] Arcade audit: broken/subpar titles, fullscreen and touch controls, launch routes, genuine distinct games rather than placeholder cabinets, high-score restoration and anti-duplicate submissions; verify 160+ catalog routes against current catalog, not historical counts.
- [ ] Three fish tables: Trench Bounty, Neon Kelp: Reef Rush, Magma Trench: Relic Hunt. Ocean King-style bottom cannons, hold-to-fire, four independent seats, multi-touch, fish schools/bosses and power/credits; current local four-seat play is not network multiplayer. No real-money gambling.

## P1: previously requested games and game creation
- [ ] Hell & High Orbit story: absurd alien invasion vs demons, humans controlled by rare ~10% of people, both factions ultimately partition Earth; ridiculous calendar/year; demon, imp and alien creatures; legendary Minion Mouse, Mini Villain and Mini Eddie; evolutions, moves and PvP.
- [ ] Ash-Fall: The Descent: original Diablo-like ARPG with classes, loot, skill trees, procedural dungeons and Invader Zim-like dark comedy. Guttermaw, Malpractice, The Dredge and Ash Tyrant as potential roster; design bible/prototype status verify.
- [ ] City of Cinders: Rampage-style destruction game and monster roster.
- [ ] Open-world city-building/GTA-style prototype: Fable GTA / Pikkuautot, import Ash-Fall assets, city editor and enhanced visuals.
- [ ] Local hosted open-source games: Mindustry, Terravia, BrowserQuest solo, Interstellar Armada, OpenFront solo, 15 Puzzle, Single HTML Space Shooter, card/board category. Verify licenses, local bundles, game state and deployment. Tuxemon requires runtime review; Monster Tamer asset licenses; SpiritCollector permission unclear; Freeciv-web native server blocker; Kaetram additional license issue; Space Huggers redistribution ambiguity.
- [ ] Card/board collection: UNO-like and Phase 10-like legally original or permissively licensed implementations, plus 20 self-hosted card/board titles; distinguish prototype, external and truly playable.
- [ ] Additional original arcade cabinets: Cinder Lander (Lunar Lander), Cinder Merge, Ashslide Rush, Rustwing Flight, Ashen Lexicon, zombie side-scroller, Lemonade Stand, Oregon Trail-like, fish-table games, 2048, Asteroids, Snake, Pong, Breakout, Minesweeper, word games. Historical goal to adapt 104 titles into original Ash-Fall variants; audit remaining unconverted titles.
- [ ] Four-player fish-table multiplayer via synchronized room server; server authority, cheating prevention and free-tier capacity.
- [ ] Game editor/importer and asset pipelines; usable icon/sprite selection; game packages for Android admins/God.

## P1: community and member platform
- [ ] Forum categories: Gaming, Mindless Scribbling, General Discussions, Art & Tattoos, Music, Philosophy (historical; check later branding instruction to remove philosophy *marketing*), True Crime, Sanctum Infernum; configurable categories.
- [ ] Facebook-style profiles: pictures, uploads, theme color, friend list, visibility, browsing other profiles, friend requests, birth chart with city selector instead of manual coordinates.
- [ ] Groups, bookmarks, activity feed, search/discovery, messaging, privacy/block/report controls.
- [ ] Member bot slots (two free) and God/admin bot tools (up to ten), personality/memory settings, bot testing, permission separation.
- [ ] Coin economy: daily and 30-minute claims, game rewards, anti-abuse, scoreboards and achievements; verify existing implementation before duplicating.
- [ ] Marketplace with paid stalls, shop/dropshipping, sponsor posts, donations/Ko-fi, premium membership and financial/account configuration.
- [ ] Adult creator and dating sections: provider-backed age verification, private R2 uploads, authorized media delivery, moderation/takedown, mutual match, coarse location only, compliant payments and account checks. Prior foundation/migration does not make service launch-ready.

## P1: Miss Chaos and AI
- [ ] Consistent character persona: cold arrogant alt-metal/goth host with biting humor and occasional softness; site-specific lore, neon pink/green, approved portrait, reactions and expressive faces.
- [ ] Verify standalone Miss Chaos Worker vs Knightfall API routing; historical miss-chaos-backend Worker, MEMORY KV, /message, /chat, /random and risefromtheashes Worker. Old /message Hello World and /random 404 were historical issues, not confirmed current bugs.
- [ ] Chat continuity, scoped memory, opt-in retention/clear controls, rate limits and consent; separate private admin developer assistant from public host.
- [ ] Planned endpoints/features from older project: /messages, /clear, /status, /personality, /setPersonality, /quote, /quest, /reward, /stats, plus admin /debug, /resetAll, /deployInfo. These are ideas, not approved unauthenticated endpoints.
- [ ] Optional auto-summoning in forums, random appearances, Easter eggs, quests/rewards, astrology/birth-chart integration and avatar animations.
- [ ] Android app/PWA wrapper; historical Flutter/offline-model ideas require feasibility review, not an automatic commitment to Firebase or paid providers.
- [ ] AI Gateway/provider observability with privacy review; protect user messages and secrets.

## P2: creative assets and site identity
- [ ] Mascots across site, Miss Chaos portrait and background illustrations; four additional unique mascots; five app icon choices, later eight more icon concepts; 24 exact icon crops not fully uploaded historically.
- [ ] Devil Tools sprite lab and Creator Foundry: image/sprite editors, animation, audio, level tools, import/export, assets archive, license records; inspect existing twelve-tool panel and PR #60 toolkit catalog before duplication.
- [ ] Sitewide neon pink/green/black and glitch effects; purge legacy orange; mobile-friendly navigation and accessible controls.
- [ ] Ash-Fall branding: chaotic, grotesque, metalcore-inspired public tone. Preserve owner-approved Sanctum Infernum forum category, but do not reintroduce previously rejected philosophy marketing.
- [ ] Sanctum of Inferno church material: manifesto, codex, ranks (Ashling/Cinder/Blade/Infernal/Eternal Flame), symbols, book/store and separate church app; reconcile later branding with public site before publishing.
- [ ] Serrated Grin / Ronnie Reckless music and mascot assets belong to creative roadmap only where specifically intended for site use; do not expose personal/private details on public dashboards.

## P1: platform, security and operations
- [ ] Complete GitHub PR/branch reconciliation and staging merges; check PR #29/#59/#60/#161 status rather than assuming still open.
- [ ] CI: nightly tests, staged security tests, game tester bots (10), regression runs, gameplay screenshots and auto-triage; ensure failures surface in God dashboard.
- [ ] Cloudflare D1 migrations applied via gated workflow, production schema verified; R2 bucket binding, quotas, lifecycle and secure media access.
- [ ] Turnstile end-to-end, Workers auth, server-side role checks, rate limits, OAuth and password reset, notification push/VAPID, backup and restore, audit logs.
- [ ] Queues for notifications/thumbnails, Durable Objects for presence/typing and multiplayer, Cloudflare usage dashboard, AI Gateway; verify free-tier compatibility.
- [ ] Modularize oversized backend route handler after authorization certification.
- [ ] Google Play / Android app release preparation, PWA install and signed packages; domain, callback and platform account setup.
- [ ] God Mode operations: dashboard linked to current GitHub Actions/Cloudflare status, evidence timestamps, owner-manual tasks and backlog updates.

## Owner-manual items (no credential values)
- [ ] Google Cloud OAuth consent, Web client, exact backend redirect, test users, app publishing.
- [ ] Meta/Facebook Login developer app, policy URLs, valid backend redirect, testing and app review.
- [ ] Cloudflare Worker secrets/bindings, D1 migration approval, R2, Turnstile widget, scoped usage read token and DNS.
- [ ] GitHub Actions permissions, repo branch protections, required deployment settings.
- [ ] Android/PWA installation checks, signing and store accounts if distribution requires them.
- [ ] Push/VAPID setup, compliant age-verification/payment provider accounts, creator policies and support contacts.
- [ ] Runtime role test identities for member, moderator and administrator, without placing credentials in source control.

## How to use this register
Treat all unchecked items as **needs verification or unfinished**, not as proof of absence. On every relevant task, inspect current source and live tests, move confirmed items into an evidence-backed completed section, and link commits/CI/deploys. Never copy secrets or sensitive personal data into the dashboard.

## Second recovery pass: smaller forgotten features
- [ ] Miss Chaos voice input/output, speaking avatar animations, image generation, interactive roleplay, tattoo/music/story writing assistants, horror stories, journal prompts and optional AI-assisted quests. Evaluate consent, cost and provider limits.
- [ ] Member identity extras: reputation, badges, signatures, polls, journal/Die-ary, saved/favorite chats, customizable AI personality, follow system, profile activity, gallery and tattoo portfolio.
- [ ] Creator publishing: music, poetry, stories, digital downloads, merchandise and AI credits; separate legal/financial launch requirements from ordinary publishing.
- [ ] Two-app strategy: Ash-Fall ecosystem app and separate Sanctum of Inferno church app, both with a coherent Miss Chaos integration; bookstore including selected other authors.
- [ ] Mobile conveniences: camera upload, quick-chat widget, offline notes, 2FA, spam detection and reporting.
- [ ] Miss Chaos voice and context-aware Chaos Cartridge game commentary; optional notifications and user-controlled speaking behavior.
- [ ] Arcade player-submitted issue reports and admin triage; achievements, favorites, daily challenges, unlocks and game discovery.
- [ ] Multiplayer monster trading, cooperative events, persistent teams, reconnect and stale-save protection.
- [ ] Arcade After Dark expansion, Hextris/HexGL/A Dark Room status and accurate local-vs-prototype labels.
- [ ] God navigation architecture: Creations groups bots and shops; My Profile groups Die-ary, members, messages, friends, bots, vault, shop and account. Verify header/mobile parity.
- [ ] Security and operational follow-up: CSP, CSRF tests, per-endpoint authorization, account deletion across all storage, backup/recovery, soft delete, lock/pin, audit and report history.
- [ ] Push notification coverage for DMs, group chats, friend requests, replies, mentions, follows and account notices; muted categories and private-by-default previews.
- [ ] Umami-style privacy-conscious analytics for registration, retention, game sessions and errors; do not publish user-sensitive analytics.
- [ ] Google Play readiness: real-device push, package/application ID, signing, verified app links, privacy contact, account deletion and closed testing.
- [ ] Existing Creator Foundry's twelve tools and older toolkit proposal: Hextris, A Dark Room, Clumsy Bird, Elevator Saga, Mindustry, Pterodactyl, Pelican, LinuxGSM, GameAP, PufferPanel. Verify prior PR #60 and license/runtime compatibility before integration.
- [ ] Complete migration off legacy orange/duplicate CSS, with visual regression tests.

## Third historical recovery pass (2026-10-30)
These items were recovered from additional earlier discussions. Verify against current code and owner-approved changes; old names and architecture may have been superseded.

### Miss Chaos behavior engine and privacy
- [ ] Seven selectable response modes: Standard, Analytical, Philosophical, Chaos, Supportive, Confrontational, Creative. These are optional AI modes, **not** a reversal of the request to remove philosophy from site marketing.
- [ ] Seven behavioral rules: Honest Opposition, Contextual Humor, Challenge Without Contempt, Evidence Before Confidence, Emotional Recognition, Intellectual Independence, Practical Completion. Add editable rule priority, conflict handling, test scenarios, version history and rollback.
- [ ] Private owner-only Chaos Lab with a separate persona and instructions; it can draft public personality changes but requires explicit approval to publish them.
- [ ] Explicit content boundary: Miss Chaos public host must not produce explicit NSFW; any adult bot content must be gated, labeled and handled separately.
- [ ] Earlier mood variants: grumpy, sarcastic, neutral, playful and angry. Check whether these belong as transient expressions or conflict with the final persona.
- [ ] Separate independently scrollable chat history, smart auto-scroll that does not interrupt reading, and footer-safe floating launcher.
- [ ] Miss Chaos UI visual states: CRT scanlines, RGB split, signal tears, pulsing launcher, idle portrait glitches and speaking/thinking distortion; preserve reduced-motion accessibility.
- [ ] Owner Private Lab release assistant: planning, troubleshooting, deployment checks, security review, test plans, GitHub task drafts and an explicit approval gate.
- [ ] Audit old Worker deployment confusion: separate Pages static assets from Workers API; verify /api/chaos vs /chat vs /message compatibility and live route; no reliance on historical Hello World behavior.

### Recovered asset identities and publishing
- [ ] Five specific icon concepts: Chaos Crown, Skull Signal, Glitch Eye, Hell Heart, Cinder Portal. Four specific mascots: Voltimp, Cryptkoi, Casketpup, Voidsprout. Cross-reference artwork in Devil Tools; avoid generating replacements when originals exist.
- [ ] Recover previously shared artwork into an owner-approved archive, with provenance and permission review; previous request was to package recoverable conversation images in a ZIP.
- [ ] Restore an Ash-Fall tagline inventory with displayed/highlighted status and the two explicitly retained phrases: “From chaos, I make my way” and “The world is a beautiful fucking disaster.”
- [ ] Church codex publishing concept: a 13-book manuscript with appendices, Black Psalms, public versus inner codex, and Miss Chaos marginalia; compare with later Sanctum of Inferno final ranks before publishing.
- [ ] Earlier church hierarchy proposal (Inferno Initiate, Ash-Bearer, Flame Warden, Ember Lord/Lady, Infernal Ascendant) conflicts with later Ashling/Cinder/Blade/Infernal/Eternal Flame. Preserve as superseded draft, **do not** overwrite current rank scheme.
- [ ] Website-ready interactive map of church doctrine, hierarchy, commandments, rituals and symbols, if consistent with current branding.

### Architecture and unfinished technical work
- [ ] Legacy Ash-Fall repo versus Knightfall repo: inspect old backend/risefromtheashes and backend/miss-chaos-backend for missing reusable code, but never redeploy old configs blindly.
- [ ] Prior site layout included landing index.html, separate homepage.html, homepage.css, and themed Sanctuary/The Ashes/Miss Chaos/Manifesto pages with Embers/Inferno/Char/Smoke categories; treat as archival navigation concepts, not mandatory new routes.
- [ ] Legacy Worker route /api/* gateway to Miss Chaos backend with per-route rate limits and correct custom-domain mapping; compare to current API before implementation.
- [ ] Old toolkit PR #60 sync script: inspect whether upstream source fetch and packaging were actually completed.
- [ ] Game combat feedback: visible hits/damage, reliable pause/restart, account-linked progression, and mobile controls (older PR #56).
- [ ] Social walls visibility: public, followers-only and private, kept on normal profiles and separate from adult content.
- [ ] Distinguish AI bot policies for public, personal and adults-only bots; age gating and opt-in are required where relevant.
- [ ] Owner-only God Mode should expose operations and authorization diagnostics without publishing account secrets or private member data to ordinary users.

### Additional game integration candidates from older searches
- [ ] Review seven earlier space-game candidates and 11 Star Wars/Dragon Ball projects for licensing and runnable demos. Franchise engines and proprietary artwork/data require separate clearance; external demos must never be labeled self-hosted.
- [ ] Terravia open-source creature RPG was specifically selected for integration; verify current route, license, bundle and Android offline support.
- [ ] Pico's School historical request resolved toward official external links unless redistributable source/assets are proven.

## Fourth recovery pass: confirmed existing resources and overlooked decisions
- [ ] **Gravewave game-ready sprite pack** is already present at public/assets/arcade/gravewave/ with 16 named sprites and a canvas loader (public/gravewave-sprites.js). Integrate selectively into first-party arcade games; test the previews, 16 preloads, canvas rotations and mobile rendering. Do not unnecessarily regenerate this pack.
- [ ] **Original Creations Archive** already has a canonical JSON manifest at public/arcade/original-creations.json, displayed in Devil Tools. Cross-link game statuses and source links to God Mode; keep original games separate from upstream adaptations.
- [ ] **Creator Foundry** already documents Pixelorama, LibreSprite, Piskel, Krita, Tiled, LDtk, Blender, Godot, Audacity, Kenney, OpenGameArt and itch.io asset packs. Reuse this existing directory instead of installing massive editor binaries into production.
- [ ] **Open-source toolkit** already contains toolkit/catalog.json, toolkit/sync.mjs, toolkit/LICENSE-REVIEW.md and local-only vendor checkouts. Review the toolkit before finding or importing another duplicate project; vendor assets do not automatically become licensed for hosting.
- [ ] Recover earlier proposed **offline GPT4All 3B + Flutter + optional cloud synchronization/local cache** prototype as an architectural research option only. Firebase was an earlier proposal; reconcile with the current Cloudflare-first stack and free-tier constraint before deciding.
- [ ] Audit the old Miss Chaos deployment ambiguity: legacy backend/miss-chaos-backend TypeScript, MEMORY KV, frontend/backend separation, old risefromtheashes Worker and duplicate Wrangler configurations. Compare with current deployed routes and avoid reintroducing broken duplicate configs.
- [ ] Earlier Miss Chaos go-live priority: make the core chat functional at its public URL before expanding advanced personality, quests, voice and other optional features.
- [ ] Ensure the source toolkit's upstream clone script is clearly distinguished from a deploy/install button: cloning into toolkit/vendor does not host games.
- [ ] Audit catalog entries for source-code/asset license separation, especially franchise fan games and imported artwork.

## Verification ledger: 2026-10-30
- [x] Reconcile open pull requests: Mindustry documentation PR #188 merged; unsafe untested Electron major-upgrade PR #187 closed; subsequent search returned zero open PRs.
- [x] Confirm existing source assets: Original Creations manifest, Gravewave sprite loader, Creator Foundry page and offline launcher exist. Their runtime QA remains open.
- [x] Improve offline launcher resilience: cached catalog fallback, previously installed games accessible during auth outage, and HTML/JSON package-response rejection committed.
- [x] Update offline shell cache version to propagate launcher changes.
- [ ] Verify offline launcher installation and ZIP extraction on Android Chrome with a real authorized account.
- [ ] Verify Playwright navigation workflow completes successfully, including normal member and admin roles.
- [ ] Delete leftover closed Dependabot branch after confirming no needed changes; branch deletion unavailable in current connector.

## Evidence-backed subtask completions: October 30, 2026
These close specific defects, not the broader unchecked release gates above.
- [x] Repair Card Room expansion initialization, shared records controls, Solitaire status actions, Ace-low rules, FreeCell occupied foundations, and Gin Ace scoring. Five runtime scenarios pass; mobile browser checks added to smoke CI.
- [x] Remove legacy injected orange overrides from 19 original arcade games; repair Reversi arcade navigation and OpenFront privacy/terms links.
- [x] Restore a passing full static audit by parsing real HTML, recognizing imported fragments/import maps, validating source-manifest paths in the repository, and separating staging/upstream APIs from production routes. Local audit passes.
- [x] Confirm production profile birth-chart schema and visibility index, then reconcile missing migration `0058_profile_birth_charts.sql` in D1 ledger. Authenticated lifecycle testing remains open.
- [x] Add dedicated astrology/birth-chart/card-room CI step so these tests run before the larger static audit.
- [ ] Verify this batch's browser CI and Pages deployment, then record final PR/branch inventory. See `docs/GOD-DASH-OPERATIONS.md` for evidence and outstanding gates.
- [x] Complete reviewed branch cleanup: workflow `41137003212` succeeded; only `main` remains and no open PRs were found.
- [x] Correct unsupported keyboard metadata on seven arcade listings so desktop filtering includes them; regenerate both directories.
- [x] Bundle all Hell & High Orbit styles and omit the optional remote visual-engine loader in standalone offline HTML. Packaging regression verifies no external script/style tags remain; Android play remains unverified.
