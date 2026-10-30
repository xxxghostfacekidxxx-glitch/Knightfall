# God Mode operations register

Status reflects repository evidence, not confirmed production availability. Review date: 2026-10-30.

## Tools present in repository
- Arcade catalog doctor and asset doctor
- Playwright browser gameplay tests and GitHub Actions
- Tiled and LDtk map JSON validator
- Cloudflare Pages and Workers architecture
- Arcade catalog and import scripts
- See docs/KNIGHTFALL-DEV-TOOLBOX.md

## Work in progress
- Phaser, Godot, Vite, Workbox and Colyseus integrations are candidates, not installed across the site.
- Mobile gameplay tests for Hell and High Orbit, Sanctuary editions and other arcade games.
- Offline admin app downloads and game packages.
- Google and Facebook authentication callbacks and account linking.
- Cloudflare usage reporting, Turnstile, Queues and Durable Objects.
- Creator identity verification, private media and payments.
- See docs/cloudflare-free-first-rollout.md and docs/social-adult-dating-integration.md

## Owner-only manual setup checklist
Google: Configure a Google Cloud OAuth project and consent screen. Create a Web OAuth client, then enter the precise authorized origin and callback URL after the backend callback route is implemented. Configure production publishing and test accounts.

Facebook: Create a Meta developer app with Facebook Login for Web. Set the website domain, privacy and deletion policy links, and exact authorized redirect URI after backend implementation. Configure developer testing and app review.

Cloudflare: Configure required Worker environment variables and secrets through Cloudflare settings, verify D1 migrations and bindings, Turnstile configuration, R2 storage, deployment routes, quotas and access permissions.

GitHub: Review workflow permissions, deployment settings, branch protection and CI runs.

Android: Verify PWA install, offline cache behavior, package signing and release requirements.

Payments and adult services: Select compliant verification and payment providers, configure their accounts and review policies before enabling services.

Never put real credential values in this document or frontend code. Confirm completion using provider dashboards and live testing.

## Shared reference maintenance policy
This register and the God Mode Development Operations panel are the shared working reference for the project owner and development assistant. On each relevant Knightfall task, consult them, record newly completed work and newly discovered blockers, and distinguish planned, implemented, tested, deployed and production-verified status. Never silently mark a task done based only on a commit. Add new manual account requirements without storing credential values. Reconcile the dashboard and this document after significant changes. This policy applies while actively working; unattended continuous updates require an explicitly configured automation or CI integration.

## Verified repository inventory
- The God dashboard has an engineering execution-order panel (commit caec3aa3).
- Arcade catalog validation exists at scripts/arcade-catalog-doctor.mjs; it has not been certified against production.
- Shared navigation logic lives in public/nav.js. Its authorization fallback needs browser regression testing.
- The original creations manifest is public/arcade/original-creations.json.
- The recovered historical backlog is docs/ASH-FALL-RECOVERED-BACKLOG.md.
