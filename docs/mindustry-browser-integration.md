# Mindustry browser integration gate

Status: research only. Do not advertise as playable.

## Existing state
Mindustry is listed as a GPL-3.0 Java game reference in toolkit/catalog.json. No web bundle has been validated for Knightfall.

## Requirements before shipping
1. Verify upstream license and third-party asset licenses at a pinned revision; preserve attribution and GPL source availability for distributed modifications.
2. Establish whether a maintained HTML5/GWT build can be produced from the pinned upstream release. Record build commands, Java/Gradle versions, bundle size and reproducibility.
3. Test the generated static assets locally and on a Cloudflare Pages preview: load, input, save data, audio, mobile performance, and browser console errors.
4. Keep any JVM multiplayer server outside Pages/Workers. Do not claim Cloudflare Workers can host the native server.
5. Add a playable arcade entry only after successful browser testing; until then retain the upstream-source reference in Open Source Arsenal.
6. Keep original Mindustry assets and identity distinct from any separately developed Ash-Fall factory-defense game.

## Deployment gate
No production route, external executable download, or game binary should be added until licensing and browser compatibility checks pass.
