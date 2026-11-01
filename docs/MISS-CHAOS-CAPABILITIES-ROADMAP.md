# Miss Chaos: capable assistant architecture (implementation plan)

## Goal
Upgrade the existing public Miss Chaos and separate owner-only Chaos Lab into a capable assistant, not merely a persona prompt. Reuse the existing /api/chaos/chat, conversations, memory, and /api/admin/chaos-lab endpoints. Preserve the goth/alt-metal personality while prioritizing truthful, useful answers.

## Current confirmed frontend
- public/miss-chaos.js supports streamed /api/chaos/chat replies.
- public/miss-chaos-presence.js provides sitewide chat, optional browser speech synthesis, mood and arcade tips.
- public/miss-chaos.html includes editable memory and chat export.
- public/chaos-lab.html supports private config and approval-gated behavior proposals.
These frontend observations do not prove any backend tool is currently implemented or deployed.

## Tool architecture
1. Introduce a server-side capability registry, with name, JSON-schema input, per-user permission, rate budget, timeout, audit event, and explicit approval requirement.
2. A planner selects a tool only if necessary; validate arguments on the server. Never execute arbitrary model-generated code, URLs, SQL, or shell commands.
3. Execute a maximum bounded number of tool calls per user turn; return source provenance and clearly distinguish observed results from guesses.
4. Read-only public tools first: site navigation, indexed site help, searchable public posts (respecting visibility), game guides and catalog, arithmetic and date utilities, and optionally externally sourced research via a configured provider.
5. Private user tools only with verified session and ownership: their own messages, profile, saved memories, notifications, drafts, and permitted personal-bot controls.
6. Mutating tools require explicit confirmation describing the target and change. Never use model text as authorization.
7. God Mode tools are separate routes with server-side role enforcement, audit logs, preview/diff, and an approval step. Public chat must never see admin secrets, user archives, or cross-user memories.

## Conversational intelligence
- Use stable core identity and style independent of mood. Mood changes expression, not factual standards or access privileges.
- Retrieve scoped conversation summaries and relevant user-approved memories with retention and deletion controls.
- Distinguish short-term context, durable memories, and source citations. Never invent past events or claim an action was completed without a successful tool result.
- Support a structured answer mode for coding, debugging, writing, brainstorming, site assistance, and troubleshooting.
- Support streaming tool status, cancellation, retries, and helpful failure messages.

## User-facing capabilities roadmap
P0: backend inventory and authentication tests; chat reliability, mobile focus/keyboard, history and memory regression tests.
P1: grounded Knightfall site search and game-guide lookup, with citations/links to source pages.
P2: task planning, drafts, structured code suggestions, safe file upload processing with size/type validation.
P3: optional external web research and voice input/output through configured services.
P4: opt-in automations with schedules, quotas, unsubscribe and delivery monitoring.
P5: owner-only repo diagnostics, CI status, issue/PR proposals and approved code changes.

## Acceptance tests
- Public user cannot call admin tools or retrieve another user's memories, even by prompt injection.
- No cross-user data in memory retrieval or cache.
- Every mutating action shows target and asks for confirmation.
- Tool timeouts and upstream failures do not silently fabricate results.
- Public game tips cite a specific game guide when available; otherwise acknowledge uncertainty.
- Mobile companion does not block navigation, donation or shop actions.
- Streamed and nonstreamed chat paths have consistent errors and conversation history.
- Tests run against backend endpoints and real browser sessions before marking deployed.

## Cost discipline
Use the existing Cloudflare stack, cache nonpersonal public data, cap retrieval and tool calls, and avoid claiming that a hosted LLM or external research provider is free or unlimited. Maintain graceful fallback if a paid provider is not configured.
