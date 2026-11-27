import {parseRepository,inspectRepository} from "./alien-eyes-core.mjs";
export function canReviewTools(user,partner){return Boolean(user?.status==="active"&&user.role==="god"&&Number.isSafeInteger(Number(user.id))&&Number(user.id)>0&&Number(partner?.invited_by)===Number(user.id));}
const registry=Object.freeze([{"id":"alien-eyes","name":"Alien Eyes","description":"Inspect a known public software repository; review declared license and maintenance metadata.","scope":"Public software projects only","execution":"owner-only"}]);
const key=id=>"eye_tool_review:"+id;
const allowed=new Set(["pending","public","isis","scrapped"]);
function normalizeDecision(row){if(!row)return {decision:"pending",updatedAt:null};let x;try{x=JSON.parse(row.value)}catch{return {decision:"pending",updatedAt:null};}return {decision:allowed.has(x?.decision)?x.decision:"pending",updatedAt:typeof x?.updatedAt==="string"?x.updatedAt:null};}
export async function handleEyeToolReview(request,env,url,user,respond,{fetcher=fetch}={}){
 const prefix="/api/god/eye/tools";
 if(url.pathname!==prefix&&!url.pathname.startsWith(prefix+"/"))return null;
 try{
 const partner=await env.DB.prepare("SELECT invited_by FROM ai_handoff_partner WHERE slot=1").first();
 if(!canReviewTools(user,partner))return respond({error:"Verified Osiris owner access required."},403);
 const read=async id=>normalizeDecision(await env.DB.prepare("SELECT value FROM site_settings WHERE key=?").bind(key(id)).first());
 if(url.pathname===prefix&&request.method==="GET"){const tools=await Promise.all(registry.map(async t=>({...t,...await read(t.id)})));return respond({tools,publication:"Decisions record intended distribution only. Release requires a separate implementation and verification."});}
 if(url.pathname===prefix+"/alien-eyes/inspect"&&request.method==="GET"){
 if((await read("alien-eyes")).decision==="scrapped")return respond({error:"This candidate has been scrapped."},403);
 let reference;try{reference=parseRepository(url.searchParams.get("repository"));}catch{return respond({error:"Enter an exact public GitHub project reference."},400);}
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
 try{return respond({report:await inspectRepository(reference.owner+"/"+reference.repo,{fetcher,signal:controller.signal})});}catch{return respond({error:"Public project metadata unavailable or rate limited."},502);}finally{clearTimeout(timer);}
 }
 if(url.pathname===prefix+"/alien-eyes/decision"&&request.method==="POST"){
 const source=request.headers.get("origin");if(source!=="https://ash-fall.com"&&source!=="https://www.ash-fall.com")return respond({error:"Invalid request origin."},403);
 if(!/^application\/json(?:;|$)/i.test(request.headers.get("content-type")||""))return respond({error:"JSON required."},415);
 const raw=await request.text();if(raw.length>512)return respond({error:"Request too large."},413);
 let input;try{input=JSON.parse(raw);}catch{return respond({error:"Invalid JSON."},400);}
 if(!allowed.has(input?.decision))return respond({error:"Invalid review decision."},400);
 const updatedAt=new Date().toISOString(),value=JSON.stringify({decision:input.decision,updatedAt});
 await env.DB.prepare("INSERT INTO site_settings (key,value,updated_by,updated_at) VALUES (?,?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_by=excluded.updated_by,updated_at=excluded.updated_at").bind(key("alien-eyes"),value,user.id,updatedAt).run();
 return respond({id:"alien-eyes",...await read("alien-eyes"),publication:"Decision saved; no public or Isis access activated."});
 }
 return respond({error:"Unknown tool review operation."},404);
 }catch{return respond({error:"Tool review unavailable."},503);}
}
