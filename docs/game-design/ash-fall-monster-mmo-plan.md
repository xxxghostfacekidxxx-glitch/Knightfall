# Ash-Fall Monster MMORPG: Feasibility and Delivery Plan

Status: research/prototype phase. This document does not represent a deployed MMO or legal approval to distribute Pokémon intellectual property.

## Product decisions

- Platform: browser first, responsive desktop/mobile.
- Visual direction: modern 2D, expressive animation, strong silhouettes, clean combat UI, Ash-Fall's charcoal/orange visual identity with creature-biome colors.
- IP preference: Pokémon-based fan game. Public distribution is blocked pending qualified IP review/authorization. Do not bundle Pokémon ROMs, sprites, music, logos, maps, or extracted game data without verified rights.
- Multiplayer: persistent shared world with server-authoritative movement, battles, trades, and saves.
- Strategy: adapt an existing project if a candidate passes build, architecture, license, asset-provenance, and maintenance checks.
- Hosting: Ash-Fall Pages for the client; Worker/API for account integration; persistent WebSocket world service and database chosen only after a prototype and capacity test.

## Candidate audit (initial repository inspection)

### Tuxemon/Tuxemon
- Repository: https://github.com/Tuxemon/Tuxemon
- Default branch observed: `development`.
- Root LICENSE is GNU GPL version 3 or later. The repository also contains content and dependencies whose individual terms must be checked before redistribution.
- Strengths: established monster-RPG code and data, maps/dialogue, combat, and a broader game loop.
- Risks: Python application, not a drop-in browser client. Browser delivery and MMO persistence would require substantial adaptation. Confirm current network code, tests, asset license metadata, and upstream activity before selection.
- Decision: audit as an RPG-mechanics/content-pipeline reference and determine whether the existing client can be reused without an expensive port.

### maierfelix/PokeMMO
- Repository: https://github.com/maierfelix/PokeMMO
- README describes canvas editor rendering and unfinished WebGL gameplay; its own checklist leaves engine/editor features unfinished.
- LICENSE is a custom BSD-like license with a nonstandard “Good, not Evil” condition. This is not a standard OSI-approved permissive license and may be unsuitable for the project's intended reuse; obtain legal review before incorporating code.
- README credits third-party graphics and sound sources. The code license does not automatically clear those assets.
- Decision: use only for a short isolated technical evaluation unless the license and maintenance risks are resolved. Do not treat it as production-ready.

### smogon/pokemon-showdown
- Repository: https://github.com/smogon/pokemon-showdown
- Server/simulator code is commonly identified as MIT-licensed; verify the current LICENSE and data/assets in the checked-out revision.
- Strengths: mature competitive battle simulator and battle formats.
- Limits: not an overworld, persistent trainer MMO, capture loop, or economy.
- Decision: study mechanics and protocol boundaries. Integrate code only after license/dependency review and a clear reason to do so.

### Pokéngine
- Website: https://www.pokengine.org/
- Documentation: https://pokengine.readthedocs.io/en/latest/About/faq/
- It is a useful browser-MMO product reference. Public availability of a complete source tree under a license permitting our fork/hosting has not been established.
- Decision: research reference only until source access and license terms are verified.

## License and IP release gate

A code license only governs the code it covers. Maintain a manifest for every imported code package, sprite, sound, font, tile set, map, species record, and other asset, with source URL, creator, exact license, required attribution, modification notes, and evidence of permission.

Pokémon names, creature designs, logos, artwork, music, maps, and game data may be protected independently of the engine. No public launch, distribution of extracted assets, or use of ROM files is approved by this technical plan. Obtain authorization/qualified legal review for the intended public use or replace uncleared content with original or explicitly licensed assets. Never bundle game ROMs.

## Architecture proposal

