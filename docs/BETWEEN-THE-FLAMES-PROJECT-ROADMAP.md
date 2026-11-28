# Between the Flames — project roadmap and continuation register
Updated 2026-11-27. Start here for both project collaborators and their assistants.

**Canonical live assignments:** https://ash-fall.com/ai-handoff.html (accepted accounts only). This is the project directory and phase history, not a competing task board. Search by permanent ID or workstream, not a card's temporary display position. The production D1 read-back after reconciliation was 199 active tasks: 7 done, 82 in progress, 110 to do. This is a dated snapshot, not a live counter. No feature acceptance was inferred from documentation.

## Work order and gates
P0: Restore performance, navigation, role isolation and messaging reliability; verify live collaboration. P1: Finish and verify committed realm expansions, themes, arcade and creator tools. P2: new features, commerce and growth once their dependencies are satisfied. Priorities here are recommended sequencing, not reassignment or a change to existing task priorities.
Every project follows: inspect current source and live tasks → recover previous scope → implement → targeted regression checks → main commit → CI → deployed revision → signed-in/device acceptance → close. Projects can have additional domain phases below. A phase marked source-present is not necessarily shipped. Use existing tasks, preserve history and cross-reference related work rather than copying it.

## Project index and phases
### 1. Platform stability, theme architecture and permissions
Tasks #6–7, #11–13, #15–23, #26, #43–46, #139, #183, #185, #191, #198, #200, #230.
- Prior reported Phase III: navigation/performance, ticker and dropdown separation, mobile hiding, PWA/cache/startup. Phase V: restore swappable independent realm themes and global control; 14 presets reported. Phase VI: consolidate CSS, recover deployment. Earlier phase labels not recovered; do not invent them. Previous reported measurements/CI require independent confirmation.
- Current: measure cold/warm load, long tasks and network; verify ticker never clips dropdowns, mobile sticky header, no inaccessible controls. Test signed-out, member, creator, moderator, admin, Isis and owner with server denial as well as UI concealment. Owner-only mailbox and secrets never available to partner/admin.
- Next: actual device/browser checks and verified deployment; fix owning CSS rather than piling on overrides. Separate site, Madhouse, Arcade, Chaosphere and Admin scopes; preserve theme assets, choices and inheritance.

### 2. Chaosphere and asynchronous games
Tasks #34, #35, #37–42 (existing IDs only), #179; #72–76 for cards/turn games; #24, #28 for social safety.
- Phase 1 recover baseline inbox/history/recipient isolation; phase 2 rebuild responsive composer, avatar bubbles, replies, photo attachments, emoji design and dock; phase 3 notification/read-state, multiplayer turn delivery and reliability; phase 4 signed-in two-account and real-device acceptance. This phase grouping is reconstructed from requests, not a claim that every milestone is implemented.
- Current: prior source/test evidence on composer and history; verify floating messenger and Miss Chaos collisions, long history, switching races, photos, pushes and emoji quality. Never reopen completed black-screen overlay fix without regression evidence.
- Cards Against Chaos: one to four humans with AI fill, four seats, async turns, expansion entitlements, hidden hands, versioned actions. Verify private data and fair scoring.

### 3. Miss Chaos / Chaos Collective
Tasks #93–96, #99–101, #168–169, #171, #229; collaboration #147–151, #201, #231.
- Phase 1 account-private chat, memo and memory; phase 2 site routing and source-aware tools, builder permissions, distinct portraits/themes; phase 3 approved agent research, review, budgets and public directory; phase 4 real-account and mobile acceptance.
- Current: Chaos Collective is a hub, not another model or database. Preserve private workspaces and owner-only controls. Check tools and route permissions, not only visible buttons; no autonomous publishing without approval.
- Next: verify existing hub/bot filters and role-controlled creator builder; repair floating UI and test private memory isolation. Guide: [Miss Chaos field guide](MISS-CHAOS-OSIRIS-ISIS-FIELD-GUIDE.md).

