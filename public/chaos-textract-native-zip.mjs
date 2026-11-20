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
 const entries=new Map();let cursor=start,total=0;
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
  total+=size;
  if(total>MAX_TOTAL)throw Error("Expanded ZIP contents exceed memory safety limits.");
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
   return dec.decode(plain);
  }
 });
}
export function parseKnightfallXml(raw){
 if(!raw)return null;
 if(raw.length>MAX_SECTION)throw Error("Document XML is too large.");
 if(/<!DOCTYPE|<!ENTITY/i.test(raw))throw Error("XML entities and document types are not supported.");
 if(typeof DOMParser!=="function")throw Error("Your browser has no XML parser.");
 const xml=new DOMParser().parseFromString(raw,"application/xml");
 if(xml.querySelector("parsererror"))throw Error("Document XML is invalid.");
 return xml;
}
function childText(element,name){
 const matches=element.getElementsByTagName(name);
 return [...matches].map(el=>el.textContent||"").join("");
}
function xmlLines(raw,tag="t",paragraph="p"){
 const xml=parseKnightfallXml(raw);if(!xml)return "";
 const parts=[];
 for(const node of xml.getElementsByTagName("*")){
  if(node.localName===paragraph||node.localName==="tr")parts.push("\n");
  if(node.localName===tag&&!node.children.length)parts.push(node.textContent||"");
  if(node.localName==="tab")parts.push("\t");
 }
 return parts.join("").replace(/\n{3,}/g,"\n\n").trim();
}
export async function readKnightfallOffice(file,extension,{notify=()=>{},cancelled=()=>false}={}){
 const zip=await openKnightfallZip(file);
 const read=path=>zip.read(path);
 const names=zip.names(),check=()=>{if(cancelled())throw Error("Extraction cancelled.");};
 if(extension==="docx"){
  notify("Reading Word paragraphs with Knightfall's own parser…");
  return xmlLines(await read("word/document.xml"));
 }
 if(extension==="pptx"){
  const paths=names.filter(s=>/^ppt\/slides\/slide\d+\.xml$/.test(s))
   .sort((a,b)=>Number(a.match(/slide(\d+)/)[1])-Number(b.match(/slide(\d+)/)[1])).slice(0,60);
  if(!paths.length)throw Error("No slide XML found.");
  const slides=[];
  for(let i=0;i<paths.length;i++){check();notify("Reading slide "+(i+1));
   slides.push("Slide "+(i+1)+"\n"+xmlLines(await read(paths[i])));
  }
  return slides.join("\n\n");
 }
 if(extension!=="xlsx")throw Error("Unsupported Office format.");
 notify("Reading spreadsheet cells…");
 const strings=[],shared=parseKnightfallXml(await read("xl/sharedStrings.xml"));
 if(shared)for(const entry of shared.getElementsByTagName("si"))strings.push(childText(entry,"t"));
 const paths=names.filter(s=>/^xl\/worksheets\/sheet\d+\.xml$/.test(s))
  .sort((a,b)=>Number(a.match(/sheet(\d+)/)[1])-Number(b.match(/sheet(\d+)/)[1])).slice(0,15);
 const sheets=[];
 for(let i=0;i<paths.length;i++){
  check();const xml=parseKnightfallXml(await read(paths[i]));if(!xml)continue;
  const lines=[];let used=0;
  for(const row of xml.getElementsByTagName("row")){
   const cells=[];
   for(const cell of row.getElementsByTagName("c")){
    const kind=cell.getAttribute("t"),value=childText(cell,"v");
    const content=kind==="s"?strings[Number(value)]||"":kind==="inlineStr"?childText(cell,"t"):value;
    if(content)cells.push((cell.getAttribute("r")||"")+"="+content);
   }
   if(cells.length){const line=cells.join(" | ");used+=line.length;lines.push(line);}
   if(used>150000)break;
  }
  sheets.push("Sheet "+(i+1)+"\n"+lines.join("\n"));
 }
 if(!sheets.length)throw Error("No readable spreadsheet cells.");
 return sheets.join("\n\n");
}
