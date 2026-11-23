# Creator Foundry mobile acceptance gate

Status: NOT VERIFIED on a signed-in real device. Do not mark task #102 done from source-only inspection.

## Device and account matrix
- Android Chrome and installed PWA at 360px and 412px widths; desktop at 1280px.
- A real Digital Creator account, a normal member account, and GOD/Osiris owner account. Do not share credentials or test private creator access with the wrong role.
- Confirm access to Creator Foundry and production lab, Pixel Studio, Tilemap Forge, Atlas Packer and saved assets.
- Confirm member denial for protected creator operations and no privilege escalation by modifying client UI.
- Confirm touch draw stays inside the canvas, eyedropper does not create undo history, animation-frame changes reset stale undo, and tilemap touches do not paint outside grid.
- Confirm exported images/atlases can be downloaded and imported back without corruption.
- Confirm small-screen toolbars, dialogs, keyboard, upload controls and file pickers are reachable without horizontal overflow.
- Record device, account role, route, expected/actual, screenshot and failed request status for each test.

## Existing source regression coverage
- `scripts/creator-production-lab.test.mjs` and `scripts/creator-production-core.test.mjs` cover parts of the editor logic.
- A passing static test is not a substitute for signed-in browser interaction or permission-denial checks.
- Never mark READY FOR VERIFICATION until a device/browser session has actually executed the above flows.
