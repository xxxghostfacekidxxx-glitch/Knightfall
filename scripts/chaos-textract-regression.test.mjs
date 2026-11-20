import test from "node:test";
import assert from "node:assert/strict";
import {deflateSync,deflateRawSync} from "node:zlib";
import {extractKnightfallPdfOperators,readKnightfallPdf,decodeKnightfallPdfRaster} from "../public/chaos-textract-native-pdf.mjs";
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


test("PDF exceeding the 24-page safety limit displays a visible truncation notice",async()=>{
 const objects=[];
 for(let i=1;i<=25;i++){
  const page=i*2-1,content=i*2,stream="BT (PAGE_"+i+") Tj ET";
  objects.push(page+" 0 obj << /Type /Page /Contents "+content+" 0 R >> endobj");
  objects.push(content+" 0 obj << /Length "+stream.length+" >>\nstream\n"+stream+"\nendstream\nendobj");
 }
 const result=await extractTextract(file("too-many-pages.pdf",pdf(objects)));
 assert.match(result.text,/PAGE_24/);
 assert.doesNotMatch(result.text,/PAGE_25/);
 assert.match(result.text,/Only 24 of 25 PDF pages were processed/);
 assert.match(result.warning,/first 24 PDF pages/);
});
test("Large PowerPoint and Excel files report safely omitted slides and sheets",async()=>{
 const slides=Array.from({length:61},(_,i)=>[
  "ppt/slides/slide"+(i+1)+".xml",'<p:sld><a:p><a:t>SLIDE_'+(i+1)+'</a:t></a:p></p:sld>'
 ]);
 const powerpoint=await extractTextract(file("deck.pptx",zipPack(slides)));
 assert.match(powerpoint.text,/Only 60 of 61 slides were processed/);
 assert.match(powerpoint.warning,/extraction is incomplete/);
 const sheets=Array.from({length:26},(_,i)=>[
  "xl/worksheets/sheet"+(i+1)+".xml",'<worksheet><row><c r="A1" t="inlineStr"><is><t>SHEET_'+(i+1)+'</t></is></c></row></worksheet>'
 ]);
 const excel=await extractTextract(file("budget.xlsx",zipPack(sheets)));
 assert.match(excel.text,/Only 25 of 26 worksheets were processed/);
 assert.match(excel.warning,/extraction is incomplete/);
});


test("PowerPoint reads relationship-defined presentation order rather than slide filenames",async()=>{
 const slideXml=value=>'<p:sld><p:spTree><a:p><a:r><a:t>'+value+'</a:t></a:r></a:p></p:spTree></p:sld>';
 const doc=zipPack([
  ["ppt/slides/slide1.xml",slideXml("Last slide in presentation")],
  ["ppt/slides/slide3.xml",slideXml("First slide in presentation")],
  ["ppt/slides/slide2.xml",slideXml("Middle slide in presentation")],
  ["ppt/presentation.xml",'<p:presentation><p:sldIdLst><p:sldId id="256" r:id="rId3"/><p:sldId id="257" r:id="rId2"/><p:sldId id="258" r:id="rId1"/></p:sldIdLst></p:presentation>'],
  ["ppt/_rels/presentation.xml.rels",'<Relationships><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="/ppt/slides/slide3.xml"/></Relationships>']
 ]);
 const result=await extractTextract(file("out-of-order.pptx",doc));
 assert.match(result.text,/Slide 1\nFirst slide in presentation/);
 assert.match(result.text,/Slide 2\nMiddle slide in presentation/);
 assert.match(result.text,/Slide 3\nLast slide in presentation/);
 assert.ok(result.text.indexOf("First slide")<result.text.indexOf("Last slide"));
});
test("PowerPoint corrupted slide relationships fail visibly instead of silently reordering",async()=>{
 const doc=zipPack([
  ["ppt/slides/slide1.xml",'<p:sld><a:p><a:t>ONE</a:t></a:p></p:sld>'],
  ["ppt/presentation.xml",'<p:presentation><p:sldIdLst><p:sldId r:id="lostSlide"/></p:sldIdLst></p:presentation>'],
  ["ppt/_rels/presentation.xml.rels",'<Relationships><Relationship Id="lostSlide" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="../secret.xml"/></Relationships>']
 ]);
 await assert.rejects(()=>extractTextract(file("broken.pptx",doc)),/missing or unsupported slide/);
});
test("Excel truncated worksheet content shows an explicit partial-extraction warning",async()=>{
 const cells=Array.from({length:10002},(_,i)=>'<row r="'+(i+1)+'"><c r="A'+(i+1)+'" t="inlineStr"><is><t>X</t></is></c></row>').join("");
 const doc=zipPack([["xl/worksheets/sheet1.xml",'<worksheet><sheetData>'+cells+'</sheetData></worksheet>']]);
 const result=await extractTextract(file("long-rows.xlsx",doc));
 assert.match(result.text,/Worksheet text exceeded the local/);
 assert.match(result.warning,/extraction is incomplete/);
 assert.match(result.text,/A1=X/);
});


