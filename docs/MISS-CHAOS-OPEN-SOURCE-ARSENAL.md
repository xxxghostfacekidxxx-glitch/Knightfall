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
