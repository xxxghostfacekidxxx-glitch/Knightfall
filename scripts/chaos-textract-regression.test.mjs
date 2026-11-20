import test from "node:test";
import assert from "node:assert/strict";
import {deflateSync,deflateRawSync} from "node:zlib";
import {extractKnightfallPdfOperators,readKnightfallPdf} from "../public/chaos-textract-native-pdf.mjs";
import {readKnightfallOffice,parseKnightfallXml} from "../public/chaos-textract-native-zip.mjs";
import {extractTextract,TEXTRACT_ENGINE} from "../public/chaos-textract-core.mjs";

const enc=new TextEncoder();
function zipPack(entries){
 const locals=[],centrals=[];let offset=0;
 for(const [name,source,method=8] of entries){
  const filename=enc.encode(name),raw=enc.encode(source),packed=method===8?deflateRawSync(raw):raw;
  const local=new Uint8Array(30+filename.length+packed.length),a=new DataView(local.buffer);
  a.setUint32(0,0x04034b50,true);a.setUint16(4,20,true);a.setUint16(6,0x800,true);a.setUint16(8,method,true);
  a.setUint32(18,packed.length,true);a.setUint32(22,raw.length,true);a.setUint16(26,filename.length,true);
  local.set(filename,30);local.set(packed,30+filename.length);locals.push(local);
  const center=new Uint8Array(46+filename.length),b=new DataView(center.buffer);
  b.setUint32(0,0x02014b50,true);b.setUint16(4,20,true);b.setUint16(6,20,true);
  b.setUint16(8,0x800,true);b.setUint16(10,method,true);b.setUint32(20,packed.length,true);
  b.setUint32(24,raw.length,true);b.setUint16(28,filename.length,true);b.setUint32(42,offset,true);
  center.set(filename,46);centrals.push(center);offset+=local.length;
 }
 const centralLength=centrals.reduce((n,x)=>n+x.length,0),footer=new Uint8Array(22),v=new DataView(footer.buffer);
 v.setUint32(0,0x06054b50,true);v.setUint16(8,entries.length,true);v.setUint16(10,entries.length,true);
 v.setUint32(12,centralLength,true);v.setUint32(16,offset,true);
 const bytes=new Uint8Array(offset+centralLength+footer.length);
 let at=0;for(const part of [...locals,...centrals,footer]){bytes.set(part,at);at+=part.length;}
 return bytes;
}
const file=(name,bytes)=>({name,size:bytes.length,arrayBuffer:async()=>bytes.slice().buffer});
const pdf=objects=>enc.encode("%PDF-1.6\n"+objects.join("\n")+"\n%%EOF");

