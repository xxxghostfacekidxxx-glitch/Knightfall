# Miss Chaos free open-source arsenal

Audited November 19, 2026.

## Implemented
- [Acorn](https://github.com/acornjs/acorn), MIT, pinned 8.19.0: actual JS AST parsing via read-only `dev.code_inspect`, plus native JSON syntax checking. The tool does not execute pasted code and only issues a few heuristic warnings, not a complete security review.
- [GitHub public repository search API](https://docs.github.com/en/rest/search/search#search-repositories): actual bounded fixed-host public repo discovery via `research.github_repos`. Results contain GitHub-reported license metadata but do not establish a legal or security audit. API availability depends on GitHub rate limits.

## Candidates researched but NOT installed
- [Prettier](https://github.com/prettier/prettier), MIT: formatter; standalone browser version requires parser plugins and bundle budget.
- [Monaco Editor](https://github.com/microsoft/monaco-editor), MIT: VS Code-like editor, substantial mobile/worker integration.
- [Mermaid](https://github.com/mermaid-js/mermaid), MIT: architecture diagrams; must sanitize and bound input.
- [highlight.js](https://github.com/highlightjs/highlight.js), BSD-3-Clause: code display, only from safely escaped text.
- [Transformers.js](https://github.com/huggingface/transformers.js), Apache-2.0: opt-in client-side AI tasks, model downloads and device limits.

## Tests and boundaries
Run `npm install --prefix backend` then `node --test backend/chaos-*.test.mjs backend/offline-bot-cache.test.mjs`. Direct utility endpoint continues to require an authenticated session; public Miss Chaos has no repository-write power. Keep arbitrary GitHub URLs, code execution and secret access out of the model-controlled tool palette. CI passes are not proof of live Worker deployment or external provider availability.

## Free Code Studio follow-up
- Prettier 3.6.2 (MIT) is bundled as a pinned npm runtime dependency and used locally within the existing Worker for bounded JS/JSON formatting. No third-party hosted formatting service or pay-per-request API.
- The Knightfall original flowchart builder is a static-browser and shared Worker utility, not a claimed full Mermaid renderer. It produces standard Mermaid flowchart source and a browser-native SVG preview.
- Editing and exports are local to the browser; code analysis/formatting requires signing in to the existing Knightfall API, with existing rate limits. No saved source, no repository modifications, no arbitrary code execution.

## Owner-only GitHub health and repair review (read-only)
- New `god.github_health` tool reads the latest 12 public GitHub Actions runs on main directly from the fixed Knightfall repository using a bounded free GitHub GET request. No GitHub secret or paid API is needed; GitHub anonymous API limits apply.
- The tool returns grounded workflow links, status and generic proposals for what to inspect. It explicitly does not fetch detailed job logs, diagnose root causes, make file changes or auto-approve any repairs. Verified GOD role is enforced on both chat and authenticated utility API; ordinary members cannot invoke it.
- Owner can ask Miss Chaos 'Check Knightfall GitHub workflow status'. Any code change remains a separate review-and-approval step.

## Free developer utilities: November 19, 2026 (phase 3)
- [@babel/parser 7.28.5](https://github.com/babel/babel/tree/main/packages/babel-parser), MIT: extends actual syntax parser coverage to TypeScript, JSX and TSX. This is **syntax validation**, not TypeScript semantic type-checking or running source.
- [jsdiff 8.0.2](https://github.com/kpdecker/jsdiff), BSD-3-Clause: read-only line diffs, unified patch preview and add/remove counts. Never applies a patch or writes to GitHub.
- Knightfall's own deliberately bounded JSON-shape validator supports a transparent subset of JSON Schema (types, required/properties, items, enums, limits). No remote $ref, arbitrary pattern evaluation, user-supplied code compilation or paid service.
- The Code Studio UI offers corresponding direct tools under the existing authenticated, rate-limited utility endpoint. All raw source remains unsaved by these tools. No new third-party account, analytics or billing.

## November 28 — External repository intake
Owner Miss Chaos accepts `inspect repo: owner/name` or `integrate repo: owner/name file src/index.js`. Code Studio exposes the owner-only repository intake interface after capability verification. The backend uses public GitHub GET requests, immutable commit and tree SHAs, preliminary permissive-license screening, bounded file inventory and source retrieval; it rejects unsafe paths and blob mismatches. The Code Studio can open an external source draft and export the full pinned source/provenance JSON. Existing review and candidate-test workflows remain the route for adapting source into Knightfall. No arbitrary upstream code is installed, executed, committed or deployed by this intake. CI and authenticated browser acceptance pending.

## Owner-approved integration
The new `miss-chaos-approved-integration.yml` workflow accepts the existing candidate kit inputs plus explicit `APPLY TO MAIN` confirmation from the repository owner. It tests in a read-only job, then applies only the exact SHA-256 candidate to the exact base commit in a separate write job, without executing candidate code there. Non-force push rejects concurrent main updates. Only existing files with pinned test recipes are supported. GitHub Actions token pushes may not trigger other Actions; verify Pages and manually dispatch API deployment if applicable. No automatic model-controlled writes or credential provisioning.

## One-click owner integration
Eye of Chaos developer review defaults to Osiris only; Osiris may explicitly enable Isis or administrators as review delegates. Delegates cannot initiate main integration. The approve-and-push button verifies the exact proposal, records approval and claims a single dispatch before calling the fixed GitHub workflow. To enable the button, provision a repository-owner fine-grained token restricted to Knightfall with Actions write permission as the Worker secret `CHAOS_INTEGRATION_TOKEN`. Do not store it in a file, browser, model prompt or repository. GitHub acceptance is not a test or commit receipt; inspect Actions. Existing workflow constraints and release verification remain.

## URL staging and credential-free integration queue
Paste a bare public GitHub repository URL into the verified owner companion or use the repository panel in Eye of Chaos. The source intake automatically selects a small entry-point module where eligible, saves its pinned contents, license file and inventory, and presents a Code Studio handoff. It does not assert that external code is compatible or already adapted. Approve & push through queues an exact existing-file proposal; the scoped GitHub OIDC runner claims it, tests without write credentials, then commits through a separate write job. Five-minute schedule is best effort; manual queue workflow dispatch is available. A main revision change invalidates the candidate; no force push. No Worker PAT is needed for this queue. A runner-reported commit is not independent deployment verification.
