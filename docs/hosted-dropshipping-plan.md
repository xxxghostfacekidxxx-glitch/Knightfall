# Knightfall hosted dropshipping platform: implementation plan
Updated: 2026-11-15

## Current state (verified in repository)
- Hosted on Cloudflare Pages: `ash-fall.com`, production branch `main`.
- Member shop creation/editing: `public/my-shop.html`, `public/my-shop.js`.
- Public discovery and storefronts: `public/shops.html`, `public/store.html`.
- Cloudflare Worker: `backend/src/index.js` `handleShopRequest`.
- D1 tables: `shops` and `shop_products` from migration `0012_shops.sql`.
- Seller data is scoped to the authenticated shop owner. Public storefront API intentionally omits supplier URLs.
- Catalog exports and batches of up to 10 product CSV imports are supported. CSV import does not automate supplier sync or fulfill orders.
- **No live checkout, orders, Stripe Connect onboarding, supplier connections, shipping/tax engine, or automated fulfillment.** Do not enable money collection without the release checks below.

## Recommended commercial model
Knightfall provides storefront software, seller tools and a community directory; independent sellers are merchants of record for **their own** physical product sales. Start with a single-seller cart per checkout. Do not offer one payment split across multiple stores at first.

- Stripe Connect configured as a SaaS platform with seller-owned connected accounts and direct charges. Seller completes Stripe onboarding, KYC and payout setup. Stripe-hosted Checkout handles customer payment details; the backend creates sessions using a server-verified SKU, price, shipping configuration and account eligibility. Add a disclosed platform application fee if permitted by the chosen Connect setup.
- Knightfall may offer a free catalog tier, paid subscription hosting/features, and optional application fees. Set actual rates only after testing processing fees, taxes, refunds, fraud, and support economics.
- If Knightfall later becomes the merchant of record and aggregates multi-seller checkout, re-evaluate marketplace charges and platform dispute liability with Stripe. **Do not silently switch the charge model.**
- Restrict selling regions initially to a supported jurisdiction, with appropriate merchant identity, contact information, shipping estimates and return information.

Reference: https://docs.stripe.com/connect/saas and https://docs.stripe.com/connect/saas/tasks/accept-payment

## Fulfillment provider roadmap
1. **Printful:** first automated provider for original print-on-demand merch. Use a Printful **Public App OAuth** flow to connect many third-party sellers, not one shared private token. Build product/variant mapping, mockups, orders, webhook tracking, refunds/cancellations, and retry handling. Seller maintains their own account/billing.
   Docs: https://developers.printful.com/docs/
2. **CJdropshipping:** follow with general physical products. Use the official product/catalog, inventory, shipping calculation, order/payment and logistics APIs. CJ order payment may require supplier balance; buyer card payment does not magically fund supplier immediately. Implement per-seller secret storage and order reconciliation.
   Docs: https://developers.cjdropshipping.com/en/api/start/development.html
3. **Printify:** another POD adapter after the common product + variant + fulfillment interface works.
   Docs: https://developers.printify.com/
4. **Manual supplier link:** retain existing private supplier URLs as references, *not* active fulfillment integrations. No unattended order handoff for arbitrary supplier URLs.

## Cloudflare application design
- Continue existing Pages frontend and Worker backend (no additional hosting required for every seller).
- D1: persist seller identity / policies, verified provider connection metadata, product variants, immutable order snapshots, events and fulfillment/shipping state.
- R2 or Cloudflare Images: authorized seller-uploaded product images; validate file type, size and ownership. No arbitrary executable uploads.
- Workers: checkout session creation, seller onboarding initiation/callback, OAuth callbacks, webhook signature verification, seller-scoped order APIs, supplier adapter APIs.
- Queues / Workflows: retryable order dispatch and shipping updates; do not perform fulfillment solely in client redirects or in a fragile single HTTP request.
- Keep platform API secrets in Worker secret bindings. Encrypt per-seller supplier tokens at rest using a server-only key management scheme. Never store API secrets in `supplier_url`, browser local storage, or public product JSON.

