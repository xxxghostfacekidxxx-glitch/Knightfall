# Member shop release checks

The storefront is a preview. Do not enable payment collection or Cinder purchases until these checks pass.

## Order security
- Server creates orders using a server-owned SKU and price, never client-supplied totals.
- Verify signed provider webhooks against the raw body and reject unknown events.
- Enforce a unique provider event/payment ID and atomic fulfillment.
- Duplicate, delayed, forged, and replayed events must never credit twice.
- Refunds, disputes, and chargebacks must revoke unspent entitlements or flag the account for review.
- A failed database transaction must not leave an order marked fulfilled.

## Bot slots
- Two free slots remain for regular users.
- Entitlements must be counted server-side in both bot listing and creation.
- Database triggers and API caps must agree.
- Revoking slots must not delete bots without a user-facing policy.

## Cinders
- Do not sell Cinders usable in casino-style or chance-based games until legal and payment-provider review.
- Keep free rewards separate from purchased balances.
- Never offer cash-out, transferable winnings, or purchases that can become monetary prizes without a compliant program.

## Deployment
- Apply migration 0035 to D1 before enabling entitlement reads.
- Verify the Worker and Pages deployment, then run end-to-end tests with a test payment provider.
- Leave all checkout buttons disabled until verification is complete.
