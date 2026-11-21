# Knightfall's Three New Public Section Hubs

Updated 2026-11-20. Source of truth for the Celestial Sanctum, Serrated Signal and Chaos Collective navigation.

## Structure

| Section | Canonical page | Existing tools reused | Artwork / identity |
| --- | --- | --- | --- |
| **Celestial Sanctum** | `public/celestial-sanctum.html` | `moonology.html` and lunar journal; `shadow-work.html` and private journal; `profile-edit.html#birth-chart-studio` | Saved `assets/knightfall/realm-moon.svg` and scoped Celestial CSS |
| **Serrated Signal / Music** | `public/music.html` | Public music-category bots in `bots.html?category=Music`; Madhouse discussions; member profile links; Creator's Foundry | Original record and waveform visual composed in `realm-hubs.css` |
| **Chaos Collective / Chatbots** | `public/chatbots.html` | `bots.html` public directory; `personal-bots.html` private builder; `miss-chaos.html`; Creator's Foundry | Saved `assets/knightfall/realm-messages.svg` |

These are actual, distinct pages that share the single `nav.js` menu and canonical `theme.css`. Homepage provides three launch cards. Do not create parallel bot directories, alternate Moon Journals or a second Creator Foundry.

The new `public/realm-hubs.css` owns only `.kf-hub-page` components and consumes the approved `--kf-realm-*` palette tokens. **It introduces no `!important` declarations.** `nav.js` recognizes the new realm identities for navigation and does not mark their custom heroes with the historical `data-kf-art-hero` overlay selector. This avoids importing old forced artwork rules onto newly built content. The existing five Theme Forge publication scopes remain unchanged: site, Madhouse, Arcade, Chaosphere and Admin. These three hubs currently inherit the shared published palette and have their own scoped section motifs. Adding independently publishable Theme Forge slots would require a separately reviewed backend/settings migration, and has not been done here.

## Working features vs future expansion

The Celestial Sanctum connects existing Moonology (all eight phases), a Moon Journal, optional private-default natal charts, and Shadow Work. Numerology, mythological study, tarot/divination reference material and transit lessons are **planned, not yet tools**. Astrological interpretations are presented as symbolic traditions, not science or medical guidance.

Serrated Signal includes an original **tap-tempo and Web Audio metronome** at `public/music-rhythm-lab.js`. It never autoplays, opens no media stream or microphone, uses no third-party audio sample, and pauses when its tab is hidden. Music uploads, streaming, band profiles, release pages and collaboration discovery are planned and should require ownership/licensing, moderation and appropriate member permissions before launch.

Chaos Collective is a hub, not a new chatbot provider. It routes users into the existing role-controlled bot creation and public directories, preserving Miss Chaos and the private GOD/Isis permissions. The Music category deep link filters the existing bots without duplicating its database. It never publishes private bot contents.

## Test and maintenance contract

1. Run `node --test scripts/realm-hubs.test.mjs` before changing the three hubs, their links, their CSS or the original rhythm lab. It checks real links, zero duplicate destinations, accessibility headings, PWA offline shell entries, the scoped cascade and simulated no-autoplay metronome behavior.
2. Run `node scripts/site-link-integrity.mjs` and `node scripts/pages-release-guard.mjs` before production. The latter includes the new hub suite and cannot be bypassed.
3. Run browser smoke tests across 390px, 900px and desktop widths through the Theme Crew CI workflow. The real site's existing member/auth requirements remain in force.
4. If changing shared appearance, edit the owning CSS module rather than adding more forced legacy declarations. The original historic monolith still contains older `!important` declarations. It has been split by concern but **not completely removed**.
5. Preserve original illustrations, CSS-composed artwork and the creator system. The Creations Vault now protects all new hub page sources, their shared CSS and the original rhythm tool in addition to existing artwork and Creator's Foundry sources.

**Deploy rule:** GitHub main commits and configured checks do not prove a Cloudflare Pages deployment is live. Check the actual successful deployment commit before announcing changes as published.
