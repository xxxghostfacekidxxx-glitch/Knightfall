# Knightfall Originals: first public bot collection

Date: 2026-11-03

## What changed

The public directory at `/bots.html` now contains twelve official, general-audience AI characters even when no member has published a personal bot. These are **virtual, read-only catalog entries**, not impersonated member accounts. They use the existing public AI chat endpoint and therefore require the configured Cloudflare AI binding to reply. They consume **no** personal-bot slots, create **no** member accounts, and do **not** write conversation history into the foreign-key-constrained personal-bot table.

## The first 12

| Bot | Specialty | What it does |
|---|---|---|
| Night Shift | Community | Guides newcomers through Knightfall |
| Ink Spark | Art & Design | Tattoo, art, mascot and visual design brainstorming |
| Cinder Scribe | Writing | Fiction, dialogue, characters and story development |
| Riff Forge | Music | Original songs, structures, hooks and stage concepts |
| Bug Hunter | Coding | Code review, debugging, testing and app-building guidance |
| Dice Crypt | Gaming | Text adventures, tabletop quests and game-mastering |
| Study Specter | Learning | Tutoring, examples, explanations and quizzes |
| Curiosity Cabinet | Research | History, philosophy, science and myth discussions |
| Pixel Sidekick | Gaming | Game design, level mechanics and strategy |
| Fix-It Fiend | DIY & Tech | Household project checklists and maintenance diagnostics |
| Idea Furnace | Business & Ideas | Branding, project planning and practical brainstorming |
| The Sounding Board | Everyday | Everyday decisions, organization and reflective prompts |

Every entry provides an individual persona, a description, its category, a visual symbol and three suggested prompts.

## Endpoints and integration

- `GET /api/public-bots` now returns official starter summaries **plus** existing community-published personal bots.
- `GET /api/public-bots?q=...` searches official names/categories/descriptions and member titles/descriptions.
- `GET /api/public-bots/:id` returns public metadata. Official bot details include suggested prompts but never private system guidance.
- `POST /api/public-bots/:id/chat` runs the existing Cloudflare AI model, standard rate limiting, user-message validation, and model-safety instructions.
- For official bots, conversations are transient: the browser retains temporary history for context, while the backend avoids inserting fake bot IDs into `personal_bot_chat_messages`. Member bot history remains unchanged.
- `public/bots.html` now offers category filters, search, labels distinguishing official versus community-created bots, and responsive cards.
- `public/bot.html` shows a specialty label and buttons that populate the chat input with starter prompts.
- All official starters are SFW. Community NSFW bot restrictions and existing age verification remain intact.

## Test coverage

- `node --test backend/src/starter-public-bots.test.mjs scripts/public-bot-starters.test.mjs`
- `node scripts/starter-bots-browser.mjs` tests directory browse, filters, search, community coexistence, conversation-starter buttons, chat POST transport and layout on desktop and a 390px mobile viewport.
- Worker deploy workflow checks the official catalog contract before deployment; runtime workflow checks live API listing and details without using inference credits.
- Source checks were exercised during development, but production success and real Cloudflare AI conversational quality require separate live smoke verification.

## Production checks

1. Open `https://ash-fall.com/bots.html` and confirm all 12 Knightfall Originals appear alongside any community-published bots.
2. Search for `coding`; verify Bug Hunter appears. Click Music to see Riff Forge, and Community-built to see member bots.
3. Open Night Shift and use a conversation starter. The starter should fill the message field; Send should produce a genuine AI response when Cloudflare AI is available.
4. Verify owners still see their private bots only in the personal workshop and official starters do not reduce available slots.
5. Try an NSFW community bot with an unverified account to confirm the existing adult gate is still enforced.

## Potential next stage

More curated personalities, member ratings, individual bot avatars, featured creators, optional favorites, and more structured categories can be added without changing the official bot IDs. The starter collection is intentionally useful and broad rather than pretending artificially generated accounts are real community members.
