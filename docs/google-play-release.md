# Google Play release plan for Ash-Fall / Knightfall

Status: preparation only. No Google Play developer account is registered, and no Android release artifact has been built or signed.

## Product direction

Keep the existing Cloudflare Pages site and Worker API as the product backend. First validate the installable PWA on real Android devices, then package it as a Trusted Web Activity (TWA) if its web experience meets Play quality requirements. A TWA is not a substitute for quality: login, account management, messaging, notifications, games, back navigation, error states, and support/deletion flows must work reliably.

- Public origin: https://ash-fall.com
- API origin: https://api.ash-fall.com
- Web app manifest: `public/manifest.webmanifest`
- Service worker: `public/sw.js`
- Shared navigation/PWA registration: `public/nav.js`
- Public privacy policy draft: `https://ash-fall.com/privacy.html`

## Before building the Android package

- [ ] Validate the current production site and API on a physical Android phone at narrow widths and with Android back navigation.
- [ ] Fix any broken game launchers, sign-in redirects, OAuth callback flows, messages/history loading, and notification permission/delivery failures.
- [ ] Verify background Web Push on a real device while the browser/app is backgrounded and fully closed. The existence of a service-worker handler is not proof of delivery.
- [ ] Complete authenticated staging tests for ownership and authorization. Do not count skipped credential-dependent jobs as passing tests.
- [ ] Verify the manifest's installability, start URL, scope, icon appearance, and offline fallback. Do not cache private API responses or authenticated pages.
- [ ] Create proper 192x192 and 512x512 PNG launcher icons, a maskable icon, splash/launch artwork, and Play Store graphics. The current SVG is useful for the web app but is not a complete Play Store asset package.
- [ ] Decide and document the Android application ID/package name before generating signing material. Do not change it casually after release.
- [ ] Add Digital Asset Links at `/.well-known/assetlinks.json` after the Android signing certificate SHA-256 fingerprint is known. Never publish a guessed fingerprint.
- [ ] Build the TWA with a maintained Android toolchain and target Android 16 / API 36 or newer for releases made under the current 2026 Play requirement. Confirm the requirement again when submitting.
- [ ] Generate a signed Android App Bundle (.aab), protect the upload key, and verify the artifact in Play Console's internal testing track.

## Policy and account requirements (release blockers until verified)

- [ ] Replace/review the privacy policy draft at `public/privacy.html` against the actual live data flows, vendors, retention, contact details, and legal requirements. The draft intentionally calls out facts the operator must verify; do not submit it unchanged without that review.
- [x] Add authenticated deletion-request capture, password confirmation when available, username confirmation for social-login accounts, cancellation while a request is pending, and a public external request-instructions URL. This records a request only; actual deletion execution remains a release blocker until every associated data store is handled and verified.
- [ ] Publish a monitored privacy/support contact method and accurate account-deletion instructions. These are not yet evidenced by this repository audit.
- [ ] Complete Google Play Data safety, content rating, target audience, ads declaration, app access instructions, and any applicable age/content disclosures based on the actual shipped behavior.
- [ ] Review third-party game licenses, bundled assets, trademarks, and attribution before including them in the app.
- [ ] Check the current Google Play policy for user-generated content, moderation/report/block mechanisms, AI features, privacy, and age-restricted areas.

## Google Play account and testing

- [ ] Register a Google Play Console developer account and complete identity/device verification.
- [ ] Budget for the current US$25 one-time registration fee.
- [ ] If the account is a new personal developer account subject to the testing rule, recruit at least 12 testers who opt in and keep them enrolled for 14 consecutive days before applying for production access. Verify the rule shown in the actual Play Console account.
- [ ] Use internal testing first, then the required closed-testing track. Test sign-in, OAuth, account recovery, notification permission denial/grant, push tap navigation, offline behavior, rotation/resizing, accessibility, and app updates.

## Release acceptance criteria

Do not call the app Play-ready until all are true:

1. The signed .aab installs and launches on supported Android devices.
2. The TWA opens the verified Ash-Fall origin without browser chrome and handles links outside the verified scope safely.
3. Authentication and all key journeys work without console/runtime errors.
4. Background notifications are confirmed on physical hardware.
5. Account deletion and privacy/contact pages are live, accurate, and tested.
6. Automated static/runtime checks pass and authenticated checks are executed rather than skipped.
7. Store declarations, screenshots, icon assets, signing, and testing requirements are complete.

## Account deletion operations: mandatory before Play submission

- Requests are recorded in `account_deletion_requests` and exposed to admins at `/admin-deletion-requests.html`.
- The endpoint verifies the signed-in session and current password, rejects admin/God accounts for separate handling, rate-limits requests, and records an audit event.
- Admin queue statuses `pending` and `in_progress` are tracking states only. Never mark a request completed until the account and associated personal data have actually been deleted or anonymized under a documented retention policy.
- A production-grade deletion executor still needs an audited data inventory across D1, KV, R2, push subscriptions, AI conversation/memory records, sessions, messages/attachments, bot configurations, game progress/currency, shops, public content, and provider-side copies. It must have tests proving cross-account isolation and cleanup. The current queue is not a substitute for this executor.
- The public deletion page states the process and deadline, but a monitored privacy contact must be published before store submission.

## Known outstanding risks at the time this document was added

- Push notification issue #141 remains open until authenticated staging authorization tests and real background delivery are verified.
- Existing ownership/authorization CI workflows can skip their authenticated tests when dedicated credentials are missing; a green workflow with a skipped test is not an end-to-end pass.
- No Google Play developer account, Android package ID, signing certificate, assetlinks statement, signed AAB, store listing, or tester cohort has been established.
- Account deletion requests can now be recorded and reviewed, but automated or verified full data deletion is NOT implemented. The admin queue intentionally cannot mark a request completed. A monitored privacy contact is still missing and must be configured.
