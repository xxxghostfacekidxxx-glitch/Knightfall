# Cinderwild: Knightfall's original creature-collection MMORPG

> Product benchmark: the multiplayer exploration, collection, and progression *systems* that make classic 2D creature MMORPGs engaging. Cinderwild keeps its own characters, creatures, world geometry, locations, dialog, sprite assets, and quests. Do not copy the maps, quests, scripts, or copyrighted assets of Pokémon Planet or Pokémon.

## Canonical game

- **One** playable Knightfall MMORPG: `public/arcade/hosted/cinderwild/`. Keep `monster-mmo` as an archived prototype, not a competing launcher or backend.
- Client: vanilla JavaScript, pixel canvas and Android-friendly tap controls.
- Backend: authenticated `knightfall-api` Worker, D1 as the source of truth for competitive state, existing account system.
- The offline creature party, capture logic and cloud backups remain a single-player experience until server-owned creatures and battles are released. **Never** turn browser creature JSON into an authoritative PvP or trading asset.

## Implemented foundation (2026-11-15)

- Original 25-creature bestiary, evolution, capture, storage, elemental moves, 3 solo Wardens, world map, and 3 collectible shrine creatures.
- Client-local save plus conflict-aware Knightfall account backups using the existing arcade-save endpoint.
- **Online-world alpha:** account-based join/leave, D1-backed player positions, collision validation against all 2,432 current world tiles, current-zone nearby trainers, blocked-user filtering, 45-second presence expiry, authoritative cardinal movement, move cooldown and version checks.
- First five server-verified quests: *Footsteps in the Ash*, *A Kindled Welcome*, *Pack for the Wilds*, *Into the Brambles*, *A Warden's Challenge*.
- Online world currently begins in Cinder Town. Its region gates rely on server-owned milestones, not unaudited local crests. This deliberately limits exploration past Bramble Trail until online Warden fights exist.
- Production migration `0135_cinderwild_online_world.sql` installed November 15, 2026.
- Regression tests for cloud backups, map parity, collisions, world sessions, blocked trainers, quest credit, and online UI.

## Feature-parity implementation order

### 1. Server-owned creatures and wild battles

- Introduce account-owned `cinderwild_creatures` with immutable per-creature IDs, IV-like genetic variance, effort/training values, move charges, status, held items, levels and protected starter flag.
- Server generates encounter IDs, region-based creature odds, species levels and rarity. Browser submits only battle decisions, never results.
- Server applies each turn: damage, statuses, fainting, experience, evolution, orbs used, capture, and rewards. Persist with transactional conditional revisions.
- Migrate offline catches only into a **separate unranked collection** unless verified by the server; never allow save imports to mint tradable inventory.

### 2. World map and campaign expansion

Build an original connected atlas that delivers the same *kind* of journey: starter settlement, routes, forests, caves, waters, desert, towns, healing shops, gym-like challenges, a championship league and postgame exploration.

Suggested original regions:
1. **Cinder Reach**: Cinder Town, Bramble Trail, Thornbarrow, Glasswood, First Warden.
2. **Storm Basin**: Floodcut Marsh, Volt Harbor, Luminous Mire, marsh trials.
3. **Eclipse Highlands**: Quarry Pass, Mourning Ridge, Shadowglass City, night-court trials.
4. **Ember Coast**: Saltburn Strand, Reef Crypts, Cinder Lighthouse, tide routes and fishing.
5. **Ashen Crown**: volcanic ascent, the Warden summit, eight-crest championship and postgame legendary quests.

Maps must be **original tile layouts**, not traced or renamed maps from Pokémon/Planet. Add area-specific entry/exit links, collision grids, shops, trainers, spawn pools, quests, and minimaps. Extend the shared-world API with `map_id` and instance boundaries. A major map release should not change the geometry of active multiplayer maps without migration.

### 3. Original campaign and quest engine

- Store `quest_id`, prerequisite graph, objective type, required location/NPC, staged dialog, narrative flags, claimable rewards and expiry settings as versioned server content.
- Story arcs: *The Broken Beacon* (starter through first crest), *Static on the Marsh* (missing couriers), *Echoes Under Glass* (ghost investigations), *The Sunken Engine* (coastal expedition), *Crown of Cinders* (championship), and *After the Ash* (postgame).
- Minimum first major release target: eight Wardens, a 4-challenge final league, 8 towns, multiple connected caves/forests, 40 original quest stages, and at least 80 original creatures with evolutions.
- Checkpoint quests are awarded by server actions only. NPC dialogue, cutscenes and rewards must be original.

### 4. Social and competitive systems

- Real-time trainer positions and world chat with spam throttles, user blocks, moderation and reporting.
- Direct trading with two-party consent, offer locks, creature ownership checks, transactionally swapping server-owned IDs only after both sides confirm.
- PvP rooms with turn deadlines, authoritative move decisions, per-season competitive rankings, voluntary spectators and battle logs.
- Friend and party system leveraging Knightfall's existing social accounts, then clans, co-op expeditions and rotating events.
- Player market/auction with escrow, server-owned currencies, fraud controls and item sinks. Paid cosmetic customization must not sell competitive power.

### 5. Platform and quality gates

- Map streaming/chunk caching for Android browsers, tap controls, viewport scaling, reconnect, background visibility, and offline local-only mode.
- Automated two-account session tests, logout expiration, version-conflict recovery, replay/reconnect tests, race checks for trade and battle outcomes, and deterministic world parity tests.
- Preserve a single `main` branch for active work. Each release must pass tests and confirm Pages + Worker production deployment, not only GitHub commits.

## Current gap

This is **not yet a fully equivalent MMO**: online trainer visibility and quest milestones are implemented, but shared-world chats, trading, server-owned parties, gym combat, ranked PvP, eight Warden progression, and a large connected atlas still need to be built. Prioritize the authoritative battle and progression services before allowing competitive creature interactions.
