# Knightfall Open-Source Toolkit

This is a source toolkit and intake registry for the game projects and administration tools we researched. It keeps upstream projects separate from the production site instead of dumping unrelated server applications into Cloudflare Pages and hoping the internet takes pity on us.

## Contents

- `catalog.json`: upstream URLs, project purpose, known/recheck license labels, size, and fit.
- `sync.mjs`: clones approved, manageable upstream repositories into the ignored local `vendor/` folder.
- `vendor/`: local-only checkout area. It is intentionally excluded from Git so third-party source is not accidentally republished as Knightfall code.
- `LICENSE-REVIEW.md`: import and reuse rules.

## Fetch the starter toolkit

Requires Node.js and Git. From the repository root:

```bash
node toolkit/sync.mjs
```

To include large/reference-only projects as well:

```bash
node toolkit/sync.mjs --all
```

The script clones each repository into `toolkit/vendor/<id>`, skips an existing checkout, and does not build, run, deploy, or alter upstream source. It does not fetch game assets, ROMs, binaries, Docker images, credentials, or server data.

## What belongs in production?

Nothing gets promoted automatically. Knightfall currently uses Cloudflare Pages + Workers + D1/KV/R2. Browser-game source can sometimes be adapted to `public/` after a code and asset review. Dedicated game-server panels, Java/native games, streaming servers, and self-hosted library apps need separate compatible hosting and security operations.

Before adapting or redistributing any project:
1. Verify the upstream repository is the intended canonical project and is still maintained.
2. Read its current LICENSE and all notices. A license label in the catalog is a discovery aid, not legal advice.
3. Audit code, dependencies, build steps, network behavior, authentication, and known vulnerabilities.
4. Review artwork, fonts, music, logos, trademarks, and other assets separately from source-code licensing.
5. Keep upstream attribution and notices; document every modification and license obligation.
6. Do not bundle ROMs or proprietary franchise assets.

See [LICENSE-REVIEW.md](./LICENSE-REVIEW.md) and [catalog.json](./catalog.json).
