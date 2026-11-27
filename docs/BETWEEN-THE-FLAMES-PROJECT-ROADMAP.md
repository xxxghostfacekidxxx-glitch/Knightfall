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
