# Knightfall Profile Studio 2
Updated: 2026-11-03

## What changed

This release reworks the existing authenticated `/profile-edit.html` editor and enhances existing profile APIs. It does not replace user profiles or erase previously saved data.

### Editing experience
- Responsive Gravewave neon profile editor with live preview, visible progress meter, six navigable areas, active section cues, keyboard accessibility, and reduced-motion support.
- Appearance fields, configurable theme/accent, interests, privacy, photo wall, layout ordering, and optional birth-chart section remain.
- Profile visibility guide responds to public, friends-only, and private selections. Recent forum activity visibility is previewed separately.
- A sticky Save/Discard command bar shows saved, unsaved, saving, or failed state. The Layout section also has a Save profile + layout shortcut.
- `Ctrl/Cmd + S` saves changes without leaving the editor. Navigation prompts when unsaved profile/layout work remains.
- No profile draft is written to browser localStorage. Pressing Discard restores last saved fields and last published layout.
- The main save now persists profile details and any pending layout changes together, rather than redirecting the user after saving just profile details. The two existing API calls are sequential, not a database transaction: if the layout call fails, the editor clearly reports that profile details saved and layout still needs retrying.
- Explicit birth-chart visibility and deletion remain separate, since they have dedicated privacy controls and API behavior.

### Image editing
- Existing avatar and cover upload controls have real pixel cropping, rather than only CSS preview transforms.
- Avatar is cropped to 320x320 and cover to 1600x900 before JPEG compression, with center/top/bottom/left/right focus options.
- File types restricted to PNG/JPEG/WebP and 8MB client-side. The server still validates uploads.
- Versioned processing avoids stale asynchronous results replacing newer manual image selections.
- An in-flight crop temporarily disables saving, and old object URLs are revoked when replaced.
- Direct URL image entry remains supported, subject to existing API security rules.

### Photo wall
- New integrated gallery manager loads photos from `GET /api/profile/photos?username=<owner>`.
- Signed-in owners can add a photo with a caption using `POST /api/profile/photos`, select a gallery photo as a cover (requiring Save profile to publish), and delete photos using `DELETE /api/profile/photos/:id`.
- Supports JPG/PNG/GIF/WebP, limit 8MB/photo and existing server-side maximum of 60 gallery photos.
- Gallery upload and deletion take effect immediately; the editor explains this separately from unpublished profile field changes.
- Member profile visibility still controls gallery access; the UI does not circumvent server-owned checks.
- Backend cleanup now clears a user's published `cover_url` if the matching gallery photo is deleted, preventing broken cover images.

## Relevant files

- `public/profile-edit.html` (existing editor, updated)
- `public/profile-studio-next.css` and `public/profile-studio-next.js` (new)
- `public/profile-photo-studio.js` (new)
- `public/profile.html` (current shared nav version)
- `backend/src/index.js` (gallery cover cleanup)
- `scripts/profile-studio-next.test.mjs`
- `scripts/profile-photo-studio.test.mjs`
- `scripts/profile-studio-browser.mjs`
- `.github/workflows/smoke-test.yml` and `.github/workflows/deploy-api.yml`

## Validation performed

Code and HTML were checked for valid JavaScript and duplicate element IDs. Nine targeted static/unit checks for the new editor and gallery passed in an isolated JavaScript test harness. The pixel-crop helper was also exercised on portrait source geometry for actual top, center, bottom crops. Existing profile and birth-chart test expectations were checked for compatibility.

GitHub Actions now has desktop and Android-sized Playwright scenarios for editing, Save profile + layout, Discard, cover/avatar image uploads, photo wall upload/cover assignment/deletion, keyboard save, and horizontal overflow.

**No signed-in production account was modified for testing.** Actual browser smoke and production deployment status must be checked in CI/Cloudflare; the above source-level checks are not a guarantee of live behavior. No schema migration is required.

## Manual release checklist

1. Open `/profile-edit.html` on Android and desktop, sign in, verify loaded preview and current field values.
2. Select themes, edit bio and privacy, choose a layout preset, use Save profile and verify changes on `/profile.html?username=...`.
3. Reload with unsaved edits, ensure browser warns; press Discard, verify last published values and layout return.
4. Test avatar and cover pixel crops, including focus mode changes, and verify both upload to the existing profile media store.
5. Upload a Gallery photo, set it as cover, publish, then delete that photo. Confirm the published cover is cleared.
6. Confirm `Private` and `Friends only` profile visibility is enforced for external/blocked viewers.
7. Test gallery file format/size errors, backend quotas, upload retry and signed-out editor behavior.
8. Test birth-chart opt-in and deletion separately; confirm raw birth coordinates remain private.
9. Ensure no orange palette leaks into the profile editor or public profile.
