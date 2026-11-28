/* Miss Chaos supervised full-file review docket.
 * No GitHub credentials, arbitrary code execution, shell, workflow dispatch,
 * automatic commit, deploy, or credential exposure. Human review != integration.
 */
import {canAccessEyeOfChaos,canAccessEyeOfHorus} from "./staff-capabilities.js";
import {validIntegrationPath} from "./chaos-integration-dispatch.mjs";
import {acceptedAdminPartner} from "./chaos-companion.mjs";
import {readKnightfallFile,validateKnightfallFileArgs} from "../chaos-repo-reader.mjs";
import {compareChaosCode} from "../chaos-dev-utilities.mjs";
import {inspectChaosCode} from "../chaos-code-inspect.mjs";

const BASE="/api/chaos/dev-reviews";
const VALID_ID=/^[a-f0-9-]{36}$/;
const VALID_SHA=/^[a-f0-9]{40}$/;
const HEADER={"cache-control":"private, no-store","x-robots-tag":"noindex,nofollow"};
const ORIGINS=new Set(["https://ash-fall.com","https://www.ash-fall.com"]);
const bytes=value=>new TextEncoder().encode(value).length;
const formats={js:"javascript",mjs:"javascript",cjs:"javascript",ts:"typescript",tsx:"tsx",jsx:"jsx",json:"json"};

