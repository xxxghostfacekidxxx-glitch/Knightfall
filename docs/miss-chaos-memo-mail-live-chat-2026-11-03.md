# Miss Chaos Memo Pad, Memo Mail and Live Chat

Implemented November 3, 2026 in the Knightfall/Ash-Fall repository.

## Three distinct experiences

1. **My Notes**: account-owned editable drafts, maximum 100 notes, each title up to 100 characters and body up to 4,000. Saved automatically to the authenticated member's D1 records. Nobody is notified when a private note is created or edited.
2. **Memo Mail**: separate inbox and sent folder with read/unread state, individual archiving (never deletes the other party's copy), and explicit delivery of a **saved** private memo. The sender's note is not transferred or deleted. Each delivery stores an immutable title and body snapshot. Delivery checks recipient status, self-send, account blocks and rate limits. The recipient receives a standard Knightfall notification linked to `/memo-pad.html?tab=inbox`. Private memos are not inserted into the ordinary messages table.
3. **Live Chat**: two-way member DM conversations using the existing `/api/messages/conversations` endpoints and block/moderation protections. The UI searches active members through `/api/discover`, offers chat selection, text messaging, and polls for updates about every 5 seconds while its tab is visible. **This is polling rather than WebSocket real-time delivery**, so there may be a few seconds of latency. No group chats are created from the Memo Pad.

## User-facing routes

- `/memo-pad.html` default My Notes
- `/memo-pad.html?tab=inbox` separate Memo Mail, received and sent folders
- `/memo-pad.html?tab=chat` direct Live Chat
- `/messages.html` remains the site's full-featured traditional messaging inbox.

Miss Chaos's floating panel now has its own memo icon. Opening it loads the Memo Pad, Memo Mail and Live Chat without leaving the page. The compact dock can move among four corners, minimize to a restore tab, and auto-select an area that interferes less with visible page controls. It hides during fullscreen activities.

## Backend and data

- `backend/src/member-memos.js` handles private memo CRUD with owner-scoped queries.
- `backend/src/member-memo-mail.js` handles GET inbox/sent, POST delivery from an account-owned saved memo, POST read acknowledgement, and owner-scoped DELETE archive.
- `backend/migrations/0110_member_memos.sql` and `0111_member_memo_mail.sql` contain the schema. Both were applied to production D1 using the authorized Cloudflare API, and their tables/indexes and migration-ledger entries were read-verified on November 3, 2026. Do not replay blindly.
- `backend/src/index.js` dispatches these authenticated endpoints and uses its existing notification helper for memo deliveries.

## Safety and usability

- Client code displays all member-authored text via DOM `textContent`, never as interpreted HTML.
- Saving or autosaving a memo cannot send it. Sending needs an explicit member selection and click.
- Sent mail and direct messages are different backend storage systems.
- Offline draft editing is not advertised: the authoritative memo storage lives in D1 and requires authentication and network access.
- The dock's auto-position is a best-effort overlap avoidance algorithm, not a guarantee against every third-party overlay. It remains manually movable and minimizable.

## Tests and deployment checks

- `backend/src/member-memos.test.mjs` verifies owner-scoped note CRUD.
- `backend/src/member-memo-mail.test.mjs` covers authentication, both folders, owner-only delivery, self/blocked recipients, notifications, read, and archive.
- `scripts/miss-chaos-memo.test.mjs` protects the separation, script loading and floating dock behavior.
- `scripts/miss-chaos-memo-browser.mjs` runs desktop and 390-pixel Android-size Playwright scenarios with mock API responses for private save, mail delivery, separate chat sending, popup sync and dock controls.
- The tests are wired into the smoke-test workflow; API deploy also runs the backend/unit/static checks.

Production deployment depends on GitHub Actions successfully deploying Pages and the API Worker. **The production D1 schema is verified, but the updated frontend and API runtime have not been independently verified on live desktop/Android browsers in this session.**

## Manual production acceptance

1. Sign in; create a note, reload, and confirm private persistence.
2. Select a different active member, send the memo, verify it enters Sent and is delivered to the recipient's Memo Mail inbox without appearing in Live Chat.
3. Open/read/archive a received memo; the other user's copy must stay intact.
4. From an incoming memo, choose Chat with sender; verify direct messages appear in the Chat tab and the site's normal messaging inbox.
5. Open the bubble on PC and Android; move among corners, minimize, restore, open memo tabs and check that bottom navigation, support/footer links and dialogs remain accessible.
6. Confirm blocked users and logged-out visitors cannot access memo data or send notes.
7. Confirm automatic chat refresh works while visible and pauses while hidden.
