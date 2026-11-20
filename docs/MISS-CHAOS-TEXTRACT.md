# Miss Chaos Textract · Knightfall document tools

Textract is Knightfall-authored UI and document processing/orchestration code. It **does not** mean Knightfall owns the copyrights to PDF.js, JSZip, Tesseract.js, or the language models. All redistribution is under the respective upstream open-source licenses.

## Where it lives
- `/chaos-textract.html` for signed-in and public visitors. Local extraction itself does not require an AI account.
- Creator Foundry, both full Miss Chaos chat workspaces (standard and Isis), the floating field kit (standard, Osiris and Isis), and the public Miss Chaos site index.
- The return to chat is an explicit handoff: only after the user presses Stage draft is a **short excerpt** placed in `sessionStorage`. Chat authenticates its user and requires a separate manual Send.

## What is self-hosted
The `node scripts/pages-release-guard.mjs` Pages build gate runs `node scripts/textract-vendor.mjs` **after** tests. This retrieves pinned packages **at build time only** and deploys their static bytes into `public/vendor/textract/` on Knightfall's own Pages host:
- PDF.js 4.10.38: `pdf.min.mjs` and `pdf.worker.min.mjs`.
- JSZip 3.10.1: `jszip.min.js`.
- Tesseract.js 5.1.1: main bundle and browser worker.
- Tesseract.js Core 5.0.0: all four JS WebAssembly loaders **and** their matching `.wasm` binaries.
- `@tesseract.js-data/eng` 1.0.0: English `eng.traineddata.gz` from `4.0.0_best_int`.
- Original license files for each upstream library and language-data package, included in the deployed `licenses/` directory.

Each downloaded file is checked for basic type signatures and a safe static-size limit and recorded with a SHA-256 hash in `public/vendor/textract/manifest.json`. Version-pinned URLs and checks are NOT a substitute for a verified upstream checksum; a future improvement could pin approved SHA-256 values to prevent upstream supply-chain changes at build time. The build **fails closed** if required assets cannot be downloaded: no silent CDN fallback reaches visitors.

The production browser imports **only relative Knightfall paths**. No direct CDN dependency remains in PDF/ZIP/OCR processing. External network is used to obtain third-party code during the Pages build, not when members open documents. This is self-hosting, not rewriting these upstream engines from scratch.

## What members can do
1. Extract text from TXT, Markdown, JSON, CSV and other plain text, Word DOCX, XLSX cached cells, PowerPoint PPTX slides, PDF text layers, or common image formats.
2. Use **local English OCR** on image files or on scanned PDF pages lacking selectable text.
3. Preview, edit, copy, download text, and search for phrases with jump-to-result.
4. View counts for words, lines, and sections, plus heuristically detected key:value fields and table-like rows.
5. Export lines CSV, fields CSV, possible-table CSV, or structured JSON with source-section labels.
6. Choose a **second local file** and compare added/removed text with a downloadable change report. Changes in layout or paragraph order may be misclassified; this is a text-level comparison.
7. Optionally stage a safely bounded excerpt for Miss Chaos to summarize, proofread, or interpret.

## Limits and trust boundaries
- Max file size: 18 MB. Up to 24 PDF pages, with local OCR on up to 8 scanned pages. Max normalized text: 180,000 characters.
- The comparison engine inspects at most 6,000 lines from either document, returns a bounded report, and does not retain original files across navigations.
- Tables, formulas, merged cells, handwriting, and numbers may not be accurately reconstructed. Verify all critical text against the document.
- First use of large self-hosted OCR engine or language bytes requires a network connection to **Knightfall itself**. Later caching may help; strict offline capability is not guaranteed.
- No original document is sent through the Knightfall API. OCR, search, comparison, and exports occur in the browser. Only text that the user explicitly submits via Miss Chaos chat is sent to the AI backend.
- Extracted text is marked untrusted in the handoff; source instructions do not become AI system instructions.
- CSV protects against cells beginning with spreadsheet formulas (`= + - @`), reducing accidental formula execution in Excel/Sheets.

## Verification
```bash
node --test scripts/chaos-textract.test.mjs scripts/chaos-textract-lab.test.mjs scripts/chaos-textract-vendor.test.mjs
node --check public/chaos-textract-core.mjs
node --check public/chaos-textract-lab-core.mjs
node --check public/chaos-textract.mjs
node --check scripts/textract-vendor.mjs
```

The Pages release guard runs the tests and copies the approved package files; Cloudflare must report a successful production deployment of the target commit before this feature is called live. Real Android and desktop OCR acceptance tests remain a separate requirement.
