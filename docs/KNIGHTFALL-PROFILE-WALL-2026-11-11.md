# Knightfall Profiles: social wall and saved updates

Implemented on `main`, November 11, 2026.

## Member experience

- Context-aware profile header, shortcuts, profile-selected themes and a readable About card.
- Public member wall displays status updates already stored in `social_activity`. Owners can publish, edit and soft-delete their own updates, choose Everyone/Followers/Only me and page through older updates.
- Signed-in readers can react with Fire, Love or Skull. Changing a reaction replaces their earlier one.
- Replies attach to an exact status update. Members can delete their own replies, profile owners can moderate replies on their own walls, and staff moderators can delete replies server-side.
- Signed-in visitors can report an update through an inline form. Reports flow into the existing `/api/social/report` and `safety_reports` staff queue, subject to its established abuse limits.
- Signed-in members can save a visible update and revisit the private `#profile-saved` collection on their own profile. Saved posts are re-checked for current permissions: private profiles, withdrawn follows, blockers, deletions and removed content are not bypassed by bookmarks.
- Saved posts are stored in the existing `social_bookmarks` schema (from migration 0033). No additional migration is needed for bookmarks.
- User-generated content is rendered as text, not as HTML. Comments use an explicit 1,000 character maximum and status updates a 5,000 character maximum.

## Server components

- `backend/src/profile-wall.js`: `GET /api/profile-wall?username=…&before=…`, `GET /api/profile-wall/saved`, `PATCH/DELETE /api/profile-wall/posts/:id`, `POST/DELETE /api/profile-wall/posts/:id/reactions`, `GET/POST /api/profile-wall/posts/:id/comments`, `DELETE /api/profile-wall/comments/:id`, `POST/DELETE /api/profile-wall/posts/:id/bookmark`.
- `backend/src/index.js`: routes the wall into the existing authenticated Worker and fixes the legacy public activity stream so private/friends-only profiles do not leak through the feed.
- `backend/migrations/0126_profile_wall_interactions.sql`: additive `profile_wall_comments`, `profile_wall_reactions`, FK constraints and indexes.

## Production schema release

- D1 `knightfall-forum` migration `0126` applied November 11, 2026. Verified the Time Travel bookmark was available before applying.
- Verified two tables, three indexes, foreign keys and recorded ledger ID 71 with filename `0126_profile_wall_interactions.sql`.
- Did not modify existing posts, profiles, or saved data.
- **Do not run migration 0126 again.**

## QA and release gates

- `node --test backend/src/profile-wall.test.mjs scripts/profile-wall-ui.test.mjs`
- `node --test scripts/profile-community-overhaul.test.mjs`
- `node scripts/profile-community-browser.mjs` with local static server + Playwright installed; covers desktop and 390px Android, owner/visitor walls, reactions, publishing, replying, saved shelf, profile themes and overflow.
- `.github/workflows/smoke-test.yml` includes both source and browser checks.
- `.github/workflows/deploy-api.yml` gates the Worker deploy on wall security and JS syntax checks.
- Source test harness and read-only production D1 SELECT validation passed during implementation. **Real browser CI results and cross-account live acceptance require separate confirmation**; tests committed to CI are not proof the jobs have passed.

## Real-user acceptance checklist

1. Sign into account A; publish a public status; verify account B sees and can comment, react, bookmark and report it.
2. Edit the status from A; confirm B sees the updated text and audience.
3. Change the status to Followers and remove the follow relationship; ensure B can no longer read it through direct API access or its saved shelf.
4. Make A's profile friends-only and private in turn; ensure B without an accepted friendship receives the correct restriction.
5. Block B; verify B cannot use the wall or comments API to interact with A.
6. Test deleting a status; verify its reactions/comments become inaccessible and its bookmarks are cleaned.
7. Test Android portrait mode, soft keyboard, report form, saved shelf, profile navigation and theme preservation.
