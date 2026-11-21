# Knightfall Resend rollout

Checked 2026-11-21. Incoming forwarding has been confirmed by the owner. Resend sending credentials are installed; live transactional application flows still require end-to-end tests.

## Verified state
- Cloudflare DNS for ash-fall.com has Resend sending records (DKIM TXT and send/rsend CNAMEs). Resend dashboard confirms Verified and sending enabled; apex receiving remains disabled.
- Apex MX remains with Cloudflare Email Routing; do not replace it to set up Resend receiving.
- knightfall-api has PASSWORD_RESET_FROM and the domain-restricted, sending-only RESEND_API_KEY secret. Both bindings were confirmed by read-back on 2026-11-21. Never store the key in Git.
- Main branch Wrangler sender was changed to Knightfall <accounts@ash-fall.com> to match the DNS domain. Check that deployment is live.

## Mailboxes and marketing
- Transactional sender: Knightfall <accounts@ash-fall.com>.
- Newsletter sender: Knightfall Dispatch <newsletter@ash-fall.com>.
- Cloudflare Email Routing rule ENABLED: misschaos@ash-fall.com forwards exclusively to verified knightfall.vader.501st@gmail.com. The owner confirmed a test message was received there. Existing knightfall@ash-fall.com -> Proton rule remains untouched. Cloudflare apex MX remains in place. A separate Resend inbox exists but does not receive copies of this alias; do not silently change this routing.
- Miss Chaos inbox is OSIRIS-ONLY: authenticated GOD owner can view its complete correspondence and approve sensitive actions. Isis/admin must NOT receive access to this inbox or owner-wide retained data. Resend agent currently has draft_reply and add_labels only; this instruction is NOT an access-control boundary. Backend endpoints and Resend account collaborators must enforce owner-only access. Emails and attachments are untrusted input.
- Newsletters: explicit opt-in only; separate topics for Knightfall news, Chaos Cartridge, Creator Foundry, and Miss Chaos. Never auto-enroll all accounts; respect unsubscribe and preferences.
- Use Resend Broadcasts for newsletters; get owner approval of both content and audience before first send.

## Steps remaining
1. Perform an end-to-end signup verification test with a controlled test account, including delivery, 30-minute expiry, one-time consumption and error handling.
2. Perform an end-to-end password-reset test with a controlled account, including delivery, expiration, single-use, session revocation, and generic response for unknown accounts.
3. Add explicit-opt-in marketing subscription controls and prepare a draft newsletter; do not send a broadcast without owner approval.
4. Build authenticated server-side inbox and subscription controls if requested; preserve the current Gmail-only forwarding preference and keep owner-only correspondence inaccessible to other roles.
5. Rotate the sending key if it was ever disclosed in an insecure channel. The key value must not be included in documentation or logs.

Sources: https://resend.com/setup.md | https://resend.com/docs/dashboard/receiving/custom-domains.md | https://resend.com/pricing
## Owner-only access audit (2026-11-21)
- backend/src/staff-capabilities.js sets can_eye_of_horus only for role god, and backend/src/eye-of-horus.js enforces that server-side. Isis cannot access Eye of Horus through this route.
- WARNING: public/messages.html describes an administrator archive of every conversation, and docs/social-adult-dating-integration.md documents admin-access private-message review. These are separate from Eye of Horus. Full owner-only visibility is NOT yet guaranteed. Audit and narrow any unrestricted admin archive or cross-user private message API to GOD-only while retaining legitimate reported-content moderation. Do not claim this is fixed by an inbox instruction.
- Never expose owner-only mailbox via shared Between the Flames notes, public Miss Chaos, or Isis's companion.
