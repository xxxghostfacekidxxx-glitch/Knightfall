# Ruinwire: standalone Knightfall messaging
Ruinwire is the branded, separately installable **web app** for existing Knightfall messaging. It intentionally reuses the same origin, sign-in cookie, message API, group chats, Web Push service worker, chat bubbles and message storage rather than duplicating private data.

- Install page: `/ruinwire.html`
- App launcher: `/messages.html?app=ruinwire`
- Manifest ID: `/ruinwire` (different from Knightfall PWA `/`)
- PWA manifest: `/ruinwire.webmanifest`
- Existing shared service worker: `/sw.js` (does **not** cache private messages, account APIs or authenticated pages)
- Phone install: supported Chrome-family browsers can offer native PWA install; Safari uses Add to Home Screen. The in-page prompt is browser-controlled.
- Android debug build: `.github/workflows/ruinwire-android.yml` compiles `com.ashfall.ruinwire` and uploads a short-lived signed-for-debug test artifact, NOT a public release.
- A release APK still requires owner-controlled permanent signing, verified Digital Asset Links, push and navigation acceptance tests on physical hardware, and a documented publishing step. Never advertise debug APKs as verified production downloads.
- Future app splits: each app gets its own PWA manifest `id` and launcher URL but continues to share backend identity and API ownership, subject to scoping and security tests.

## Checks
Confirm `/ruinwire.webmanifest` and `/ruinwire.html` serve HTTP 200 on production and the manifest has its own ID. Check login and conversation opening from the app launcher, multiple back-to-back sends, history pagination, notification click and inline reply on a physical Android device. Installed PWAs and TWAs can share credentials but actual browser profiles and device settings may affect authentication. Verify rather than assume.

## Privacy
Ruinwire is not end-to-end encrypted and does not claim to be. Messages remain subject to existing Knightfall account, moderation, reporting and retention policies.