- Browser client: candidate renderer adapted for responsive touch and keyboard controls.
- Identity: link to Ash-Fall account through a server-verified API/session. Do not trust client-supplied user IDs or roles.
- World server: authoritative movement, zones, encounter ownership, battle actions, trade transactions, and reconnect handling. Use a persistent WebSocket-capable runtime. Evaluate Durable Objects for zone actors only after measuring concurrency, message rate, CPU, storage, and cost.
- Database: D1 or a compatible transactional store after testing write contention and required constraints. KV is for cache/session-like data, not authoritative creature ownership or multi-record trades.
- Assets: R2/static delivery for assets with documented redistribution rights.
- Security: server-authoritative RNG/outcomes; rate limits; schema validation; origin/session checks; anti-duplication transactions; audit logs; backups and recovery drills.
- Operations: staging environment and staging database; no disposable production accounts/content in smoke tests.

## Phased delivery and exit criteria

1. **Audit (week 1):** clone candidate repos; read licenses and asset manifests; build from clean checkout; inventory client/server boundaries, tests, dependencies, open issues, and last meaningful commits. Exit: reproducible build and evidence-based scorecard.
2. **Prototype selection (weeks 2-3):** make the same small map/character movement proof in the two strongest candidates. Measure mobile load time, frame stability, collision correctness, and ease of data-driven maps. Exit: selected base plus written rejection reasons for alternatives.
3. **Browser slice (weeks 2-4):** responsive shell, one map, movement/collisions, NPC interaction, encounter trigger, keyboard/touch support, reduced-motion support. Exit: playable on mobile and desktop.
4. **Account and persistence (weeks 3-5):** Ash-Fall session integration, trainer profile, starter/party/inventory/quest saves, migration tests, ownership constraints. Exit: save survives logout, reconnect, and device switch.
5. **Persistent world (weeks 5-8):** authoritative WebSocket zone server, movement broadcast, nearby-player filtering, reconnect, chat moderation, map transitions. Exit: 10-25 concurrent test clients without state divergence in a staging environment.
6. **Creature battle loop (weeks 7-10):** encounter, turn order, battle state, capture, storage, progression, and tests for all critical calculations. Exit: complete encounter-to-capture-to-save loop.
7. **Social/economy (weeks 10-13):** friends, parties, trade confirmations, atomic inventory transfers, guilds, shops/currency, moderation tools. Exit: trade duplication and interrupted transactions are tested and prevented.
8. **Closed beta (weeks 13-16+):** load/security tests, mobile QA, backups, rollback, monitoring, content review, licensing/IP clearance. Exit: all critical release checks pass and rights are documented.

These are planning estimates, not delivery guarantees. A major port of a Python client to browser or a rewrite of unfinished rendering/network layers can materially increase the schedule.

## MVP scope

- 3-5 connected maps and a starter hub.
- 20-40 creatures only if the intended IP/assets are cleared; otherwise use original or explicitly licensed placeholder content.
- Server-side save/load and account linking.
- Encounter, battle, capture, storage, one quest chain.
- Nearby-player visibility and basic chat.
- Initial load/concurrency target of 10-25 players in staging, subject to benchmark.
- No player trading, real-money shop, breeding, ranked PvP, or huge open world until persistence/security is proven.

## Candidate scorecard

Score each candidate 1-5 and attach evidence:
- Clean build and reproducible dev setup (20%)
- Browser client/rendering viability (20%)
- Persistent multiplayer foundation (20%)
- Code license compatibility (15%)
- Asset provenance/redistribution clarity (10%)
- Test quality and maintainability (10%)
- Mobile accessibility/performance (5%)

Do not select solely on feature count. A technically impressive prototype with unclear licensing or no sustainable server model is not a suitable production base.

## Immediate next actions

1. Run clean builds of Tuxemon and PokeMMO in isolated workspaces.
2. Inspect Tuxemon-Server separately and map its protocol to current client code.
3. Verify current Pokémon Showdown license and data boundaries.
4. Confirm whether Pokéngine exposes reusable source and a compatible license.
5. Use the in-repository browser prototype as a UI/input-loop test only; it is local-only and does not claim multiplayer or server persistence.
