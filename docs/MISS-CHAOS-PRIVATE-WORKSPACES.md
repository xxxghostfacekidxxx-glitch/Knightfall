# Knightfall private Miss Chaos workspaces

Updated November 19, 2026. This documents the actual verified permissions, not aspirational autonomous-agent privileges.

## Supported workspaces
- **Standard Miss Chaos:** Available to every authenticated member. Existing per-user private conversations and memories, normal model tools.
- **Private Owner:** Only the signed-in **GOD owner** who is the recorded `invited_by` account of Between the Flames can select `companion=owner`. Open from the floating selector or `/miss-chaos.html?companion=owner`. Offers owner-specific guidance, read-only GOD diagnostics where enabled, plus links to Eye of Chaos and the shared handoff board. Browser-provided role flags cannot grant access.
- **Private Partner:** Only the signed-in account recorded as the **accepted** `ai_handoff_partner` can select `companion=partner`. Open from the floating selector or `/samantha-chaos.html`. Uses that member's own conversations/memories and can inspect authorized handoff information and the permitted owner-bot roster via verified read-only tools. She can add tasks and post notes through explicit signed-in form submissions on her private desk. Partner mode does **not** automatically elevate site roles. Samantha's live accepted partner account already holds `admin`; her session retains that role without inheriting GOD, owner conversations, billing, private prompts or secrets.

## Floating switch

`public/nav.js` loads `miss-chaos-presence.js` site-wide. The widget shows the **Private Workspace** selector only after `GET /api/chaos/modes` verifies which modes belong to the current signed-in account. Anonymous and ordinary accounts receive Standard only. A failed check hides private options.

Choosing a mode changes the conversation pointer and draft under distinct **account + mode** session-storage keys, updates the visual header, and provides a matching full-chat shortcut. Older messages are loaded only through the existing owner-scoped authenticated conversation endpoint. The server independently validates the mode again on every `POST /api/chaos/chat` request.

**Storage limitation:** Per-user conversations are still in the same account-bound D1 table. The floating widget uses distinct mode pointers/drafts, but the full conversation history is not yet split into permanent mode-specific database partitions. Private here means **private to the signed-in owner**, not hidden from Knightfall's existing audited administrative access policies. Introducing durable mode-specific history requires an additive, deployed migration with end-to-end access tests.

## Security invariants
- The companion role is never taken from query parameters, browser storage, a display name or an email address. It derives from the verified session ID, D1 invitation and existing GOD role.
- `/api/chaos/modes` and `/api/chaos/companion` send `Cache-Control: private, no-store`.
- The invited collaborator can use project coordination and individually approved bot access. When the same live account also holds `admin`, the server exposes existing admin controls plus versioned draft approval, audited reviewed theme publishing/rollback, and explicit manual curator-bot profile/post actions. The invitation alone never grants admin.
- Shared handoff edits happen only through authenticated explicit submission; chat replies never auto-publish notes/tasks or execute repository changes.
- Revoking the invitation removes the partner choice on the next mode refresh and blocks partner-mode chat immediately through the Worker, even if an old browser tab still shows the option.
- Server-side limits, per-user data ownership and NSFW/adult verification are not bypassed by a private-mode switch.
- **GOD-only reserves:** Eye of Horus, root ownership and protected-account changes, the master execution lock, and private account/security secrets. A delegated admin cannot transfer ownership. Other administrators are not automatically given Samantha's additional privileges.
- **Publishing conditions:** The approved partner can approve recorded content drafts but cannot auto-publish them; she may publish individually reviewed allowlisted theme presets with revision guards, and make explicit manual curator bot posts. The Worker checks login, accepted invitation, admin role, origin, and request limits; the affected actions are logged.

## How to verify
1. Sign in as GOD owner; floating selector shows Standard and Private Owner, full-chat link opens `/miss-chaos.html?companion=owner`. Eye of Chaos link appears only in owner mode.
2. Sign in as **accepted admin partner**; selector shows Standard and Private Partner, which opens `/samantha-chaos.html`. The private desk exposes Admin Dashboard, Eye of Chaos, Theme Crew, Creator Foundry and manually controlled bot profiles, backed by live server authorization. A non-admin accepted partner receives no admin escalation.
3. Sign in as any unrelated member; no private choices appear. Sending `companion:owner` or `companion:partner` directly must return HTTP 403.
4. Revoke the partner invitation; a browser refresh removes Private Partner, and any stale private chat request is denied.
5. Switch modes with unfinished drafts, sign out and sign in to a second account; confirm no cross-mode or cross-account draft/conversation pointer leaks.

Run `node --test backend/chaos-companion.test.mjs` from an environment with backend dependencies installed, plus `node --test scripts/samantha-chaos-ui.test.mjs scripts/miss-chaos-private-switch.test.mjs`. The main CI workflows perform those checks.

## Future work
- Durable mode-bound conversation history with a guarded D1 migration and verified membership checks
- Stronger partner-specific creation tools behind explicit approval and versioned action logs
- Real mobile browser device checks for switching, resizing, voice and offline behavior
