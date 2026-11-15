# Knightfall business launch and financing readiness
**Baseline: November 15, 2026.** Source: live Cloudflare D1 production read-only aggregate queries, GitHub code and Actions, Pages deployment metadata, connected Stripe account mode. This is an execution checklist, not a loan application or projection of approval.

## Objective
Turn Knightfall from a feature-rich early platform into a measurable, compliant business capable of supporting recurring revenue and, eventually, a credible small-business financing application. Focus on one reliable consumer experience before adding new product lines.

## Verified baseline (November 15, 2026)
| Indicator | Observed | Important qualification |
|---|---:|---|
| User records | 12 | Includes any staff and test accounts; not a verified count of external customers |
| Last-seen records in preceding 30 days | 8 | Field-based approximation; not independently validated analytics |
| Accounts created in preceding 30 days | 9 | Not necessarily retained or legitimate external acquisitions |
| Forum threads | 97 | Four distinct authors; seeded/development threads may be included |
| Message records | 140 | Six distinct senders; not necessarily distinct paying customers |
| Arcade high-score records | 40 | Three distinct players across 32 game keys |
| Personal bots | 3 | Count of records, not customers |
| Shops, shop products, shop orders | 0, 0, 0 | No evidence of active storefront commerce in these tables |
| Premium memberships and creator subscriptions | 0, 0 | No recurring entitlements recorded in these tables |

Additional verification:
- Cloudflare Pages: project `knightfall`, domain `ash-fall.com`, GitHub source, production branch `main`.
- Backend: `knightfall-api` Worker and `knightfall-forum` D1 database.
- Stripe connection: only Ash-Fall test-mode accounts were available at review; **no live payment processing confirmed**.
- A Runtime Smoke Test was blocked by two static-audit issues on November 15: valid Cloudflare Pages extensionless route `/messages` was mistaken for a missing asset; the audit did not scan delegated `creator-ideas.js` API route. These are audit defects, **not proof those features were broken**.
- PWA is present. Permanently signed, publicly released and physical-device-accepted Android APK remains a separate release gate.

## Priority 0: release quality gates
- [x] Identify and patch the two known static-audit false positives (Pages pretty URLs and delegated Creator Foundry API endpoint).
- [ ] Verify the next `main` CI static audit and complete live runtime smoke test pass, and that Cloudflare Pages deploys the matching commit.
- [ ] Verify registration/sign-in, password reset, messaging, read status, conversation deep links and notifications on real Android and desktop devices.
- [ ] Verify flagship arcade games start, render, save and recover from fullscreen on real mobile devices.
- [ ] Verify game source/asset licensing and preserve third-party attribution; block any infringement-prone content from commercial marketing.
- [ ] Review adult content, user-created bots, dating, virtual currencies and casino-style games against processor policies before monetization.
- [ ] Review GOD/admin visibility, private user data, notification behavior, deletion, user disclosures, incident response and independent access-control testing.
- [ ] Publish an easy-to-find support contact, refunds/terms/privacy guidance and reliable account-deletion flow.

**Release gate:** no critical account, messaging, payment, or security defects; passing automated checks; physical-device acceptance logs; permissions and IP review documented.

## Priority 1: the first legitimate revenue
- [ ] Choose *one* launch offer before pricing a large catalog (candidate: Premium cosmetic/profile perks or first-party original merchandise).
- [x] Keep public shop directories explicitly labeled browse-only until tested checkout and fulfillment exist.
- [ ] Confirm processor eligibility, live account onboarding, tax/merchant obligations, payout ownership and payment descriptor.
- [ ] Implement server-priced products, hosted Checkout and verified signed webhooks, with idempotent fulfillment, reconciliation, refunds and dispute handling.
- [ ] Run sandbox end-to-end tests including duplicates, forged webhooks, cancellations, retries, refunds and failed fulfillment.
- [ ] Only after security, compliance and production checks, enable payment collection through the authorized live account.
- [ ] Record monthly gross revenue, refunds, fees, cost of goods, infrastructure/AI cost, other expenses and net operating cash flow.

**Revenue gate:** real, reconciled, repeatable purchases with a non-negative unit contribution margin. Do not equate a test payment, product listing or enabled button with revenue.

## Priority 2: evidence of external demand
- [ ] Confirm privacy-conscious first-party or Cloudflare Web Analytics, privacy disclosures and consent requirements.
- [x] Add a staff-only, read-only D1 aggregate business metrics panel under Admin > System. It displays records, not verified customers or revenue.
- [ ] Track weekly active users (WAU), monthly active users (MAU), four-week returning members, activation, engagement by major module and outages.
- [x] Surface member-role and staff-role activity separately in the read-only business dashboard. Member-role accounts may still include development/test accounts.
- [ ] Split internal/staff/test activity from genuine external users.
- [x] Add a public homepage first-step funnel: free arcade -> Madhouse community -> pet/profile exploration, with direct account creation, no paid claims and no duplicate directory links.
- [ ] Measure the first-step funnel and validate flagship path: **Chaos Cartridge or Cinderwild -> member account -> messaging/community -> safe premium perks**. No individual visitor tracking added yet.
- [ ] Test acquisition with unpaid creator collaboration, owned social channels, game showcases and personal referrals before purchasing ads.
- [ ] Run one pricing experiment with defined eligibility, conversion count, refund rate and cancellation tracking.
- [x] Add non-personal source-dated CSV KPI snapshot export to the admin dashboard (record totals only).
- [ ] Publish a monthly KPI report with a separate reconciliation to real bank/processor deposits and expenses.

**Traction gate:** positive evidence of returning external users and paid demand, not just registrations or page hits.

## Priority 3: lender packet
- [ ] Confirm legal entity type, ownership documents, EIN, state registrations, business bank account and business address.
- [ ] Prepare owner credit details, tax returns and any required personal financial statement privately for the lender, **not in this public repository**.
- [ ] Prepare profit-and-loss statements, actual bank and processor statements, liabilities, outstanding debts and cash-flow projections.
- [ ] Build a specific use-of-funds budget (e.g. device testing, licensed artwork, security, hosting and small measurable marketing tests).
- [ ] Prepare month-by-month 12-month cash flow with conservative/base/upside scenarios, break-even analysis and debt service.
- [ ] Identify repayment source in all scenarios; avoid relying on speculative loan-funded ad spend to pay the loan.
- [ ] Check lender eligibility and activity restrictions for site content, age-restricted material, gaming and any separate religious nonprofit activity.
- [ ] Review SBA Microloan, CDFI/community lenders and Kiva only after documenting eligibility and affordability.

**Finance gate:** a lender can independently reconcile historical cash inflows, operating expenses and the proposed payment schedule. Eligibility to apply is not approval.

## Weekly operating rhythm
**Monday:** review site failures, accessibility and device QA; fix top user blockers.
**Tuesday:** inspect registration/activation/retention metrics and member complaints.
**Wednesday:** improve the flagship game or messaging feature based on evidence.
**Thursday:** validate payment controls, support, content policy and legal/IP risks.
**Friday:** reconcile sales, fees, refunds, expenses, user trends and next-week priorities.

## Guardrails
1. Keep one canonical `main` branch and commit narrowly scoped, tested changes.
2. Never present planned code, debug APKs, seeded accounts, catalog listings, or test-mode payments as live commercial traction.
3. Never add bank credentials, personal credit reports, identification numbers, Stripe secrets or confidential lender documents to GitHub.
4. Do not turn adult or chance-based features into paid products before explicit legal and processor clearance.
5. Do not borrow for scale until legitimate demand and a defensible repayment plan have been demonstrated.
