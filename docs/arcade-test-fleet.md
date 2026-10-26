# Arcade Test Fleet: operating notes

The ten named bots are GitHub Actions matrix jobs, **not autonomous AI agents**. They share the browser smoke suite, and run gameplay replays at five viewport sizes. They run on arcade pushes and PRs, every six hours, and via manual workflow dispatch.

## What is automated
- Audit hosted game routes, missing assets, browser exceptions and failed requests.
- Reproduce a small set of gameplay scenarios (Particle Clicker, Freeciv Web, Kaiju Krush, Custom Tetris); record action traces and screenshots when they fail.
- Audit and correct narrowly defined invalid `public/` asset URLs when the corrected file exists.
- Recognize one previously diagnosed Kaiju hitbox code signature.
- On scheduled/manual runs, propose repairs in a PR **only after** unit tests, syntax checks and mobile gameplay replay pass. No automatic merging or deployment.

## Review procedure
1. Open [Arcade Test Bot Fleet](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions/workflows/arcade-test-fleet.yml) and inspect the latest completed run.
2. For failed jobs, download `arcade-test-results-*` artifacts; inspect `arcade-gameplay-replay.log`, `arcade-replays/`, `arcade-browser-evidence/`, and the asset audit.
3. Reproduce locally before treating a live-site failure as a code defect; deployment lag and network outages can also fail tests.
4. Review the bot's PR diff and CI checks. Never auto-merge a repair touching gameplay logic, account state, authentication, credits, payments, or security.

## Known limits
- Successful workflow execution has to be verified in GitHub Actions; commits alone are not proof.
- Browser smoke coverage does not guarantee every game is playable or every account integration works.
- Repair patterns are intentionally narrow; unexpected defects become evidence and tickets, not guessed fixes.
- The bot PR creation step needs repository Actions permissions that allow creating pull requests; if disabled, the workflow can test but cannot open repair PRs.
- The fleet's live-site checks run against whatever version is deployed, which may lag behind `main`.