### 4. Celestial Sanctum
Tasks #216–220. Source: [Realm hubs and six expansion batches](KNIGHTFALL-REALM-HUBS.md).
- I: Observatory, date numerology, Major Arcana, study archive and existing Moonology/journal/shadow work destinations.
- II: 78-card deck, five-card spreads, zodiac wheel, UTC natal/transit comparison, personal year/name numerology, equinox/solstice.
- III: 33-entry archive, 24 runes, four geometry constructions, lunar quarters/global eclipse peaks.
- IV: 16 deity profiles, signs/houses, seven planetary metals, alchemy reflections, 42 SVG emblems.
- V: 56 unique pip/court assets, twelve-chamber navigation constellation, synastry, 98-asset manifest.
- VI: ten guided Egyptian/Hermetic lessons (Library of Mysteries), planetary hours (Clock of the Seven), four moderated study circles (Circle of Seekers), direct Miss Chaos entry.
- Current: six source-documented phases; five live tasks already existed, now have explicit acceptance steps. Next #220 specialized AI study context; #217 citation/art vault review; #218 verify D1 forum categories; #219 verify CI, actual deployment and mobile. Keep private inputs local and distinguish symbolic interpretations from astronomy; no fabricated natal houses or local eclipse predictions.

### 5. Force Realms — Jedi Temple and Order of the Sith
Tasks #193, #221–223. [Detailed register](FORCE-REALMS-TASK-REGISTER.md).
- 1 archive, Council/Holocron, 60 draft readings, eight master profiles and 36 research leads.
- 2 original manuscripts, canon/Legends timeline and encyclopedia; source label and primary-reference review.
- 3 daily practices, training plans, Academy assessment mapping, account-private journal.
- 4 living charters, voluntary vows, traditions and ceremony hall; authorized rank/mentorship workflows remain to implement/verify.
- 5 CI, deployment, mobile art/theme and signed-in acceptance.
- Current: source register includes readers and original content, production/browser verification incomplete. Existing #193 retained for curriculum/forum work; #221 archive and #222 practice/governance and #223 release now separate. Both orders must remain distinct, no coercive membership requirements. Do not link Sanctuary as a subrealm.

### 6. Sanctuary — The Eternal Archives
Tasks #224–225, related forum content #174. [Detailed register](SANCTUARY-TASK-REGISTER.md).
- 1 standalone entrance/navigation and scoped identity; 2 searchable fictional religious mythology, theology, bestiary, geography, chronology and lore; 3 check primary sources, novels, campaign outcomes and cross-links; 4 release and mobile acceptance.
- Current: archive/reader and several editorial draft batches in source; citations and actual release remain unverified. Do not create academies, ranks or mentor fleet. Approved tagline: Heaven promises salvation. Hell promises power. Sanctuary bears the consequences.

### 7. Chaos Cartridge and game families
Tasks #1, #48–76, #176–178, #188, #226–227 (use actual existing rows).
- Phase 1 consolidate catalog, remove duplicates and preserve old work; phase 2 playable original mechanics and art; phase 3 persistence, scores and network turns; phase 4 fullscreen/touch and release acceptance.
- Cosmic Ascension #226: original asteroid to galactic nucleus, absorption, satellite capture, hazards and reciprocal gravity source migration. Next catalog, growth testing, orbital systems and visuals; never assert deployed without proof.
- Neon Surge #227: dash, chains, Overdrive, bosses, hazards and collision math documented. Prior Shattershot identity is unconfirmed; reconcile catalog/identity before renaming or creating another cabinet. Test bosses at waves 5/10/15 and weapon milestones 40/80/120/160.
- Archived #177 was consolidated into #57 Imp Inferno, #58 Hex & Whisk, #59 City of Cinders and #82–84 Cinderwild; inherited requirements are retained in those tasks. Other cabinets have their own IDs. #1 black-screen overlay resolved per owner; #48 remains for independent cases, not duplication.

### 8. Creature Sanctuary, Misfit avatars and creature RPGs
Tasks #77–92, #156–160, #202, #206–207, #210–211 (existing IDs only).
- 1 inventory pets and stable IDs; 2 original art, adoption and earned evolutions; 3 care, reactions and avatar articulation; 4 fair opt-in arena and server-owned RPG combat; 5 acceptance on devices.
- Four equal legendary companions: Boogie (black fox ears/three tails, tagline “Too legendary for ordinary.”) + Specter (white wolf, pink/green); Minion Mouse (red fox ears/three tails) + Bubblemaw (pink axolotl); Mini Villain + Nox (black dragon); The Eddie + Ruckus (original whirlwind beast). Companions are theme illustration partners, not combat mounts. #210 duo theme integration; #211 gallery and care acceptance; #206 Boogie adoption/animation.
- Preserve the Midnight & Mayhem and Tiny Tyrants themes and existing assets. Verify all account entitlements through approved test accounts; do not publish real family data. Arena #207 separate. RPG #77–84 has staged multiplayer/server-authoritative gates.

