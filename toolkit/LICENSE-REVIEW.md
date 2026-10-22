# License and import review policy

This toolkit is a curated index plus a local source-fetch helper. It does not grant rights to upstream projects.

- Verify the live repository and license file before any code reuse. Catalog entries marked `VERIFY-UPSTREAM` are reference-only and are excluded from the default sync.
- Keep each upstream checkout intact in `toolkit/vendor/<project-id>`. Do not copy code into Knightfall production until its license, dependency licenses, assets, trademarks, security, and compatibility have been reviewed.
- GPL and AGPL projects can impose source-distribution or network-use obligations when modified/combined in covered ways. MPL has file-level obligations. MIT and Apache-2.0 still require preservation of notices; Apache-2.0 also has NOTICE and patent provisions.
- Code licenses do not automatically license game artwork, sound, fonts, logos, brand names, or copyrighted franchise content.
- No game ROMs, proprietary assets, secrets, credentials, production data, or third-party binaries are fetched by this toolkit.
- A project intended for Docker, PHP, Ruby, Java, or a persistent server process is not directly deployable as a Cloudflare Worker. Treat it as a separate service unless architecture review proves otherwise.
- Re-check upstream license text and security status at the time of use. This registry is a starting point, not a substitute for review.