test("PDF tokenizer preserves escaped parentheses, Unicode, TJ spaces and line breaks",()=>{
 const sample="BT /F1 12 Tf (Hello \\(Knightfall\\)) Tj 0 -18 Td [(two) -220 ( words)] TJ T* <00480069> Tj ET";
 const result=extractKnightfallPdfOperators(sample);
 assert.match(result,/Hello \(Knightfall\)/);
 assert.match(result,/two\s+words/);assert.match(result,/Hi/);
 assert.equal(result.split("\n").length,3);
});
test("PDF honors logical page tree order rather than raw object IDs",async()=>{
 const bytes=pdf([
  "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
  "2 0 obj << /Type /Pages /Kids [9 0 R 3 0 R] /Count 2 >> endobj",
  "3 0 obj << /Type /Page /Contents 4 0 R /Parent 2 0 R >> endobj",
  "4 0 obj << /Length 18 >>\nstream\nBT (SECOND) Tj ET\nendstream\nendobj",
  "9 0 obj << /Type /Page /Contents 10 0 R /Parent 2 0 R >> endobj",
  "10 0 obj << /Length 17 >>\nstream\nBT (FIRST) Tj ET\nendstream\nendobj"
 ]);
 const result=await readKnightfallPdf(bytes);
 assert.match(result,/Page 1\nFIRST/);assert.match(result,/Page 2\nSECOND/);
});
test("PDF ToUnicode CMap maps custom glyph codes to readable characters",async()=>{
 const cmap="2 beginbfchar\n<0001> <0048>\n<0002> <0069>\nendbfchar";
 const stream="BT /F1 14 Tf <00010002> Tj ET";
 const result=await readKnightfallPdf(pdf([
  "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
  "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
  "3 0 obj << /Type /Page /Parent 2 0 R /Contents 4 0 R /Resources << /Font << /F1 7 0 R >> >> >> endobj",
  "4 0 obj << /Length "+stream.length+" >>\nstream\n"+stream+"\nendstream\nendobj",
  "7 0 obj << /Type /Font /Subtype /Type0 /ToUnicode 8 0 R >> endobj",
  "8 0 obj << /Length "+cmap.length+" >>\nstream\n"+cmap+"\nendstream\nendobj"
 ]));
 assert.match(result,/Page 1\nHi/);
});
test("PDF Flate streams preserve binary bytes, scanned PDF returns explicit error",async()=>{
 const bytes=deflateSync(enc.encode("BT (Compressed words) Tj ET"));
 const packed=Buffer.concat([
 Buffer.from("%PDF-1.4\n1 0 obj << /Type /Page /Contents 2 0 R >> endobj\n2 0 obj << /Length "+bytes.length+" /Filter /FlateDecode >>\nstream\n"),
 bytes,Buffer.from("\nendstream\nendobj\n%%EOF")]);
 assert.match(await readKnightfallPdf(new Uint8Array(packed)),/Compressed words/);
 await assert.rejects(()=>readKnightfallPdf(pdf([
  "1 0 obj << /Type /Page /Contents 2 0 R >> endobj",
  "2 0 obj << /Length 0 >>\nstream\n\nendstream\nendobj"
 ])),/No selectable text/);
});
test("DOCX preserves Word runs, paragraphs and escaped entities",async()=>{
 const xml='<w:document><w:body><w:p><w:r><w:t>Hello </w:t></w:r><w:r><w:t>world &amp; chaos</w:t></w:r></w:p><w:p><w:r><w:t>Second line</w:t></w:r></w:p></w:body></w:document>';
 const result=await extractTextract(file("sample.docx",zipPack([["word/document.xml",xml]])));
 assert.match(result.text,/Hello world & chaos\nSecond line/);
 assert.equal(result.engine,TEXTRACT_ENGINE);
});
test("XLSX preserves rich shared strings, inline strings and uncached formulas",async()=>{
 const sheets=zipPack([
  ["xl/sharedStrings.xml",'<sst><si><t>Acme &amp; Sons</t></si></sst>'],
  ["xl/worksheets/sheet1.xml",'<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="inlineStr"><is><t>South</t></is></c><c r="C1"><v>42.5</v></c><c r="D1"><f>SUM(C1,1)</f></c></row></sheetData></worksheet>'],
  ["xl/workbook.xml",'<workbook><sheets><sheet name="Sales &amp; Service" sheetId="1" /></sheets></workbook>']
 ]);
 const result=await extractTextract(file("data.xlsx",sheets));
 for(const phrase of ["Sales & Service","A1=Acme & Sons","B1=South","C1=42.5","Formula value not cached: SUM(C1,1)"]){
  assert.ok(result.text.includes(phrase),"Missing "+phrase+" in "+result.text);
 }
});
test("PPTX text runs are read in slide order",async()=>{
 const data=zipPack([
  ["ppt/slides/slide2.xml",'<p:sld><a:p><a:r><a:t>Second slide</a:t></a:r></a:p></p:sld>'],
  ["ppt/slides/slide1.xml",'<p:sld><a:p><a:r><a:t>First slide</a:t></a:r></a:p></p:sld>']
 ]);
 const result=await extractTextract(file("deck.pptx",data));
 assert.match(result.text,/Slide 1\nFirst slide/);assert.match(result.text,/Slide 2\nSecond slide/);
});
test("Office files with many embedded photos do not spend extraction memory on unused images",async()=>{
 const image="X".repeat(3*1024*1024);
 const entries=[["word/document.xml",'<w:document><w:p><w:t>Text still readable</w:t></w:p></w:document>']];
 for(let i=0;i<9;i++)entries.push(["word/media/photo"+i+".png",image]);
 const bytes=zipPack(entries);
 assert.ok(bytes.length<18*1024*1024,"Compressed test document fits input cap");
 const result=await extractTextract(file("photo-heavy.docx",bytes));
 assert.match(result.text,/Text still readable/);
});
test("Unsafe OOXML DTD and entities are rejected",()=>{
 assert.throws(()=>parseKnightfallXml('<!DOCTYPE a [<!ENTITY x "boom">]><a>&x;</a>'),/Unsafe XML/);
});
