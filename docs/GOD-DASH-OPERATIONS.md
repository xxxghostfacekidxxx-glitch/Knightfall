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
