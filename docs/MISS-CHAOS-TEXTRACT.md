# Knightfall Textract · free document-reading workbench (2026-11-20)

## Entry points
- `/chaos-textract.html` is a standalone local document reader.
- Creator Foundry > Creator Desk > Textract, both full Miss Chaos chats, and the floating Chaos Console point to it.
- The public navigation index can guide members asking Miss Chaos about extracting documents.
- The floating console supplies a mode-specific return path: standard, verified Osiris, or verified Isis. These URLs do not grant permissions; the existing Worker checks authorization.

## Supported files and limits
- Text files, CSV, HTML, JSON, Markdown, JavaScript, XML, and similar source text: direct local read.
- DOCX: Word document XML text. XLSX: cached spreadsheet cell values. PPTX: slide text. These use JSZip 3.10.1.
- PDF: text layer extraction with PDF.js 4.10.38, first 24 pages. Pages with almost no text may use Tesseract.js 5.1.1 (English OCR), at most eight pages.
- PNG/JPEG/WebP/GIF/BMP/AVIF: Tesseract.js English OCR if the browser supports decoding the format.
- Max selected file size 18 MB, max output 180,000 characters. Browser memory and CDN availability can impose stricter practical limits.
- OCR does not perfectly preserve layout, handwriting, dates, merged table cells, spreadsheets, or mathematical notation. Verify the original. This is not a document-editing conversion service.

## Privacy and costs
Files remain in the browser during extraction. The site does not upload the original via the Worker, object storage, or AWS. Tesseract.js, PDF.js, and JSZip are loaded on demand from pinned public CDN URLs. OCR English-language data may be downloaded on first use. There is no AWS Textract bill or credential to configure.
Third-party library delivery requires connectivity and the ability to load CDN resources; using CDNs rather than vendored code introduces a supply-chain dependency and means strict offline use is not supported. Document text is *not* transferred to Miss Chaos automatically.

## Explicit chat handoff
1. User chooses a file, selects Extract text, and reviews/edits the text.
2. Copy or Download .txt works locally.
3. Stage draft for Miss Chaos puts up to 3,900 characters of task, filename, and an excerpt into tab-scoped sessionStorage. The draft treats document text as untrusted, not system commands.
4. The browser navigates to the prior chat mode. The authenticated chat initialization consumes and deletes that draft (10-minute expiry), and fills the message composer. The user still must press Send.
5. Longer documents must be split or transferred as separate excerpts. Site message retention policies apply only *after* the user sends the extracted text in chat.

## Regression checks
`node --check public/chaos-textract-core.mjs`
`node --check public/chaos-textract.mjs`
`node --test scripts/chaos-textract.test.mjs`

These are also wired into `.github/workflows/miss-chaos-tests.yml` for pushes to `main`. Live browser OCR still needs acceptance testing on Android and desktop; a syntactic check is not equivalent to confirmed extraction against real files.
