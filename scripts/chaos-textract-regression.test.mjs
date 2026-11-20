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
test("PDF header may follow a short transport preface without losing document text",async()=>{
 const base=pdf(["1 0 obj << /Type /Page /Contents 2 0 R >> endobj",
  "2 0 obj << /Length 16 >>\nstream\nBT (READY) Tj ET\nendstream\nendobj"]);
 const prefix=enc.encode("\n\n  \n\n  ");
 const padded=new Uint8Array(prefix.length+base.length);
 padded.set(prefix,0);padded.set(base,prefix.length);
 assert.match(await readKnightfallPdf(padded),/READY/);
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
test("PDF compressed object streams expose page dictionaries to text extraction",async()=>{
 const pages="<< /Type /Pages /Kids [3 0 R] /Count 1 >>";
 const page="<< /Type /Page /Parent 2 0 R /Contents 4 0 R >>";
 const head="2 0 3 "+(pages.length+1)+" ";
 const compressed=deflateSync(enc.encode(head+pages+" "+page));
 const stream="BT (Compressed objects work) Tj ET";
 const doc=Buffer.concat([
  Buffer.from("%PDF-1.7\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"+
   "10 0 obj << /Type /ObjStm /N 2 /First "+head.length+" /Length "+compressed.length+" /Filter /FlateDecode >>\nstream\n"),
  compressed,
  Buffer.from("\nendstream\nendobj\n4 0 obj << /Length "+stream.length+" >>\nstream\n"+stream+"\nendstream\nendobj\n%%EOF")
 ]);
 assert.match(await readKnightfallPdf(new Uint8Array(doc)),/Compressed objects work/);
});
test("PDF direct stream lengths preserve literal endstream words inside extracted text",async()=>{
 const text="BT (The word endstream belongs to the document) Tj ET";
 const bytes=pdf([
  "1 0 obj << /Type /Page /Contents 2 0 R >> endobj",
  "2 0 obj << /Length "+text.length+" >>\nstream\n"+text+"\nendstream\nendobj"
 ]);
 assert.match(await readKnightfallPdf(bytes),/word endstream belongs/);
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
function ascii85Encode(bytes){
 let out="";
 for(let i=0;i<bytes.length;i+=4){
  const chunk=bytes.subarray(i,i+4),nbytes=chunk.length;
  const word=((chunk[0]||0)*16777216)+((chunk[1]||0)*65536)+((chunk[2]||0)*256)+(chunk[3]||0);
  if(nbytes===4&&word===0){out+="z";continue;}
  let remaining=word,digits="";
  for(let j=0;j<5;j++){digits=String.fromCharCode(33+remaining%85)+digits;remaining=Math.floor(remaining/85);}
  out+=nbytes===4?digits:digits.slice(0,nbytes+1);
 }
 return out+"~>";
}
test("PDF ASCII85 plus Flate, ASCIIHex and run-length filter pipelines",async()=>{
 const words="BT (Decoded a real encoded stream) Tj ET";
 const compressed=deflateSync(enc.encode(words));
 const ascii85=Buffer.from(ascii85Encode(compressed),"ascii");
 const hex=Buffer.from(enc.encode(words)).toString("hex")+">";
 const run=Uint8Array.from([words.length-1,...enc.encode(words),128]);
 for(const [name,encoded,filter] of [
  ["ASCII85",ascii85,"/Filter [/ASCII85Decode /FlateDecode]"],
  ["ASCIIHex",Buffer.from(hex,"ascii"),"/Filter /ASCIIHexDecode"],
  ["RunLength",run,"/Filter /RunLengthDecode"]
 ]){
  const wrapped=Buffer.concat([
   Buffer.from("%PDF-1.5\n1 0 obj << /Type /Page /Contents 2 0 R >> endobj\n2 0 obj << /Length "+encoded.length+" "+filter+" >>\nstream\n"),
   Buffer.from(encoded),Buffer.from("\nendstream\nendobj\n%%EOF")
  ]);
  const result=await readKnightfallPdf(new Uint8Array(wrapped));
  assert.match(result,/Decoded a real encoded stream/,name+" PDF pipeline");
 }
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


test("XLSX follows workbook relationship IDs and retains sheet labels with > characters",async()=>{
 const doc=zipPack([
  ["xl/workbook.xml",'<workbook><sheets><sheet name="First > Revenue" sheetId="9" r:id="rId9"/><sheet name="Second" sheetId="2" r:id="rId2"/></sheets></workbook>'],
  ["xl/_rels/workbook.xml.rels",'<Relationships><Relationship Id="rId9" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="/xl/worksheets/sheet1.xml"/></Relationships>'],
  ["xl/worksheets/sheet1.xml",'<worksheet><sheetData><row><c r="A1" t="inlineStr"><is><t>SECOND_VALUE</t></is></c></row></sheetData></worksheet>'],
  ["xl/worksheets/sheet3.xml",'<worksheet><sheetData><row><c r="A1" t="inlineStr"><is><t>FIRST_VALUE</t></is></c></row></sheetData></worksheet>']
 ]);
 const result=await extractTextract(file("relationships.xlsx",doc));
 assert.match(result.text,/Sheet 1 · First > Revenue\nA1=FIRST_VALUE/);
 assert.match(result.text,/Sheet 2 · Second\nA1=SECOND_VALUE/);
 assert.ok(result.text.indexOf("FIRST_VALUE")<result.text.indexOf("SECOND_VALUE"));
});
test("DOCX keeps visible field text without copying hidden instructions",async()=>{
 const xml='<w:document><w:body><w:p><w:r><w:t>Page: </w:t></w:r><w:r><w:instrText>HYPERLINK "https://private.invalid"</w:instrText></w:r><w:r><w:t>Visible label</w:t></w:r></w:p></w:body></w:document>';
 const result=await extractTextract(file("fields.docx",zipPack([["word/document.xml",xml]])));
 assert.match(result.text,/Page: Visible label/);
 assert.doesNotMatch(result.text,/HYPERLINK|private.invalid/);
});
test("PDF ToUnicode bfrange arrays map actual glyph codes to text",async()=>{
 const cmap="1 beginbfrange\n<0001> <0003> [<0041> <0042> <0043>]\nendbfrange";
 const stream="BT /F1 12 Tf <000100020003> Tj ET";
 const bytes=pdf([
  "1 0 obj << /Type /Page /Contents 2 0 R /Resources << /Font << /F1 7 0 R >> >> >> endobj",
  "2 0 obj << /Length "+stream.length+" >>\nstream\n"+stream+"\nendstream\nendobj",
  "7 0 obj << /Type /Font /ToUnicode 8 0 R >> endobj",
  "8 0 obj << /Length "+cmap.length+" >>\nstream\n"+cmap+"\nendstream\nendobj"
 ]);
 assert.match(await readKnightfallPdf(bytes),/ABC/);
});
test("Text files with UTF-16LE, UTF-16BE and UTF-8 BOMs are decoded correctly",async()=>{
 for(const endian of ["le","be"]){
  const str="Knightfall: café ✓";
  const bytes=new Uint8Array(2+str.length*2);
  bytes.set(endian==="le"?[255,254]:[254,255]);
  for(let i=0;i<str.length;i++){
   const code=str.charCodeAt(i);bytes[2+i*2]=endian==="le"?code&255:code>>8;
   bytes[3+i*2]=endian==="le"?code>>8:code&255;
  }
  const result=await extractTextract(file("unicode.txt",bytes));
  assert.equal(result.text,str);
 }
 const bom=new Uint8Array([239,187,191,...enc.encode("UTF-8 works")]);
 assert.equal((await extractTextract(file("utf8.txt",bom))).text,"UTF-8 works");
});
