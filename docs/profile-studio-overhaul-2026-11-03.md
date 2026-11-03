# Knightfall Profile Studio 2.0: Theme Library, Photo Wall, Link Hub

**Implementation:** November 3, 2026. All changes committed to the canonical `main` branch; no pull requests or side branches.

## Member-facing improvements

### Editor
- `/profile-edit.html`: responsive neon Profile Studio with seven sections: appearance, interests, Link Hub, privacy, photos, layout, and optional birth chart.
- Persistent save/discard status, private-by-default editing before publication, completion meter, clear privacy explanations, scrollable section navigation, and improved keyboard focus.
- The main **Save profile** action keeps the member in the editor, saves pending layout edits, and also submits any changed Link Hub links.
- Unsaved changes (including layout or links) trigger a leave-page warning. An in-progress save or crop also guards against accidental navigation.
- **Discard** restores published details, layouts, and Link Hub. Unpublished text is not stored in localStorage.
- Main editor is noninteractive until the current member's profile has loaded. This prevents replacing user edits with late session data.
- Standalone Save buttons in the Link Hub and Layout sections support phones and tablets.

### Photos
- Real square-avatar and wide-cover crop before compression/upload, with five framing positions.
- Owner-managed photo wall: upload, remove, select a gallery image as the cover, and edit a caption without uploading the image again.
- Published cover references are cleared by the server if the corresponding gallery image is deleted.
- Existing gallery limits, authentication, R2 storage, and content-type validation remain in force.

### Themes
- Nine profile appearances: Ember, Midnight, Toxic, Bubblegum, Monochrome, **Gravewave**, **Blood Moon**, **Spectral**, and **The Void**.
- Theme differences go beyond text color: backgrounds, card surfaces, borders, highlights, cover treatment, and preview mood.
- Member-provided accent colors remain supported; all new theme identifiers are validated by the API.
- Shared stylesheet: `public/profile-theme-library.css`, used on both editor preview and published profiles.

### Custom Link Hub
- Up to eight ordered, explicitly published HTTPS links per account.
- Presets for Art Portfolio, Music, Shop, Writing, and Social, plus freeform labels and addresses.
- Drag-free up/down order controls, delete controls, account-backed save/discard, and mobile-specific Save button.
- Public display uses prominent thematic cards linked with `rel="noopener noreferrer nofollow"`, domain previews, and safe DOM text, not interpolated HTML.
- Reads enforce profile visibility (public, accepted friends, private), account blocks, and role permissions on the backend.
- Writes are owner-only, rate-limited, validation-first, and stored atomically with D1 `batch()`.

## API and storage

- `GET /api/profile/links`: signed-in member's own links.
- `GET /api/profile/links?username=...`: privacy-checked profile links.
- `PUT /api/profile/links`: authenticated explicit replacement of all owner's links.
- `backend/migrations/0112_profile_links.sql`: `member_profile_links` with `user_id`, ordered `position`, `label`, `url`, `updated_at`.
- The production D1 migration was applied and both table/index and migration-ledger entry were read-verified on Nov 3, 2026.

## Files

Core UI: `public/profile-edit.html`, `public/profile-studio-next.js`, `public/profile-studio-next.css`, `public/profile-photo-studio.js`, `public/profile-theme-library.css`, `public/profile-links-editor.js`, `public/profile-links-view.js`, `public/profile-links.css`, `public/profile.js`, and `public/profile.html`.

Backend: `backend/src/profile-links.js`, `backend/src/index.js`, migration `0112_profile_links.sql`.

## Tests and rollout checks

- `node --test scripts/profile-navigation.test.mjs scripts/profile-studio-next.test.mjs scripts/profile-photo-studio.test.mjs scripts/profile-link-hub.test.mjs backend/src/profile-links.test.mjs`.
- `node scripts/profile-studio-browser.mjs` runs Playwright desktop + 390px Android viewport: load, change theme, profile + layout save, unsaved discard, cropped avatar/cover uploads, gallery upload/caption/cover/delete, Link Hub validation/order/save/discard, and viewport overflow.
- API deploy workflow runs backend and profile tests; runtime smoke workflow runs JS syntax and browser flows.
- Static source and isolated unit evaluations were run in this conversation. **CI outcomes and full live Android/browser acceptance have not been independently verified as passing** at the time of this report. Cloudflare Pages deployments can queue or skip intermediate commits; check the latest production deployment before accepting a feature as live.

### Manual acceptance checklist

1. Sign in and confirm existing profile details, colors, avatar, cover, section layout and birth chart are unchanged before editing.
2. Select each of the four new themes, check both live preview and public profile after saving, including custom accent override.
3. Crop avatar and cover at top/left/right and confirm the actual uploaded image matches the selected framing.
4. Add a gallery photo, change its caption, assign it as cover, then delete it. Confirm no broken cover remains.
5. Add a valid HTTPS link and a second link, reorder, save, reload, then discard a later unpublished change.
6. Test blocked accounts, friends-only profiles, private profiles, unauthorized GET and PUT requests, and links with unsafe schemes.
7. On Android and PC, ensure sticky Save bars, section navigation, footer links, fields, Miss Chaos dock and back navigation remain accessible.
