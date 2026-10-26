# Optional birth charts on member profiles

## Member experience

1. Open **Edit profile** (`/profile-edit.html`) and scroll to **Birth chart**.
2. Enter birth date, local time, the correct historical UTC offset, and latitude/longitude. Choose equal or whole-sign houses.
3. **Display my birth chart on my profile** is unchecked by default. Calculate and save with it off to keep the chart hidden.
4. Turn the visibility switch on to publish the existing chart, or off to hide it immediately. **Delete saved chart** removes the stored profile chart.
5. When published, `/profile.html?username=...` displays a themed Cosmic Blueprint with Sun, Moon, rising sign and expandable placements.

## Data minimization and access control

`profile_birth_charts` is a separate table with `visible=0` by default. The owner-only `GET/PUT/DELETE /api/profile/birth-chart` endpoints require authentication and enforce the user ID in SQL. The public `/api/users/:username` response includes the chart only if `visible=1` **and** the viewer is authorized to see the profile under its existing public/friends/private setting. The public card never exposes the birth timestamp, UTC offset, or coordinates.

Only derived chart placements, Ascendant/Midheaven sign and degrees, and house numbers are persisted. Birth date and coordinates are processed in the request but are not separately persisted in this feature. Sending chart details in a Miss Chaos chat may persist them in that conversation.

## Deployment and verification

Migration: `backend/migrations/0058_profile_birth_charts.sql`. The table and index were also created directly on the production Knightfall D1 database through Cloudflare on October 26, 2026; both operations returned success. The idempotent migration remains in Git for future environments. The normal migration runner still needs to record it as applied.

Regression tests: `node --test scripts/profile-birth-chart.test.mjs` (included in smoke-test workflow), plus the astrology tests. A successful Worker deployment, static Pages publish, and signed-in browser verification are **not** implied by committing the files or applying the D1 schema.