### 9. Creator Foundry, artwork, Open Source Arsenal and Theme Crew
Tasks #102–118, #161–164, #166, #196–197, #200, #209.
- 1 inspect existing tool and asset catalog; 2 create or refine original SVG, sprites, maps and patterns; 3 validate/export, provenance, accessible preview; 4 authorized publishing and swappable themes; 5 device/release QA.
- Current: Pixel Studio, Atlas Packer and Tilemap Forge available in source, asset inventory and recovered art remain ongoing. Use original assets, retain originals and licenses. Do not claim artwork from a chat is imported without path/hash and Vault registration. Keep theme engine global/per-realm controls; theme previews do not publish.
- First collaborator work: small private sprite/asset, export, inspect metadata, record exact tool and test results. No secrets or production writes required.

### 10. Madhouse / social / Serrated Signal
Tasks #24–33, #167, #170, #173–175, #184, #189, #193, #205, #228.
- 1 hierarchy and news-first discovery; 2 source-backed drafts and moderated agent queue; 3 profile, albums, community onboarding and safety; 4 verified publishing and participation.
- Serrated Signal #228: hub and original tap-tempo/metronome first; next link/no-autoplay/mobile verification; then band profiles/release discovery; licensed uploads and streaming only after rights/moderation review. Keep music autoposting excluded from agent seeding.
- Verify public versus private data, report/block/mute and attribution; no duplicate forum or bot directories.

### 11. Commerce and legal launch
Tasks #119–130, #146, #182, #212–215.
- 1 Iowa sole proprietor/trade name, appropriate tax setup; 2 live merchant identity/bank and isolated Stripe credentials; 3 server-priced checkout, signed idempotent webhook, entitlements, billing portals; 4 tax reconciliation, refunds, policies and sandbox/live acceptance; 5 storefronts, supplier and Connect prototypes, metrics.
- Proposed pricing (not approved production catalog): free standard; VIP $4.99/month or $39.99/year; card skins $1–1.99; additional slots, pets, themes, expansions TBD; support custom amount. Do not activate payments, file registrations, spend or sign agreements without owner approval and verified prerequisites.

### 12. Sanctum of Inferno and creative world
Tasks #142–144, #186–187, #203.
- 1 preserve existing codex, oath, commandments, ranks, symbols and memorial art; 2 editorial review and original visual identity; 3 separate optional realm and authorized publishing; 4 release acceptance. Keep independent from fictional Sanctuary and Force Realms.
- #143 manuscripts/symbolism; archived #186 preservation scope moved into #143 and #142 (with #90 pet art reference); #142 separate memorial acceptance. Keep the existing branding direction: “We control chaos”; homepage tagline “The world is a beautiful disaster.”

### 13. Email, mobile, operations and collaboration
Tasks #134–140, #147–152, #181, #198, #201, #231.
- Recovery #136 is already in Ready for Verification; test controlled receipt, expiration, one-time use and session revocation. #181 owner-only mailbox, newsletters and unsubscribe remain separate; verified sending does not establish receiving.
- Mobile OAuth, PWA, Google Play policy/account deletion, queue, backup and free-tier monitoring: inspect evidence and real release before closing.
- Collaboration: separate accounts, accepted invitation, private Action keys only if supported, snapshot before each batch, version-aware write, read-back and note. No shared ChatGPT memory assumption.

## Consolidation rules and source links
Read [historical alias register](backlog-consolidation-2026-11-24.md) before using old IDs. Never renumber or permanently delete existing records. Keep work that requires independent acceptance separate; cross-link umbrellas. Archived #177 and #186 are retained as aliases; #210 is theme artwork (not battle mechanics), #211 is gallery/device acceptance. #148 remains open for historical gaps. New records #221–231 were inserted after checking existing titles, and existing #193 was moved to Force Realms, #143/#186 to Sanctum of Inferno, #147 to AI Collaboration. #177 and #186 were soft-archived after transferring their requirements; other statuses preserved. Live handoff note #6 links this roadmap and the collaborator guide.
Use [Start Here](SAMANTHA-KNIGHTFALL-START-HERE.md) for assistant onboarding. Before any project batch, open the live record, read its current version, source, blocker, and concrete next step. After each batch, save actual evidence, next step, and blocker to the same record and post one shared handoff note. If tools are unavailable, supply a clearly labeled copyable update for the authorized collaborator; never claim it was saved.


