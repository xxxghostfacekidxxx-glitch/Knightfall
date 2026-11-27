# Identity QA — The Black Key Syndicate
Null Saint tests server capability rules; Vesper Vile tests mobile/desktop HTML/CSS with simulated identities; Deadbolt.exe checks production login, read-only endpoints and logout for dedicated accounts. Eye of Chaos reports each job separately.

## Owner-controlled provisioning
Create three dedicated accounts via the normal verified registration flow using operator-controlled email addresses. Suggested usernames: `qa_nullsaint`, `qa_vespervile`, and `qa_deadbolt` (proposals only). Assign member, moderator and admin respectively in Admin Dashboard. Never use Osiris, Isis, personal accounts or service bots. Use independent random passwords and save usernames/passwords directly in repository Actions secrets (Settings > Secrets and variables > Actions): KNIGHTFALL_MEMBER_USERNAME/PASSWORD, KNIGHTFALL_MODERATOR_USERNAME/PASSWORD, KNIGHTFALL_ADMIN_USERNAME/PASSWORD. Never commit them or send them to chat. No workflow auto-creates elevated accounts.

Run Identity QA manually on main after Pages and Worker deploy. Live checks also run weekly; pushes run fixture tests only. Missing credentials fail the live job. Skipped live checks are not verification. The older ownership audit writes production fixtures and needs separate review before enabling. Full royal and creator login tests belong in isolated staging, not real owner sessions.

No new external account or secret is created by installing this code. No D1 migration needed.
