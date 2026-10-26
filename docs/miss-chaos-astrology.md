# Miss Chaos astrology calculations

Miss Chaos has an Astrology mood with a birth-chart calculator and a current-transits button.

## Using it

1. Sign in and open `/miss-chaos.html`, then select **Astrology**.
2. Enter the birth date and **local clock time**, plus the **historical UTC offset at birth** (including daylight saving time). For example, UTC−4 is `-4`, UTC+5:30 is `5.5`.
3. Select **Calculate placements**. The site converts the local clock time to UTC and calls `POST /api/chaos/astrology/chart`. The response prepares a draft for interpretation; the user reviews it before sending.
4. Select **Calculate today's transits** for current planetary positions. If a natal chart has been calculated in the current page session, the API compares transiting planets with natal positions. Otherwise it shows current positions and aspects.

## Calculation method and limits

`backend/src/astrology.js` computes **approximate** geocentric ecliptic longitudes from low-precision orbital elements (Paul Schlyter's published algorithms). The tropical zodiac is divided into twelve 30-degree signs. Major aspects use a 4-degree orb for single charts and 2 degrees for natal-transit comparisons. Retrograde is estimated by comparing the positions one day before and after the target date.

This is **not a high-precision Swiss Ephemeris or JPL ephemeris**. It currently includes the Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus and Neptune. It does not compute Pluto, lunar nodes, Ascendant, houses, topocentric positions, precession-sensitive sidereal placements, or exact electional timing. Calculations support 1900–2100 UTC, and the Moon and outer-planet approximations may deviate materially from professional chart software. The user's birth city is not used; it will be needed for future Ascendant and house calculations.

The API requires an authenticated session, is rate limited, and does not persist chart data. Chat messages prepared from results are saved in the user's normal Miss Chaos conversation if sent. Users should avoid sharing birth data they do not want stored in conversation history.

## Engineering checks

Run `node --test scripts/astrology.test.mjs` and `node scripts/static-audit.mjs`. The backend deployment workflow runs the astrology tests and triggers for changes anywhere under `backend/src/`. Live deployment still depends on configured Cloudflare credentials and passing GitHub Actions.

## Location-based Ascendant and houses

The calculator now accepts optional birth latitude and longitude (north/east positive, south/west negative). When both are supplied, it calculates an **approximate Ascendant** from local sidereal time and mean obliquity, then uses twelve **equal houses** spaced 30 degrees from the Ascendant. It does **not** calculate Placidus or whole-sign houses, and limits latitude to -66 through +66 degrees. The city and historical UTC offset must be determined by the user; the calculator does not perform geocoding or timezone lookup.

This remains a **low-precision** planetary ephemeris. Pluto and lunar nodes are absent, and exact birth-time rectification, professional-grade ephemerides and sidereal charts are not implemented. Location input is not separately persisted by the calculator; if the user sends the prepared interpretation prompt, the chart information enters their normal chat history.

## Additional celestial points and house systems

The chart now includes **Pluto** from a low-precision heliocentric series, and **mean North and South lunar nodes**. The nodes are approximate and are not the oscillating/true nodes. It also calculates an approximate **Midheaven** from local sidereal time. With coordinates, the user may choose **equal houses** or **whole-sign houses**; Placidus remains unsupported. These approximations must not be represented as professional-grade ephemeris data, especially close to sign or house cusps.

## Accuracy and deployment gate

Do not label these calculations Swiss Ephemeris or JPL precision. Before promoting them as production-verified, confirm `node --test scripts/astrology.test.mjs`, the static audit, the backend deployment workflow, and an authenticated browser check of the chart and transit controls. Existing CI status is not proof of a successful live deployment until a run completes successfully.
