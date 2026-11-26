# Stripe Payments, Billing and Invoicing for Knightfall

## Business context
- Domain: https://ash-fall.com
- Business: online community
- Stripe products: Payments for digital goods, Billing for recurring Premium membership, Invoicing for business customers
- Existing stack: Cloudflare Pages, `knightfall-api` Worker, D1, signed webhook at `/api/member-shop/stripe-webhook`
- No card data is collected or stored by the website. Hosted Stripe pages manage checkout and invoices.

## Setup status (November 15, 2026)
- Connected Stripe contexts are test mode only. Live billing is NOT enabled.
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are not installed as Worker secret bindings.
- The CLI installer was attempted in the development workspace, but that environment cannot resolve registry.npmjs.org.
- `stripe agent setup` was attempted and failed because the Stripe CLI binary is unavailable in the workspace.
- Official Stripe integration planner accepted the hosted Checkout design.
- Production D1 migration `0145_stripe_member_customers.sql` has been applied and recorded.
- All checkout, subscription and invoicing operations are explicitly disabled by default.

## What the code supports
1. **Payments**: `POST /api/member-shop/checkout` creates a one-time Stripe-hosted Checkout Session for server-priced shop SKUs. `/api/member-shop/stripe-webhook` validates the raw body signature and fulfills paid orders. Existing paid skins use account-scoped D1 entitlements.
2. **Billing**: `GET /api/stripe/billing/status`, `POST /api/stripe/billing/checkout`, `POST /api/stripe/billing/portal`. `/billing.html` links to the hosted Stripe Customer Portal. Premium is assigned only from verified `customer.subscription.created|updated|deleted` events for the configured Stripe Price ID, bound to the authenticated user/customer mapping.
3. **Invoicing**: `POST /api/stripe/invoices/draft` is **admin/GOD only**, creates an **unsent draft**, and validates email, description, USD amount ($1–$5,000) and payment terms (1–60 days). The admin can finalize/send the invoice in the Stripe Dashboard. A public member cannot issue an invoice.

## Complete the Stripe CLI setup on a machine with internet
```bash
npm install -g @stripe/cli
stripe agent setup
stripe login
stripe --version
```
This agent setup modifies the supported *local* developer agent configuration; it is not needed for the connected ChatGPT Stripe integration.

## Configure secrets without committing credentials
In the Stripe Dashboard, open **Developers → API keys** and use the **test-mode secret key** from the selected Ash-Fall account first.
Configure a test webhook endpoint at:
`https://api.ash-fall.com/api/member-shop/stripe-webhook`
Subscribe it to:
- `checkout.session.completed`
- `charge.refunded`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Retrieve this endpoint's own `whsec_...` secret from Stripe Workbench. A Stripe CLI `listen` secret is not interchangeable with the live webhook endpoint secret.

From a trusted local shell inside `backend/` (uses the existing `wrangler.jsonc`):
```bash
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
```
**Do not** paste either secret into GitHub, chat, the website, a browser console, a screenshot, or a commit.

For recurring membership, create a real recurring **test-mode** Premium Price in Stripe. Do not guess its amount. Save the resulting `price_...` ID as `STRIPE_PREMIUM_PRICE_ID` in the Worker configuration (secret binding is acceptable).

### Launch flags
Only after successful test purchases, signed webhooks, subscription cancellation/refund tests, and full fulfillment validation:
- `MEMBER_SHOP_CHECKOUT_ENABLED=true` enables one-time shop Checkout
- `STRIPE_BILLING_ENABLED=true` enables subscription Checkout and Customer Portal
- `STRIPE_INVOICING_ENABLED=true` enables staff-only unsent invoice drafts

No flag should be enabled until the matching endpoint is fully verified. Use separate test and live Stripe keys, webhook secrets, and Price IDs.

## Regression commands
```bash
node --check backend/src/index.js
node --check backend/src/stripe-billing.js
node --check backend/src/stripe-invoicing.js
node --test backend/src/stripe-billing.test.mjs backend/src/stripe-invoicing.test.mjs backend/src/mascot-payments.test.mjs
```
GitHub Actions `.github/workflows/stripe-integration-tests.yml` runs these on `main`.

## Live launch readiness, verified November 15, 2026