export function validateDevReviewInput(payload){
 if(!payload||typeof payload!=="object"||Array.isArray(payload))throw Error("Expected a review proposal object.");
 if(typeof payload.source_sha!=="string"||!VALID_SHA.test(payload.source_sha))throw Error("A valid immutable 40-character main SHA is required.");
 const {path,start,count}=validateKnightfallFileArgs({path:payload.path,start_line:1,line_count:80});
 if(start!==1||count!==80)throw Error("Invalid source range.");
 if(typeof payload.original!=="string"||typeof payload.candidate!=="string"||
    !payload.original.trim()||!payload.candidate.trim()||
    bytes(payload.original)>5000||bytes(payload.candidate)>5000)
   throw Error("Complete original and proposed source must be 1–5,000 bytes each.");
 if(payload.original===payload.candidate)throw Error("No actual change was proposed.");
 if(payload.original.includes("\r")||payload.candidate.includes("\r"))
   throw Error("Normalize line endings to LF before review.");
 if(payload.original.split("\n").length>80||payload.candidate.split("\n").length>80)
   throw Error("The complete file and proposed replacement must each be 80 lines or fewer.");
 if(payload.candidate.split("\n").some(line=>line.length>300))
   throw Error("A proposed line is longer than the safe 300-character source reader limit.");
 const summary=String(payload.summary||"").trim();
 if(summary.length<12||summary.length>360)throw Error("Include a specific 12–360 character summary of the change.");
 return {path,source_sha:payload.source_sha,original:payload.original,candidate:payload.candidate,summary};
}
export async function inspectDevReviewCandidate(payload,{readSource=readKnightfallFile}={}){
 const p=validateDevReviewInput(payload);
 // The Worker repeats an authenticated GitHub HEAD lookup and pulls the
 // immutable file, never trusting the client-supplied SHA, excerpt or preflight.
 const verified=await readSource({path:p.path,start_line:1,line_count:80});
 if(!verified?.available||verified.branch!=="main"||verified.commit_sha!==p.source_sha||
    verified.long_lines_omitted||verified.start_line!==1||
    !Number.isInteger(verified.total_lines)||verified.total_lines<1||
    verified.total_lines>80||verified.lines?.length!==verified.total_lines||
    verified.lines.some((line,index)=>line.number!==index+1))
   throw Error("Current main revision is stale, inaccessible, incomplete or exceeds the full-file limit. Re-read source.");
 const actual=verified.lines.map(line=>line.text).join("\n");
 if(actual!==p.original)throw Error("Current immutable source differs from the supplied original. Re-read source.");
 const diff=compareChaosCode({before:actual,after:p.candidate});
 if(diff.identical||!diff.unified_diff)throw Error("No verified changes to review.");
 const ext=p.path.split(".").pop()?.toLowerCase();
 let syntax_status="not_supported",findings=[];
 if(Object.hasOwn(formats,ext)){
   const result=inspectChaosCode({code:p.candidate,language:formats[ext],
     source_type:ext==="cjs"?"script":"module"});
   if(!result.syntax_valid)throw Error("Proposed full-file syntax failed: "+String(result.errors?.[0]?.message||"Invalid syntax.").slice(0,120));
   syntax_status="passed";
   findings=(result.findings||[]).slice(0,8);
   // Do not silently authorize potentially dangerous code even if it parses.
   if(findings.some(item=>item.severity==="high"))
     throw Error("High-severity parser warning requires manual revision before submission.");
 }
 return {...p,syntax_status,findings,verified:true,
   diff:{added_lines:diff.added_lines,removed_lines:diff.removed_lines,
     unified_diff:diff.unified_diff},
   source_url:verified.source_url};
}
export function devReviewSummary(row){
 return {id:row.id,created_by:row.author_id,source_sha:row.source_sha,path:row.path,
   change_summary:row.change_summary,syntax_status:row.syntax_status,
   status:row.status,revision:row.revision,reviewer_id:row.reviewer_id,
   review_note:row.review_note,reviewed_at:row.reviewed_at,
   created_at:row.created_at,updated_at:row.updated_at,
   integration_status:"not_integrated",ci_status:"not_run_on_proposal",
   deployment_status:"not_deployed"};
}
export async function handleChaosDevReviews(request,env,url,{requireUser,json,origin,rateLimit,readSource=readKnightfallFile}){
 if(url.pathname!==BASE&&!url.pathname.startsWith(BASE+"/"))return null;
 const reply=(value,status=200)=>json(value,status,origin,HEADER);
 const user=await requireUser(request,env);
 if(!user)return reply({error:"Sign in required."},401);
 if(!canAccessEyeOfChaos(user))return reply({error:"Admin/Osiris/Isis permissions required."},403);
 const owner=canAccessEyeOfHorus(user);
 const policyKey="chaos_dev_review_delegation";
 let delegation=[];try{const row=await env.DB.prepare("SELECT value FROM site_settings WHERE key=?").bind(policyKey).first();const parsed=JSON.parse(row?.value||"[]");if(Array.isArray(parsed))delegation=parsed.filter(x=>["isis","admin"].includes(x));}catch{}
 const canApprove=owner||(delegation.includes("admin")&&user.role==="admin")||(delegation.includes("isis")&&await acceptedAdminPartner(env,user));
 if(!["GET","POST"].includes(request.method))return reply({error:"Method not allowed."},405);
 if(request.method==="POST"&&(!ORIGINS.has(request.headers.get("Origin"))||
     !String(request.headers.get("content-type")||"").startsWith("application/json")))
   return reply({error:"Submit JSON from the signed-in Knightfall origin."},403);
 if(url.pathname===BASE+"/policy"){
   if(!owner)return reply({error:"Osiris only."},403);
   if(request.method==="GET")return reply({roles:delegation,integration_ready:true});
   if(!await rateLimit(env,request,"chaos-dev-review-policy",5,60,user.id))return reply({error:"Policy rate limit."},429);
   try{const raw=await request.text();if(raw.length>512)throw Error("Too large");const roles=JSON.parse(raw).roles;if(!Array.isArray(roles)||roles.some(x=>!["isis","admin"].includes(x)))throw Error("Invalid roles");const unique=[...new Set(roles)];await env.DB.prepare("INSERT INTO site_settings(key,value,updated_by,updated_at) VALUES(?,?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_by=excluded.updated_by,updated_at=excluded.updated_at").bind(policyKey,JSON.stringify(unique),user.id,new Date().toISOString()).run();return reply({roles:unique,integration_ready:true});}catch{return reply({error:"Delegation update not confirmed."},400);}
 }
 if(!canApprove)return reply({error:"Osiris-only developer access; delegation must be enabled explicitly."},403);
 const detail=url.pathname.match(/^\/api\/chaos\/dev-reviews\/([a-f0-9-]{36})(?:\/(approve|reject|apply))?$/);
 if(url.pathname!==BASE&&!detail)return reply({error:"Not found."},404);
 if(detail?.[2]==="apply"&&!owner)return reply({error:"Only Osiris can push code to main."},403);
 if(!await rateLimit(env,request,"chaos-dev-reviews",request.method==="POST"?8:30,60,user.id))
   return reply({error:"Developer review limit reached."},429);
 let ready=false;
 try{
   const schema=await env.DB.prepare("SELECT COUNT(*) AS ready FROM sqlite_master WHERE type='table' AND name IN ('chaos_dev_reviews','chaos_dev_review_events')").first();
   ready=schema?.ready===2;
 }catch{}
 if(!ready)return reply({error:"Review docket schema is awaiting approved migration 0151. No code is being integrated.",schema_ready:false},503);
 async function body(){
   const size=Number(request.headers.get("content-length")||0);
   if(size>12000)throw Error("Review body exceeds 12 KB.");
   const raw=await request.text();
   if(bytes(raw)>12000)throw Error("Review body exceeds 12 KB.");
   const data=JSON.parse(raw);
   if(!data||typeof data!=="object"||Array.isArray(data))throw Error("Invalid review JSON.");
   return data;
 }
 if(url.pathname===BASE&&request.method==="GET"){
   const status=url.searchParams.get("status")||"pending";
   if(!["pending","approved","rejected","all"].includes(status))return reply({error:"Unsupported filter."},400);
   const rows=await env.DB.prepare(status==="all"?
     "SELECT id,author_id,source_sha,path,change_summary,syntax_status,status,revision,reviewer_id,review_note,reviewed_at,created_at,updated_at FROM chaos_dev_reviews ORDER BY created_at DESC LIMIT 40":
     "SELECT id,author_id,source_sha,path,change_summary,syntax_status,status,revision,reviewer_id,review_note,reviewed_at,created_at,updated_at FROM chaos_dev_reviews WHERE status=? ORDER BY created_at DESC LIMIT 40")
    .bind(...(status==="all"?[]:[status])).all();
   return reply({reviews:(rows.results||[]).map(devReviewSummary),can_approve:canApprove,can_apply:owner,integration_ready:owner&&true,schema_ready:true,
     notice:"Review approval does not apply code, run CI, commit, merge or deploy."});
 }
 if(detail&&request.method==="GET"&&!detail[2]){
   const row=await env.DB.prepare("SELECT * FROM chaos_dev_reviews WHERE id=?").bind(detail[1]).first();
   if(!row)return reply({error:"Review not found."},404);
   const diff=compareChaosCode({before:row.original,after:row.candidate});
   const job=await env.DB.prepare("SELECT value FROM site_settings WHERE key=?").bind("chaos_integration:"+row.id).first();let integration=null;try{integration=JSON.parse(job?.value||"null");}catch{}
   return reply({...devReviewSummary(row),can_apply:owner&&validIntegrationPath(row.path),integration_ready:owner&&true,integration,original:row.original,candidate:row.candidate,
     diff:diff.unified_diff,source_url:"https://github.com/xxxghostfacekidxxx-glitch/Knightfall/blob/"+row.source_sha+"/"+row.path,
     events:(await env.DB.prepare("SELECT actor_id,action,source_sha,occurred_at FROM chaos_dev_review_events WHERE proposal_id=? ORDER BY id DESC LIMIT 20").bind(row.id).all()).results||[]});
 }
 if(url.pathname===BASE&&request.method==="POST"){
   let data,verified;
   try{data=await body();verified=await inspectDevReviewCandidate(data,{readSource});}
   catch(error){return reply({error:String(error.message||"Could not verify source.").slice(0,230)},409);}
   const id=crypto.randomUUID();
   const insert=env.DB.prepare("INSERT INTO chaos_dev_reviews(id,author_id,source_sha,path,original,candidate,change_summary,syntax_status) VALUES(?,?,?,?,?,?,?,?)")
     .bind(id,user.id,verified.source_sha,verified.path,verified.original,verified.candidate,verified.summary,verified.syntax_status);
   const event=env.DB.prepare("INSERT INTO chaos_dev_review_events(proposal_id,actor_id,action,source_sha) VALUES(?,?,?,?)")
     .bind(id,user.id,"submitted",verified.source_sha);
   try{await env.DB.batch([insert,event]);}
   catch{return reply({error:"Review docket could not save the proposal. Nothing was applied."},503);}
   return reply({ok:true,id,status:"pending",revision:1,syntax_status:verified.syntax_status,
     diff:verified.diff,source_sha:verified.source_sha,
     integration_status:"not_integrated",ci_status:"not_run_on_proposal",
     message:"Stored for exact-source human review only. No GitHub write or deployment."},201);
 }
 if(detail?.[2]==="apply"&&request.method==="POST"){
   // The scoped GitHub Actions queue does not need a static dispatch credential.
   let data;try{data=await body();}catch{return reply({error:"Invalid JSON."},400);}
   if(data.confirmation!=="APPLY TO MAIN"||data.revision!==1)return reply({error:"Exact revision and explicit approval required."},400);
   const stored=await env.DB.prepare("SELECT * FROM chaos_dev_reviews WHERE id=?").bind(detail[1]).first();
   if(!stored||stored.revision!==data.revision||!["pending","approved"].includes(stored.status)||!validIntegrationPath(stored.path))return reply({error:"No eligible reviewed candidate."},409);
   try{await inspectDevReviewCandidate({path:stored.path,source_sha:stored.source_sha,original:stored.original,candidate:stored.candidate,summary:stored.change_summary},{readSource});}catch(error){return reply({error:String(error.message).slice(0,180)},409);}
   if(stored.status==="pending"){
     const note="Osiris approved this exact candidate for isolated tests and integration.";
     const update=env.DB.prepare("UPDATE chaos_dev_reviews SET status=?,reviewer_id=?,review_note=?,reviewed_at=strftime('%Y-%m-%dT%H:%M:%fZ','now'),updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=? AND revision=? AND status='pending'").bind("approved",user.id,note,stored.id,stored.revision);
     const audit=env.DB.prepare("INSERT INTO chaos_dev_review_events(proposal_id,actor_id,action,source_sha) SELECT id,?,?,source_sha FROM chaos_dev_reviews WHERE id=? AND revision=? AND status=?").bind(user.id,"approved",stored.id,stored.revision,"approved");
     const result=await env.DB.batch([update,audit]);if(result[0]?.meta?.changes!==1)return reply({error:"Concurrent approval; refresh."},409);
   }
   const key="chaos_integration:"+stored.id,stamp=new Date().toISOString();
   const claim=await env.DB.prepare("INSERT OR IGNORE INTO site_settings(key,value,updated_by,updated_at) VALUES(?,?,?,?)").bind(key,JSON.stringify({status:"queued",requested_at:stamp}),user.id,stamp).run();
   if(claim.meta?.changes!==1)return reply({error:"Integration already requested. Inspect GitHub Actions before retrying."},409);
   return reply({ok:true,status:"approved",integration:{status:"queued",requested_at:stamp,workflow_url:"https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions/workflows/miss-chaos-integration-queue.yml"}},202);
 }
 if(detail?.[2]&&request.method==="POST"){
   let data;
   try{data=await body();}catch{return reply({error:"Valid JSON required."},400);}
   const revision=data.revision;
   const decision=detail[2];
   const note=String(data.note||"").trim();
   if(revision!==1||note.length<12||note.length>600)
     return reply({error:"A version-1 review needs a 12–600 character decision note."},400);
   const stored=await env.DB.prepare("SELECT * FROM chaos_dev_reviews WHERE id=?").bind(detail[1]).first();
   if(!stored)return reply({error:"Review not found."},404);
   if(stored.status!=="pending"||stored.revision!==revision)
     return reply({error:"This exact proposal is no longer pending. Refresh the docket."},409);
   if(decision==="approve"){
     try{
       await inspectDevReviewCandidate({path:stored.path,source_sha:stored.source_sha,
         original:stored.original,candidate:stored.candidate,summary:stored.change_summary},{readSource});
     }catch(error){return reply({error:"Main changed or validation failed: "+String(error.message||"Unavailable").slice(0,180)},409);}
   }
   // Both decision and append-only event are atomic, and only a pending revision
   // can be signed. An approval has NO integration/deployment side-effect.
   const update=env.DB.prepare("UPDATE chaos_dev_reviews SET status=?,reviewer_id=?,review_note=?,reviewed_at=strftime('%Y-%m-%dT%H:%M:%fZ','now'),updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=? AND revision=? AND status='pending'")
     .bind(decision==="approve"?"approved":"rejected",user.id,note,stored.id,revision);
   const audit=env.DB.prepare("INSERT INTO chaos_dev_review_events(proposal_id,actor_id,action,source_sha) SELECT id,?,?,source_sha FROM chaos_dev_reviews WHERE id=? AND revision=? AND status=?")
     .bind(user.id,decision==="approve"?"approved":"rejected",stored.id,revision,decision==="approve"?"approved":"rejected");
   try{
     const results=await env.DB.batch([update,audit]);
     if(Number(results[0]?.meta?.changes||0)!==1||Number(results[1]?.meta?.changes||0)!==1)
       return reply({error:"Concurrent review state changed. Refresh before retrying."},409);
   }catch{return reply({error:"The review decision was not confirmed. Refresh the docket."},503);}
   return reply({ok:true,id:stored.id,status:decision==="approve"?"approved":"rejected",
     reviewer_id:user.id,revision,source_sha:stored.source_sha,ci_status:"not_run_on_proposal",
     integration_status:"not_integrated",deployment_status:"not_deployed",
     message:"Human review recorded. No GitHub integration, CI execution or production deployment occurred."});
 }
 return reply({error:"Method not allowed."},405);
}