## Proposed future D1 resources (not yet migrated)
- `shop_settings`: business contact, policies, legal seller identity, allowed sales regions, shipping origin.
- `shop_payment_accounts`: shop ID, connected account reference, onboarding and capability status. No banking credentials.
- `shop_supplier_connections`: shop ID, provider, provider store reference, encrypted credentials/token reference, connection state.
- `shop_product_variants`: product and supplier variant mapping, SKU, stock policy, supplier cost snapshot, weight, options, processing and shipping estimates.
- `shop_orders`: id, shop ID, buyer/contact references, order status, currency, immutable totals, checkout/payment IDs, addresses protected according to privacy policy.
- `shop_order_items`: SKU, quantity, unit price and tax/shipping snapshots, fulfillment provider reference.
- `shop_shipments`: supplier order ID, carrier, tracking, status updates and dates.
- `shop_webhook_events`: provider + unique event ID, receive/process status, retry and error details.

Use a new numbered migration (after the repository's latest migration) *only* when implementing these routes. Deploy migration and Worker together and test an existing seller shop for backward compatibility.

## Transaction state machine
1. Seller creates a shop and verifies legal/payment and supplier prerequisites. Store stays **catalog only** until all prerequisites pass.
2. Seller publishes catalog with supplier-approved images and realistic supply, processing, and shipping details. Price and variants are server controlled.
3. Buyer purchases from exactly one merchant. Worker calculates total (items + shipping + tax where applicable) and creates Stripe Checkout Session for the seller's connected account.
4. A signed Stripe payment-success webhook is validated on the **raw request body**. Store immutable order and unique event ID atomically, with idempotency. A client success redirect alone cannot create a payable order.
5. A background job checks supplier stock/price and dispatches once using an idempotency key. If supplier cannot fulfill, pause and notify; do not place duplicate supplier orders.
6. Supplier order and tracking webhooks update shipment state. Seller and customer receive accurate status and support paths.
7. Refunds, cancellations and disputes reconcile payment, supplier state and any application fee. Record the full financial trail.

## Must-pass launch tests and protections
- Seller A cannot read, update, import into, or fulfill Seller B's records. Public API exposes no supplier tokens, supplier costs, buyer addresses or raw order information.
- Forged, duplicated, delayed, reordered, retried and failed Stripe/provider webhooks do not double-charge or double-fulfill.
- Address validation, out-of-stock handling, taxes/shipping, canceled payment, delayed payment, supplier price changes, failed supplier payment, partial shipment, returns and refunds.
- Rate limits, anti-abuse seller screening, product safety and intellectual-property rules, shipping restrictions and prohibited products.
- For US internet sales, honor the FTC Mail, Internet, or Telephone Order Merchandise Rule: reasonable shipping promises, delay notices, cancellation and refunds. Reference: https://www.ftc.gov/business-guidance/resources/selling-internet-prompt-delivery-rules
- Confirm real Stripe Connect account support and production access. There are currently Stripe **test-mode** accounts connected; that is not proof of live processing.
- Verify successful D1 migration, Cloudflare Worker deployment, Pages deployment, webhook routing, monitoring, disaster recovery, and sandbox purchases before switching on checkout.
- Provide clear merchant/customer support, privacy, returns, and seller terms. Obtain legal/tax review for the precise merchant-of-record model and marketplace obligations.

## Immediate next engineering order
1. Seller storefront identity, shipping/returns policy editor and product variants.
2. Stripe Connect sandbox seller onboarding and one-seller Checkout, webhook and order ledger.
3. Printful multi-seller OAuth + test-mode order/fulfillment/tracking adapter.
4. Operational dashboard (orders, cancellations, supplier costs, stock sync, customer support).
5. Real-money enablement only after all required checks pass and the chosen Stripe account is live-ready.
