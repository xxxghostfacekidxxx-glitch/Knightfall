# Wild Frontier implementation status

Last updated: 2026-10-21

## Implemented on the feature branch

- Responsive browser prototype: tile map, keyboard/touch movement, eight original creature species with custom SVG illustrations, turn-based battles/capture, party management, elemental type matchups with a live effectiveness indicator, event log, and creature XP progress bars.
- Local browser save for offline play, including creature XP progress and visible progress bars.
- Authenticated Worker endpoints:
  - `GET /api/game/save`: loads the signed-in user's save.
  - `PUT /api/game/save`: writes a validated save with an optimistic version check.
  - `POST /api/game/action`: validates encounter starts, attacks/counters, elemental damage multipliers, captures, flee, party lead changes, rest, and server-authoritative XP/level gains across the eight-species original roster.
- D1 migration `0023_monster_game_saves.sql` creates a one-save-per-user table; `0024_monster_game_battles.sql` stores one active battle per account so reloads can restore it.
- Save validation checks position/counters, requires walkable tiles, rejects non-adjacent position changes, limits party size, canonicalizes creature identities/stats from a server-side allowlist, rate-limits writes, and rejects conflicting versions rather than silently overwriting another session. The ordinary save route cannot alter party membership/levels/HP, inventory, or progression counters; those changes go through validated game actions. First-time cloud creation supports a bounded import of existing local progress so players do not lose prototype saves.
- Client attempts cloud sync using the existing Ash-Fall session cookie and falls back to local storage when signed out or the API is unavailable.
- The online client routes battle actions and party lead selection through the authenticated Worker and restores active battle state after reconnect. Party members can be selected as the active lead outside battle, the camp at X 04 / Y 01 restores the party when no battle is active, and victories award XP toward a level-based threshold. XP, level, HP, and derived stats are persisted server-side for online play. Signed-out/offline play retains the local prototype combat fallback.
- Static audit assertions cover authentication, version checks, species allowlisting, rate limits, server-side battle actions, type-effectiveness parity, original sprite assets, the live matchup indicator, and credentialed cloud requests.

## Deployment requirements before cloud sync and multiplayer can work

1. Merge the reviewed feature branch or deploy this branch to an isolated staging Worker.
2. Apply the new D1 migration to the staging database first. Do not apply to production without confirming the target database and backup state.
3. Verify `api.ash-fall.com` points to the Worker version containing these routes, that the Pages origin is allowed by the Worker CORS configuration, and that the Durable Object binding/migration is active.
4. Test sign-in, GET empty save, first PUT, GET restored save, stale-version conflict, invalid species rejection, rate limiting, and logout.
5. Test server battle actions: encounter outside grass rejected, start from grass, attack damage/counter, capture success/failure, no-supplies and full-party rejection, flee, reload battle recovery, stale-version conflict, and request rate limits.
6. Test two signed-in accounts in separate browsers: join, movement broadcast, blocked movement, reconnect, duplicate-session handling, and clean disconnect.
7. Only after staging passes, plan production migration/deployment with backup and rollback steps.

## Known limitations

- The shared-world WebSocket zone and server-authoritative online encounter/battle actions are implemented on the feature branch, but they are not deployed or staging-tested yet. Player presence is ephemeral across zone restarts; player saves and active battles persist in D1.
- Signed-out/offline combat is intentionally client-side. Online combat outcomes use Worker-side RNG and save-version checks, but staging tests must still verify action sequencing, concurrent sessions, and consistency between save and active-battle writes before treating them as production-ready.
- The cloud-save API persists a bounded party and progress counters, but it is not a complete inventory/economy/trading system.
- If two tabs edit the same save, the version check rejects the stale write. The UI warns the player instead of merging automatically.
- The public Pokémon IP and third-party asset rights question remains unresolved. This branch uses original placeholder creature concepts only; no ROMs or Pokémon assets are bundled.

## Next engineering milestone

Validate and deploy the new save/battle migrations to isolated staging, run two-account multiplayer tests, and test reconnects, concurrent actions, and save/battle consistency. Add inventory/trading rules only after these core invariants pass staging.
