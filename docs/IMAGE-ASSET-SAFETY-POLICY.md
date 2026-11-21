# Knightfall image protection and youth-safety policy

## Technical limits
Images displayed to a visitor are recoverable from network traffic, browser caches, or screenshots. No right-click blocker, CSS overlay, disabled drag action, or JavaScript can guarantee prevention. Do not claim otherwise.

## Shipping controls
- Keep unreleased, full-resolution, paid, or sensitive source images in private R2 buckets. Never publish originals in `public/`, public GitHub, or an unauthenticated `/public-assets/` URL.
- Serve only resized, flattened, metadata-stripped, optionally watermarked preview derivatives publicly. Generate derivatives server-side and preserve original source privately.
- For restricted originals, verify the signed-in user and server-side asset entitlement on **every** GET, not only the gallery page. Return `Cache-Control: private, no-store` and `Cross-Origin-Resource-Policy: same-site`. Use expiring signed delivery only when access has already been checked.
- Add `X-Robots-Tag: noindex, noimageindex` to asset delivery and discourage hotlinking. Search-engine compliance is voluntary and does not stop downloads.
- Reject public uploads pending moderation. Screen for sexual content involving minors, nudity, violence, private information, and prohibited imagery; provide reporting, rapid removal, and escalation paths. A no-save button does not make content safe for children.
- Separate age-appropriate public galleries from 18+ community areas with verified access controls and moderation. Do not rely on an age checkbox alone for high-risk content.
- Record ownership, license, upload consent, uploader ID, review status, and removal history. Do not sell images without appropriate commercial rights.
- Honor accessibility: do not globally disable context menus, keyboard interactions, or assistive technologies.

## Current implementation boundary
The published sprite API has same-site resource policy and image-indexing opt-out headers. Existing static public art and published images remain downloadable. The theme-entitlement database is a foundation, not a deployed paid-asset gate. Full private-original storage, moderation, and derivative generation remain to be implemented and verified.
