import {parseRepository,inspectRepository} from "./alien-eyes-core.mjs";
export function canReviewTools(user,partner){return Boolean(user?.status==="active"&&user.role==="god"&&Number.isSafeInteger(Number(user.id))&&Number(user.id)>0&&Number(partner?.invited_by)===Number(user.id));}
const registry=Object.freeze([{"id":"alien-eyes","name":"Alien Eyes","description":"Inspect a known public software repository; review declared license and maintenance metadata.","scope":"Public software projects only","execution":"owner-only"},{"id":"tree-sitter","name":"Tree-sitter","description":"Incremental concrete syntax trees and language grammars","source":"https://github.com/tree-sitter/tree-sitter","license":"MIT","division":"Forge / Byte","scope":"Software development research","execution":"not installed"},{"id":"pyright","name":"Pyright","description":"Python static type analysis","source":"https://github.com/microsoft/pyright","license":"MIT","division":"Patch / Forge","scope":"Software development research","execution":"not installed"},{"id":"tokenizers","name":"Hugging Face Tokenizers","description":"Train and evaluate original subword tokenizers","source":"https://github.com/huggingface/tokenizers","license":"Apache-2.0","division":"Tokenizer / Corpus","scope":"Software development research","execution":"not installed"},{"id":"llama-cpp","name":"llama.cpp","description":"Local inference runtime for compatible independently licensed weights","source":"https://github.com/ggml-org/llama.cpp","license":"MIT","division":"Relay / Quant","scope":"Software development research","execution":"not installed"},{"id":"lm-evaluation-harness","name":"LM Evaluation Harness","description":"Reproducible model benchmarking","source":"https://github.com/EleutherAI/lm-evaluation-harness","license":"MIT","division":"Baseline / Distill","scope":"Software development research","execution":"not installed"},{"id":"wasmtime","name":"Wasmtime","description":"WebAssembly runtime candidate for isolated execution research","source":"https://github.com/bytecodealliance/wasmtime","license":"Apache-2.0 with LLVM exception (verify exact revision)","division":"Kernel / Warden","scope":"Software development research","execution":"not installed"}]);
const key=id=>"eye_tool_review:"+id;
const allowed=new Set(["osiris","scrapped"]);
// Legacy distribution intents never granted access. Existing seven tools are authorized for Osiris only.
function normalizeDecision(row){let x;try{x=JSON.parse(row?.value||"null");}catch{}return {decision:x?.decision==="scrapped"?"scrapped":"osiris",updatedAt:typeof x?.updatedAt==="string"?x.updatedAt:null};}
export async function handleEyeToolReview(request,env,url,user,respond,{fetcher=fetch}={}){
 const prefix="/api/god/eye/tools";
 if(url.pathname!==prefix&&!url.pathname.startsWith(prefix+"/"))return null;
 try{
 const partner=await env.DB.prepare("SELECT invited_by FROM ai_handoff_partner WHERE slot=1").first();
 if(!canReviewTools(user,partner))return respond({error:"Verified Osiris owner access required."},403);
 const read=async id=>normalizeDecision(await env.DB.prepare("SELECT value FROM site_settings WHERE key=?").bind(key(id)).first());
 if(url.pathname===prefix&&request.method==="GET"){const tools=await Promise.all(registry.map(async t=>({...t,...await read(t.id)})));return respond({tools,publication:"Osiris-only implementation authorized. Installation and execution status are tracked separately; no public or Isis access."});}
 if(url.pathname===prefix+"/alien-eyes/inspect"&&request.method==="GET"){
 if((await read("alien-eyes")).decision==="scrapped")return respond({error:"This candidate has been scrapped."},403);
 let reference;try{reference=parseRepository(url.searchParams.get("repository"));}catch{return respond({error:"Enter an exact public GitHub project reference."},400);}
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
 try{return respond({report:await inspectRepository(reference.owner+"/"+reference.repo,{fetcher,signal:controller.signal})});}catch{return respond({error:"Public project metadata unavailable or rate limited."},502);}finally{clearTimeout(timer);}
 }
 const readinessMatch=url.pathname.match(/^\/api\/god\/eye\/tools\/([a-z0-9-]+)\/inspect$/);
 if(readinessMatch&&request.method==="GET"){
  const tool=registry.find(t=>t.id===readinessMatch[1]);if(!tool?.source)return respond({error:"Unknown software tool."},404);
  if((await read(tool.id)).decision==="scrapped")return respond({error:"This candidate has been scrapped."},403);
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
  try{const reference=parseRepository(tool.source);const report=await inspectRepository(reference.owner+"/"+reference.repo,{fetcher,signal:controller.signal});return respond({id:tool.id,report,execution:tool.execution});}catch{return respond({error:"Upstream project metadata unavailable or rate limited."},502);}finally{clearTimeout(timer);}
 }
 const decisionMatch=url.pathname.match(/^\/api\/god\/eye\/tools\/([a-z0-9-]+)\/decision$/);
 if(decisionMatch&&request.method==="POST"){
 const id=decisionMatch[1];if(!registry.some(t=>t.id===id))return respond({error:"Unknown candidate."},404);
 const source=request.headers.get("origin");if(source!=="https://ash-fall.com"&&source!=="https://www.ash-fall.com")return respond({error:"Invalid request origin."},403);
 if(!/^application\/json(?:;|$)/i.test(request.headers.get("content-type")||""))return respond({error:"JSON required."},415);
 const raw=await request.text();if(raw.length>512)return respond({error:"Request too large."},413);
 let input;try{input=JSON.parse(raw);}catch{return respond({error:"Invalid JSON."},400);}
 if(!allowed.has(input?.decision))return respond({error:"Invalid review decision."},400);
 const updatedAt=new Date().toISOString(),value=JSON.stringify({decision:input.decision,updatedAt});
 await env.DB.prepare("INSERT INTO site_settings (key,value,updated_by,updated_at) VALUES (?,?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_by=excluded.updated_by,updated_at=excluded.updated_at").bind(key(id),value,user.id,updatedAt).run();
 return respond({id,...await read(id),publication:"Osiris-only setting saved. No public or Isis access."});
 }
 return respond({error:"Unknown tool review operation."},404);
 }catch{return respond({error:"Tool review unavailable."},503);}
}
