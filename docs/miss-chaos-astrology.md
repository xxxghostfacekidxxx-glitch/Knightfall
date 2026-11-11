# Miss Chaos astrology: Cosmic Blueprint

## Current features (November 2026)

Miss Chaos has a calculated natal-chart experience, an SVG zodiac wheel, major aspects, house display, the Sun/Moon/Rising trio, elements/modalities, current transits, and chart-to-chart comparison against another member's permissioned published chart. Member profiles and Profile Studio share the same responsive chart visualizer. Members can load their own private saved profile chart into Miss Chaos without supplying the original birth details again. No reading is automatically sent: the user reviews the drafted interpretation before sending.

Birth-place search uses Nominatim to select coordinates; it sends a city query but not the birth date/time. An optional IANA time-zone field uses browser Intl time-zone history to determine the UTC offset at the birth date. The manual offset field remains for verified fallback. DST gaps are rejected, and overlapping fall-back hours can use the first or second occurrence. Choosing a city does not automatically identify its historical time zone: the member must choose the appropriate zone. Historical data can be incomplete or include sub-minute offsets.

## Astronomical basis and honest limits

Backend astronomy uses the MIT-licensed Astronomy Engine 2.1.19 for geocentric Sun, Moon, and Mercury-through-Pluto tropical longitudes. Planetary retrogrades use a day-to-day longitude estimate. Mean lunar nodes, Ascendant and Midheaven angles remain approximate. Equal and whole-sign houses are supported, NOT Placidus. Birth coordinates are required for houses, with supported latitudes -66° to +66°. The supported UTC birth date range is 1900–2100. It is not a Swiss Ephemeris implementation.

The profile visualizer has five major aspect types; its visual convention uses a 6-degree orb when Sun or Moon is involved and a 4-degree orb for other bodies. The backend natal result uses a 4-degree orb; natal transit matching uses 2 degrees.

Astrology here is a symbolic tradition for reflection and entertainment, not a scientifically established predictor of traits, health, fate, or compatibility. Miss Chaos should describe themes and options, not invent uncalculated placements or deterministic outcomes.

## Privacy and access

Saved profile charts are hidden by default, can be published/hidden/deleted by their owner, and save derived chart data rather than raw birth timestamp or coordinates. The permission-aware public user API decides whether another member's chart may be accessed. The synastry feature does not bypass that rule. The one-time cross-page chart transfer uses browser session storage for derived placements, is consumed once, and does not post to chat automatically. A user who sends the reading stores its text in their normal Miss Chaos conversation.

## Verification

- Node tests: scripts/astrology.test.mjs, scripts/profile-birth-chart.test.mjs, scripts/profile-birth-chart-runtime.test.mjs, scripts/cosmic-chart.test.mjs.
- Static syntax and audit: public/cosmic-chart.js, public/cosmic-timezone.js, public/profile.js, public/miss-chaos.js, and scripts/static-audit.mjs.
- Required manual checks: Android and desktop layout; normal/ambiguous/invalid historical time; city selection; profile-public/friends/private visibility; published member comparison; personal chart loading; current transit drafts.

GitHub commits and Pages deployments are not proof of authenticated browser verification. Verify live workflows and real signed-in sessions separately.

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

## Cosmic Blueprint phase 3: local birthplace zones and dual-ring transits (2026-11-11)

**Locally hosted time-zone suggestions:** The city picker still requests geographical matches from OpenStreetMap Nominatim, but a downloaded copy of PhotoStructure's `@photostructure/tz-lookup` v11.8.0 is now served from `public/vendor/tz-lookup.js` under **CC0-1.0** (source: https://github.com/photostructure/tz-lookup). The helper `public/cosmic-place-timezone.js` suggests an IANA time zone from the selected coordinates without an extra network request. Existing manual time-zone entry wins over any suggestion. A displayed warning explains that compressed boundary data and historical zone changes can make the suggestion wrong, especially near boundaries. Members should verify historical zones and clock times; Nominatim receives only their city search query, not their date or time of birth. This does not rely on Open-Meteo's non-commercial free API.

**Planetary overlay:** Miss Chaos now supports three live visual modes after calculating transits: combined natal/transit chart, transiting planets only, and natal wheel only. A combined chart uses natal ascendant/houses as its orientation, a mint secondary ring for planetary transits, and an explicit list of computed transit-to-natal aspects (2° orb). The chart text identifies both sets and does not invent natal houses on a transiting-only view. The separate natal and transit charts remain calculated using the existing astronomy engine and generated from derived placements.

**House-angle accuracy improvement:** `backend/src/astrology.js` now derives the true obliquity of the ecliptic from Astronomy Engine's `Rotation_EQD_ECT` and `RotateVector`, matching the true ecliptic-of-date coordinate frame and apparent sidereal time already used elsewhere. The returned angle object includes `true_obliquity_degrees` as a diagnostic. This is not a Placidus implementation: equal and whole-sign houses only. Location precision, time-zone history, birth-time uncertainty, refraction and topocentric effects remain limitations.

**Verification:** `scripts/cosmic-geo-timezone.test.mjs` covers offline zone estimates, invalid coordinates, and protecting manually typed zones. `scripts/cosmic-atlas.test.mjs` covers both planetary rings and aspects; `scripts/cosmic-atlas-browser.mjs` checks the dual wheel at 320px, 390px and desktop widths. These suites are included in the birth-chart and runtime smoke workflows. Treat passing tests and deployed assets as separate confirmations.
