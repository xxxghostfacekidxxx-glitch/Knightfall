/**
 * Knightfall PDF text-layer reader, original implementation.
 * Supports standard page trees, content operators, Flate streams and a subset
 * of embedded ToUnicode CMaps. This is not a PDF renderer or scanned-page OCR.
 * Source bytes never leave the browser.
 */
const LATIN=new TextDecoder("windows-1252"),UTF8=new TextDecoder();
/* PDF bytes must remain reversible: TextDecoder("latin1") aliases to Windows-1252
   in browsers, corrupting binary deflate streams at bytes 0x80–0x9F. */
function binaryString(bytes){
 const chunks=[];
 for(let i=0;i<bytes.length;i+=8192)chunks.push(String.fromCharCode(...bytes.subarray(i,i+8192)));
 return chunks.join("");
}
const MAX_DOCUMENT=18*1024*1024,MAX_OBJECTS=3500,MAX_STREAM=5*1024*1024,MAX_TOTAL=30*1024*1024;
const utf16=(bytes)=>{
 let output="";
 for(let i=0;i+1<bytes.length;i+=2)output+=String.fromCharCode((bytes[i]<<8)|bytes[i+1]);
 return output;
};
function bytesForLiteral(raw){
 const out=[];
 for(let i=0;i<raw.length;i++){
  const c=raw.charCodeAt(i);
  if(c!==92){out.push(c&255);continue;}
  const next=raw[++i];
  if(next===undefined)break;
  const escape={n:10,r:13,t:9,b:8,f:12};
  if(next==="\r"||next==="\n"){if(next==="\r"&&raw[i+1]==="\n")i++;continue;}
  if(Object.hasOwn(escape,next)){out.push(escape[next]);continue;}
  if(/[0-7]/.test(next)){
   let oct=next;
   while(oct.length<3&&/[0-7]/.test(raw[i+1]||""))oct+=raw[++i];
   out.push(parseInt(oct,8));continue;
  }
  out.push(next.charCodeAt(0)&255);
 }
 return Uint8Array.from(out);
}
function hexBytes(hex){
 const clean=hex.replace(/\s+/g,"");const buffer=new Uint8Array(Math.ceil(clean.length/2));
 for(let i=0;i<clean.length;i+=2)buffer[i/2]=parseInt((clean.slice(i,i+2)+"0").slice(0,2),16)||0;
 return buffer;
}
function pdfText(bytes,map){
 if(map?.size){
  let out="",i=0;
  const sizes=[...new Set([...map.keys()].map(k=>k.length/2))].sort((a,b)=>b-a);
  while(i<bytes.length){
   let found=false;
   for(const n of sizes){
    if(n+i>bytes.length)continue;
    const hex=Array.from(bytes.subarray(i,i+n),x=>x.toString(16).padStart(2,"0")).join("").toUpperCase();
    if(map.has(hex)){out+=map.get(hex);i+=n;found=true;break;}
   }
   if(!found){out+=LATIN.decode(bytes.subarray(i,i+1));i++;}
  }
  return out;
 }
 if(bytes.length>=2&&bytes[0]===254&&bytes[1]===255)return utf16(bytes.subarray(2));
 if(bytes.length>=4&&bytes.length%2===0&&bytes.every((value,index)=>index%2===1||value===0))return utf16(bytes);
 if(bytes.length>=3&&bytes[0]===239&&bytes[1]===187&&bytes[2]===191)return UTF8.decode(bytes.subarray(3));
 return LATIN.decode(bytes);
}
// Each token has a type; PDF literal strings can contain nested parentheses.
function lexPdf(raw){
 const out=[];
 let i=0;
 while(i<raw.length&&out.length<150000){
  let c=raw[i];
  if(/\s/.test(c)){i++;continue;}
  if(c==="%"){while(i<raw.length&&!/[\r\n]/.test(raw[i]))i++;continue;}
  if(c==="("){
   const start=++i;let depth=1,escaped=false;
   while(i<raw.length&&depth){
    c=raw[i++];
    if(escaped){escaped=false;continue;}
    if(c==="\\"){escaped=true;continue;}
    if(c==="(")depth++;
    if(c===")")depth--;
   }
   out.push({type:"string",bytes:bytesForLiteral(raw.slice(start,depth?i:i-1))});
   continue;
  }
  if(c==="<"&&raw[i+1]!=="<"){
   const end=raw.indexOf(">",i+1);
   if(end<0)break;
   out.push({type:"string",bytes:hexBytes(raw.slice(i+1,end))});i=end+1;continue;
  }
  if(c==="["||c==="]"||c==="<<"||c===">>"){out.push({type:"operator",value:c});i++;continue;}
  if(c==="/"&&i+1<raw.length){const start=i++;while(i<raw.length&&!/[\s<>\[\]()/%]/.test(raw[i]))i++;out.push({type:"name",value:raw.slice(start,i)});continue;}
  const start=i;
  while(i<raw.length&&!/[\s<>\[\]()/%]/.test(raw[i]))i++;
  if(i===start){i++;continue;}
  const value=raw.slice(start,i);
  out.push(/^[-+]?(?:\d+\.?\d*|\.\d+)$/.test(value)?{type:"number",value:Number(value)}:{type:"operator",value});
 }
 return out;
}
function extractTextOperators(content,fontMaps=new Map()){
 const tokens=lexPdf(String(content||"")),output=[];
 let active=false,buffer="",font="",lastY=null,leading=0,pending=[];
 const flush=()=>{if(buffer.trim())output.push(buffer.trimEnd());buffer="";};
 const append=bytes=>{if(active)buffer+=pdfText(bytes,fontMaps.get(font));};
 const line=()=>{flush();};
 const textArray=value=>{
  for(const item of value){
   if(item.type==="string")append(item.bytes);
   else if(item.type==="number"&&item.value<-150)buffer+=" ";
  }
 };
 for(let i=0;i<tokens.length;i++){
  const item=tokens[i];
  if(item.value==="["){
   let depth=1,parts=[];
   while(i+1<tokens.length&&depth){i++;
    if(tokens[i].value==="[")depth++;
    else if(tokens[i].value==="]")depth--;
    else if(depth===1)parts.push(tokens[i]);
   }
   pending.push({type:"array",parts});continue;
  }
  if(item.type!=="operator"){pending.push(item);if(pending.length>100)pending.shift();continue;}
  const op=item.value;
  if(op==="BT"){active=true;pending=[];lastY=null;continue;}
  if(op==="ET"){if(active)flush();active=false;pending=[];continue;}
  if(!active){pending=[];continue;}
  if(op==="Tf"){const n=pending.findLast(x=>x.type==="name");if(n)font=n.value;pending=[];continue;}
  if(op==="TL"){const n=pending.findLast(x=>x.type==="number");if(n)leading=n.value;pending=[];continue;}
  if(op==="Td"||op==="TD"){
   if(buffer.trim())line();
   if(op==="TD"&&pending.length>=2)leading=-(pending.at(-1)?.value||0);
   pending=[];continue;
  }
  if(op==="T*"||op==="'"){
   line();
   if(op==="'"){const token=pending.findLast(x=>x.type==="string");if(token)append(token.bytes);}
   pending=[];continue;
  }
  if(op==='"'){
   line();const token=pending.findLast(x=>x.type==="string");if(token)append(token.bytes);
   pending=[];continue;
  }
  if(op==="Tm"){
   const values=pending.filter(x=>x.type==="number").map(x=>x.value);
   const y=values.at(-1);
   if(lastY!==null&&y!==undefined&&Math.abs(lastY-y)>1.8)line();
   if(y!==undefined)lastY=y;
   pending=[];continue;
  }
  if(op==="Tj"){const token=pending.findLast(x=>x.type==="string");if(token)append(token.bytes);pending=[];continue;}
  if(op==="TJ"){const array=pending.findLast(x=>x.type==="array");if(array)textArray(array.parts);pending=[];continue;}
  // Unknown operators must not leak their arguments into a subsequent Tj.
  pending=[];
 }
 if(buffer.trim())flush();
 return output.join("\n").replace(/[ \t]+\n/g,"\n").replace(/\n{3,}/g,"\n\n").trim();
}
export function extractKnightfallPdfOperators(content){return extractTextOperators(content);}

