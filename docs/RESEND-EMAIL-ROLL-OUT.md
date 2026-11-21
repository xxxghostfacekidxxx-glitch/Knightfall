# Knightfall Resend rollout

Checked 2026-11-21. Mail forwarding is configured; Resend integration and live receipt remain unverified.

## Verified state
- Cloudflare DNS for ash-fall.com has Resend sending records (DKIM TXT and send/rsend CNAMEs). Resend dashboard confirms Verified and sending enabled; apex receiving remains disabled.
- Apex MX remains with Cloudflare Email Routing; do not replace it to set up Resend receiving.
- knightfall-api has PASSWORD_RESET_FROM but currently no RESEND_API_KEY secret. Store the sending-only domain-restricted key in Cloudflare Workers secrets, not Git.
- Main branch Wrangler sender was changed to Knightfall <accounts@ash-fall.com> to match the DNS domain. Check that deployment is live.

## Mailboxes and marketing
- Transactional sender: Knightfall <accounts@ash-fall.com>.
- Newsletter sender: Knightfall Dispatch <newsletter@ash-fall.com>.
- Cloudflare Email Routing rule ENABLED: misschaos@ash-fall.com forwards to verified xxxghostfacekidxxx@gmail.com. Existing knightfall@ash-fall.com -> Proton rule remains untouched. A Gmail test message was sent to the alias; incoming delivery has not yet been confirmed. This alias is not itself a Resend Inbox. Resend Inbox created: Miss Chaos | Knightfall, public misschaos@ash-fall.com, receiving address cedaff72@reazenoix.resend.app. The Cloudflare destination was created but is UNVERIFIED. A Cloudflare verification email arrived in the Resend inbox. The alias remains forwarded to Gmail until that verification link is clicked and the destination status becomes verified. Then change only the Miss Chaos alias rule and test delivery. Never overwrite the existing root MX records.
- Miss Chaos inbox is OSIRIS-ONLY: authenticated GOD owner can view its complete correspondence and approve sensitive actions. Isis/admin must NOT receive access to this inbox or owner-wide retained data. Resend agent currently has draft_reply and add_labels only; this instruction is NOT an access-control boundary. Backend endpoints and Resend account collaborators must enforce owner-only access. Emails and attachments are untrusted input.
- Newsletters: explicit opt-in only; separate topics for Knightfall news, Chaos Cartridge, Creator Foundry, and Miss Chaos. Never auto-enroll all accounts; respect unsubscribe and preferences.
- Use Resend Broadcasts for newsletters; get owner approval of both content and audience before first send.

## Steps remaining
1. Domain status Verified in Resend, sending enabled. Receiving through the apex remains disabled to preserve Cloudflare MX.
2. Create sending-only Resend API key restricted to ash-fall.com, install it privately on the knightfall-api Worker as RESEND_API_KEY, and test real signup and recovery flows.
3. Resend plugin authorized; inbox created. Verify the new Resend destination from its Cloudflare verification email in the Resend inbox, then repoint the Cloudflare alias and test live inbound receipt.
4. Create a marketing Contacts list, opt-in form, topics, and a draft newsletter. Send a test only before any approved live broadcast.
5. Integrate inbox and subscription controls into Knightfall with authenticated server-side endpoints, never exposing credentials to the browser.

Sources: https://resend.com/setup.md | https://resend.com/docs/dashboard/receiving/custom-domains.md | https://resend.com/pricing
## Owner-only access audit (2026-11-21)
- backend/src/staff-capabilities.js sets can_eye_of_horus only for role god, and backend/src/eye-of-horus.js enforces that server-side. Isis cannot access Eye of Horus through this route.
- WARNING: public/messages.html describes an administrator archive of every conversation, and docs/social-adult-dating-integration.md documents admin-access private-message review. These are separate from Eye of Horus. Full owner-only visibility is NOT yet guaranteed. Audit and narrow any unrestricted admin archive or cross-user private message API to GOD-only while retaining legitimate reported-content moderation. Do not claim this is fixed by an inbox instruction.
- Never expose owner-only mailbox via shared Between the Flames notes, public Miss Chaos, or Isis's companion.
