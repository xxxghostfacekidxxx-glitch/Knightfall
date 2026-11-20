/**
 * Knightfall's original, dependency-free ZIP reader for OOXML documents.
 * Uses browser-standard DecompressionStream for RFC1951 DEFLATE bytes.
 * No third-party JavaScript, WASM, external services, or file uploads.
 */
const MAX_ENTRIES=2048,MAX_SECTION=4*1024*1024,MAX_TOTAL=24*1024*1024;
const dec=new TextDecoder("utf-8",{fatal:false});
function uint16(view,i){return view.getUint16(i,true);}
function uint32(view,i){return view.getUint32(i,true);}
function requireRange(bytes,offset,length,label){
 if(!Number.isSafeInteger(offset)||!Number.isSafeInteger(length)||offset<0||length<0||offset+length>bytes.length)
  throw Error("Invalid ZIP: "+label+" outside file bounds.");
}
export function listKnightfallZipEntries(bytes){
 if(!(bytes instanceof Uint8Array))throw Error("Expected ZIP bytes.");
 const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 let footer=-1;
 for(let i=bytes.length-22;i>=Math.max(0,bytes.length-22-65535);i--){
  if(i>=0&&uint32(v,i)===0x06054b50&&i+22+uint16(v,i+20)<=bytes.length){footer=i;break;}
 }
 if(footer<0)throw Error("ZIP directory not found.");
 if(uint16(v,footer+4)||uint16(v,footer+6))throw Error("Multi-disk ZIP archives are unsupported.");
 const count=uint16(v,footer+10),directoryLength=uint32(v,footer+12),start=uint32(v,footer+16);
 if(count>MAX_ENTRIES)throw Error("ZIP has too many entries.");
 requireRange(bytes,start,directoryLength,"central directory");
 const entries=new Map();let cursor=start;
 for(let i=0;i<count;i++){
  requireRange(bytes,cursor,46,"central directory header");
  if(uint32(v,cursor)!==0x02014b50)throw Error("Malformed ZIP central directory.");
  const flags=uint16(v,cursor+8),method=uint16(v,cursor+10);
  const compressed=uint32(v,cursor+20),size=uint32(v,cursor+24);
  const nameLength=uint16(v,cursor+28),extraLength=uint16(v,cursor+30),commentLength=uint16(v,cursor+32);
  const localOffset=uint32(v,cursor+42);
  requireRange(bytes,cursor+46,nameLength+extraLength+commentLength,"directory entry");
  const name=dec.decode(bytes.subarray(cursor+46,cursor+46+nameLength));
  cursor+=46+nameLength+extraLength+commentLength;
  if(!name||name.endsWith("/")||name.includes("..")||name.startsWith("/"))continue;
  if(flags&1)throw Error("Encrypted ZIP archives are unsupported.");
  if(method!==0&&method!==8)throw Error("ZIP compression method "+method+" is unsupported.");
  if(size>MAX_SECTION||compressed>MAX_SECTION)continue;
  // Do not count images, thumbnails and embedded media against a text
  // extraction budget when we never decompress them. Count actual reads below.
  entries.set(name,{name,method,compressed,size,localOffset});
 }
 return entries;
}
async function inflateDeflate(data,format="deflate-raw"){
 if(typeof DecompressionStream!=="function")
  throw Error("Your browser lacks built-in ZIP decompression.");
 let stream;
 try{stream=new Blob([data]).stream().pipeThrough(new DecompressionStream(format));}
 catch{throw Error("Your browser cannot decompress this file's format.");}
 try{
  const reader=stream.getReader(),chunks=[];let length=0;
  while(true){
   const {done,value}=await reader.read();
   if(done)break;
   length+=value.byteLength;
   if(length>MAX_SECTION){await reader.cancel();throw Error("ZIP section exceeds 4 MB expansion limit.");}
   chunks.push(value);
  }
  const output=new Uint8Array(length);let offset=0;
  for(const chunk of chunks){output.set(chunk,offset);offset+=chunk.byteLength;}
  return output;
 }catch(e){throw Error("ZIP decompression failed: "+String(e?.message||e));}
}
export async function openKnightfallZip(file){
 const bytes=file instanceof Uint8Array?file:new Uint8Array(await file.arrayBuffer());
 if(bytes.length>18*1024*1024)throw Error("Document exceeds the 18 MB limit.");
 const entries=listKnightfallZipEntries(bytes);
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 let expandedRead=0;
 return Object.freeze({
  names:()=>[...entries.keys()],
  async read(path){
   const item=entries.get(path);
   if(!item)return "";
   const i=item.localOffset;
   requireRange(bytes,i,30,"local header");
   if(uint32(view,i)!==0x04034b50)throw Error("Invalid local ZIP header.");
   const start=i+30+uint16(view,i+26)+uint16(view,i+28);
   requireRange(bytes,start,item.compressed,"compressed content");
   const packed=bytes.subarray(start,start+item.compressed);
   const plain=item.method===0?packed:await inflateDeflate(packed);
   if(plain.length!==item.size)throw Error("ZIP section length failed verification.");
   expandedRead+=plain.length;
   if(expandedRead>MAX_TOTAL)throw Error("Extracted Office XML exceeds memory safety limits.");
   return dec.decode(plain);
  }
 });
}
const xmlEntity=text=>String(text||"").replace(/&(?:amp|lt|gt|quot|apos|#(?:x[0-9a-fA-F]+|\d+));/g,entity=>{
 const names={"&amp;":"&","&lt;":"<","&gt;":">","&quot;":'"',"&apos;":"'"};
 if(Object.hasOwn(names,entity))return names[entity];
 const number=entity[2].toLowerCase()==="x"?parseInt(entity.slice(3,-1),16):parseInt(entity.slice(2,-1),10);
 return Number.isInteger(number)&&number>0&&number<=0x10ffff&&!(number>=0xd800&&number<=0xdfff)?String.fromCodePoint(number):"\ufffd";
});
function nameOf(tag){return tag.includes(":")?tag.slice(tag.indexOf(":")+1):tag;}
function attrsFrom(source){
 const attrs=Object.create(null);
 for(const part of source.matchAll(/([:\w.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)){
  attrs[part[1]]=xmlEntity(part[2]??part[3]??"");
 }
 return attrs;
}
// Original bounded forward-only XML tokenizer. It reads OOXML text and metadata
// without external libraries; DTD and user-defined entities are rejected.
export function parseKnightfallXml(raw){
 if(!raw)return [];
 if(raw.length>MAX_SECTION)throw Error("Document XML exceeds 4 MB.");
 if(/<!DOCTYPE|<!ENTITY/i.test(raw))throw Error("Unsafe XML document type or custom entity.");
 const tokens=[];
 const pattern=/<!--[\s\S]*?-->|<!\[CDATA\[([\s\S]*?)\]\]>|<((?:[^"'<>]|"[^"]*"|'[^']*')+)>|([^<]+)/g;
 let match;
 while((match=pattern.exec(raw))){
  if(tokens.length>450000)throw Error("Document XML has too many elements.");
  if(match[0].startsWith("<!--"))continue;
  if(match[1]!==undefined){tokens.push({type:"text",value:match[1]});continue;}
  if(match[3]!==undefined){tokens.push({type:"text",value:xmlEntity(match[3])});continue;}
  const part=match[2].trim();
  if(!part||part.startsWith("?")||part.startsWith("!"))continue;
  const end=part.startsWith("/");
  const self=!end&&part.endsWith("/");
  const found=part.match(/^\/?\s*([^\s/>]+)/);
  if(!found)continue;
  const name=nameOf(found[1]);
  tokens.push({type:end?"end":"start",name,attrs:end?null:attrsFrom(part.slice(found[0].length)),self});
 }
 return tokens;
}
function xmlText(raw,{paragraph="p",textTag="t",includeRows=false}={}){
 const tokens=parseKnightfallXml(raw),pieces=[];
 let textDepth=0,skip=0,lastCell=false;
 const space=()=>{const prev=pieces.at(-1);if(prev&&prev!=="\n"&&prev!=="\t")pieces.push("\n");};
 for(const token of tokens){
  if(token.type==="text"){if(textDepth&&!skip)pieces.push(token.value);continue;}
  if(token.type==="start"){
   if(token.name==="del"||token.name==="delText"){skip++;continue;}
   if(skip)continue;
   if(token.name===paragraph||token.name==="br"||token.name==="cr")space();
   if(token.name==="tr"&&includeRows){space();lastCell=false;}
   if(token.name==="tc"&&includeRows){if(lastCell)pieces.push("\t");lastCell=true;}
   if(token.name==="tab")pieces.push("\t");
   if(token.name===textTag)textDepth++;
   if(token.self&&token.name===textTag)textDepth=Math.max(0,textDepth-1);
  }else{
   if(token.name==="del"||token.name==="delText"){skip=Math.max(0,skip-1);continue;}
   if(token.name===textTag)textDepth=Math.max(0,textDepth-1);
  }
 }
 return pieces.join("").replace(/[\t ]+\n/g,"\n").replace(/^\s+|\s+$/g,"").replace(/\n{4,}/g,"\n\n\n");
}
function sharedStrings(raw){
 const entries=[];let inside=false,depth=0,value="",reading=false;
 for(const token of parseKnightfallXml(raw)){
  if(token.type==="start"&&token.name==="si"){inside=true;depth++;value="";continue;}
  if(token.type==="end"&&token.name==="si"){if(inside){entries.push(value);inside=false;depth=Math.max(0,depth-1);}continue;}
  if(!inside)continue;
  if(token.type==="start"&&token.name==="t")reading=true;
  if(token.type==="end"&&token.name==="t")reading=false;
  if(token.type==="text"&&reading)value+=token.value;
 }
 return entries;
}
function worksheetRows(raw,strings){
 const rows=[];let row=null,cell=null,field="",used=0;
 const finishCell=()=>{
  if(!cell||!row)return;
  let value=cell.type==="s"?strings[Number(cell.value)]??"":cell.type==="inlineStr"?cell.inline:cell.value;
  if(!value&&cell.formula)value="[Formula value not cached: "+cell.formula.slice(0,100)+"]";
  if(value)row.push((cell.ref||"cell")+"="+value);
  cell=null;
 };
 const finishRow=()=>{
  if(!row)return;
  if(row.length){
   const line=row.join(" | ");used+=line.length;
   if(used<170000)rows.push(line);
  }
  row=null;
 };
 for(const t of parseKnightfallXml(raw)){
  if(t.type==="start"){
   if(t.name==="row"){finishRow();row=[];}
   else if(t.name==="c"&&row){finishCell();cell={ref:t.attrs.r||"",type:t.attrs.t||"",value:"",inline:"",formula:""};}
   else if(["v","t","f"].includes(t.name)&&cell)field=t.name;
  }else if(t.type==="text"){
   if(cell&&field==="v")cell.value+=t.value;
   if(cell&&field==="t")cell.inline+=t.value;
   if(cell&&field==="f")cell.formula+=t.value;
  }else{
   if(t.name===field)field="";
   if(t.name==="c")finishCell();
   if(t.name==="row")finishRow();
  }
  if(rows.length>=10000||used>=170000)break;
 }
 finishCell();finishRow();
 return rows;
}
function workbookSheetDefinitions(raw){
 const definitions=[];
 for(const token of parseKnightfallXml(raw))
  if(token.type==="start"&&token.name==="sheet")
   definitions.push({name:token.attrs.name||"",id:token.attrs["r:id"]||""});
 return definitions;
}
function worksheetRelationships(raw){
 const relationships=new Map();
 for(const token of parseKnightfallXml(raw)){
  if(token.type!=="start"||token.name!=="Relationship")continue;
  const {Id,Target,Type,TargetMode}=token.attrs;
  if(!Id||!Target||TargetMode==="External"||!/\/worksheet$/.test(Type||""))continue;
  const stack=Target.startsWith("/")?[]:["xl"];
  let unsafe=false;
  for(const segment of Target.split("/")){
   if(!segment||segment===".")continue;
   if(segment===".."){if(!stack.length){unsafe=true;break;}stack.pop();}
   else if(/^[A-Za-z0-9_.-]+$/.test(segment))stack.push(segment);
   else {unsafe=true;break;}
  }
  const path=stack.join("/");
  if(!unsafe&&/^xl\/worksheets\/sheet\d+\.xml$/.test(path))relationships.set(Id,path);
 }
 return relationships;
}
export async function readKnightfallOffice(file,extension,{notify=()=>{},cancelled=()=>false}={}){
 const zip=await openKnightfallZip(file);
 const read=path=>zip.read(path);
 const names=zip.names();
 const check=()=>{if(cancelled())throw Error("Extraction cancelled.");};
 if(extension==="docx"){
  notify("Reading Word text and tables…");
  const original=await read("word/document.xml");
  if(!original)throw Error("Word document content is missing or too large.");
  const sections=[xmlText(original,{paragraph:"p",includeRows:true})];
  const extras=names.filter(s=>/^word\/(?:header|footer|footnotes|endnotes)\d*\.xml$/.test(s)).slice(0,16);
  for(const path of extras){
   check();
   const fragment=xmlText(await read(path),{paragraph:"p",includeRows:true});
   if(fragment)sections.push("["+(path.includes("header")?"Header":path.includes("footer")?"Footer":"Note")+"]\n"+fragment);
  }
  return sections.filter(Boolean).join("\n\n");
 }
 if(extension==="pptx"){
  const allSlides=names.filter(s=>/^ppt\/slides\/slide\d+\.xml$/.test(s))
   .sort((a,b)=>Number(a.match(/slide(\d+)/)[1])-Number(b.match(/slide(\d+)/)[1]));
  const slides=allSlides.slice(0,60);
  if(!slides.length)throw Error("No PowerPoint slide text files found.");
  const out=[];
  for(let i=0;i<slides.length;i++){
   check();notify("Reading slide "+(i+1)+" of "+slides.length+"…");
   out.push("Slide "+(i+1)+"\n"+(xmlText(await read(slides[i]))||"[No editable text on this slide]"));
  }
  if(allSlides.length>slides.length)
   out.push("[Notice: Only "+slides.length+" of "+allSlides.length+" slides were processed. Split the presentation to extract the remainder.]");
  return out.join("\n\n");
 }
 if(extension!=="xlsx")throw Error("Unsupported Office format.");
 notify("Reading Excel shared strings and cell values…");
 const strings=sharedStrings(await read("xl/sharedStrings.xml"));
 const definitions=workbookSheetDefinitions(await read("xl/workbook.xml"));
 const rels=worksheetRelationships(await read("xl/_rels/workbook.xml.rels"));
 const available=names.filter(s=>/^xl\/worksheets\/sheet\d+\.xml$/.test(s))
  .sort((a,b)=>Number(a.match(/sheet(\d+)/)[1])-Number(b.match(/sheet(\d+)/)[1]));
 const linked=definitions.map((def,i)=>({path:rels.get(def.id)||available[i]||"",label:def.name||"Sheet "+(i+1)}))
  .filter(def=>available.includes(def.path));
 const allSheets=(linked.length?linked:available.map((path,i)=>({path,label:definitions[i]?.name||"Sheet "+(i+1)})));
 const sheets=allSheets.slice(0,25);
 if(!sheets.length)throw Error("No Excel worksheets found.");
 const out=[];
 for(let i=0;i<sheets.length;i++){
  check();notify("Reading worksheet "+(i+1)+" of "+sheets.length+"…");
  const rows=worksheetRows(await read(sheets[i].path),strings);
  out.push("Sheet "+(i+1)+(sheets[i].label?" · "+sheets[i].label:"")+"\n"+(rows.join("\n")||"[No cached cell values]"));
 }
 if(!out.some(x=>!/^\s*Sheet[^\n]*\n\[No cached cell values\]$/.test(x)))
  throw Error("Spreadsheet contains no readable cached text or values.");
 if(allSheets.length>sheets.length)
  out.push("[Notice: Only "+sheets.length+" of "+allSheets.length+" worksheets were processed. Split the workbook to extract the remainder.]");
 return out.join("\n\n");
}