## Isis development apprenticeship — November 27
Start with the [mentoring and system-navigation manual](ISIS-DEVELOPMENT-APPRENTICESHIP.md) and [complete repository path index](KNIGHTFALL-REPOSITORY-TREE.md). Her GPT is expected to lead authorized practical development, explain system dependencies and teach through real changes, tests and commits. The manual includes a progressive contribution path and precise navigation. Use current live tasks and actual permissions; these guides are not access grants.


## Assigned starting workstream — November 27
Osiris has designated Celestial Sanctum as Samantha and her GPT's first development project. Follow the [Celestial Sanctum assignment and first coding task](CELESTIAL-SANCTUM-ISIS-START.md), starting with #217's verified source-metadata gap, then #216–220. This supersedes generic example starter tasks; coordinate overlapping changes with the other development assistant. No role/access changes or completion claims are implied.


### 14. The Veil — Kemet and occult reference collections
[Dedicated project register](THE-VEIL-PROJECT-REGISTER.md). Kemet: 371 civilization and 264 mythology records, five room pages and Theban studio source-present; new phases for evidence review, chronology, science, language, archaeology and religion. Grimoire: #232–235, 117 searchable records, seven seal previews, with proposed pentacle/Enochian/reader/assistant expansions. World mythologies, world religions, esoteric movements and witchcraft/mysticism are planned collections. Use current live records for IDs and status. Timestamp display uses permanent note IDs, America/Chicago and canonical UTC; original history remains intact.


### 15. Philosophy
[Project register](PHILOSOPHY-AND-LANGUAGES-REGISTER.md). Independent philosopher archive and Nietzsche-first extended collection: 25 introductions, 18 Nietzsche concepts and 11 works. Expand textual commentary, author dossiers, schools, comparative arguments and acceptance.

### 16. Languages and Sound Studio
[Project register](PHILOSOPHY-AND-LANGUAGES-REGISTER.md). Independent language hub, 24-sign Egyptian laboratory, keyboard, recognition practice, historical script guides and six modern speech samples. Expand script/grammar, documented pronunciation, audio and language modules. Cross-reference Kemet #238 without duplicating implementation. Production acceptance remains open.


### Miss Chaos — urgent experience recovery (November 27)
[Dedicated experience roadmap](MISS-CHAOS-EXPERIENCE-ROADMAP.md). Existing #45/#93/#94/#95/#169: chat-first layout, rounded portrait-led replies, mobile history, disclosure-based tools/privacy, Bubblegum Havoc, warmer adaptive voice, character art/expressions and actual audience acceptance. Source implementation and checks recorded; release and feedback remain open. Philosophy #250–253, Languages #254–258, Kemet #236–242 and The Veil #232–235/#243–248 retain their respective registers and roadmap.


### Miss Chaos — The 66 dedicated research corps
[Project register](MISS-CHAOS-66-RESEARCH-CORPS.md). Six divisions, 66 new research identities, retiring the previous shared-fleet research assignments. Public source discovery, verified evidence retrieval, peer ledger, tool evaluation queue, original model training. Preserve original 32 duties. Candidate training and deployment gates remain independent.

## November 27 — Alien Eyes and native model verification
- Alien Eyes public project inspector: source committed and direct fixture checks passed; browser and deployment verification pending. See [implementation](ALIEN-EYES-PUBLIC-PROJECT-INSPECTOR.md).
- Miss Chaos experiment 003: conditioning audit reproduced from checkpoint; regression suite and independent CI job committed. Model remains research-only; quality insufficient for production. See [model record](MISS-CHAOS-ORIGINAL-MODEL.md).
- Six-character collective: current label unchanged pending name selection; prior expanded cast preserved. Live Between the Flames records not synchronized from this source-only session.

## November 27 — Fractured Mind and tool quarantine
- Fractured Mind: owner-selected name committed in console and archive response.
- Alien Eyes: moved to verified Osiris-only Worker execution, owner decision state and review UI. Ten direct mocked authorization/state checks passed. Public/Isis release requires separately verified access adapter; scrapping disables execution. Live Worker/Pages and CI verification pending.
- Candidate review currently contains Alien Eyes only. Existing previously public tools remain unchanged. Live task board not synchronized.