test("DOCX tables retain adjacent columns and separated rows in reading order",async()=>{
 const xml='<w:document><w:body><w:tbl>'+
  '<w:tr><w:tc><w:p><w:r><w:t>Item</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Price</w:t></w:r></w:p></w:tc></w:tr>'+
  '<w:tr><w:tc><w:p><w:r><w:t>Pen</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>2</w:t></w:r></w:p></w:tc></w:tr>'+
  '</w:tbl></w:body></w:document>';
 const result=await extractTextract(file("table.docx",zipPack([["word/document.xml",xml]])));
 assert.match(result.text,/Item\tPrice\nPen\t2/);
});
test("OOXML rejects conflicting or spoofed local ZIP directory names",async()=>{
 const xml='<w:document><w:p><w:r><w:t>Readable</w:t></w:r></w:p></w:document>';
 const duplicated=zipPack([["word/document.xml",xml],["word/document.xml",xml]]);
 await assert.rejects(()=>extractTextract(file("duplicate.docx",duplicated)),/duplicate document entries/);
 const spoofed=zipPack([["word/document.xml",xml]]);
 spoofed[30]=spoofed[30]===119?120:119;
 await assert.rejects(()=>extractTextract(file("spoofed.docx",spoofed)),/local filename does not match/);
});


test("PDF horizontal positioning retains spaces without incorrectly starting new lines",()=>{
 const operators="BT 1 0 0 1 72 700 Tm (LEFT) Tj 40 0 Td (RIGHT) Tj 1 0 0 1 72 680 Tm (NEXT) Tj ET";
 const result=extractKnightfallPdfOperators(operators);
 assert.equal(result,"LEFT RIGHT\nNEXT");
 const matrix="BT 1 0 0 1 72 700 Tm (ONE) Tj 1 0 0 1 150 700 Tm (TWO) Tj ET";
 assert.equal(extractKnightfallPdfOperators(matrix),"ONE TWO");
});


