import test from "node:test";
import assert from "node:assert/strict";
import {deflateRawSync} from "node:zlib";
import {listKnightfallZipEntries,openKnightfallZip} from "../public/chaos-textract-native-zip.mjs";
import {extractKnightfallPdfOperators,readKnightfallPdf} from "../public/chaos-textract-native-pdf.mjs";
import {otsuThreshold,normalizeGlyph,classifyGlyph,decodeGlyphMask} from "../public/chaos-textract-native-ocr.mjs";
import {extractTextract,TEXTRACT_ENGINE} from "../public/chaos-textract-core.mjs";
import {readFileSync} from "node:fs";

function zipStored(name,source,method=0){
 const encoder=new TextEncoder(),filename=encoder.encode(name),data=encoder.encode(source);
 const packed=method===8?deflateRawSync(data):data;
 const local=new Uint8Array(30+filename.length+packed.length);
 const view=new DataView(local.buffer);
 view.setUint32(0,0x04034b50,true);view.setUint16(4,20,true);view.setUint16(8,method,true);
 view.setUint32(18,packed.length,true);view.setUint32(22,data.length,true);
 view.setUint16(26,filename.length,true);local.set(filename,30);local.set(packed,30+filename.length);
 const center=new Uint8Array(46+filename.length),c=new DataView(center.buffer);
 c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);
 c.setUint16(10,method,true);c.setUint32(20,packed.length,true);c.setUint32(24,data.length,true);
 c.setUint16(28,filename.length,true);center.set(filename,46);
 const footer=new Uint8Array(22),e=new DataView(footer.buffer);
 e.setUint32(0,0x06054b50,true);e.setUint16(8,1,true);e.setUint16(10,1,true);
 e.setUint32(12,center.length,true);e.setUint32(16,local.length,true);
 const combined=new Uint8Array(local.length+center.length+footer.length);
 combined.set(local);combined.set(center,local.length);combined.set(footer,local.length+center.length);
 return combined;
}
test("Knightfall native ZIP reads stored files and detects corruption",async()=>{
 const buffer=zipStored("word/document.xml","<w:document>KNIGHTFALL</w:document>");
 const index=listKnightfallZipEntries(buffer);
 assert.equal(index.size,1);
 const zip=await openKnightfallZip(buffer);
 assert.equal(await zip.read("word/document.xml"),"<w:document>KNIGHTFALL</w:document>");
 assert.throws(()=>listKnightfallZipEntries(new Uint8Array(22)),/directory not found/);
});
test("Knightfall native ZIP decompresses deflate without third-party library",async()=>{
 const buffer=zipStored("word/document.xml","hello native office engine",8);
 const zip=await openKnightfallZip(buffer);
 assert.equal(await zip.read("word/document.xml"),"hello native office engine");
});
test("original PDF parser reads text operators and a standard uncompressed page",async()=>{
 assert.match(extractKnightfallPdfOperators("BT (Hello Knightfall) Tj ET"),/Hello Knightfall/);
 assert.match(extractKnightfallPdfOperators("BT <00480069> Tj ET"),/Hi/);
 const stream="BT /F1 12 Tf 72 72 Td (Hello Knightfall) Tj ET";
 const pdf="%PDF-1.4\n1 0 obj\n<< /Type /Page /Contents 2 0 R >>\nendobj\n"+
  "2 0 obj\n<< /Length "+stream.length+" >>\nstream\n"+stream+"\nendstream\nendobj\n%%EOF";
 const data=new TextEncoder().encode(pdf);
 const result=await readKnightfallPdf({arrayBuffer:async()=>data.buffer});
 assert.match(result,/Page 1/);assert.match(result,/Hello Knightfall/);
});
test("original pattern OCR components are deterministic and support synthetic glyphs",()=>{
 const sample=new Uint8Array([0,0,0,0,0,255,255,0,0,255,255,0]);
 const threshold=otsuThreshold(sample);
 assert.ok(threshold>=0&&threshold<=255);
 const mask=Uint8Array.from([0,1,0,1,1,1,0,1,0]);
 const template={letter:"A",ratio:1,grid:normalizeGlyph(mask,3,3)};
 const match=classifyGlyph(mask,3,3,[template]);
 assert.equal(match.letter,"A");assert.ok(match.confidence>.8);
 const recognized=decodeGlyphMask(mask,3,3,[template]);
 assert.ok(typeof recognized.text==="string");
});
test("original engine reads text without network or AWS dependencies",async()=>{
 const result=await extractTextract({name:"notes.txt",size:8,text:async()=>"Hello native chaos!"});
 assert.equal(result.text,"Hello native chaos!");
 assert.equal(result.engine,TEXTRACT_ENGINE);
 for(const path of ["public/chaos-textract-core.mjs","public/chaos-textract-native-zip.mjs",
  "public/chaos-textract-native-pdf.mjs","public/chaos-textract-native-ocr.mjs"]){
  const content=readFileSync(new URL("../"+path,import.meta.url),"utf8");
  assert.doesNotMatch(content,/\b(?:fetch|importScripts|XMLHttpRequest)\s*\(/);
  assert.doesNotMatch(content,/pdfjs|tesseract(?:\.js)?|jszip|cdn\./i);
 }
});