- **Stripe account Ash-Fall** (`acct_1SrVGlBG2dX8uA8q`) currently reports `charges_enabled=false`, `payouts_enabled=false`, `details_submitted=false`, with `requirements.pending_verification`. The account holder must complete onboarding in the Stripe Dashboard. The connected app contexts are test-mode only.
- **Cloudflare Worker:** no `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, or launch flags were present when checked. Do not set launch flags until keys, webhooks, deployment and end-to-end tests all pass.
- **D1 security migration:** `0146_stripe_subscription_event_cursor.sql` was applied to production and recorded as `d1_migrations` ID **86**. Do not reapply it manually.
- Webhook order protection now rejects stale subscription state updates and refuses premium grants without a valid future expiration. Stripe events must include a valid event ID and creation timestamp.
- **Deployment is not payment activation.** Public pages may be visible while real checkout remains intentionally disabled.
- Stripe access/authorization must be completed through the Stripe OAuth consent flow; real secret keys must be installed through Cloudflare's encrypted Worker secrets, never committed to the repository.

## Before live payment acceptance
- Verify Stripe account identity/business onboarding, payouts, support address, and business descriptors.
- Decide Premium monthly/yearly subscription prices and cancellation/refund policy; publish them before taking a subscription.
- Confirm currency/taxes and any Stripe Tax obligations for customer locations.
- Enable and test Stripe's hosted Customer Portal for invoices, card updates and cancellations.
- Test webhooks with signed **test-mode** events, correct timing, retries, duplicate delivery and out-of-order subscription events.
- Verify member access is revoked after subscription cancellation/expiration and refund policies.
- Keep real-money checkout disabled until payment receipts, membership access, dispute/refund handling and deployment verification pass.
- Use Stripe Dashboard Invoicing for manually reviewing and sending invoices, not an unauthenticated public API.

The website's billing success redirect is never proof of payment or membership ownership.

## November 26, 2026 — activation progress
- Knightfall live Stripe account reports charges and payouts enabled; identity document live capture remains outstanding and the payout destination is unverified.
- Both sandbox and live default Customer Portal configurations exist, with invoice history, payment method updates, and cancellation at period end. Plan changes remain disabled until multiple supported recurring Price IDs are implemented.
- Cloudflare production Worker secret inventory did not contain either Stripe secret binding. Provision matching live credentials directly via the dashboard only after sandbox testing. Never install sandbox credentials on the production Worker; use isolated staging resources for test orders and webhooks.
- Main commits a0e6b78af2004449fe9c97b815b5bce3f452d89a and 22a05c903f64647b915e603cbf5a69bf6a9bd6e1 add delayed-payment fulfillment, multiple-signature verification, and regression coverage. CI/deployment and live purchase verification remain outstanding.
- Live checkout remains launch-gated. Catalog creation is pending confirmation of the merchant's tax collection status; no new charges have been initiated.

## Iowa sole-proprietor launch checklist (2026-11-26)
Owner confirmed Iowa operations and sole proprietorship trading as Knightfall. Legal registration status, operating county, physical business address, tax identification number and first taxable sale date are not yet verified. Do not infer them from profile, device or payment data.
- County trade-name filing: https://sos.iowa.gov/businesses/business-faqs
- Federal EIN, if needed and not already assigned: https://www.irs.gov/businesses/small-businesses-self-employed/get-an-employer-identification-number
- Iowa sales/use permit: https://revenue.iowa.gov/taxes/business-permit-registration and https://govconnect.iowa.gov/
- Digital products and software tax guidance: https://revenue.iowa.gov/taxes/tax-guidance/sales-use-excise-tax/taxation-specified-digital-products-software-and-related-services
- Stripe Tax is pending a verified headquarters address; no registrations were listed. Never create a Stripe registration before the owner confirms actual state registration.
- Stripe eligibility review: disclose the site's actual content, virtual currency, casino-style games and marketplace features to Stripe before launch; do not assume free or segregated restricted content resolves eligibility. https://stripe.com/legal/restricted-businesses
- Before turning on automatic tax, implement and test signed checkout verification of subtotal, tax, total and currency; persist tax separately and reconcile full/partial refunds including tax. Existing order checks assume the pre-tax amount equals the paid total. Do not enable automatic tax until these are repaired and verified.
- `STRIPE_BILLING_PORTAL_ENABLED=true` is an optional independent gate for existing customers' account-owned cancellation/payment-method management, even while new sales remain disabled. Requires a valid Stripe secret key and a configured portal. No production flag was changed.
- Billing code/UI/tests committed in 022c35dd528997059aab7a5f698ab91765d7dbeb, a3005796ba81b142f5e86f8a5aee5376e76be83a and c254588e4221ebb8119d04b21faf01cbe66a526d. Deployment and runtime verification outstanding.