function jpegPdfFixture({draw=true,selectable=false,inheritResources=false}={}){
 const jpeg=new Uint8Array(160).fill(71);jpeg.set([255,216,255,224],0);jpeg.set([255,217],158);
 const content=selectable?"BT (SELECTABLE CONTENT) Tj ET /ScanImage Do":"q 700 0 0 900 0 0 cm "+(draw?"/ScanImage Do":"")+" Q";
 const resources="/Resources << /XObject << /ScanImage 8 0 R >> >>";
 const page="3 0 obj << /Type /Page /Parent 2 0 R /Contents 4 0 R "+(inheritResources?"":resources)+" >> endobj";
 const pageTree="2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 "+(inheritResources?resources:"")+" >> endobj";
 const prefix=Buffer.from("%PDF-1.5\n"+
  "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"+
  pageTree+"\n"+page+"\n"+
  "4 0 obj << /Length "+content.length+" >>\nstream\n"+content+"\nendstream\nendobj\n"+
  "8 0 obj << /Type /XObject /Subtype /Image /Width 700 /Height 900 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length "+jpeg.length+" >>\nstream\n");
 return {jpeg,bytes:new Uint8Array(Buffer.concat([prefix,Buffer.from(jpeg),Buffer.from("\nendstream\nendobj\n%%EOF")]))};
}
test("PDF OCR processes drawn embedded JPEG pages locally and exposes source warnings",async()=>{
 const {bytes,jpeg}=jpegPdfFixture();
 let invoked=0;
 const reader=async blob=>{
  invoked++;
  assert.equal(blob.type,"image/jpeg");
  assert.deepEqual(new Uint8Array(await blob.arrayBuffer()),jpeg);
  return {text:"KNIGHTFALL SCANNED PAGE 123",method:"original-template-ocr",confidence:.89};
 };
 const result=await readKnightfallPdf(bytes,{ocrImage:reader});
 assert.equal(invoked,1);
 assert.match(result,/Page 1\n\[OCR from embedded JPEG image; verify text and numbers\]/);
 assert.match(result,/KNIGHTFALL SCANNED PAGE 123/);
});
test("JPEG PDF OCR supports inherited page resources and does not read unused images",async()=>{
 const inherited=jpegPdfFixture({inheritResources:true});
 let calls=0;
 assert.match(await readKnightfallPdf(inherited.bytes,{ocrImage:async()=>{calls++;return{text:"INHERITED RESOURCES WORK"};}}),/INHERITED RESOURCES WORK/);
 assert.equal(calls,1);
 const hidden=jpegPdfFixture({draw:false});
 await assert.rejects(()=>readKnightfallPdf(hidden.bytes,{ocrImage:async()=>{throw Error("Unreferenced image should never be OCRed");}}),/No selectable text/);
});
test("PDF already containing selectable text never OCRs unrelated scanned image resources",async()=>{
 const example=jpegPdfFixture({selectable:true});
 let calls=0;
 const output=await readKnightfallPdf(example.bytes,{ocrImage:async()=>{calls++;throw Error("Should not OCR");}});
 assert.match(output,/SELECTABLE CONTENT/);
 assert.equal(calls,0);
});
test("PDF JPEG OCR failure reports inability to recover source text rather than fabricating it",async()=>{
 const {bytes}=jpegPdfFixture();
 await assert.rejects(()=>readKnightfallPdf(bytes,{ocrImage:async()=>{throw Error("JPEG unable to be recognized");}}),/No selectable text could be recovered/);
});


test("Excel booleans and built-in/custom date styles retain their raw serials",async()=>{
 const styles='<styleSheet><numFmts><numFmt numFmtId="164" formatCode="yyyy-mm-dd"/></numFmts>'+
  '<cellXfs><xf numFmtId="0"/><xf numFmtId="14"/><xf numFmtId="164"/></cellXfs></styleSheet>';
 const sheet='<worksheet><sheetData><row r="1">'+
  '<c r="A1" t="b"><v>1</v></c><c r="B1" t="b"><v>0</v></c>'+
  '<c r="C1" s="1"><v>45292</v></c><c r="D1" s="2"><v>45293</v></c>'+
  '<c r="E1"><v>45292</v></c>'+
  '</row></sheetData></worksheet>';
 const data=zipPack([["xl/styles.xml",styles],["xl/worksheets/sheet1.xml",sheet]]);
 const result=await extractTextract(file("dates.xlsx",data));
 assert.doesNotMatch(result.text,/Sheet 1 · Sheet 1/,"Default worksheet heading must not be repeated");
 for(const piece of ["A1=TRUE","B1=FALSE","C1=2024-01-01 [Excel serial 45292]",
  "D1=2024-01-02 [Excel serial 45293]","E1=45292"])
  assert.ok(result.text.includes(piece),"Missing "+piece+" in "+result.text);
});
test("Excel 1904 date system is respected, and the fictitious 1900-02-29 is not invented",async()=>{
 const styles='<styleSheet><cellXfs><xf numFmtId="14"/></cellXfs></styleSheet>';
 const sheet='<worksheet><sheetData><row><c r="A1" s="0"><v>0</v></c>'+
  '<c r="B1" s="0"><v>1</v></c></row></sheetData></worksheet>';
 const workbook='<workbook><workbookPr date1904="1"/></workbook>';
 const text=(await extractTextract(file("1904.xlsx",zipPack([
  ["xl/styles.xml",styles],["xl/workbook.xml",workbook],["xl/worksheets/sheet1.xml",sheet]
 ])))).text;
 assert.match(text,/A1=1904-01-01 \[Excel serial 0\]/);
 assert.match(text,/B1=1904-01-02 \[Excel serial 1\]/);
 const leap=(await extractTextract(file("excel-1900.xlsx",zipPack([
  ["xl/styles.xml",styles],["xl/worksheets/sheet1.xml",
   '<worksheet><row><c r="A1" s="0"><v>60</v></c></row></worksheet>']
 ])))).text;
 assert.match(leap,/A1=60/);
 assert.doesNotMatch(leap,/1900-02-29/);
});