## November 27 — executable compiler and code interpretation
- Iron Crucible: real WebAssembly emitter, no-import execution, VM comparison and binary export. Six native emitter fixtures passed on Node 22.16.0; full integration and deployment pending.
- Miss Chaos existing code inspection: structural AST summaries, functions/classes/loops/branches/import/export counts, async signatures, regression fixtures committed; dependency-backed tests pending CI.
- Osiris tool quarantine: six individually reviewable source candidates (Tree-sitter, Pyright, Tokenizers, llama.cpp, LM Evaluation Harness, Wasmtime). No installation or publication. Alien Eyes remains software-project inspection, not personal account correlation.
- Research roster cadence remains three assignments per hour (72/day maximum attempted, 22 hours per rotation); live successful run rate and neural quality not verified. No live task board write.

## November 28 — Osiris-only authorization and Order 66 activation
- All seven registered tools authorized for Osiris only; prior distribution intents normalize to Osiris, and explicitly scrapped tools remain disabled. Six upstream readiness checks and owner-only per-agent evidence ledger implemented; six external engines still require installation and runtime integration.
- Dedicated collector activation migration, peer sharing independent of successful network collection, daily synthetic training cadence. Global master pause retained. Live migration, authenticated runtime, actual learning counts and CI remain pending. See [implementation record](OSIRIS-ORDER66-2026-11-28.md).

## November 28 — Order 66 live bootstrap and continuation
- D1 confirmed 462 manual-curation delivery receipts (7 concepts for each of 66 agents); do not count as independent discoveries or comprehension. Teacher attribution remains original evidence source.
- Continued 175-parameter format model from checkpoint 001 for 35,640 training steps; held-out 500-row synthetic loss 0.292457 to 0.105292, accuracy remained 100%. Checkpoint 002 integrated into owner-only advisory classification endpoint and console; general chat weights unchanged. Daily candidate continuation uses distinct run seeds and cached prior checkpoint, regression-gated, not automatically deployed.

- Six pinned external engines now have isolated GitHub Actions installation and execution acceptance jobs (fixed synthetic fixtures only). Native Linux runner success is not production Worker integration. Random GGUF fixture is Apache-2.0 and checksum-pinned; no model output promoted. No private site data or deployment credentials are passed into these jobs.

- Private owner Miss Chaos can retrieve reviewed Order 66 evidence automatically on relevant coding prompts and run the trained classifier on explicit format requests; the owner learning ledger exposes each agent's actual curriculum. These local retrieval paths do not send private chat data to research sources. Deployment and live owner acceptance pending.

- Alien Eyes full software report adds languages, license file declaration, latest release, manifest inventory, source links, partial failure status, scheduled owner-only six-project catalog, and explicit private Miss Chaos commands. External engine acceptance now repeats weekly. Actual authenticated browser acceptance and successful autonomous collection remain to be verified.

- Six live project catalog reports bootstrapped from GitHub metadata, explicitly marked manual and partial. Owner coding questions automatically retrieve relevant catalog evidence. Independent hourly GitHub Actions research fallback reuses existing bounded D1 collector and retries failed current-hour claims once, preserving original error provenance. Runtime credential acceptance and autonomous successful discovery remain pending.

- Direct D1 fallback credentials returned HTTP 403. Replaced with exact-repository/workflow/main-branch GitHub OIDC, fixed current-slot public discovery results, canonical source validation, replay reservation, pause enforcement and one retry per failed claim. No runner database credential or arbitrary SQL access. Production OIDC acceptance pending.

- Restored dedicated Alien Eyes software workspace with owner verification, readable metadata, catalog cards, report export and direct Osiris link. Research fallback first deployed upload returned HTTP 401; added boolean-only runner OIDC diagnostics. Do not claim automatic collection successful before production readback.

- All six native engine acceptance jobs confirmed successful at run 46112183898, including the corrected llama.cpp headless build and fixture inference. This confirms isolated runner execution, not production callable integration.

- Confirmed first autonomous Order 66 research upload run 46112608482: 3 complete, 0 failed, 9 pending public software metadata records; 462 manual-curation lesson receipts unchanged. Added original local next-token model checkpoint 001 and owner-only inference panel, with daily candidate training and loss regression gate. Model and UI deployment pending verification; not general conversational replacement.

- Autonomous run returned nine records across three agents, but production found counts establish three unique new records (six prior manual-curation entries were already present; do not count as autonomous). Added bounded 66-roster metadata reference fanout, excluding source agent, preserving pending/rejected distinction, pause and idempotency. No automatic package execution or neural training on unreviewed metadata.

