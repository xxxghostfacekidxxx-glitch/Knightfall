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