test("Text extraction cap reports omitted characters instead of silently dropping them",async()=>{
 const input="A".repeat(180000)+"Z".repeat(41);
 const result=await extractTextract({name:"large.txt",size:input.length,text:async()=>input});
 assert.equal(result.text.length,180000);
 assert.equal(result.characters,180041);
 assert.equal(result.truncated,true);
 assert.match(result.warning,/41 additional characters were omitted/);
 assert.doesNotMatch(result.text,/Z/);
});
test("Text cap never leaves a dangling Unicode surrogate",async()=>{
 const input="A".repeat(179999)+"🦂"+"END";
 const result=await extractTextract({name:"unicode.txt",size:input.length,text:async()=>input});
 assert.equal(result.truncated,true);
 assert.equal(result.text.length,179999);
 assert.equal(result.text.at(-1),"A");
 assert.match(result.warning,/5 additional characters were omitted/);
});


test("Flate grayscale PDF images decode to exact local pixels without a PDF renderer",async()=>{
 const raw=new Uint8Array(120*120).fill(242);
 raw[0]=0;raw[120]=14;raw[121]=70;
 const decoded=await decodeKnightfallPdfRaster({
  kind:"flate",width:120,height:120,channels:1,predictor:1,bytes:deflateSync(raw)
 });
 assert.equal(decoded.width,120);assert.equal(decoded.height,120);
 assert.deepEqual([...decoded.pixels.slice(0,8)],[0,0,0,255,242,242,242,255]);
 assert.deepEqual([...decoded.pixels.slice(120*4,120*4+8)],[14,14,14,255,70,70,70,255]);
});
test("PDF PNG up/sub row predictors reconstruct grayscale pixels correctly",async()=>{
 const width=120,height=120,encoded=new Uint8Array((width+1)*height);
 for(let row=0;row<height;row++){
  const offset=row*(width+1);
  encoded[offset]=row===0?1:2; // First row Sub; subsequent rows Up
  if(row===0)encoded[offset+1]=213;
 }
 const decoded=await decodeKnightfallPdfRaster({
  kind:"flate",width,height,channels:1,predictor:15,bytes:deflateSync(encoded)
 });
 assert.deepEqual([...decoded.pixels.slice(0,8)],[213,213,213,255,213,213,213,255]);
 assert.deepEqual([...decoded.pixels.slice((width*height-1)*4)],[213,213,213,255]);
});
test("Flate RGB PDF images extract every color sample without confusing channel order",async()=>{
 const width=120,height=120,raw=new Uint8Array(width*height*3).fill(240);
 raw.set([235,18,99],0);
 const decoded=await decodeKnightfallPdfRaster({
  kind:"flate",width,height,channels:3,predictor:1,bytes:deflateSync(raw)
 });
 assert.deepEqual([...decoded.pixels.slice(0,8)],[235,18,99,255,240,240,240,255]);
});
test("Drawn Flate-scanned PDF page reaches image OCR, with no fabricated text on failure",async()=>{
 const width=120,height=120;
 const raw=new Uint8Array(width*height).fill(250);
 raw.set(new Uint8Array(120).fill(20),0);
 const packed=deflateSync(raw);
 const stream="q /Scan Do Q";
 const prefix=Buffer.from("%PDF-1.4\n"+
  "1 0 obj << /Type /Page /Resources << /XObject << /Scan 8 0 R >> >> /Contents 4 0 R >> endobj\n"+
  "4 0 obj << /Length "+stream.length+" >>\nstream\n"+stream+"\nendstream\nendobj\n"+
  "8 0 obj << /Type /XObject /Subtype /Image /Width "+width+" /Height "+height+
  " /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode /Length "+packed.length+" >>\nstream\n");
 const bytes=new Uint8Array(Buffer.concat([prefix,packed,Buffer.from("\nendstream\nendobj\n%%EOF")]));
 let seen=0;
 const rasterizeImage=async image=>{
  const data=await decodeKnightfallPdfRaster(image);
  assert.equal(image.kind,"flate");
  assert.equal(data.pixels[0],20);
  return new Blob([data.pixels],{type:"image/png"});
 };
 const result=await readKnightfallPdf(bytes,{
  rasterizeImage,
  ocrImage:async blob=>{
   seen++;assert.equal(blob.type,"image/png");
   return {text:"LOCAL FLATE SCAN 42",method:"original-template-ocr"};
  }
 });
 assert.equal(seen,1);
 assert.match(result,/OCR from embedded Flate image/);
 assert.match(result,/LOCAL FLATE SCAN 42/);
 await assert.rejects(()=>readKnightfallPdf(bytes,{
  rasterizeImage,
  ocrImage:async()=>{throw Error("Blurry image");}
 }),/No selectable text could be recovered/);
});
test("Unsupported raster parameters fail instead of inventing pixel data",async()=>{
 await assert.rejects(()=>decodeKnightfallPdfRaster({
  kind:"flate",width:120,height:120,channels:1,predictor:15,bytes:deflateSync(Uint8Array.of(2,3,4))
 }),/unexpected row length/);
 await assert.rejects(()=>decodeKnightfallPdfRaster({
  kind:"flate",width:2000,height:1200,channels:1,predictor:1,bytes:deflateSync(Uint8Array.of(1))
 }),/dimensions exceed supported limits/);
});


