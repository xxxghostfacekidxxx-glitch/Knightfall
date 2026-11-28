// Owner-only persisted repository staging; source is evidence, never executed.
import {autoRepositoryCandidate,generateRepositoryCandidate} from "./chaos-repository-candidate.mjs";
import {INTEGRATION_PATHS} from "./chaos-integration-dispatch.mjs";
import {intakeRepository} from "../chaos-repo-intake.mjs";
import {parseRepository} from "./alien-eyes-core.mjs";
const PREFIX="chaos_repo_stage:";
export function repositoryRequest(message){
 const text=String(message||"").trim();
 const implementation=text.match(/^\s*(?:implement|integrate)\s+(https:\/\/github\.com\/[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+)\/?\s+into\s+([^\s]+)\s*:\s*([\s\S]{12,1000})$/i);
 if(implementation){try{const ref=parseRepository(implementation[1]);return {repository:ref.owner+"/"+ref.repo,target:implementation[2],goal:implementation[3]};}catch{return null;}}
 const explicit=text.match(/^\s*(?:integrate repo|inspect repo|import repo|stage repo)\s*:\s*(\S+)(?:\s+file\s+([^\s]+))?\s*$/i);
 const bare=text.match(/^https:\/\/github\.com\/[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+\/?$/i);
 const embedded=/\b(?:integrate|implement|import|stage|adopt|inspect|analyze)\b/i.test(text)?text.match(/https:\/\/github\.com\/[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+/i):null;
 if(!explicit&&!bare&&!embedded)return null;
 try{const r=parseRepository(explicit?.[1]||bare?.[0]||embedded?.[0]);return {repository:r.owner+"/"+r.repo,...(explicit?.[2]?{path:explicit[2]}:{}),...((bare||/^(?:implement|integrate|import|adopt)\b/i.test(text))?{auto:true}:{})};}catch{return null;}
}
export async function stageRepository(env,input,ownerId,{intake=intakeRepository}={}){
 if(!Number.isSafeInteger(Number(ownerId))||Number(ownerId)<1)throw Error("Owner identity required");
 const report=await intake({...input,auto_select:input.path===undefined});
 if(!/^[a-f0-9]{40}$/i.test(report.commit_sha||""))throw Error("Missing pinned revision");
 const id=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(report.project.toLowerCase()+":"+report.commit_sha+":"+(input.path||"")));
 const key=Array.from(new Uint8Array(id),x=>x.toString(16).padStart(2,"0")).join("");
 const stamp=new Date().toISOString();
 const record={id:key,owner_id:Number(ownerId),project:report.project,commit_sha:report.commit_sha,source_url:report.source_url,license:report.license,license_eligible:report.license_eligible,manifest:report.manifest,files:report.files,inventory_complete:report.inventory_complete,license_file:report.license_file||null,selected_source:report.source||null,status:report.license_eligible?(report.source?"source_staged_for_adaptation":"inventory_staged_for_adaptation"):"license_review_required",created_at:stamp};
 // Keep the intake evidence bounded and private. No source is copied to production.
 const raw=JSON.stringify(record);if(new TextEncoder().encode(raw).length>75000)throw Error("Staged report too large");
 await env.DB.prepare("INSERT INTO site_settings(key,value,updated_by,updated_at) VALUES(?,?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_by=excluded.updated_by,updated_at=excluded.updated_at").bind(PREFIX+key,raw,ownerId,stamp).run();
 return record;
}
export async function listRepositoryStages(env,ownerId){
 const rows=(await env.DB.prepare("SELECT value FROM site_settings WHERE key LIKE 'chaos_repo_stage:%' AND updated_by=? ORDER BY updated_at DESC LIMIT 20").bind(ownerId).all()).results||[];
 return rows.flatMap(row=>{try{const r=JSON.parse(row.value);return r.owner_id===Number(ownerId)?[r]:[];}catch{return [];}});
}
export async function handleRepositoryStages(request,env,url,{requireUser,json,origin,rateLimit}){
 if(!["/api/chaos/repository-stages","/api/chaos/repository-stages/generate"].includes(url.pathname))return null;
 const reply=(body,status=200)=>json(body,status,origin,{"cache-control":"private, no-store"});
 const user=await requireUser(request,env);if(!user)return reply({error:"Sign in required."},401);
 if(user.role!=="god"||user.status!=="active")return reply({error:"Osiris only."},403);
 if(request.method==="GET")return reply({stages:await listRepositoryStages(env,user.id),targets:INTEGRATION_PATHS});
 if(request.method!=="POST")return reply({error:"Method not allowed."},405);
 if(!["https://ash-fall.com","https://www.ash-fall.com"].includes(request.headers.get("origin"))||!String(request.headers.get("content-type")||"").startsWith("application/json"))return reply({error:"Knightfall origin required."},403);
 if(!await rateLimit(env,request,"chaos-repository-stage",5,60,user.id))return reply({error:"Repository intake limit reached."},429);
 try{const raw=await request.text();if(raw.length>1500)throw Error("Input too large");const input=JSON.parse(raw);if(url.pathname.endsWith("/generate")){if(!/^[a-f0-9]{64}$/.test(input.stage_id||""))throw Error("Invalid stage ID");const row=await env.DB.prepare("SELECT value FROM site_settings WHERE key=? AND updated_by=?").bind(PREFIX+input.stage_id,user.id).first();if(!row)throw Error("Stage not found");const stage=JSON.parse(row.value);if(input.target==="auto")return reply(await autoRepositoryCandidate(env,{stage,ownerId:user.id}),201);return reply({proposal:await generateRepositoryCandidate(env,{stage,target:input.target,goal:input.goal,ownerId:user.id})},201);}return reply({stage:await stageRepository(env,input,user.id)},201);}catch(error){return reply({error:String(error.message).slice(0,180)},400);}
}
