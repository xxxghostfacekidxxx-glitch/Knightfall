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

`developer-arsenal-audit.yml` runs on PRs or manual dispatch. JavaScript syntax and existing security audits block its job on failure. Biome and Semgrep are advisory while the repo's baseline is being assessed. Reports are retained as GitHub Actions artifacts for seven days. No production release is performed by this workflow.

## Next engineering milestones

- Introduce testable, least-privilege actions for Miss Chaos (read logs, open issue, propose patch, run targeted tests).
- Expand Playwright coverage with staging test accounts instead of production credentials.
- Add an error ingestion/monitoring service once cost and data retention are approved.
- Treat changes to branches, migrations, DNS, credentials and deployments as privileged actions.