test("PDF stream containing literal endobj does not truncate selectable text",async()=>{
 const stream="BT (The word endobj belongs to this page, not PDF syntax) Tj ET";
 const bytes=pdf([
  "1 0 obj << /Type /Page /Contents 2 0 R >> endobj",
  "2 0 obj << /Length "+stream.length+" >>\nstream\n"+stream+"\nendstream\nendobj"
 ]);
 const result=await readKnightfallPdf(bytes);
 assert.match(result,/word endobj belongs to this page/);
});
test("PDF JPEG image bytes may contain endobj without corrupting OCR input",async()=>{
 const example=jpegPdfFixture();
 const prefix=Array.from(example.bytes).findIndex((value,index,a)=>
  value===255&&a[index+1]===216&&a[index+2]===255&&a[index+3]===224);
 assert.ok(prefix>0);
 const phrase=new TextEncoder().encode("endobj inside JPEG metadata");
 example.bytes.set(phrase,prefix+40);
 let called=false;
 const result=await readKnightfallPdf(example.bytes,{ocrImage:async blob=>{
  called=true;
  const source=new Uint8Array(await blob.arrayBuffer());
  assert.ok(Buffer.from(source).includes("endobj inside JPEG metadata"));
  assert.equal(source.length,example.jpeg.length);
  return {text:"INTACT SCANNED IMAGE"};
 }});
 assert.equal(called,true);
 assert.match(result,/INTACT SCANNED IMAGE/);
});
