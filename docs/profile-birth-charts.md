# Optional birth charts on member profiles

## Member experience

1. Open **Edit profile** (`/profile-edit.html`) and scroll to **Birth chart**.
2. Enter birth date, local time, and the correct historical UTC offset. Search for the birth city (city, region, country), then select the correct result. Coordinates are resolved automatically via OpenStreetMap Nominatim and are used only for chart calculation. Choose equal or whole-sign houses.
3. **Display my birth chart on my profile** is unchecked by default. Calculate and save with it off to keep the chart hidden.
4. Turn the visibility switch on to publish the existing chart, or off to hide it immediately. **Delete saved chart** removes the stored profile chart.
5. When published, `/profile.html?username=...` displays a themed Cosmic Blueprint with Sun, Moon, rising sign and expandable placements.

## Data minimization and access control

`profile_birth_charts` is a separate table with `visible=0` by default. The owner-only `GET/PUT/DELETE /api/profile/birth-chart` endpoints require authentication and enforce the user ID in SQL. The public `/api/users/:username` response includes the chart only if `visible=1` **and** the viewer is authorized to see the profile under its existing public/friends/private setting. The public card never exposes the birth timestamp, UTC offset, or coordinates.

Only derived chart placements, Ascendant/Midheaven sign and degrees, and house numbers are persisted. Birth date and coordinates are processed in the request but are not separately persisted in this feature. Sending chart details in a Miss Chaos chat may persist them in that conversation.

## Deployment and verification

Migration: `backend/migrations/0058_profile_birth_charts.sql`. The table and index were also created directly on the production Knightfall D1 database through Cloudflare on October 26, 2026; both operations returned success. The idempotent migration remains in Git for future environments. On October 30, 2026, the production table and visibility index were compared with this migration, and the missing `d1_migrations` record was reconciled with `INSERT OR IGNORE`. The ledger now records `0058_profile_birth_charts.sql`.

Regression tests: `node --test scripts/profile-birth-chart.test.mjs` (included in smoke-test workflow), plus the astrology tests. A successful Worker deployment, static Pages publish, and signed-in browser verification are **not** implied by committing the files or applying the D1 schema.

City lookup requires an internet connection and sends the entered city query to OpenStreetMap Nominatim only when **Find birth city** is pressed. The city search does not send the birth date or time. Users must still enter the correct UTC offset at the time of birth, including historical daylight saving rules; selecting a city does not automatically resolve historical time zones. City lookup may be temporarily unavailable or return ambiguous matches.

## Isolated lifecycle regression coverage (October 30, 2026)
`node --test scripts/profile-birth-chart-runtime.test.mjs` exercises the production Worker route with isolated test storage: calculate/save hidden, publish, hide, delete; reject anonymous/invalid sessions and cross-origin mutation; ignore supplied user IDs and preserve other owners' charts; reject malformed inputs. All four scenarios passed locally. This is handler-level testing, not signed-in production/browser certification.

The independent **Profile Birth Chart Verification** workflow runs these tests with the astronomy suite, then performs read-only production checks for the public profile assets, JSON authentication and chart endpoints, anonymous chart denial, category existence and adult gating. It creates no production chart records and needs no member credentials.


## Cosmic Blueprint upgrade (November 11, 2026)

Profile Studio and published member profiles render an accessible responsive zodiac wheel and aspect summaries from the saved *derived* chart data. Miss Chaos can load the owner's saved chart (including charts hidden from the public) for an unsent interpretation draft. A click from either profile view can transfer the derived chart into that same browser session; no raw birth timestamp or coordinates are transferred.

A birth-place IANA timezone (such as America/Chicago) can resolve historical UTC offset and handle DST gaps and overlaps. A city selection supplies coordinates but does not infer the historical time zone. The member must select/verify that separately; manual UTC offset is retained for difficult historical cases.

A second member's chart is used in compatibility only when the standard permission-checked public profile response already includes a published chart. See docs/miss-chaos-astrology.md for accuracy boundaries and test instructions.

New regression coverage: scripts/cosmic-chart.test.mjs in dedicated birth-chart and runtime smoke workflows.

## Cosmic Atlas, dated transits and unknown birth times (November 11, 2026)

The shared visual chart renderer is now accompanied by `public/cosmic-insights.js`, a client-side Chart Atlas which derives an approximate lunar phase from the measured Sun–Moon longitude difference, identifies the traditional chart ruler (with modern co-ruler where traditions use one), counts classical-element/modality distributions and planetary sign clusters, and explains the calculated house and aspect relationships on a keyboard-accessible planet selector. The wheel highlights the selected planet and associated aspect lines. These descriptions are explicitly symbolic, not a psychological assessment or forecast.

Miss Chaos also has an optional transit **date** selector. A chosen date uses 12:00 UTC; leaving the field blank uses the current moment. The interface shows the selected tropical sky positions as a separate transit wheel and compares them with a locally calculated natal chart or a saved derived profile chart. A return-to-natal control restores the previous natal wheel. The transit chart is not a substitute for natal houses or a birth chart.

### Unknown birth time

Profile Studio and Miss Chaos both accept **I don't know my birth time**. The user enters their birth *date*, not a fabricated clock time. Calculations use 12:00 UTC as a provisional representative instant. The profile API accepts `time_unknown: true` only with a noon-UTC timestamp; it does not require location and does **not** compute or store Rising, Midheaven, or house placements. Stored derived data marks `time_precision: "unknown"`. Published and private chart access controls remain unchanged. No raw date/timestamp or exact birthplace is persisted in the profile chart. Astrological Moon and sign-cusp positions can differ at the actual time of birth; warnings on the chart and in Miss Chaos's interpretation draft explain this limitation.

When a user supplies a birth time, the existing location-aware calculation remains unchanged. This feature deliberately does not imply that a noon-UTC chart is an exact natal chart.

### Tests and release checks

- `scripts/cosmic-chart.test.mjs`: integration and client-side chart correctness.
- `scripts/cosmic-atlas.test.mjs`: classical rulers, lunar phase, symbolic summaries, chart focus and provisional-chart warnings.
- `scripts/profile-birth-chart-runtime.test.mjs`: real Worker handler with isolated test storage, including unknown-time save/publish/hide/delete and input validation.
- `scripts/cosmic-atlas-browser.mjs`: Chromium at 320px, 390px and desktop widths; focuses planet and restores wheel; checks transit and unknown-time layout.
- `.github/workflows/profile-birth-chart-checks.yml` and `.github/workflows/smoke-test.yml` run the corresponding tests. Static and test success must be distinguished from successful Cloudflare Worker and Pages deployment, and from authenticated production UI verification.

No new D1 migration or paid astrology API has been introduced for the Atlas or unknown-time controls.
