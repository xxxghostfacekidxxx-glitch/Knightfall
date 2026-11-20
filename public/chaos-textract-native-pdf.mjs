/**
 * Lightweight, original Knightfall PDF text reader.
 * Implements a safe subset of the public PDF text-stream operators.
 * It is NOT a general PDF renderer and does NOT OCR scanned PDF pages.
 */
const LATIN=new TextDecoder("windows-1252"),UTF8=new TextDecoder();
const MAX_DOCUMENT=18*1024*1024,MAX_OBJECTS=3000,MAX_STREAM=4*1024*1024;
function decodePdfString(token){
 let bytes=[];
 if(token.startsWith("<")){
  let hex=token.slice(1,-1).replace(/\s+/g,"");
  if(hex.length%2)hex+="0";
  for(let i=0;i<hex.length;i+=2)bytes.push(parseInt(hex.slice(i,i+2),16));
 }else{
  const raw=token.slice(1,-1);
  for(let i=0;i<raw.length;i++){
   let ch=raw.charCodeAt(i);
   if(ch===92){
    const next=raw[++i];if(next===undefined)break;
    const map={n:10,r:13,t:9,b:8,f:12};if(map[next])ch=map[next];
    else if(next==="\n")continue;
    else if(next==="\r"){if(raw[i+1]==="\n")i++;continue;}
    else if(/[0-7]/.test(next)){
     let digits=next;
     while(digits.length<3&&/[0-7]/.test(raw[i+1]||""))digits+=raw[++i];
     ch=parseInt(digits,8)&255;
    }else ch=next.charCodeAt(0);
   }
   bytes.push(ch&255);
  }
 }
 if(bytes.length>1&&bytes[0]===254&&bytes[1]===255){
  let output="";
  for(let i=2;i+1<bytes.length;i+=2)output+=String.fromCharCode((bytes[i]<<8)|bytes[i+1]);
  return output;
 }
 if(bytes.length>2&&bytes[0]===239&&bytes[1]===187&&bytes[2]===191)
  return UTF8.decode(new Uint8Array(bytes.slice(3)));
 return LATIN.decode(new Uint8Array(bytes));
}
export function extractKnightfallPdfOperators(content){
 const blocks=[...String(content||"").matchAll(/\bBT\b([\s\S]*?)\bET\b/g)];
 const out=[];
 const textToken=String.raw`\((?:\\[\s\S]|[^\\)])*\)|<[0-9a-fA-F\s]+>`;
 for(const match of blocks.slice(0,4000)){
  const block=match[1];let lines=[],line="";
  const op=/(?:\[(.*?)\]|(\((?:\\[\s\S]|[^\\)])*\)|<[0-9A-Fa-f\s]+>))\s*(T[Jj]|')|(?:\bT\*\b|[-\d.]+\s+[-\d.]+\s+T[Dd]\b)/gs;
  let found;
  while((found=op.exec(block))){
   if(found[0].endsWith("Td")||found[0].endsWith("TD")){if(line.trim())lines.push(line);line="";continue;}
   if(found[1]!==undefined){
    const inner=found[1];
    const tokens=[...inner.matchAll(new RegExp(textToken+"|[-+]?\\d+(?:\\.\\d+)?","g"))].map(v=>v[0]);
    for(const token of tokens){
     if(token.startsWith("(")||token.startsWith("<"))line+=decodePdfString(token);
     else if(Number(token)<-150)line+=" ";
    }
   }else if(found[2])line+=decodePdfString(found[2]);
   if(found[3]==="'"){if(line.trim())lines.push(line);line="";}
   if(line.length>200000)break;
  }
  if(line.trim())lines.push(line);
  if(lines.length)out.push(lines.join("\n"));
 }
 return out.join("\n").replace(/[ \t]+\n/g,"\n").replace(/\n{3,}/g,"\n\n").trim();
}
async function pdfStreamBytes(raw,filters,sizeLimit=MAX_STREAM){
 if(raw.length>sizeLimit)throw Error("PDF content stream exceeds the safe 4 MB limit.");
 const filter=String(filters||"");
 if(!/\/Filter\b/.test(filter))return raw;
 if(!/\/FlateDecode\b/.test(filter)||/\/(?:LZWDecode|DCTDecode|ASCII85Decode|ASCIIHexDecode|RunLengthDecode)\b/.test(filter))
  throw Error("PDF contains an encoding that the native reader does not yet support.");
 if(typeof DecompressionStream!=="function")throw Error("Browser lacks PDF decompression support.");
 try{
  const stream=new Blob([raw]).stream().pipeThrough(new DecompressionStream("deflate"));
  const reader=stream.getReader();const parts=[];let length=0;
  for(;;){
   const {value,done}=await reader.read();if(done)break;
   length+=value.byteLength;
   if(length>sizeLimit){await reader.cancel();throw Error("Expanded PDF stream exceeds safety limit.");}
   parts.push(value);
  }
  const result=new Uint8Array(length);let offset=0;
  for(const part of parts){result.set(part,offset);offset+=part.byteLength;}
  return result;
 }catch(error){throw Error("PDF deflate decoding failed: "+String(error?.message||error));}
}
export async function readKnightfallPdf(file,{notify=()=>{},cancelled=()=>false}={}){
 const bytes=file instanceof Uint8Array?file:new Uint8Array(await file.arrayBuffer());
 if(bytes.length>MAX_DOCUMENT)throw Error("PDF exceeds 18 MB.");
 const text=LATIN.decode(bytes);
 if(!text.startsWith("%PDF-"))throw Error("This file is not a PDF document.");
 const objects=new Map();
 const matches=text.matchAll(/(?:^|[\r\n])\s*(\d{1,9})\s+(\d{1,5})\s+obj\b([\s\S]*?)\bendobj\b/g);
 for(const item of matches){
  if(objects.size>=MAX_OBJECTS)throw Error("PDF contains too many objects.");
  const id=Number(item[1]),data=item[3];
  if(data.length<=MAX_STREAM*2)objects.set(id,data);
 }
 const pages=[...objects.entries()].filter(([,v])=>/\/Type\s*\/Page\b/.test(v))
  .sort((a,b)=>a[0]-b[0]).slice(0,24);
 if(!pages.length)throw Error("This PDF does not have an accessible page tree.");
 const parts=[];let count=0;
 for(const [pageId,page] of pages){
  if(cancelled())throw Error("Extraction cancelled.");
  count++;notify("Reading native PDF text layer "+count+" of "+pages.length+"…");
  const contents=page.match(/\/Contents\s*(?:\[\s*([\d\sR]+)\s*\]|(\d+)\s+\d+\s+R)/);
  if(!contents){parts.push("Page "+count+"\n[No readable text stream]");continue;}
  const refs=[...String(contents[1]||contents[2]+" 0 R").matchAll(/(\d+)\s+\d+\s+R/g)].map(x=>Number(x[1])).slice(0,40);
  const chunks=[];
  for(const ref of refs){
   const object=objects.get(ref);if(!object)continue;
   const marker=/\bstream(?:\r\n|\n|\r)/.exec(object);if(!marker)continue;
   const start=marker.index+marker[0].length;
   const end=object.indexOf("endstream",start);if(end<start)continue;
   let raw=object.slice(start,end).replace(/\r?\n$/,"");
   if(raw.length>MAX_STREAM)throw Error("PDF object too large.");
   const binary=Uint8Array.from(raw,ch=>ch.charCodeAt(0)&255);
   const decoded=await pdfStreamBytes(binary,object.slice(0,marker.index));
   chunks.push(extractKnightfallPdfOperators(LATIN.decode(decoded)));
  }
  parts.push("Page "+count+"\n"+(chunks.filter(Boolean).join("\n")||"[No recognized text on this page]"));
 }
 const result=parts.join("\n\n").trim();
 if(!parts.some(s=>s.includes("\n")&&!/^\s*Page \d+\s*\n\[(?:No|.*unsupported)/.test(s)))
  throw Error("No selectable PDF text found. Native PDF rendering/scanned-page OCR is not supported yet.");
 return result;
}
