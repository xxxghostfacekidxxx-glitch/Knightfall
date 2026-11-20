# Knightfall code cleanup and Textract v2 audit
Date: 2026-11-20

## Release facts verified
- Cloudflare Pages release gate passed for Textract native v2 after implementing PDF byte-exact decoding, common filter pipelines, Office XML preservation and bounded extraction.
- The latest confirmed Textract test group passed (48 pass, 0 fail), including new PDF Unicode/page-tree/Flate/ASCII85/ASCIIHex/run-length and multi-entry DOCX/XLSX/PPTX regressions.
- Live browser checks successfully extracted text from a synthetic PDF, and the on-page **Run reader self-test** passed through the same public workbench UI.
- Existing site audit: 172 CSS files, 90 top-level HTML pages, 505 local links; no broken or duplicate static links or missing shared-theme assets in the verified release.
- Header list contained 94 unique route rules; offline-cache app shell had 88 entries without duplicate paths in the previous audit.
- Branch discipline: edits committed to `main`, no extra branches or pull requests.

## Textract bug fixes
- PDF: repaired array token loop that skipped `TJ`, and preserved exact source bytes before decompression (Windows-1252 altered certain binary bytes).
- PDF: accepts common `BT/ET`, `Tj/TJ`, `T*`, `Td/TD`, `Tm`, escaped literals, hex strings, Unicode maps, page-tree ordering, and compressed object streams.
- PDF: added bounded `FlateDecode`, `ASCII85Decode`, `ASCIIHexDecode`, `RunLengthDecode` filter chains; honors direct stream byte lengths.
- Office: Word runs, paragraphs, tables, notes; Excel shared and inline strings, cached cells, explicit uncomputed-formula labels; PowerPoint slide text.
- Office: embedded photographs no longer spend the text extraction memory quota unless their bytes are actually read.
- OCR: prefer browser-provided on-device `TextDetector` where available. The original glyph matcher remains an explicitly experimental fallback and rejects highly uncertain results.
- UI: clears stale previews after invalid selections/failures, resets comparisons, reports method/warnings, provides an offline synthetic PDF self-test and displays local OCR capabilities.
- Mobile: Textract hero uses isolated Egyptian dark-gold styling instead of colliding with shared gothic hero selectors. Floating-dock placement now honors intentionally protected page areas.

## Important limitations, not hidden
1. **General scanned PDF rendering remains incomplete**. JPEG-backed pages that explicitly draw DCTDecode image XObjects can now run through local OCR, but JBIG2, CCITT, JPX/JPEG2000, Flate image raster decoding, and nested form rendering are not supported. Unreadable pages must be disclosed, never invented.
2. **Image OCR is not production-grade on all devices**. `TextDetector` is browser-dependent. The fallback is appropriate only for clear printed Latin text; handwritten, skewed, tiny and complex images can fail or produce inaccuracies.
3. **PDF coverage is deliberately bounded**. Encryption, some font CMaps, unusual filters/predictors, rich forms and complex rendering may require a fuller PDF engine.
4. Excel builtin and recognizably date-formatted cells now include readable ISO dates alongside original serials, and booleans are shown as TRUE/FALSE. Unknown date styles remain raw; calculated formulas are not executed, and table reconstruction is best effort.
5. No untrusted text is sent to Miss Chaos without explicit draft staging and a user Send action.

## Remaining maintenance inventory
- `knightfall-unified-theme.css`: about 103 KB and 482 `!important` rules; `knightfall-requiem.css`: about 20 KB and 133 `!important` rules. These are CSS audit **warnings**, not proof rules can be deleted. Continue audited, route-by-route consolidation with visual regression snapshots; do not blanket-remove selectors that style live games, messaging or member themes.
- Public engine PDF/Office tests are deterministic. A collection of sanitized representative PDFs, phone photos and OOXML files is still needed to validate diverse production inputs. Never use members' private documents as fixtures.
- Retain `profile-custom-theme`, `#profile[data-theme]`, gameplay, and admin-authorized theme switching exclusions.

## How to verify
```bash
node scripts/pages-release-guard.mjs
node --test scripts/chaos-textract.test.mjs scripts/chaos-textract-native.test.mjs scripts/chaos-textract-lab.test.mjs scripts/chaos-textract-regression.test.mjs
node --check public/chaos-textract-core.mjs
node --check public/chaos-textract-native-pdf.mjs
node --check public/chaos-textract-native-zip.mjs
node --check public/chaos-textract-native-ocr.mjs
node --check public/chaos-textract.mjs
```

Manual browser QA:
1. Open `/chaos-textract.html` on mobile. Press **Run reader self-test**. Expect `Page 1\nKnightfall Textract self-test passed`.
2. Upload a real selectable-text PDF, DOCX, XLSX, PPTX, TXT and one clear printed image. Check the preview against the source, not just nonempty output.
3. Check a JPEG-backed scanned PDF produces labeled OCR and a caveat. Verify unsupported scan formats and heavily blurred images produce candid errors instead of invented content.
4. Repeat on Android Chrome and a desktop browser. Verify no network requests send original file bytes.
5. Confirm Cloudflare release, main branch and source tests before claiming any follow-up change is live.

## November 20 continuation: first-party scanned JPEG support and format fidelity

- JPEG page images explicitly drawn by PDF content streams are now routed to the same on-device OCR routine used for standalone pictures, with no external uploads. Hidden or unreferenced PDF resources are not OCRed.
- Browser smoke test: an entirely image-only PDF containing KNIGHTFALL 123 was correctly recognized in production; output carried an explicit OCR source and verification warning.
- Regression tests exercise inherited page resources, ignoring unrelated images, and OCR failure behavior. Other compressed PDF image formats remain unsupported and must be described as such.
- Excel style metadata is now used to interpret supported date formats and TRUE/FALSE cells while preserving original serials. Both 1900 and 1904 date systems are covered by regressions; Excel's fictitious 1900 leap day is not fabricated.
- Default sheet headings are deduplicated.
- Canonical Knightfall section palette tokens now replace scattered copies of identical foundation colors; the CSS import version and PWA shell cache are incremented together.

**Release interpretation:** A successful Cloudflare build and public browser checks validate the tested cases, not all arbitrary files. Cross-browser OCR, sensitive document workflows and exceptional PDF formats require continued testing.
