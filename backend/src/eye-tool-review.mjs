import {javascriptCoverage} from "../chaos-forge-javascript-course.mjs";
import {archiveArtwork,listArtwork,readArtwork,deleteArtwork} from "../chaos-forge-artwork-archive.mjs";
import {generateVector} from "../chaos-forge-image.mjs";
import {neuralImage} from "../chaos-forge-neural-image.mjs";
import {dataCoverage} from "../chaos-forge-data-course.mjs";
import {logicCoverage} from "../chaos-forge-logic-course.mjs";
import {forgeCommand,forgeDownload,listForgeArtifacts,deleteForgeArtifact} from "../chaos-independent-forge.mjs";
import {readCodingPractice,codingKnowledge} from "./order100-coding-practice.mjs";
import {readPeerAssessment} from "./order100-peer-assessments.mjs";
import {peerCurriculum,councilResearch,independentAnswer} from "../chaos-order100-council.mjs";
import {handleBuildInsight} from "./build-insight.mjs";
import {parseRepository,inspectRepository,inspectProjectDetails,readAlienCatalog} from "./alien-eyes-core.mjs";
import {RESEARCH_FLEET} from "./chaos-knowledge-fleet.mjs";
import {order66Format} from "../chaos-order66-format.mjs";
import {localModelReply} from "../miss-chaos-local-model.mjs";
import {originalTutor} from "../miss-chaos-original-tutor.mjs";
import {agentEvidence,sharedReviewedKnowledge,reviewedTutorAnswer} from "../chaos-order66-context.mjs";
import {agentSoftwareReferences} from "./order66-software-sharing.mjs";
export function canReviewTools(user,partner){return Boolean(user?.status==="active"&&user.role==="god"&&Number.isSafeInteger(Number(user.id))&&Number(user.id)>0&&Number(partner?.invited_by)===Number(user.id));}
const registry=Object.freeze([{"id":"alien-eyes","name":"Alien Eyes","description":"Inspect a known public software repository; review declared license and maintenance metadata.","scope":"Public software projects only","execution":"owner-only"},{"id":"tree-sitter","name":"Tree-sitter","description":"Incremental concrete syntax trees and language grammars","source":"https://github.com/tree-sitter/tree-sitter","license":"MIT","division":"Forge / Byte","scope":"Software development research","execution":"not installed"},{"id":"pyright","name":"Pyright","description":"Python static type analysis","source":"https://github.com/microsoft/pyright","license":"MIT","division":"Patch / Forge","scope":"Software development research","execution":"not installed"},{"id":"tokenizers","name":"Hugging Face Tokenizers","description":"Train and evaluate original subword tokenizers","source":"https://github.com/huggingface/tokenizers","license":"Apache-2.0","division":"Tokenizer / Corpus","scope":"Software development research","execution":"not installed"},{"id":"llama-cpp","name":"llama.cpp","description":"Local inference runtime for compatible independently licensed weights","source":"https://github.com/ggml-org/llama.cpp","license":"MIT","division":"Relay / Quant","scope":"Software development research","execution":"not installed"},{"id":"lm-evaluation-harness","name":"LM Evaluation Harness","description":"Reproducible model benchmarking","source":"https://github.com/EleutherAI/lm-evaluation-harness","license":"MIT","division":"Baseline / Distill","scope":"Software development research","execution":"not installed"},{"id":"wasmtime","name":"Wasmtime","description":"WebAssembly runtime candidate for isolated execution research","source":"https://github.com/bytecodealliance/wasmtime","license":"Apache-2.0 with LLVM exception (verify exact revision)","division":"Kernel / Warden","scope":"Software development research","execution":"not installed"}]);
const key=id=>"eye_tool_review:"+id;
const allowed=new Set(["osiris","scrapped"]);
// Legacy distribution intents never granted access. Existing seven tools are authorized for Osiris only.
function normalizeDecision(row){let x;try{x=JSON.parse(row?.value||"null");}catch{}return {decision:x?.decision==="scrapped"?"scrapped":"osiris",updatedAt:typeof x?.updatedAt==="string"?x.updatedAt:null};}
export async function handleEyeToolReview(request,env,url,user,respond,{fetcher=(...args)=>globalThis.fetch(...args)}={}){
 const prefix="/api/god/eye/tools";
 if(url.pathname!==prefix&&!url.pathname.startsWith(prefix+"/"))return null;
 try{
 const partner=await env.DB.prepare("SELECT invited_by FROM ai_handoff_partner WHERE slot=1").first();
 if(!canReviewTools(user,partner))return respond({error:"Verified Osiris owner access required."},403);
 const artworkMatch=url.pathname.match(/^\/api\/god\/eye\/tools\/artwork\/([a-f0-9-]{36})$/);
 if(url.pathname===prefix+"/artwork"&&request.method==="GET")return respond(await listArtwork(env,user.id));
 if(artworkMatch&&request.method==="GET"){
  const response=await readArtwork(env,user.id,artworkMatch[1]);if(!response)return respond({error:"Artwork unavailable."},404);
  const origin=request.headers.get("origin");if(["https://ash-fall.com","https://www.ash-fall.com"].includes(origin)){response.headers.set("Access-Control-Allow-Origin",origin);response.headers.set("Access-Control-Allow-Credentials","true");response.headers.set("Vary","Origin");response.headers.set("Access-Control-Expose-Headers","Content-Disposition");}return response;
 }
 if(artworkMatch&&request.method==="DELETE"){
  if(!["https://ash-fall.com","https://www.ash-fall.com"].includes(request.headers.get("origin")))return respond({error:"Same-site request required."},403);
  const deleted=await deleteArtwork(env,user.id,artworkMatch[1]);return respond({deleted},deleted?200:409);
 }
 if(url.pathname===prefix+"/artwork/vector"&&request.method==="POST"){
  if(!["https://ash-fall.com","https://www.ash-fall.com"].includes(request.headers.get("origin"))||!/^application\/json(?:;|$)/i.test(request.headers.get("content-type")||""))return respond({error:"Same-site JSON required."},403);
  const reader=request.body?.getReader();if(!reader)return respond({error:"Request body required."},400);
  let raw="",size=0;const decoder=new TextDecoder("utf-8",{fatal:true});
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>4096){await reader.cancel();return respond({error:"Request too large."},413);}raw+=decoder.decode(value,{stream:true});}raw+=decoder.decode();const a=generateVector(JSON.parse(raw));return respond({artwork:await archiveArtwork(env,user.id,{bytes:new TextEncoder().encode(a.content),mime:"image/svg+xml",engine:a.report.engine,title:a.report.title,settings:a.report})});}catch(error){return respond({error:String(error.message||"Archive failed.").slice(0,240)},400);}finally{reader.releaseLock();}
 }
 if(url.pathname===prefix+"/image-neural"&&request.method==="POST"){
  if(!["https://ash-fall.com","https://www.ash-fall.com"].includes(request.headers.get("origin"))||!/^application\/json(?:;|$)/i.test(request.headers.get("content-type")||""))return respond({error:"Same-site JSON required."},403);
  const reader=request.body?.getReader();if(!reader)return respond({error:"Request body required."},400);
  let raw="",size=0;const decoder=new TextDecoder("utf-8",{fatal:true});
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>4096){await reader.cancel();return respond({error:"Request too large."},413);}raw+=decoder.decode(value,{stream:true});}raw+=decoder.decode();return respond(await neuralImage(env,user.id,JSON.parse(raw)));}catch(error){return respond({error:String(error.message||"Image generation failed.").slice(0,240)},400);}finally{reader.releaseLock();}
 }
 if(url.pathname===prefix+"/build-insight"||url.pathname.startsWith(prefix+"/build-insight/")){
  const disabled=normalizeDecision(await env.DB.prepare("SELECT value FROM site_settings WHERE key=?").bind(key("alien-eyes")).first()).decision==="scrapped";
  if(disabled)return respond({error:"Alien Eyes is disabled."},403);
  return handleBuildInsight(request,env,url,user,respond,{fetcher});
 }
 const downloadMatch=url.pathname.match(/^\/api\/god\/eye\/tools\/forge-download\/([a-f0-9-]{36})$/);
 if(downloadMatch&&request.method==="GET"){
  const file=await forgeDownload(env,user.id,downloadMatch[1]);if(!file)return respond({error:"Artifact expired or not found."},404);
  const origin=request.headers.get("origin");if(["https://ash-fall.com","https://www.ash-fall.com"].includes(origin)){file.headers.set("Access-Control-Allow-Origin",origin);file.headers.set("Access-Control-Allow-Credentials","true");file.headers.set("Vary","Origin");file.headers.set("Access-Control-Expose-Headers","Content-Disposition");}
  return file;
 }
 if(url.pathname===prefix+"/forge"&&request.method==="GET")return respond({artifacts:await listForgeArtifacts(env,user.id)});
 if((url.pathname===prefix+"/forge"&&request.method==="POST")||(downloadMatch&&request.method==="DELETE")){
  if(!["https://ash-fall.com","https://www.ash-fall.com"].includes(request.headers.get("origin")))return respond({error:"Same-site request required."},403);
  if(downloadMatch)return respond({deleted:await deleteForgeArtifact(env,user.id,downloadMatch[1])});
  if(!/^application\/json(?:;|$)/i.test(request.headers.get("content-type")||""))return respond({error:"JSON required."},415);
  const reader=request.body?.getReader();if(!reader)return respond({error:"Request body required."},400);
  const decoder=new TextDecoder("utf-8",{fatal:true});let raw="",size=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>70000){await reader.cancel();return respond({error:"Input too large."},413);}raw+=decoder.decode(value,{stream:true});}raw+=decoder.decode();const input=JSON.parse(raw);const result=await forgeCommand(env,user.id,input.question);return result?respond(result):respond({error:"Unknown Forge command."},400);}catch(error){return respond({error:String(error.message||"Forge failed.").slice(0,240)},400);}finally{reader.releaseLock();}
 }
 if(url.pathname===prefix+"/council"&&request.method==="POST"){
  if(!["https://ash-fall.com","https://www.ash-fall.com"].includes(request.headers.get("origin"))||!/^application\/json(?:;|$)/i.test(request.headers.get("content-type")||""))return respond({error:"Same-site JSON required."},403);
  const raw=await request.text();if(raw.length>3500)return respond({error:"Input too large."},413);
  let input;try{input=JSON.parse(raw);}catch{return respond({error:"Invalid JSON."},400);}
  if(typeof input?.question!=="string"||!input.question.trim()||input.question.length>3000)return respond({error:"Provide a question of 1–3000 characters."},400);
  return respond(await independentAnswer(env,input.question,user.id));
 }
 if(url.pathname===prefix+"/coding-knowledge"&&request.method==="GET")return respond({...await codingKnowledge(env),logic:await logicCoverage(env),data:await dataCoverage(env),javascript:await javascriptCoverage(env)});
 const lessonMatch=url.pathname.match(/^\/api\/god\/eye\/tools\/learning\/(mc-\d{2,3})$/);
 if(lessonMatch&&request.method==="GET"){if(!RESEARCH_FLEET.some(a=>a.key===lessonMatch[1]))return respond({error:"Unknown research agent."},404);return respond({agent:lessonMatch[1],evidence:await agentEvidence(env,lessonMatch[1]),sharedReviewed:await sharedReviewedKnowledge(env),softwareReferences:await agentSoftwareReferences(env,lessonMatch[1]),curriculum:peerCurriculum(lessonMatch[1]),peerAssessment:await readPeerAssessment(env,lessonMatch[1]).catch(()=>null),codingPractice:await readCodingPractice(env,lessonMatch[1]).catch(()=>null)});}
 if(url.pathname===prefix+"/learning"&&request.method==="GET"){
  const [runs,lessons,control]=await Promise.all([
   env.DB.prepare("SELECT agent_key, SUM(CASE WHEN status=\'complete\' THEN 1 ELSE 0 END) AS completed, SUM(CASE WHEN status=\'failed\' THEN 1 ELSE 0 END) AS failed, SUM(found) AS discoveries, MAX(finished_at) AS last_run FROM chaos_knowledge_runs WHERE agent_key LIKE \'mc-%\' GROUP BY agent_key").all(),
   env.DB.prepare("SELECT learner_key AS agent_key, COUNT(*) AS learned, COUNT(DISTINCT teacher_key) AS teachers, MAX(received_at) AS last_lesson FROM chaos_knowledge_lessons GROUP BY learner_key").all(),
   env.DB.prepare("SELECT k.enabled,e.paused FROM chaos_knowledge_66_control k JOIN eye_chaos_controls e ON e.id=1 WHERE k.id=1").first()]);
  const byRun=new Map((runs.results||[]).map(x=>[x.agent_key,x])),byLesson=new Map((lessons.results||[]).map(x=>[x.agent_key,x]));
  const agents=RESEARCH_FLEET.map(a=>{const r=byRun.get(a.key)||{},l=byLesson.get(a.key)||{};return {key:a.key,name:a.name,division:a.division,completed:Number(r.completed||0),failed:Number(r.failed||0),discoveries:Number(r.discoveries||0),learned:Number(l.learned||0),teachers:Number(l.teachers||0),lastRun:r.last_run||null,lastLesson:l.last_lesson||null};});
  return respond({agents,enabled:Number(control?.enabled)===1,masterPaused:control==null||Number(control.paused)!==0,kind:"recorded-peer-evidence",modelWeightsUpdated:false,asOf:new Date().toISOString()});
 }
 if(url.pathname===prefix+"/original-tutor"&&request.method==="POST"){const source=request.headers.get("origin");if(source!=="https://ash-fall.com"&&source!=="https://www.ash-fall.com")return respond({error:"Invalid request origin."},403);if(!/^application\/json(?:;|$)/i.test(request.headers.get("content-type")||""))return respond({error:"JSON required."},415);const raw=await request.text();if(raw.length>2200)return respond({error:"Input too large."},413);try{const question=JSON.parse(raw).question,local=originalTutor(question);if(local.answer)return respond(local);return respond(await reviewedTutorAnswer(env,question)||local);}catch{return respond({error:"Provide a nonempty question of at most 300 characters."},400);}}
 if(url.pathname===prefix+"/local-model"&&request.method==="POST"){const source=request.headers.get("origin");if(source!=="https://ash-fall.com"&&source!=="https://www.ash-fall.com")return respond({error:"Invalid request origin."},403);if(!/^application\/json(?:;|$)/i.test(request.headers.get("content-type")||""))return respond({error:"JSON required."},415);const raw=await request.text();if(raw.length>2000)return respond({error:"Input too large."},413);try{const input=JSON.parse(raw);if(input.seed!==undefined&&(!Number.isSafeInteger(input.seed)||input.seed<0||input.seed>4294967295))throw Error("Invalid seed");return respond(localModelReply(input.prompt,input.seed??66,input.model??"miss-chaos-local-001"));}catch{return respond({error:"Provide a prompt of at most 200 characters, a known local model and an optional uint32 seed."},400);}}
 if(url.pathname===prefix+"/format-classify"&&request.method==="POST"){const source=request.headers.get("origin");if(source!=="https://ash-fall.com"&&source!=="https://www.ash-fall.com")return respond({error:"Invalid request origin."},403);if(!/^application\/json(?:;|$)/i.test(request.headers.get("content-type")||""))return respond({error:"JSON required."},415);const raw=await request.text();if(raw.length>6500)return respond({error:"Input too large."},413);try{return respond(order66Format(JSON.parse(raw).text));}catch{return respond({error:"Provide 1–1000 characters of text."},400);}}
 const read=async id=>normalizeDecision(await env.DB.prepare("SELECT value FROM site_settings WHERE key=?").bind(key(id)).first());
 if(url.pathname===prefix&&request.method==="GET"){const tools=await Promise.all(registry.map(async t=>({...t,...await read(t.id)})));return respond({tools,publication:"Osiris-only implementation authorized. Installation and execution status are tracked separately; no public or Isis access."});}
 if(url.pathname===prefix+"/alien-eyes/catalog"&&request.method==="GET"){if((await read("alien-eyes")).decision==="scrapped")return respond({error:"Tool disabled."},403);return respond({reports:await readAlienCatalog(env)});}
 if(url.pathname===prefix+"/alien-eyes/inspect"&&request.method==="GET"){
 if((await read("alien-eyes")).decision==="scrapped")return respond({error:"This candidate has been scrapped."},403);
 let reference;try{reference=parseRepository(url.searchParams.get("repository"));}catch{return respond({error:"Enter an exact public GitHub project reference."},400);}
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
 try{return respond({report:await (url.searchParams.get("detail")==="full"?inspectProjectDetails:inspectRepository)(reference.owner+"/"+reference.repo,{fetcher,signal:controller.signal})});}catch{return respond({error:"Public project metadata unavailable or rate limited."},502);}finally{clearTimeout(timer);}
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