- Order 66 research throughput: retain 3 assignments/hour, 66 identities and bounded source calls. Replaced six repeated division queries with 66 distinct technical specialist queries plus alternate curriculum rotation. Uploads report actual unique vs returned/duplicate records; runner query validated when provided. Source acceptance and full-cycle uniqueness tests added. No increase in external request budget.

- Specialist model v2: six distinct original curricula, 72 authored training sentences, 12 validation and six additional evaluation sentences. Expanded vocabulary while preserving original weight blocks; six groups of eleven simulated clients use 75% specialty and 25% common replay. Trained 42,240 steps; metrics recorded in checkpoint. Daily continued candidates with two loss gates, no automatic production promotion.

- Specialist 002 owner inference selection added alongside Local 001 (existing default API retained for compatibility; UI defaults to experimental specialist). No primary chat replacement, external inference or automatic promotion. Validation 104 tokens, loss 4.37017→3.91440, secondary 46 tokens loss 4.23814→3.74779; unknown targets present and accuracy modest. Tests and deployment pending.

- Research efficiency: authenticated read-only preflight skips paused, already accepted and fully completed Worker slots before public-source requests. Removed pre-deployment push trigger; successful API deployment, hourly schedule and manual dispatch retained. Existing write-side replay protection remains. No paid dependencies or added source budget.

- Original specialist trainer optimization: sequentially accumulate client weights into one Float64Array instead of holding 66 full model copies; typed numeric buffers and allocation-light softmax. All 66 client updates and existing summation order retained. Checkpoint format unchanged; numeric parity and workflow verification required. No paid compute.

- Original curriculum tutor: deterministic BM25-style retrieval over 72 authored lessons with evidence IDs and abstention for unsupported terms. Independent of external AI and third-party libraries. Explicit Osiris-only endpoint and console; no replacement of public chat, no account-scanning functions. Test/deployment pending.

- Context 003 original eight-position language model: 120 authored technical sentences, separate validation and one-time initial evaluation; transfer previous two-position weights, train 66 simulated clients, streaming aggregation. Candidate gate requires lower known-token loss and nondecreasing known-token accuracy. Initial test not used for daily selection. No external model or paid compute. Checkpoint and actual initial metrics in repository; serving remains unchanged.

- Context 003 added as explicit owner console checkpoint option, API default unchanged. Curriculum tutor expanded to 120 authored lessons and now requires every meaningful query term to occur in the same retrieved lesson. No primary chat replacement; tests and deployment pending.

- Endless Chaos: preserve 66 identities and add 34 unique technical specialists, 100 total. New 5-minute two-agent slots (up to 576 assignments/day; rotation 250 minutes). GitHub fallback scheduled five minutes, no added paid services; Cloudflare catalog refresh remains hourly. Shared software broadcasts now store one row per reference rather than physical copies per learner; old receipts preserved. Historical hour column holds new five-minute IDs, disjoint from legacy hourly rows. Tutor database-index alias fixes strict matching regression. Deployment and live cadence pending.

- Shared reviewed corpus immediately accessible to all 100 identities and owner tutor (exact-title lookup, canonical attribution). Original curriculum preferred; unreviewed discoveries not treated as factual training data. Context trainer now supports 100 simulated clients with balanced six-division assignment and 48,000 steps per four-round continuation. Previous checkpoint untouched. Updated roster/API regression fixtures.

- Completed 100th-agent route compatibility and invalid identity regression fixtures; result metrics distinguish shared broadcast rows from historical physical receipts.

- First 100-client continuation actually executed 48,000 steps (run 46116189858). Last round known accuracy regressed 33.62%→32.76% despite loss improvement; prior retained. Trainer now retains best eligible intermediate round, preserving strict accuracy/loss requirements while avoiding discarded earlier improvements.


## November 28 — Messaging recovery and Order 66 continuation
- Main commits 0bc4aa1, 97b2b2b, 9c770f0, 92303b4, e141f08, 570b893, 7b8d3a4 and 1045eee: global theme publishing UI (sequential, not atomic), notification reply draft retention, keyed native reply retries, message-ID confirmation, socket handshake recovery, reduced background polling, attachment preview retention and incremental draft display. Source changes committed; physical Android shade reply, signed-in attachment and production acceptance still required.
- Main commits 20dc042, d632a47, e0b2d95 and af673af: 100 coding specialists, all four provider rotations verified over 200 slots; four approved peer evidence references per assignment with a single bounded, pause-guarded D1 insert. Research remains two assignments per five-minute slot; no claim of 100 concurrent bots or neural-weight updates.
- Main commit 2a9fd1e: seven additional native math instructions, pi/e constants, arity and finite-domain checks. Six VM execution and seven rejection fixtures passed in direct checks; native WebAssembly regression suite awaits CI.
- Deployment run 46119002899 failed on incomplete provider rotations; corrected in af673af. Authorization/ownership audit runs 46119002816 and 46119002890 could not run without authenticated audit credentials. Do not mark production verification complete until fresh deployment and account checks succeed. Trouble artwork remains open.

