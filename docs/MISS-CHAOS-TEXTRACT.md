# 𓂀 Knightfall Textract · Original Engine (November 2026)

## What is original and what is not
Textract's extraction, local comparison, data-extraction, export, user interface, and Miss Chaos draft-handoff code are written for Knightfall. The project does **not** incorporate or bundle PDF.js, JSZip, Tesseract.js, pre-trained OCR model files, third-party WASM, Amazon Textract, or third-party API calls in this build. The previous CDN vendor builder was removed.

This does not mean ownership of the PDF, ZIP or Office format specifications, browser APIs, fonts, operating system, or unrelated libraries elsewhere in Knightfall. DecompressionStream, DOMParser, Canvas 2D and createImageBitmap are built-in browser platform APIs. Copyright ownership of contributed software is governed by applicable law and the relevant contributor agreements, not a superficial code rewrite. The implementation was authored anew as a limited parser, not a relabeled copy of an OCR library.

## Modules
- `public/chaos-textract-core.mjs`: file types, validation, dispatch, privacy-preserving draft handoff.
- `public/chaos-textract-native-zip.mjs`: ZIP central-directory reader, store/deflate decoding via the browser's built-in DecompressionStream, and simple OOXML Word/Excel/PowerPoint XML parsing.
- `public/chaos-textract-native-pdf.mjs`: lightweight PDF text-stream parser for a subset of unencrypted regular PDF objects with standard Tj and TJ operators and FlateDecode content.
- `public/chaos-textract-native-ocr.mjs`: original experimental browser Canvas pixel segmentation and glyph-template comparison. Template glyphs are rendered with system fonts at runtime. No pretrained OCR weights.
- `public/chaos-textract-lab-core.mjs`: search, word/page counts, line/table/key-value extraction, CSV/JSON exports and text comparison.
- `public/chaos-textract.mjs` + `public/chaos-textract.html`: responsive workbench, file handling, explicit handoff to Miss Chaos.

## Member experience
Users can select text documents, images, PDF text-layer documents, and Word/PowerPoint/Excel files on their device, then extract and inspect text. The tool offers text editing, search, structured CSV/JSON download, a second-document text comparison, and a short staged excerpt for Miss Chaos. Only clicking Send in Miss Chaos transmits extracted text to the site backend.

## Known limitations (do not advertise capabilities that are not implemented)
- **OCR is experimental** for small, simple, high-contrast printed Latin characters. It is not reliable on real-world handwriting, handwriting-like fonts, complex page layouts, rotated photos, overlapping glyphs, curved text, or low-contrast receipts. Numbers must be checked visually.
- **Scanned PDF pages are not OCRed**. Native PDF parsing works only on a supported subset of selectable text-layer files. It is not a PDF page renderer; encrypted PDFs, uncommon encodings, font maps or compressed object streams may fail or return incomplete text.
- ZIP Office extraction supports standard small OOXML files where the browser supports built-in `deflate-raw` decompression. Password-protected/complex Office files, Office macros, charts and formula evaluation are not supported. XLSX reads cached values.
- 18 MB input cap; 4 MB per decompressed ZIP document section; 24 pages for PDF; 180,000 output characters.
- Format conversions are best-effort; unknown text must never be silently invented. Exported tables and extracted key/value pairs should be checked against the original document.
- The original code is free to use on Knightfall and does not involve per-document OCR API charges. The software does not require external CDN requests when a user opens a file. Its functionality still depends on browser APIs and site hosting.

## Verification and release
```sh
node --test scripts/chaos-textract.test.mjs scripts/chaos-textract-native.test.mjs scripts/chaos-textract-lab.test.mjs
node --check public/chaos-textract-native-zip.mjs
node --check public/chaos-textract-native-pdf.mjs
node --check public/chaos-textract-native-ocr.mjs
node --check public/chaos-textract-core.mjs
node --check public/chaos-textract.mjs
```

The Cloudflare Pages release guard also runs these checks. Browser-based acceptance testing using representative real files is still required, especially on Android, before promising production-quality OCR.
