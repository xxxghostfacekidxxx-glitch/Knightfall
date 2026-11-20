import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {TEXTRACT_LIMITS,validateTextractFile,normalizeTextractText,buildTextractDraft} from "../public/chaos-textract-core.mjs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const file=(name,size=1024)=>({name,size});

test("Textract handles safe supported formats and bounds file size",()=>{
 for(const name of ["page.PDF","note.txt","scan.png","work.docx","data.xlsx","deck.pptx","script.js"]){
  assert.equal(typeof validateTextractFile(file(name)),"string");
 }
 assert.throws(()=>validateTextractFile(file("archive.exe")),/Unsupported/);
 assert.throws(()=>validateTextractFile(file("document.pdf",TEXTRACT_LIMITS.bytes+1)),/18 MB/);
 assert.throws(()=>validateTextractFile(file("empty.txt",0)),/nonempty/);
 assert.throws(()=>validateTextractFile(null),/nonempty/);
});
test("Textract cleans text without destroying paragraphs",()=>{
 assert.equal(normalizeTextractText("A  \r\n\r\nB\u0000\n\n\n\nC"),"A\n\nB\n\n\nC");
});
test("Textract draft is bounded, labeled as untrusted source and never sent directly",()=>{
 const draft=buildTextractDraft("receipt.pdf","amount: $12.45\n"+"X".repeat(30000),"List important figures");
 assert.ok(draft.length<=3900,"Miss Chaos composer caps messages at 4000");
 assert.match(draft,/TASK: List important figures/);
 assert.match(draft,/FILE: receipt\.pdf/);
 assert.match(draft,/not instructions/);
 assert.match(draft,/Excerpt truncated/);
 assert.match(draft,/END SOURCE/);
 assert.doesNotMatch(draft,/X{30000}/);
});
test("Textract is linked to all chat modes, floating console, Creator Foundry and navigation index",()=>{
 const page=read("public/chaos-textract.html");
 const controller=read("public/chaos-textract.mjs");
 const core=read("public/chaos-textract-core.mjs");
 const chat=read("public/miss-chaos.js");
 const kit=read("public/miss-chaos-field-kit.mjs");
 const foundry=read("public/devil-tools.html");
 const index=read("backend/chaos-public-tools.mjs");
 for(const path of ["public/miss-chaos.html","public/samantha-chaos.html"])assert.match(read(path),/href="\/chaos-textract\.html"/);
 assert.match(foundry,/href="\/chaos-textract\.html"/);
 assert.match(index,/url:"\/chaos-textract\.html"/);
 assert.match(kit,/chaos-textract\.html\?return=/);
 assert.match(page,/id="textract-file"/);
 assert.match(page,/id="textract-handoff"/);
 assert.match(controller,/sessionStorage\.setItem\("knightfall:textract-draft"/);
 assert.match(chat,/sessionStorage\.removeItem\("knightfall:textract-draft"/);
 assert.match(controller,/location\.assign\(returnToChat\(\)\)/);
 assert.doesNotMatch(core,/AWS_ACCESS|@aws-sdk|api\.ash-fall\.com|\bfetch\s*\(/);
 assert.doesNotMatch(controller,/\bfetch\s*\(|XMLHttpRequest|FormData/);
});
test("Textract code supports PDF OCR fallback and zipped Office documents",()=>{
 const core=read("public/chaos-textract-core.mjs");
 for(const term of ["pdf.worker.min.mjs","tesseract.min.js","jszip.min.js","word/document.xml","xl/sharedStrings.xml","ppt/slides/","recognizeImage(canvas"])assert.ok(core.includes(term),term);
});