## Chaos Core attention candidate — November 28
- Actual independent 004 training: 6,000 Adam steps, 32-token attention context, 28,981 parameters, 152 training examples; selected step 5,000 by validation loss. Code, original corpus, checkpoint, sample failures, owner-only explicit selection, and regression tests recorded. Validation loss 4.139118; separate initial test accuracy 31.18%. Candidate is not production ready. Repository implementation ready for code verification; live model replacement and authenticated acceptance remain open. No paid compute or new dependencies.

## Chaos Core Recall 001 — evidence retrieval research
Original sparse hashed word/character/bigram softmax classifier trained with 44250 updates on 590 examples (including repeated features), 35910 parameters. 69 authored concepts, 207 aliases. Held-out alias test: neural top-1 45/69, accepted neural 44/69; hybrid exact-alias lookup 69/69, unsupported abstention 22/22. Exact aliases are curated, not unseen factual generalization. Prior exploratory ranker reached 42/69 accepted and failed the 70% floor. This hybrid explicitly reports neural agreement vs deterministic fallback; no neural-only promotion. Source lesson IDs and authored text returned, no external inference. Existing public chat and generative checkpoint defaults unchanged. Research references: https://arxiv.org/abs/2005.11401 and https://arxiv.org/abs/2109.01652 (architectural inspiration, no imported weights or claims of reproducing their results). CI and live deployment pending.

## Chaos Core engineering evidence and byte tokenizer — November 28
- 45 newly authored engineering/ML lessons added to the 69 existing concepts (114 concepts, 342 unique explicit aliases). Compiler, decompiler, WebAssembly, testing, concurrency, deployment, tokenization and verification topics. Independent council supports bounded comparison of two distinct concepts and lists of up to four definitions; only exact reviewed-in-code aliases compose evidence, unknown comparisons abstain, no neural synthesis claim. All 18 direct routing/abstention fixtures passed before commit.
- Trained a deterministic byte-pair tokenizer with 256 learned merges, vocabulary 512, on 228 authored text strings. Training corpus 9,013 UTF-8 bytes → 3,760 tokens. Seven lossless source, multilingual, whitespace and empty-string round trips passed directly. This tokenizer is a research artifact for future checkpoints; existing word-token models are not compatible and remain unchanged. Reproduce with `node scripts/train-chaos-core-byte-bpe.mjs /new/tokenizer.json`. No external weights, new paid compute, or production chat replacement. CI and authenticated live verification pending. Research background: https://aclanthology.org/D19-1410/ (learned semantic retrieval; not implemented SBERT), https://arxiv.org/abs/1508.07909 (subword BPE).

## Chaos Core 005 — original prompt-conditioned byte-pair checkpoint
Actual training run: 16,000 SGD updates from random seed 28006, width 32, 64-token prompt pooling, six positional autoregressive history tokens, 514 IDs including start/end markers, 132,130 parameters. 213 original training pairs including 29 JavaScript/Python/JSON examples, 13 validation pairs, 13 separate test pairs. Selected step 14,000 by validation loss (6.244888 to 4.822838; 15.13% token accuracy). Separate test loss 6.241792 to 4.656411; accuracy 20.55%. Tokenizer fixed from prior 114-concept corpus, so held-out concept text may have influenced token merges; it was excluded from neural weight training. Sample code and definitions are invalid or incoherent, no production promotion and no automatic execution. Original causal attention 004 remains separate; 005 uses a simpler pooled prompt/positional architecture, not a longer autoregressive attention window. Reproduce with `node scripts/train-chaos-core-005.mjs /new/checkpoint.json`. Explicit owner selection `generate chaos core 005: ...`; 003 remains default. All samples preserved, no third-party weights or new paid services. CI and live verification pending.

