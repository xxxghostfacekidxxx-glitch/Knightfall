/**
 * Staff-only public source map for Knightfall. Read-only GitHub Contents API,
 * fixed repository and strict directory allowlist, at an immutable main SHA.
 * Not a filesystem walker, code runner, or secret/configuration viewer.
 */
import {validateKnightfallFileArgs} from "./chaos-repo-reader.mjs";
const ROOT="https://api.github.com/repos/xxxghostfacekidxxx-glitch/Knightfall";
const DIRS=Object.freeze(["backend","backend/src","public","public/arcade","scripts","tests","docs",".github/workflows"]);
export async function listKnightfallFiles(input={}, {fetcher=fetch}={}){
 const directory=String(input.directory||"").trim();
 if(!DIRS.includes(directory))throw Error("Select one allowlisted Knightfall source directory.");
 const query=String(input.query||"").trim().toLowerCase();
 if(query.length>64||/[\u0000-\u001f]/.test(query))throw Error("Use a short source-file search phrase.");
 const terms=[...new Set(query.split(/\s+/).filter(Boolean))].slice(0,6);
 const opts={method:"GET",redirect:"error",headers:{accept:"application/vnd.github+json","user-agent":"Knightfall-MissChaos/1.0"},
  signal:typeof AbortSignal.timeout==="function"?AbortSignal.timeout(7000):undefined};
 let sha,list;
 try{
  const ref=await fetcher(ROOT+"/git/ref/heads/main",opts);
  if(!ref?.ok)throw Error("Cannot verify GitHub main.");
  const branch=await ref.json();
  if(branch.ref!=="refs/heads/main"||branch.object?.type!=="commit"||!/^[a-f0-9]{40}$/i.test(branch.object?.sha||""))
   throw Error("Invalid GitHub branch.");
  sha=branch.object.sha.toLowerCase();
  const target=ROOT+"/contents/"+directory.split("/").map(encodeURIComponent).join("/")+"?ref="+sha;
  const response=await fetcher(target,opts);
  if(!response?.ok)throw Error("Source directory unavailable.");
  if(Number(response.headers?.get?.("content-length")||0)>1600000)throw Error("Source listing too large.");
  list=await response.json();
  if(!Array.isArray(list)||list.length>1000)throw Error("GitHub directory listing is incomplete.");
 }catch{throw Error("Verified public source index is unavailable. No files were changed.");}
 const files=[];
 for(const item of list){
  if(item?.type!=="file"||!item.path||!item.name)continue;
  try{validateKnightfallFileArgs({path:item.path});}catch{continue;}
  if(!terms.every(term=>item.path.toLowerCase().includes(term)))continue;
  files.push({path:item.path,size_bytes:Number.isSafeInteger(item.size)?Math.max(0,item.size):null,
   blob_sha:/^[a-f0-9]{40}$/i.test(item.sha||"")?item.sha:null});
 }
 files.sort((a,b)=>a.path.localeCompare(b.path));
 return {repository:"xxxghostfacekidxxx-glitch/Knightfall",directory,query,branch:"main",commit_sha:sha,
  shown:Math.min(40,files.length),matched:files.length,results:files.slice(0,40),
  source_url:"https://github.com/xxxghostfacekidxxx-glitch/Knightfall/tree/"+sha+"/"+directory,
  read_only:true,limited_to:"One immediate allowlisted directory. Only eligible source file metadata, never contents. GitHub API may truncate directories larger than its page limit.",
  next_step:files.length>40?"Refine your filename search before reading a source excerpt.":"Use staff.repo_file with an exact returned path to inspect code."};
}
