# Knightfall developer arsenal

This document distinguishes **tool links**, **repository CI checks**, and **installed integrations**. A web link does not grant Miss Chaos tool execution permissions.

## Existing foundations

- Devil Tools: `public/devil-tools.html` (client-side authenticated workshop)
- Open Source Arsenal: `public/open-source-arsenal.html` (public reference directory)
- Admin Command Center: `public/admin-command-center.js`
- Browser smoke tests: `scripts/arcade-browser-smoke.mjs`, `scripts/pwa-browser-smoke.mjs`
- Regression CI: `.github/workflows/knightfall-regression.yml`
- Nightly audit: `.github/workflows/nightly-quality.yml`

## First wave: capability matrix

| Software | Role | Current integration | Next step |
| --- | --- | --- | --- |
| Piskel | Browser pixel art | External creator link already present | Evaluate self-hosting and asset license |
| Excalidraw | Whiteboards and flow diagrams | External creator link in Devil Tools | Embed only after bundle/security review |
| SVG-Edit | SVG editing | External creator link | Validate sanitized upload/export pipeline |
| Playwright | Real browser smoke tests | Present in existing nightly workflow | Expand auth, accessibility and mobile test coverage |
| Playwright MCP | Agent-controlled browser automation | Documentation only; no MCP runtime provisioned | Connect to approved agent host with narrow capabilities |
| Chrome DevTools MCP | Debug console/network/performance | Documentation only; no MCP runtime provisioned | Configure safe, authenticated diagnostics host |
| Biome | JavaScript lint | Advisory CI in developer-arsenal-audit workflow | Establish project rules before enforcing |
| Semgrep | Security/code-pattern checks | Advisory CI in developer-arsenal-audit workflow | Triage false positives and pin dependencies |
| GlitchTip | Error monitoring | Candidate only | Evaluate hosted collector, quotas and privacy |
| OpenTelemetry JS | Instrumentation | Candidate only | Use minimal Worker-supported spans; avoid collecting secrets |

## Governance

1. Run read-only checks first; do not automatically run deployment, migrations, or destructive repairs.
2. God/admin UI access must be authenticated and authorized by Workers, never merely hidden in browser code.
3. Creator access is for art and design tools, not privileged repository actions.
4. Never send private messages, keys, tokens, authentication headers, user content or vault contents to third-party diagnostics.
5. For third-party source copies, verify the exact current upstream license and preserve notices.
6. Require an approved code review and passing tests before production deployment.

## CI behavior

`developer-arsenal-audit.yml` runs on relevant pushes to `main`, pull requests, and manual dispatch. JavaScript syntax, offline regression tests, browser role fixtures, and Semgrep scanner execution must succeed. Semgrep findings and Biome lint results remain advisory until triaged. GitHub Actions uploads a **sanitized counts-only JSON summary** and Biome output, but not the raw Semgrep source-finding JSON, as seven-day artifacts. No production release is performed by this workflow. The diagnostic workflow uses Ubuntu 24.04 for Playwright compatibility.

## Miss Chaos triage contract

Miss Chaos may review the generated `developer-arsenal-summary.json` after it is supplied by an authorized human or trusted backend. The counts-only summary does not grant access to GitHub APIs and is not evidence that a vulnerability has been fixed. Actual source-code remediation requires reviewing original findings in an appropriately restricted environment, preparing a patch, passing tests and receiving approval. Never publish or send original Semgrep snippets or possible matches for secrets to public chat, issue bodies, or telemetry.

## Usable local report import and guarded backend capability

The private admin command center supports selecting `developer-arsenal-summary.json` from the user's own device. The browser validates totals and inserts only numeric findings and severity counts into Miss Chaos's composer. It does **not** upload the selected file or automatically submit a message.

The backend now defines `god.audit_summary` as a read-only, God-only capability. A separate, server-owned `createChaosAuditSummaryHandler({loadReport})` validates a trusted counts-only document before returning it. The handler **is not connected** to a report store, GitHub Actions, or the deployed Worker router yet. This boundary deliberately avoids giving the model tokens, network access, or repository write permissions. Tests run in the Developer Arsenal CI job.

## Live diagnostic synchronization using GitHub Actions OIDC

The Developer Arsenal workflow produces a counts-only report, then requests a **short-lived GitHub Actions OIDC token** for the dedicated `https://api.ash-fall.com/api/internal/developer-audit` audience. This requires `id-token: write` in the workflow but does not grant repository write access or require storing a long-lived secret.

The `knightfall-api` Worker validates GitHub's RSA-signed JWT using the official issuer's JWKS. It pins the issuer, audience, repository name and immutable repository ID, default branch, exact workflow reference, event type, run ID, revision SHA, issue time, not-before time, expiry and signature. A verified report is sanitized and stored in existing `SESSIONS` KV for 30 days, with stale and replayed run IDs rejected. No scanner source snippets or credentials enter this storage.

The Worker exposes `GET /api/god/developer-audit` and `god.audit_summary` through its existing verified-session and capability authorization. The private command center's **Load latest verified report (God)** button fetches aggregate counts and fills the composer, but does not automatically send the message.

### Operational verification

1. Confirm `Deploy Knightfall API` succeeded with the OIDC verifier code.
2. Run the Developer Arsenal workflow on `main`; confirm that **Publish sanitized counts to private Worker storage** completed successfully. The workflow's OIDC token is never printed.
3. Log in as God and select **Load latest verified report (God)**.
4. Confirm unauthenticated requests are rejected with 401 and member/admin requests with 403.
5. If the workflow reports an upload error, inspect the status code, GitHub OIDC permissions and Worker deployment; never paste or log the OIDC bearer token.

An optional legacy HMAC shared-secret fallback remains supported by `DIAGNOSTICS_INGEST_KEY` (Cloudflare Worker secret) and `KNIGHTFALL_DIAGNOSTICS_INGEST_KEY` (GitHub Actions secret) for trusted environments that cannot obtain OIDC, but is **not required** for standard GitHub Actions. GitHub Actions OIDC is preferred. The feature uses existing Cloudflare KV, not a new database or paid service. Cloudflare KV is eventually consistent, so this is a monitoring snapshot rather than a transactional ledger.

## Next engineering milestones

- Introduce testable, least-privilege actions for Miss Chaos (read logs, open issue, propose patch, run targeted tests).
- Expand Playwright coverage with staging test accounts instead of production credentials.
- Add an error ingestion/monitoring service once cost and data retention are approved.
- Treat changes to branches, migrations, DNS, credentials and deployments as privileged actions.