## Chaos Core scalar script synthesis — November 28
- Original bounded grammar of 171 scalar arithmetic candidates. Three to sixteen distinct two-integer examples, optional disjoint validation, JavaScript/Python emission, ambiguity probes and explicit no-match. All typed interpreter checks in two simulated 100-specialist peer rounds passed (1,200/1,200 cases, four ambiguous sets each round). Not live bot activity or neural weight training. CI adds native Node and isolated Python interpreter checks for fixed generated source; those CI checks have not yet run in this session.
- `synthesize scalar: {"language":"python","examples":[{"input":[0,0],"output":3},{"input":[1,5],"output":5},{"input":[-2,1],"output":-1}],"validation":[{"input":[10,7],"output":23}]}`. `build scalar script:` uses identical input and creates an owner-scoped expiring .py/.mjs attachment only if one candidate remains and at least one validation input was supplied. No arbitrary code execution, external model, or deployment. `scalar training status` runs the bounded simulated benchmark. Existing models remain unchanged; native CI and authenticated live download pending.

## Chaos Core text pipeline synthesis — November 28
- 15 original ASCII text operations, depth 1–3, exhaustive 3,166 candidate search at depth 3, independent validation, disambiguating probes. Two simulated 100-specialist rounds (0 and 52), each 500/500 held-out typed interpreter checks; 12 oracle families, five ambiguous and 79 probe-agreement sets per round. Probe agreement does not prove equivalence. Four-step lowercase/trim/whitespace-collapse/hyphen slug example failed within depth 3; preserved in evaluation. No live bot activity or neural weight updates.
- `synthesize text:` accepts JSON `{language,examples:[{input,output}],validation:[{input,output}],maxDepth}`. `build text script:` requires disjoint validation and a unique grammar match or explicitly supplied `operations` list that matches every example; returns owner-only expiring .py/.mjs artifact. ASCII input bound 256 characters chosen for matching cross-language behavior; Unicode not supported by this tool. `text training status` reports simulated benchmark. Native JavaScript/Python execution tests authored; live CI/download verification pending. No third-party inference or paid dependencies.

## Chaos Core control synthesis — November 28
- 438 original branch/loop candidates; two integer inputs -32..32, bounded loops, safe-integer overflow rejection, independent validation. 1200/1200 interpreter oracle checks passed across two simulated 100-specialist rounds. Multiple matching programs compared across the complete 4,225-point bounded domain when no disagreement is found; distinct counterexamples otherwise. Native runtime regression tests authored, not executed in this session. Commands: `synthesize control:`, `build control script:`, `control training status`. Owner artifact requires validation and explicit selection if ambiguous. No neural weight updates or live bot activity; existing compiler tools unchanged. CI and live deployment pending.

## Original numeric composition
Owner command `build composed script:` accepts explicit acyclic steps (add/sub/mul/min/max, references to inputs or earlier results), three training examples and disjoint validation. Up to 12 steps; bounded integers and overflow checks; JS/Python output. Direct interpreter checks passed for both languages and three rejection cases. Native execution regression added; CI/live pending. No neural training or autonomous composition claimed.

## Automatic composition discovery
`discover composed script:` searches up to three arithmetic operations from examples and separate validation. Reports shortest matching programs, ambiguity probes and no-match. Explicit `build composed script:` remains the download path. Four direct search fixtures passed 12 held-out interpreter checks. Search is bounded and probe agreement is not proof; no neural training. Native CI/live pending.

## Compiler-feedback curriculum and Chaos Core Program Selector 001
- Original typed repair engine mutates operation and operand references, traces failures, searches at most two edits/1,024 candidates, selects only a unique minimum-edit training match and gates on disjoint validation. 100/100 deliberate single-operation faults repaired and 400/400 held-out checks passed in direct execution; not arbitrary-source repair. Commands `repair composed script:` and `build repaired script:` (owner-scoped source attachment only on accepted repair).
- 240 verified lessons across 20 known arithmetic program families; 160 training, 40 validation, 40 test; 2,400 independent-oracle interpreter checks. Splits use different seeded example sets, but share program families, so this is not novel algorithm generalization. Actual neural selector training: 24,000 SGD updates, 23 derived numeric features, 48 hidden units, 20 outputs, 2,132 parameters; step 6,000 selected by validation loss. Held-out top-1 22/40 vs 1/40 untrained; top-3 36/40 vs 3/40; validation loss 2.99219 to 1.04347. Full 20-template deterministic verification accepted 40/40 held-out tasks, 160/160 separate cases, not neural accuracy. Original weights saved with reproducible trainer. Commands `plan numeric script:`, `build planned script:`, `program selector status`. No production model replacement or live agent activity. Native-runtime CI and authenticated deployment verification pending.
