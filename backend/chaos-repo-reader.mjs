/**
 * Bounded, read-only source-file viewer for the Knightfall repository.
 * No GitHub token, arbitrary URL, branch selection, filesystem execution,
 * secrets, writes, or member records. Raw file text is untrusted data.
 */
const REPO="xxxghostfacekidxxx-glitch/Knightfall";
const PATH=/^(?:(?:backend|public|scripts|tests|docs)\/|\.github\/workflows\/)[a-zA-Z0-9_./-]+\.(?:js|mjs|cjs|ts|tsx|jsx|html|css|json|jsonc|md|yml|yaml)$/;
const FORBIDDEN=/(?:^|\/)\.(?!github\/)|(?:^|\/)\.\.|(?:^|\/)(?:node_modules|dist|coverage|secret|secrets|credentials|private-keys|keys)(?:\/|$)|(?:^|[-_.\/])(?:passwords?|api[-_]?keys?|access[-_]?tokens?|credentials?|secrets?)(?:[-_.\/]|$)/i;
export function validateKnightfallFileArgs(input={}){
 const path=String(input?.path||"");
 if(path.length<5||path.length>190||!PATH.test(path)||FORBIDDEN.test(path)||path.includes("//")||path.includes("\\")||/[\u0000-\u001f]/.test(path))
  throw Error("Choose a public Knightfall source file under backend/, public/, scripts/, tests/, docs/ or .github/workflows/.");
 const start=input.start_line===undefined?1:Number(input.start_line);
 const count=input.line_count===undefined?55:Number(input.line_count);
 if(!Number.isSafeInteger(start)||start<1||start>10000||!Number.isSafeInteger(count)||count<1||count>80)
  throw Error("Start line must be 1–10,000 and line count 1–80.");
 return {path,start,count};
}
export async function readKnightfallFile(input={}, {fetcher=fetch}={}){
 const {path,start,count}=validateKnightfallFileArgs(input);
 // Resolve the trusted current main ref first. Fetch the raw file by immutable SHA,
 // not by the moving /main/ URL: a proposal must identify exactly what was read.
 const refUrl="https://api.github.com/repos/"+REPO+"/git/ref/heads/main";
 let head;
 try{
  const refResponse=await fetcher(refUrl,{method:"GET",redirect:"error",
   headers:{accept:"application/vnd.github+json","user-agent":"Knightfall-MissChaos/1.0"},
   signal:AbortSignal.timeout(7000)});
  if(!refResponse?.ok)throw Error("GitHub ref unavailable.");
  const data=await refResponse.json();
  if(data?.ref!=="refs/heads/main"||data?.object?.type!=="commit"||
     !/^[a-f0-9]{40}$/i.test(data?.object?.sha||""))throw Error("Invalid GitHub ref.");
  head=data.object.sha.toLowerCase();
 }catch{throw Error("Knightfall main commit could not be verified; try again later.");}
 const url="https://raw.githubusercontent.com/"+REPO+"/"+head+"/"+path.split("/").map(encodeURIComponent).join("/");
 let response;
 try{
  response=await fetcher(url,{method:"GET",redirect:"error",
    headers:{accept:"text/plain"},signal:AbortSignal.timeout(7000)});
 }catch{throw Error("Knightfall source is temporarily unreachable.");}
 if(response.status===404)return {available:false,path,branch:"main",commit_sha:head,message:"No matching file exists at the verified main commit.",source_url:url};
 if(!response.ok)throw Error("Knightfall source is unavailable; GitHub returned "+response.status+".");
 const size=Number(response.headers?.get?.("content-length")||0);
 if(size>150000)throw Error("This source file is too large for the bounded preview. Open a smaller module in GitHub.");
 const reader=response.body?.getReader?.();
 let text="";
 if(reader){
  const decoder=new TextDecoder(),max=150000;let bytes=0;
  try{
   while(true){
    const {value,done}=await reader.read();
    if(done)break;
    bytes+=value.byteLength;
    if(bytes>max){await reader.cancel();throw Error("Source file exceeded the 150 KB limit.");}
    text+=decoder.decode(value,{stream:true});
   }
   text+=decoder.decode();
  }finally{reader.releaseLock?.();}
 }else{
  text=await response.text();
  if(new TextEncoder().encode(text).length>150000)throw Error("Source file exceeded the 150 KB limit.");
 }
 const all=text.split(/\r\n|\n|\r/),slice=all.slice(start-1,start-1+count);
 return {available:true,repository:REPO,branch:"main",commit_sha:head,path,source_url:url,
   total_lines:all.length,start_line:start,returned_lines:slice.length,
   lines:slice.map((line,i)=>({number:start+i,text:line.slice(0,300)})),
   long_lines_omitted:slice.some(line=>line.length>300),
   truncated:slice.length>0&&start-1+slice.length<all.length,
   notice:"Immutable main-commit read-only excerpt. A line longer than 300 characters is visibly flagged and must NOT be used for a proposal. This is not an execution, test, or repository write."};
}
