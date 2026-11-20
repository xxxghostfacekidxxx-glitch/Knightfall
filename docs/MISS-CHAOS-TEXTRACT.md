# 𓂀 Knightfall Textract · Native Extraction v2 (November 2026)

## What is original and what is not
Textract's extraction, local comparison, data-extraction, export, user interface, and Miss Chaos draft-handoff code are written for Knightfall. The project does **not** incorporate or bundle PDF.js, JSZip, Tesseract.js, pre-trained OCR model files, third-party WASM, Amazon Textract, or third-party API calls in this build. The previous CDN vendor builder was removed.

This does not mean ownership of the PDF, ZIP or Office format specifications, browser APIs, fonts, operating system, or unrelated libraries elsewhere in Knightfall. DecompressionStream, DOMParser, Canvas 2D and createImageBitmap are built-in browser platform APIs. Copyright ownership of contributed software is governed by applicable law and the relevant contributor agreements, not a superficial code rewrite. The implementation was authored anew as a limited parser, not a relabeled copy of an OCR library.

## Modules
- `public/chaos-textract-core.mjs`: file types, validation, dispatch, privacy-preserving draft handoff.
- `public/chaos-textract-native-zip.mjs`: ZIP central-directory reader, store/deflate decoding via the browser's built-in DecompressionStream, and simple OOXML Word/Excel/PowerPoint XML parsing.
- `public/chaos-textract-native-pdf.mjs`: locally written PDF text-layer interpreter with page-tree order, Tj/TJ/spacing commands, common ToUnicode CMaps, compressed object streams, FlateDecode, ASCII85, ASCIIHex and run-length streams; not a complete renderer.
- `public/chaos-textract-native-ocr.mjs`: browser on-device TextDetector when available; otherwise original experimental Canvas glyph-template comparison. Low-confidence fallback output is rejected instead of accepted as reliable text. Template glyphs use system fonts at runtime; no bundled OCR weights.
- `public/chaos-textract-lab-core.mjs`: search, word/page counts, line/table/key-value extraction, CSV/JSON exports and text comparison.
- `public/chaos-textract.mjs` + `public/chaos-textract.html`: responsive workbench, file handling, explicit handoff to Miss Chaos.

## Member experience
Users can select text documents, images, PDF text-layer documents, and Word/PowerPoint/Excel files on their device, then extract and inspect text. The tool offers text editing, search, structured CSV/JSON download, a second-document text comparison, and a short staged excerpt for Miss Chaos. Only clicking Send in Miss Chaos transmits extracted text to the site backend.

## Known limitations (do not advertise capabilities that are not implemented)
- **OCR is experimental** for small, simple, high-contrast printed Latin characters. It is not reliable on real-world handwriting, handwriting-like fonts, complex page layouts, rotated photos, overlapping glyphs, curved text, or low-contrast receipts. Numbers must be checked visually.
- **Some scanned PDFs are now OCRed locally**: pages containing a drawn DCTDecode JPEG or bounded FlateDecode 8-bit DeviceGray/DeviceRGB image can reach local OCR. Flate image decoding supports TIFF/PNG scanline predictors. Other encodings (JBIG2, JPX/JPEG2000, CCITT), unsupported color spaces, nested form-wrapped images and encrypted files are not rendered. The reader reports unsupported/partially recognized pages.
- ZIP Office extraction supports standard OOXML files where the browser supports built-in `deflate-raw`. Memory budgets apply to entries actually read; unrelated embedded photographs no longer exhaust the text budget. Password-protected Office files, macros, charts and formula evaluation are not supported. XLSX reads cached values and labels formulas without cached results.
- 18 MB input cap; 4 MB per decompressed ZIP document section; 24 pages for PDF; 180,000 output characters.
- Format conversions are best-effort; unknown text must never be silently invented. Exported tables and extracted key/value pairs should be checked against the original document.
- The original code is free to use on Knightfall and does not involve per-document OCR API charges. The software does not require external CDN requests when a user opens a file. Its functionality still depends on browser APIs and site hosting.