function asciiHexDecode(raw,cap){
 const hex=Array.from(raw,b=>String.fromCharCode(b)).join("").split(">")[0].replace(/\s+/g,"");
 if(!/^[\da-fA-F]*$/.test(hex))throw Error("PDF ASCIIHex text contains non-hexadecimal bytes.");
 if(Math.ceil(hex.length/2)>cap)throw Error("Decoded PDF stream exceeds safety limit.");
 return hexBytes(hex);
}
function ascii85Decode(raw,cap){
 const out=[];let word=0,count=0,started=false;
 const emit=(n,amount)=>{
  for(let shift=24;shift>=32-8*amount;shift-=8){
   if(out.length>=cap)throw Error("Decoded PDF ASCII85 stream exceeds safety limit.");
   out.push((n>>>shift)&255);
  }
 };
 for(let i=0;i<raw.length;i++){
  const c=raw[i];
  if(!started&&c===60&&raw[i+1]===126){i++;started=true;continue;}
  if(c===126){if(raw[i+1]===62)break;throw Error("Invalid PDF ASCII85 end marker.");}
  if(c===0||c===9||c===10||c===12||c===13||c===32)continue;
  if(c===122){if(count)throw Error("Misplaced PDF ASCII85 zero block.");emit(0,4);continue;}
  if(c<33||c>117)throw Error("Invalid PDF ASCII85 digit.");
  word=word*85+(c-33);count++;
  if(count===5){
   if(word>0xffffffff)throw Error("PDF ASCII85 word overflow.");
   emit(word>>>0,4);word=0;count=0;
  }
 }
 if(count===1)throw Error("Incomplete PDF ASCII85 stream.");
 if(count){
  for(let i=count;i<5;i++)word=word*85+84;
  if(word>0xffffffff)throw Error("PDF ASCII85 final word overflow.");
  emit(word>>>0,count-1);
 }
 return Uint8Array.from(out);
}
function runLengthDecode(raw,cap){
 const out=[];
 for(let i=0;i<raw.length;){
  const count=raw[i++];if(count===128)break;
  if(count<128){
   if(i+count+1>raw.length)throw Error("Truncated PDF run-length stream.");
   for(let n=0;n<=count;n++)out.push(raw[i++]);
  }else{
   if(i>=raw.length)throw Error("Truncated PDF run-length sequence.");
   const value=raw[i++];for(let n=0;n<257-count;n++)out.push(value);
  }
  if(out.length>cap)throw Error("Expanded PDF stream exceeds safety limit.");
 }
 return Uint8Array.from(out);
}
async function inflatePdf(raw,cap){
 if(typeof DecompressionStream!=="function")throw Error("Browser PDF decompression is unavailable.");
 const reader=new Blob([raw]).stream().pipeThrough(new DecompressionStream("deflate")).getReader();
 const chunks=[];let length=0;
 try{
  for(;;){
   const {done,value}=await reader.read();if(done)break;
   length+=value.byteLength;
   if(length>cap)throw Error("Expanded PDF stream exceeds safety limit.");
   chunks.push(value);
  }
 }finally{reader.releaseLock();}
 const output=new Uint8Array(length);let offset=0;
 for(const chunk of chunks){output.set(chunk,offset);offset+=chunk.byteLength;}
 return output;
}
async function streamBytes(raw,header,sizeLimit=MAX_STREAM){
 if(raw.length>sizeLimit)throw Error("PDF stream exceeds "+Math.round(sizeLimit/1048576)+" MB limit.");
 const meta=String(header||"");
 const filter=meta.match(/\/Filter\s*(?:\[\s*([^\]]+)\s*\]|\/([A-Za-z0-9]+))/);
 if(!filter)return raw;
 const predictor=Number(meta.match(/\/Predictor\s+(\d+)/)?.[1]||1);
 if(predictor>1)throw Error("This PDF uses a filtered predictor the offline text reader cannot decode.");
 const names=[...(filter[1]||"/"+filter[2]).matchAll(/\/([A-Za-z0-9]+)/g)].map(x=>x[1]);
 if(!names.length||names.length>5)throw Error("PDF has an unsupported filter pipeline.");
 let data=raw;
 for(const name of names){
  if(name==="ASCIIHexDecode"||name==="AHx")data=asciiHexDecode(data,sizeLimit);
  else if(name==="ASCII85Decode"||name==="A85")data=ascii85Decode(data,sizeLimit);
  else if(name==="RunLengthDecode"||name==="RL")data=runLengthDecode(data,sizeLimit);
  else if(name==="FlateDecode"||name==="Fl")data=await inflatePdf(data,sizeLimit);
  else throw Error("PDF uses unsupported stream filter: "+name+".");
  if(data.length>sizeLimit)throw Error("Expanded PDF stream exceeds safety limit.");
 }
 return data;
}
async function objectContent(object){
 if(!object)return "";
 const match=/\bstream(?:\r\n|\n|\r)/.exec(object);
 if(!match)return "";
 const start=match.index+match[0].length;
 const header=object.slice(0,match.index);
 const length=header.match(/\/Length\s+(\d+)\b(?!\s+\d+\s+R)/);
 const directLength=length?Number(length[1]):null;
 // With a direct /Length, find the exact stream extent rather than scanning
 // binary for the word "endstream" (which can occur inside actual page text).
 const end=directLength!==null&&directLength<=MAX_STREAM&&start+directLength<=object.length?
  start+directLength:object.indexOf("endstream",start);
 if(end<start)return "";
 let raw=object.slice(start,end);
 if(directLength===null)raw=raw.replace(/\r?\n$/,"");
 const unpacked=await streamBytes(Uint8Array.from(raw,c=>c.charCodeAt(0)&255),header);
 return binaryString(unpacked);
}
function objectReferences(source,name){
 const m=String(source||"").match(new RegExp("\\/"+name+"\\s*(?:\\[([\\s\\S]*?)\\]|(\\d+)\\s+\\d+\\s+R)"));
 if(!m)return [];
 const text=m[1]||m[2]+" 0 R";
 return [...text.matchAll(/(\d+)\s+\d+\s+R/g)].map(x=>Number(x[1])).slice(0,100);
}
async function unpackObjectStreams(objects,cancelled){
 const encoded=[...objects.entries()].filter(([,data])=>/\/Type\s*\/ObjStm\b/.test(data)).slice(0,160);
 for(const [,data] of encoded){
  if(cancelled())throw Error("Extraction cancelled.");
  const num=Number(data.match(/\/N\s+(\d+)/)?.[1]||0),first=Number(data.match(/\/First\s+(\d+)/)?.[1]||0);
  if(num<1||num>800||first<1||first>MAX_STREAM)continue;
  const plain=await objectContent(data);
  if(!plain||plain.length<first)continue;
  const header=plain.slice(0,first);
  const pairs=[...header.matchAll(/(\d+)\s+(\d+)/g)].slice(0,num).map(x=>[Number(x[1]),Number(x[2])]);
  for(let i=0;i<pairs.length;i++){
   if(objects.size>=MAX_OBJECTS)throw Error("PDF contains too many embedded objects.");
   const [id,offset]=pairs[i];
   const end=i+1<pairs.length?first+pairs[i+1][1]:plain.length;
   const start=first+offset;
   if(!Number.isSafeInteger(id)||id<1||start<first||end>plain.length||start>=end)continue;
   if(!objects.has(id))objects.set(id,plain.slice(start,end));
  }
 }
}
function collectPages(objects){
 const candidates=[...objects.entries()].filter(([,obj])=>/\/Type\s*\/Page\b/.test(obj)).map(([n])=>n);
 const catalog=[...objects.values()].find(x=>/\/Type\s*\/Catalog\b/.test(x));
 const root=objectReferences(catalog,"Pages")[0];
 const visited=new Set(),ordered=[];
 function walk(id,depth){
  if(depth>40||visited.has(id))return;
  visited.add(id);const text=objects.get(id)||"";
  if(/\/Type\s*\/Page\b/.test(text)){ordered.push(id);return;}
  for(const child of objectReferences(text,"Kids"))walk(child,depth+1);
 }
 if(root)walk(root,0);
 return (ordered.length?ordered:candidates).slice(0,24);
}
function unicodeMaps(cmapText){
 const map=new Map();
 for(const match of cmapText.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)){
  for(const pair of match[1].matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g))
   map.set(pair[1].toUpperCase(),utf16(hexBytes(pair[2])));
 }
 for(const match of cmapText.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)){
  const lines=match[1].split(/[\r\n]+/);
  for(const line of lines){
   const m=line.match(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/);
   if(!m)continue;
   const start=parseInt(m[1],16),end=parseInt(m[2],16),base=parseInt(m[3],16);
   if(!Number.isSafeInteger(start)||end-start>512||end<start)continue;
   for(let i=start;i<=end;i++){
    const src=i.toString(16).padStart(m[1].length,"0").toUpperCase();
    const dst=(base+i-start).toString(16).padStart(m[3].length,"0");
    map.set(src,utf16(hexBytes(dst)));
   }
  }
 }
 return map;
}
async function fontMapsFor(page,objects){
 const maps=new Map();let sources=[page];
 let parent=objectReferences(page,"Parent")[0],depth=0;
 while(parent&&depth++<12){const item=objects.get(parent);if(!item)break;sources.push(item);parent=objectReferences(item,"Parent")[0];}
 for(const data of sources){
  const fontBlock=data.match(/\/Font\s*<<([\s\S]*?)>>/);
  const resources=objectReferences(data,"Resources")[0];
  const resolved=fontBlock?.[1]||objects.get(resources)?.match(/\/Font\s*<<([\s\S]*?)>>/)?.[1]||"";
  for(const ref of resolved.matchAll(/\/([-\w]+)\s+(\d+)\s+\d+\s+R/g)){
   if(maps.has("/"+ref[1]))continue;
   const font=objects.get(Number(ref[2]));
   const id=objectReferences(font,"ToUnicode")[0];
   if(!id)continue;
   const text=await objectContent(objects.get(id));
   const table=unicodeMaps(text);
   if(table.size)maps.set("/"+ref[1],table);
  }
 }
 return maps;
}
export async function readKnightfallPdf(file,{notify=()=>{},cancelled=()=>false}={}){
 const bytes=file instanceof Uint8Array?file:new Uint8Array(await file.arrayBuffer());
 if(bytes.length>MAX_DOCUMENT)throw Error("PDF exceeds 18 MB.");
 if(bytes.length<8||!binaryString(bytes.subarray(0,Math.min(1024,bytes.length))).includes("%PDF-"))throw Error("This is not a valid PDF header.");
 const text=binaryString(bytes);
 if(/\/Encrypt\s+\d+\s+\d+\s+R/.test(text))throw Error("This PDF is encrypted. Save an unlocked copy before extracting.");
 const objects=new Map();
 for(const item of text.matchAll(/(?:^|[\r\n])\s*(\d{1,9})\s+(\d{1,5})\s+obj\b([\s\S]*?)\bendobj\b/g)){
  if(objects.size>=MAX_OBJECTS)throw Error("PDF contains too many objects.");
  if(item[3].length<=MAX_STREAM*2)objects.set(Number(item[1]),item[3]);
 }
 await unpackObjectStreams(objects,cancelled);
 const pages=collectPages(objects);
 if(!pages.length){
  if(/\/ObjStm\b/.test(text))throw Error("This PDF uses compressed object streams, which this offline reader cannot decode.");
  throw Error("No supported PDF pages found.");
 }
 const parts=[];let valid=0,totalChars=0;
 for(let i=0;i<pages.length;i++){
  if(cancelled())throw Error("Extraction cancelled.");
  notify("Extracting PDF page "+(i+1)+" of "+pages.length+"…");
  const page=objects.get(pages[i]);const refs=objectReferences(page,"Contents").slice(0,48),chunks=[];
  const fonts=await fontMapsFor(page,objects);
  for(const ref of refs){
   if(cancelled())throw Error("Extraction cancelled.");
   const stream=await objectContent(objects.get(ref));
   if(!stream)continue;
   const extracted=extractTextOperators(stream,fonts);
   if(extracted)chunks.push(extracted);
  }
  if(chunks.length){valid++;totalChars+=chunks.join("").length;}
  if(totalChars>MAX_TOTAL)throw Error("PDF extracted text exceeds memory safety limits.");
  parts.push("Page "+(i+1)+"\n"+(chunks.join("\n")||"[No selectable text detected]"));
 }
 if(!valid)throw Error("No selectable text detected. This is likely a scanned PDF, or uses fonts/streams that the offline reader cannot decode. Try an accessible text-layer PDF or image OCR for individual pages.");
 return parts.join("\n\n");
}
