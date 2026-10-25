# Hextris import and modification notice

- Upstream: https://github.com/Hextris/hextris
- Source ref imported: `gh-pages` branch.
- Original authors: Logan Engstrom, Garrett Finucane, Noah Moroze, and Michael Yang.
- Upstream license: GNU GPL version 3 or later. The upstream `LICENSE.md` is included unmodified.
- Local changes: bundled the original JavaScript modules and local vendor libraries, removed the third-party advertising and Google Analytics scripts, removed the external score beacon that transmitted game scores to an unrelated IP address, removed the remote analytics loader, removed app-store/share promotions, replaced remote font loading with system fonts, added the Knightfall arcade shell, account score submission, and account save/resume controls.
- The modified corresponding source is served locally in `hextris.js`, `vendor-bundle.js`, `index.html`, and `style/style.css`.
- All local gameplay assets required by the controls are included. The game has no required external runtime requests.
- This adapted version remains subject to GPL-3.0-or-later. See `LICENSE.md` and `THIRD-PARTY-NOTICES.md`.

This import is not affiliated with or endorsed by the upstream authors.