## Verification and release
```sh
node --test scripts/chaos-textract.test.mjs scripts/chaos-textract-native.test.mjs scripts/chaos-textract-lab.test.mjs scripts/chaos-textract-regression.test.mjs
node --check public/chaos-textract-native-zip.mjs
node --check public/chaos-textract-native-pdf.mjs
node --check public/chaos-textract-native-ocr.mjs
node --check public/chaos-textract-core.mjs
node --check public/chaos-textract.mjs
```

The Cloudflare Pages release guard also runs these checks. Browser-based acceptance testing using representative real files is still required, especially on Android, before promising production-quality OCR.

## Device-level diagnostic and validation

The Textract workbench includes **Run reader self-test**. It creates a tiny synthetic selectable-text PDF entirely in the browser and processes it through the same path as an actual uploaded PDF. Passing this test confirms the page, module imports, file decoding and PDF text operators work on that device; it does **not** prove a specific scanned or encrypted document is supported.

Images show whether the browser exposes native TextDetector. On unsupported devices the first-party fallback is limited to high-contrast printed text, and the interface should display an explicit failure when recognition is unreliable.

Before claiming a real-file bug fixed, reproduce it with a sanitized example from that format and add a regression test. Do not upload members' private files or suggest posting confidential PDFs to issue trackers. Keep all processing local until the user explicitly stages a chat draft.

## November 20 extraction accuracy and maintenance follow-up

- PDF ToUnicode CMap decoding now supports explicit glyph-array ranges in addition to sequential ranges. PDFs with more than 24 pages show a clear notice about omitted pages rather than silently stopping.
- XLSX worksheets follow `xl/_rels/workbook.xml.rels` so tab titles and order remain correct even when sheet filenames or IDs do not match the displayed tab order. Exported UTF-8, UTF-16LE and UTF-16BE text files honor their byte-order marks.
- Word field instructions are not included as visible document text. PowerPoint decks over 60 slides and spreadsheets over 25 worksheets announce the unprocessed remainder.
- Original fallback OCR can evaluate two-way and three-way splits of touching high-contrast printed glyphs. The split search is bounded, chooses only higher-confidence combinations, and improves spacing between words. Synthetic browser checks include `KNIGHTFALL 123`, `HELLO WORLD`, `FAMILY 456`, `WWW MMM` and `TOTAL 12.45`. This is **not** evidence of general photo or handwriting accuracy.
- Regression tests exercise these cases. The public site still avoids paid extraction APIs, external model bundles and uploading original files without user action.

### Remaining scope

JPEG-backed and some Flate-backed scanned PDF pages may now be OCRed, but the engine remains unable to render arbitrary PDF page graphics. The first-party glyph engine remains an experimental fallback when the browser has no built-in text detector, and real photos can be substantially more difficult than clean generated images. Every release needs real-device checks with non-sensitive representative documents before advertising broader reliability.

## Phone-photo orientation recovery

The Textract image OCR reader can recover **sideways printed text** using bounded local grayscale rotations. Auto mode starts upright, then tests other orientations only when the text is missing, uncertain, or broken into suspicious one-character vertical lines. The tool preserves upright clear results rather than automatically changing every photo. Auto orientation is a heuristic, not a guarantee.

The workbench's **Photo orientation** selector supports Auto, 0°, 90°, 180° and 270° clockwise for individual JPG, PNG, WebP and GIF images. On changing orientation it clears the previous extraction and any stale comparison output, so old text is never labeled as if it came from the new orientation. The selector is hidden for non-image documents, and changing photos resets it to Auto.

The rotation path allocates only bounded browser-local pixel buffers. It does not introduce a cloud OCR endpoint, a downloaded model, or a third-party parser.

Verification: a browser-generated `KNIGHTFALL 123` image was recognized upright, auto-corrected after a 90° clockwise picture rotation, and recognized after explicitly choosing 270°. Pixel-matrix unit tests check all four rotations. These tests do not validate photographic perspective, blurry handwriting or unusual fonts.
