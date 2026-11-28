import {compileArtifact,decompileStack,hexBytes,inspectWasm} from "./chaos-forge-binary.mjs";
import {buildApplet} from "./chaos-forge-applets.mjs";
import {reverseSource} from "./chaos-forge-reverse.mjs";
const enc=new TextEncoder(),ID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const filePattern=/^miss-chaos-[a-z0-9-]+\.(html|wasm|json)$/;
const to64=b=>{let out="";for(let i=0;i<b.length;i+=8192)out+=String.fromCharCode(...b.subarray(i,i+8192));return btoa(out);};
const from64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const digest=async b=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",b)),x=>x.toString(16).padStart(2,"0")).join("");
const ownerId=id=>{const n=Number(id);if(!Number.isSafeInteger(n)||n<1)throw Error("Owner required.");return n;};
export async function saveForgeArtifact(env,owner,artifact){
 const user=ownerId(owner);
 if(!filePattern.test(artifact.filename))throw Error("Invalid artifact filename.");
 const bytes=artifact.bytes||enc.encode(artifact.content);if(!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>32768)throw Error("Artifact exceeds 32 KiB.");
 const id=crypto.randomUUID(),sha256=await digest(bytes),created=new Date().toISOString(),expires=new Date(Date.now()+7*86400000).toISOString();
 // Atomic quota check; stale artifacts do not block new builds.
 await env.DB.prepare("DELETE FROM chaos_forge_artifacts WHERE owner_id=? AND expires_at<=?").bind(user,created).run();
 const r=await env.DB.prepare("INSERT INTO chaos_forge_artifacts(id,owner_id,filename,data_base64,sha256,byte_count,created_at,expires_at) SELECT ?,?,?,?,?,?,?,? WHERE (SELECT count(*) FROM chaos_forge_artifacts WHERE owner_id=?)<40").bind(id,user,artifact.filename,to64(bytes),sha256,bytes.length,created,expires,user).run();
 if(r.meta?.changes!==1)throw Error("40 active artifacts allowed. Delete an old artifact or wait for expiry.");
 return {id,filename:artifact.filename,bytes:bytes.length,sha256,expiresAt:expires,downloadUrl:"https://api.ash-fall.com/api/god/eye/tools/forge-download/"+id};
}
export async function forgeDownload(env,owner,id){
 if(!ID.test(id))return null;
 const row=await env.DB.prepare("SELECT filename,data_base64,sha256,byte_count FROM chaos_forge_artifacts WHERE id=? AND owner_id=? AND expires_at>?").bind(id,ownerId(owner),new Date().toISOString()).first();
 if(!row||!filePattern.test(row.filename)||typeof row.data_base64!=="string"||row.data_base64.length>44000)return null;
 const bytes=from64(row.data_base64);if(bytes.length!==row.byte_count||await digest(bytes)!==row.sha256)throw Error("Artifact integrity check failed.");
 return new Response(bytes,{headers:{"Content-Type":"application/octet-stream","Content-Disposition":'attachment; filename="'+row.filename+'"',"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Content-Security-Policy":"default-src 'none'; sandbox","Referrer-Policy":"no-referrer"}});
}
export async function listForgeArtifacts(env,owner){const rows=(await env.DB.prepare("SELECT id,filename,sha256,byte_count,created_at,expires_at FROM chaos_forge_artifacts WHERE owner_id=? AND expires_at>? ORDER BY created_at DESC LIMIT 40").bind(ownerId(owner),new Date().toISOString()).all()).results||[];return rows.map(r=>({...r,downloadUrl:"https://api.ash-fall.com/api/god/eye/tools/forge-download/"+r.id}));}
export async function deleteForgeArtifact(env,owner,id){if(!ID.test(id))return false;const r=await env.DB.prepare("DELETE FROM chaos_forge_artifacts WHERE id=? AND owner_id=?").bind(id,ownerId(owner)).run();return r.meta?.changes===1;}
export async function forgeCommand(env,owner,question){
 if(typeof question!=="string"||question.length>65536)throw Error("Invalid forge command.");
 const app=question.match(/^(?:applet|(?:make|create|build) (?:an? )?applet)\s*:\s*(.+)$/i);
 if(app){const a=await buildApplet(app[1]);const file=await saveForgeArtifact(env,owner,a);return {answer:"Created offline "+a.report.title+" applet. Download: "+file.downloadUrl+"\nSHA-256: "+file.sha256+"\nExpires in seven days. No external inference or dependencies.",method:"independent-applet-forge",artifact:file,report:a.report,externalInference:false};}
 const compile=question.match(/^compile\s+(wasm|stack)\s*:\s*(.+)$/i);
 if(compile){const a=compileArtifact(compile[2],compile[1].toLowerCase());const file=await saveForgeArtifact(env,owner,a);return {answer:"Compiled "+a.report.target+" artifact; result "+a.report.result+". Download: "+file.downloadUrl+"\nSHA-256: "+file.sha256,method:"independent-binary-compiler",artifact:file,report:a.report,externalInference:false};}
 const decompile=question.match(/^(?:decompile|disassemble|reverse engineer)\s+(wasm|stack)\s*:\s*([\s\S]+)$/i);
 if(decompile){let report;if(decompile[1].toLowerCase()==="wasm")report=inspectWasm(hexBytes(decompile[2]));else{const parsed=JSON.parse(decompile[2]);report=decompileStack(Array.isArray(parsed)?parsed:parsed.ops);}
 return {answer:JSON.stringify(report,null,2).slice(0,20000),method:"independent-static-decompiler",report,externalInference:false};}
 const reverse=question.match(/^(?:reverse engineer|analyze source)\s+(javascript|typescript|jsx|tsx|json)\s*:\s*([\s\S]+)$/i);
 if(reverse){const report=reverseSource(reverse[2],reverse[1].toLowerCase());return {answer:JSON.stringify(report,null,2).slice(0,20000),method:"independent-static-source-analysis",report,externalInference:false};}
 return null;
}
