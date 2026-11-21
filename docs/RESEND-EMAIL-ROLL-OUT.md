# Knightfall Resend rollout

Checked 2026-11-21. Mail forwarding is configured; Resend integration and live receipt remain unverified.

## Verified state
- Cloudflare DNS for ash-fall.com has Resend sending records (DKIM TXT and send/rsend CNAMEs). The Resend dashboard must still confirm Verified.
- Apex MX remains with Cloudflare Email Routing; do not replace it to set up Resend receiving.
- knightfall-api has PASSWORD_RESET_FROM but currently no RESEND_API_KEY secret. Store the sending-only domain-restricted key in Cloudflare Workers secrets, not Git.
- Main branch Wrangler sender was changed to Knightfall <accounts@ash-fall.com> to match the DNS domain. Check that deployment is live.

## Mailboxes and marketing
- Transactional sender: Knightfall <accounts@ash-fall.com>.
- Newsletter sender: Knightfall Dispatch <newsletter@ash-fall.com>.
- Cloudflare Email Routing rule ENABLED: misschaos@ash-fall.com forwards to verified xxxghostfacekidxxx@gmail.com. Existing knightfall@ash-fall.com -> Proton rule remains untouched. A Gmail test message was sent to the alias; incoming delivery has not yet been confirmed. This alias is not itself a Resend Inbox. Once a Resend Inbox is available, the alias can be rerouted to its supported receiving address after testing. Never overwrite the existing root MX records.
- Miss Chaos initial permissions: read, label, summarize, and draft; Osiris/Isis must approve sends, forwards, deletes, and privileged actions. Emails and attachments are untrusted input.
- Newsletters: explicit opt-in only; separate topics for Knightfall news, Chaos Cartridge, Creator Foundry, and Miss Chaos. Never auto-enroll all accounts; respect unsubscribe and preferences.
- Use Resend Broadcasts for newsletters; get owner approval of both content and audience before first send.

## Steps remaining
1. Confirm the domain status as Verified in Resend, including all DNS records displayed by that domain.
2. Create sending-only Resend API key restricted to ash-fall.com, install it privately on the knightfall-api Worker as RESEND_API_KEY, and test real signup and recovery flows.
3. Authorize the Resend plugin in ChatGPT (or another OAuth-capable MCP client) and create a Miss Chaos Inbox with its valid inbound address. Repoint the Cloudflare forwarding alias only after inbound receipt is tested.
4. Create a marketing Contacts list, opt-in form, topics, and a draft newsletter. Send a test only before any approved live broadcast.
5. Integrate inbox and subscription controls into Knightfall with authenticated server-side endpoints, never exposing credentials to the browser.

Sources: https://resend.com/setup.md | https://resend.com/docs/dashboard/receiving/custom-domains.md | https://resend.com/pricing