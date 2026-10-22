# Wild Frontier implementation status

Last updated: 2026-10-21

## Implemented on the feature branch

- Responsive browser prototype: tile map, keyboard/touch movement, original placeholder creature encounters, basic turn-based battle/capture loop, party panel, event log.
- Local browser save for offline play.
- Authenticated Worker endpoints:
  - `GET /api/game/save`: loads the signed-in user's save.
  - `PUT /api/game/save`: writes a validated save with an optimistic version check.
- D1 migration `0012_monster_game_saves.sql` creates a one-save-per-user table.
- Save validation checks position/counters, limits party size, canonicalizes creature identities/stats from a server-side allowlist, rate-limits writes, and rejects conflicting versions rather than silently overwriting another session.
- Client attempts cloud sync using the existing Ash-Fall session cookie and falls back to local storage when signed out or the API is unavailable.
- Static audit assertions cover authentication, version checks, species allowlisting, rate limits, and credentialed cloud requests.

## Deployment requirements before cloud sync and multiplayer can work

1. Merge the reviewed feature branch or deploy this branch to an isolated staging Worker.
2. Apply the new D1 migration to the staging database first. Do not apply to production without confirming the target database and backup state.
3. Verify `api.ash-fall.com` points to the Worker version containing these routes, that the Pages origin is allowed by the Worker CORS configuration, and that the Durable Object binding/migration is active.
4. Test sign-in, GET empty save, first PUT, GET restored save, stale-version conflict, invalid species rejection, rate limiting, and logout.
5. Test two signed-in accounts in separate browsers: join, movement broadcast, blocked movement, reconnect, duplicate-session handling, and clean disconnect.
6. Only after staging passes, plan production migration/deployment with backup and rollback steps.

## Known limitations

- The shared-world WebSocket zone is implemented on the feature branch, but it is not deployed or staging-tested yet. Player presence is ephemeral across zone restarts; player saves persist in D1. There is no server-run encounter RNG or server-authoritative battle engine.
- Browser combat still determines outcomes client-side. A modified client can cheat, so do not treat captured creatures, levels, or combat results as trusted competitive state yet.
- The cloud-save API persists a bounded party and progress counters, but it is not a complete inventory/economy/trading system.
- If two tabs edit the same save, the version check rejects the stale write. The UI warns the player instead of merging automatically.
- The public Pokémon IP and third-party asset rights question remains unresolved. This branch uses original placeholder creature concepts only; no ROMs or Pokémon assets are bundled.

## Next engineering milestone

Build the smallest isolated real-time zone service with server-authoritative movement and presence, then move encounters and battle outcomes server-side. Use a staging environment and load tests before connecting a live public player population.
