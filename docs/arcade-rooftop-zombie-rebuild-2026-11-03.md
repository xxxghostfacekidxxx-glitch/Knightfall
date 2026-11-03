# Chaos Cartridge — Rooftop Riot & Not Dead Yet rebuild
Date: 2026-11-03

## Scope
Both original Knightfall games are modified in place, preserving existing arcade routes:
- Rooftop Riot: `/arcade/hosted/rooftop-riot/index.html`
- Not Dead Yet, Asshole!: `/not-dead-yet.html`

### Rooftop Riot 2.0
The previous single-file prototype has been replaced with a modular canvas game:
- `engine.js`: seeded 46-rooftop / four-district level generator, independently testable platform physics, landing and extraction detection, jump input buffer, coyote grace, air dash, falls and checkpoints, drones, timed steam vents, pickups, progress and scoring.
- `view.js`: interactive rendering, parallax city layers, spark effects, original local sprite art, high-score persistence, 2D touch and keyboard input, pause, sound toggle, fullscreen/fallback, responsive HUD and the existing `ashfall:arcade-started` / `ashfall:arcade-finished` events.
- `style.css`: redesigned pink/lime/cyan Gravewave arcade cabinet, touch targets and fullscreen handling.
- Retains the arcade account bridge score selector `#shards`, which now displays a numeric overall score.
- Checkpoints restore one vitality and provide temporary damage protection. Three falls or depletion of health end a run.
- Critical extraction bug fixed: beacon activates when *walking* onto the exit area, not only when landing there.
- Geometry validation covers 180 individual jumps across four deterministic worlds with hazards disabled during reachability testing. Hazards remain active during actual play.

### Not Dead Yet, Asshole! 1.0
The existing four-stage mission campaign and account/local progression have been retained and updated:
- Melee attack on E and mobile touch, shared dead-enemy reward handling and a short cooldown.
- Actual explosive-barrel area damage and chain-blast feedback; melee and explosions use existing Scrap, score, achievement and kill tracking.
- Jump buffer and coyote time for forgiving platforms; dash physics now use the selected survivor's movement modifier.
- Selectable threat levels: Streetwise, Outbreak and Nightmare. They change HP, zombie HP, spawn pacing and score values, and are recorded as arcade score metadata.
- Gamepad twin-stick combat: left-stick move, right-stick aim, right trigger shoot, A jump, B dash, X reload, Y melee, LB weapon swap, Start pause.
- New in-game vitality/ammo/dash/melee bars and mission objective ribbon.
- The formerly cluttered Scrap Yard, Weapon Bench, account save and achievements are now organized in accessible collapsible panels.
- New `not-dead-yet-overhaul.css` takes precedence over legacy styling while preserving fullscreen canvas logic and mouse/touch controls.
- Existing progress keys, account endpoints and campaign checkpoint format are not migrated or deliberately invalidated.

## Source QA performed
- JavaScript parsed for both Rooftop modules and Not Dead Yet's inline engine.
- No duplicate HTML IDs in either game.
- Rooftop deterministic map generation and 180 cross-gap normal jumps exercised in a pure-engine simulation.
- Rooftop start, jump, dash, landing, checkpoint, extraction and fall-limit behavior exercised.
- Not Dead Yet loaded into a mocked browser DOM and correctly started Nightmare mode at reduced player HP, initialized its UI, and triggered melee cooldown.
- Existing sprite-integration regression updated to inspect modular Rooftop renderer rather than requiring inline rendering code.
- `scripts/arcade-rooftop-colossus.test.mjs`, `scripts/arcade-road-zombie-rebuild.test.mjs`, `scripts/not-dead-yet-runtime.test.mjs`, and `scripts/arcade-rooftop-zombie-browser.mjs` integrated into GitHub workflows.

## Deployment and acceptance
These are GitHub source commits. Cloudflare Pages production deployment and an actual Android or PC play session have **not been independently verified** in this session. The full Playwright browser smoke suite is configured in GitHub Actions but its latest run status needs verification.

Manual checks after deployment:
1. Rooftop desktop: run, jump, dash, land, collect crystals, trigger checkpoint, pause/resume and reach extraction.
2. Rooftop phone: hold direction while tapping jump and dash; ensure fullscreen/portrait and landscape do not clip touch controls or overflow.
3. Rooftop retry: three falls end the run; restart from overlay; local best and account leaderboard score integrate.
4. Not Dead Yet desktop: select each survivor and threat level, test all three guns, auto-reload, melee, dash, boss encounter and explosive barrel AoE.
5. Not Dead Yet phone: simultaneous hold-to-move and hold-to-fire, jump, melee, reload, gun swap, fullscreen.
6. Resume existing campaign checkpoints; verify local Scrap/unlocks and logged-in save/load still work.
7. Confirm mission-ending events and score submissions on the actual deployed origin.

## Notes
No new database schema, paid assets, or external third-party game engine was introduced. Gameplay code, styling and browser tests remain first-party. Do not describe either game as production-verified or fully bug-free until browser/phone checks succeed.
