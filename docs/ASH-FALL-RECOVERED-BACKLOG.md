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
