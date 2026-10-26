# Ash-Fall Social, Adult Creator, and Dating Integration Plan

## Architecture
Ash-Fall remains a Cloudflare Pages frontend backed by its existing Cloudflare Worker, D1, R2, and session system. Elgg is an architectural reference, not a PHP application to install inside a Worker. The new D1 migration `0024_social_adult_dating.sql` creates the first data foundation for activity streams, interest groups, bookmarks, adult creator posts and subscriptions, dating profiles/matches, and safety reports.

## Build sequence
1. Apply migration 0024 to the production D1 database and validate every table/index before deploying routes.
2. Add authenticated, paginated activity endpoints with per-item visibility checks and follow/block filtering.
3. Add group CRUD, join/approval/invite workflows, group roles, and moderation.
4. Add a provider-backed 18+ verification flow. Store only verification status and provider reference; do not store ID photos. Access is denied by default and must be rechecked on every adult endpoint.
5. Add R2 media upload with short-lived signed/authorized delivery, explicit user ownership/consent attestations, takedown/reporting, and deletion workflows.
6. Add creator memberships and one-off unlocks only after a supported payment provider is selected. Entitlements must be granted by verified server-side webhooks, never by client-submitted payment status. Handle refunds, chargebacks, cancellations, taxes, payout/KYC requirements, and provider rules.
7. Add dating discovery and mutual-match endpoints. Require verified adult access for every profile in this section; use coarse location labels only, never publish precise location; block/report controls and opt-out must be present from launch.
8. Build front-end routes, tests, audit logs, abuse controls, and moderation dashboard.

## Administrator review controls
The protected Worker endpoint `GET /api/admin/social-review` supports activity records, creator post metadata, dating profiles, and private messages. It requires an authenticated administrator/God role and writes audit entries for each review request. Message review supports a bounded text/username query and optional conversation ID. The God Mode dashboard exposes a restricted Social Review panel and loads it only when selected. The existing message archive endpoints remain separately protected by the administrator check.

This review interface displays stored text and record metadata; it is not a media-delivery bypass. Creator media remains unavailable until private object storage, authorization-checked delivery, consent/takedown workflows, and provider approvals are implemented. Review access must be used for legitimate safety, support, moderation, security, or legal purposes, consistent with the public User Agreement.

## Non-negotiable safety and privacy requirements
- All participants must be adults. No minors, age-ambiguous users, or sexual content involving minors.
- A checkbox or date-of-birth field is not sufficient for access to explicit media. Use a reputable age-assurance provider that supports the intended jurisdictions, retain minimal proof, and implement expiry/revocation.
- Adult content must be opt-in, hidden from public feeds/search by default, and segregated from general community feeds and previews.
- Explicit media must be private in R2 and served only after authorization checks. Never expose raw R2 keys or public object URLs for paid media.
- Users must control who can view, save, message, or purchase their content; include consent, block, report, takedown, and appeal flows. No non-consensual intimate imagery, impersonation, coercion, or content of uncertain age/consent.
- Payment providers, app stores, hosting providers, and local laws may restrict adult services. Confirm provider approval before implementing checkout or accepting uploads.
- This migration is schema groundwork only. It does not yet enable adult access, upload explicit media, process payments, or make dating operational.
