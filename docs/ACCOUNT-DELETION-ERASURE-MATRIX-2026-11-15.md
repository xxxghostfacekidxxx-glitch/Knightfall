# Account erasure implementation and acceptance matrix

**Snapshot:** November 15, 2026. **Evidence:** read-only aggregate/schema queries against production Cloudflare D1 `knightfall-forum`; source inspection of account deletion request endpoints, public assistance page, and Android release notes. No member data or deletion actions were accessed or changed.

## Release status: NOT COMPLETE

The authenticated account settings page allows a password-confirmed deletion **request**. A public `/account-deletion.html` page allows users without access to their account to request *assistance*; this is not identity verification. Staff can review pending requests, but a request status is **not proof** of erasing account data. A fully verified cross-store data erasure flow is still an Android/Google Play release blocker. Do not flip any "completed" UI status merely because a request was received.

The production database query found **115 non-internal tables**. A conservative DDL text search identified **73 tables containing user/owner/sender/recipient ID field names**, of which **7 lacked a literal `ON DELETE CASCADE` clause**. This is a heuristic audit, not a complete foreign-key graph. Other non-user-named or indirectly linked tables may still hold personal content, and a CASCADE clause alone does not guarantee that all relevant records disappear.

**Deletion request queue at review:** 0 records. This does not include separate public privacy-assistance requests held in KV.

## Explicit table review before writing a deletion executor

| Table | Reason for focused review | Proposed handling, pending policy/legal review |
|---|---|---|
| `account_deletion_requests` | Uses `user_id` with `ON DELETE SET NULL`; stores username/email snapshots | Keep only the minimal justified operational confirmation record for an explicit documented retention period; remove unnecessary identifiers after verification |
| `god_bot_accounts` | Links bot identity to user without a literal cascade | Reject deletion of protected service/system identities unless a separate secure migration plan exists |
| `member_shop_fulfillments` | Links owner and purchase history without literal cascade | Review legal tax/refund/accounting retention, anonymize associated customer identity where possible; never silently drop financial obligations |
| `personal_bot_chat_messages` | Contains `user_id`, no literal cascade | Remove private chat content and related bot history; verify there are no orphan bot messages |
| `personal_bot_memory` | Contains `owner_id`, no literal cascade | Remove private bot memories and retained prompts alongside bot configuration |
| `profile_layouts` | Contains `user_id`, no literal cascade | Remove stored layout and profile customizations |
| `threads` | Contains `user_id`, no literal cascade | Decide delete versus public-content anonymization consistently with published policy, moderation needs and member expectations |

## Other coverage, not exhausted by D1

- Identity: email, password hashes, sessions and refresh tokens, verification/reset tokens, OAuth account links, banned/deleted account remnants, admin role references
- Communication: conversation membership, direct/group messages, reactions, notifications, memo mail, push subscriptions and retry receipts
- Private creative data: Die-ary, moon journal, shadow-work data, astrology birth-chart details, personal bots, prompts, Miss Chaos conversations and memories
- Public identity/content: profile data, uploads, albums, friendships, social and forum posts, dating profiles and likes, creator assets and submitted content
- Gameplay and entitlements: saves, high scores, Cinders balances, pets, owned avatars, unlocked cosmetics, purchases and gift/transaction histories
- Infrastructure outside D1: Cloudflare KV namespaces (including SESSIONS and AI memory), R2 media/image objects and variants, third-party processors/fulfillment providers, backups and diagnostic logs

## Safe implementation sequence

1. **Build a production-schema inventory and legal retention classification.** Map all foreign keys, non-FK user IDs, indirect parent relationships, KV/R2 object-key patterns and external data processors. Document what is deleted, anonymized, or retained and for how long.
2. **Prove ownership and protect special identities.** Use a recent authenticated password challenge or verified alternative for OAuth-only accounts. Never accept a client-supplied victim user ID. Do not permit a GOD/system or another member's account to be deleted through an ordinary member endpoint.
3. **Create a durable, resumable erasure state machine.** Mark an account pending, stop new user activity, revoke sessions and push endpoints, and maintain idempotent checkpoints for D1, KV, R2 and external processors. Handle retries and partial provider failures without falsely claiming success.
4. **Test deletion and preservation rules in staging.** Create isolated accounts and content across every supported module. Test private data erasure, public-content policy, intact unrelated accounts, financial retention, role boundaries, concurrent updates, pending-request cancellation, and resuming failed jobs.
5. **Expose truthful progress and completion proof.** Staff may mark a request completed only after evidence confirms all required stores have been processed. Show honest pending/error states. Record minimal operational audit data without copying deleted content into logs.
6. **Publish accurate policy and verify.** Update privacy/account-deletion disclosures and Play Data safety forms, test the public external request page, real Android flow, help-queue operations and backup retention rules. Only then consider the Play release blocker cleared.

## Verification gate

- [ ] Complete table-by-table D1 erasure/retention map, including unowned orphan content
- [ ] KV/R2 object scans and delete/anonymize handlers, plus backup policy
- [ ] Sessions/OAuth/push invalidation
- [ ] Legal retention decisions for commerce, moderation and payment disputes
- [ ] Idempotent, resumable deletion executor with error-safe evidence
- [ ] Staging tests proving cross-account isolation and end-to-end erasure
- [ ] Public policy, external deletion-request flow and Play disclosures match code
- [ ] Physical Android account deletion acceptance

**Never test erasure on a real member's live account. Never treat a ticket status update as data erasure.**
