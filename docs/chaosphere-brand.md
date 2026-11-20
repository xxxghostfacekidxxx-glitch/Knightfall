# CHAOSPHERE · Knightfall Messenger
## Approved product name
Chaosphere. Tagline: **Enter the chaos. Find your kind.**

## Mascot brief
An original tiny scarlet demon, enormous mismatched eyes, crooked cream horns,
one ridiculous toothy grin, stubby paws, permanently malfunctioning brain.
Hyperactive and adorable, with dark cartoon humor and fractured-glitch energy.
GIR/JTHM/BMTH are *tonal references*, not character assets to copy.

## Behavior
- The mascot lives in the Chaosphere install icon, inbox hero and floating launcher.
- It reacts to newly increased unread counts after a baseline, plus open, send, sent,
  failed-send and invite actions. Existing unread counts never trigger new-message reactions.
- The captions are fixed quips; user content never goes into mascot text.
- A per-account quiet-demon toggle disables reactions and persists locally.
- Motion stops on reduced-motion settings. No sounds or overlay in arcade gameplay.
- Chat and live-message events use existing Knightfall D1 messaging, WebSocket and push.
- It never blocks game controls, never plays sound without a user action and never automatically sends messages or game invitations.
- Planned: illustrated expression variants, optional sound effects, costume unlocks and seasonal expressions. Not yet implemented.

## Compatibility
- `/messages.html` and D1 remain the authoritative inbox. No conversation migration.
- `/chaosphere.html` is the canonical install route. `/ruinwire.html` redirects to it.
- `?app=chaosphere` is canonical. `?app=ruinwire` still works for existing clients.
- Installed PWA `id: "/ruinwire"` and Android package `com.ashfall.ruinwire` stay stable for upgrades.
- Legacy GitHub workflow/artifact identifiers may retain the original name.
- The app title and icon have changed, but **no production-signed Android APK is published**.

## Before independent public-store launch
Check U.S. and international trademarks, app-store naming conflicts and brand availability.
The name has not been legally cleared. The term is also in existing commercial use.

## November 20 messenger experience and accessibility pass

The canonical `/messages.html` has a scoped Chaosphere presentation layer in
`public/chaosphere-polish.css` and optional composer interactions in
`public/chaosphere-extras.js`. The old authenticated messaging route, D1
conversation data, message transport, live notifications, attachment permissions,
and per-conversation draft storage remain authoritative.

### Shipped features
- Readable wine/crimson and bronze conversation cards, incoming/outgoing bubble
  styles, avatar initials when a profile picture is missing or fails, refined
  desktop/chat composer controls, and distinct hover/selected/unread states.
- **Quote:** inserts a short, editable plain-text attribution into the existing
  draft. It is not an API-level threaded reply or a change to message records.
- **Emoji tray:** inserts at cursor position with the existing 4,000-character
  limit and draft storage. It never sends or uploads content.
- **Paste images:** intercepts PNG/JPEG/GIF/WebP clipboard files and forwards
  them through the existing authenticated attachment picker. As with manual
  attachment selection, preparing a file **can upload a private pending attachment
  immediately**, before the member chooses Send. Messages themselves still need
  the member's explicit Send action.
- **Photo preview:** existing message images open in an accessible in-page
  dialog with caption and original-file link; it only accepts URLs from the
  site or the known Knightfall API origin. Closing the dialog clears its
  inline image source.
- **Mobile viewport:** fullscreen chat uses the *measured sticky header*
  and the visual viewport, rather than the old 72-pixel estimate. The floating
  Miss Chaos dock moves up and keeps its launcher accessible while Send remains
  unobstructed.
- Photo and other message attachments are still controlled by the same private
  backend routes. No mirrored message data store or secondary inbox exists.
- Emoji and quote interactions respect the reduced-motion, keyboard focus,
  and disabled-composer constraints already present in messaging.

### Verification and limitations
- The Pages release guard runs `scripts/chaosphere-polish.test.mjs` and
  `scripts/chaosphere-viewport.test.mjs`, plus the existing messaging/theme
  integrity checks. A verified production build passed **12 Chaosphere tests**.
- Production-browser checks with **synthetic data** confirmed quote insertion,
  emoji selection, initials rendering, image preview open/close, and clipboard
  image dispatch into the existing attachment picker without a chat send.
- Unauthenticated browser tests do **not** demonstrate a successful end-to-end
  delivery between real members or permission handling of actual private
  attachments. Those require consent-based, signed-in testing.
- On group messages, fallback initials display unless the message payload
  contains a valid sender avatar URL. The feature does not guess other members'
  pictures or identities.
- The finishing CSS stays scoped to `.messages-shell`. Do not replace
  the responsive conversation grid, custom profile themes, or hosted arcade
  canvas styles with a new global rule.
