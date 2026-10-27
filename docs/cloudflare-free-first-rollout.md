# Cloudflare free-first implementation gates (2026-10-26)

This document distinguishes deployed code from proposed integrations. Do not advertise planned features as live.

## Completed in this change set
- Routine Worker deployment no longer applies D1 schema migrations. Production schema changes require the separately dispatched, explicitly confirmed migration workflow.
- Nightly GitHub Actions regression run covers existing static, notification, account-deletion, astrology, PWA, and arcade browser tests against a local frontend.
- A read-only security-surface inventory enumerates dynamic HTML sinks and sensitive route references for manual follow-up. The inventory is not a vulnerability scanner or authorization proof.

## Turnstile: pending
1. Create a Turnstile widget for ash-fall.com and www.ash-fall.com. Store the secret as a Worker secret; publish only the site key.
2. Add a server-side Siteverify helper that POSTs token, secret, and optionally remote IP to Cloudflare, fails closed on missing/invalid tokens, and treats tokens as single-use.
3. Enforce on unauthenticated registration, password reset, and login after risk-based rate limits; ensure API-only clients cannot bypass verification. Add browser token refresh and error states.
4. Staging-test valid, expired, replayed, missing, and tampered tokens before production enforcement. Avoid enabling until both UI and API are ready.

## Queues: pending
- Route non-critical push fanout and thumbnail/metadata jobs through a bounded queue with idempotency keys, retry limits, dead-letter handling, and a consumer.
- Keep notification database writes synchronous. If queue binding is absent or the free quota is exhausted, preserve in-app notifications; do not silently discard jobs.
- Do not move sensitive or private payloads into queue messages without a retention/privacy review.

## Durable Objects: pending
- Start with presence and ephemeral typing state, not canonical message storage. Keep D1 as the source of truth for messages and permissions.
- Authenticate every websocket handshake and revalidate room membership before subscription; expire presence and cap per-user connections.
- Multiplayer rooms require game-specific deterministic state and abuse limits. Benchmark free-tier limits before enabling.

## God Mode usage dashboard: pending
- Display Cloudflare account request, D1, KV, R2, Queues, and AI consumption using authenticated, server-side API requests with a narrowly scoped read-only token.
- Never expose Cloudflare API credentials in the frontend. Show data timestamp, unavailable/unknown status, and usage thresholds; do not invent zeros.
- Avoid polling Cloudflare APIs on every page load. Cache short-lived summaries and require administrator authorization.

## AI Gateway: pending
- Review Miss Chaos provider routes, streaming, model compatibility, and privacy policy first.
- Gateway can add observability and caching, but provider inference may still be billed. Disable caching for personalized/private chat content unless specifically safe.

## R2 lifecycle: pending
- Inventory exact prefixes and bucket usage before changing lifecycle rules. Only expire verified temporary uploads after ownership, retention, and takedown requirements are checked.
- Never apply a blanket expiry to creator purchases, personal vaults, profile media, or message attachments.

## Staging authorization tests: pending
- Provision isolated D1, KV, and R2 resources and test accounts; never bind staging to production resources.
- Exercise anonymous/member/moderator/admin/God roles, cross-user reads and writes, media access, report/block boundaries, and CSRF/Origin controls.
- Fail tests on unexpected access; clean up test data deterministically.

## Rollback checklist
- Record the deployed Worker SHA and current D1 migration list before production releases.
- D1 migrations are not automatically reversible. Review forward-fix or restore strategy and verify backup availability before destructive changes.
- Roll back application code independently; do not automatically revert schema or delete user data.
- Verify health, login, messaging, and private-media authorization after any rollback.

## Security review
- The HTML sink inventory produces review candidates, not XSS findings. Inspect each sink's data provenance and escaping before changing it.
- Continue explicit server-side authorization for every sensitive route; hiding controls in the UI does not provide security.
- For adult creator content, age assurance, user consent, reporting, provider terms, and private R2 delivery remain hard release gates.
