// Fixed-repository, owner-authorized workflow dispatch. Secret stays in Worker.
const WORKFLOW="https://api.github.com/repos/xxxghostfacekidxxx-glitch/Knightfall/actions/workflows/miss-chaos-approved-integration.yml/dispatches";
export const INTEGRATION_PATHS=Object.freeze(["public/miss-chaos-guide-core.mjs","public/chaos-visual-effects.mjs","public/chaos-review-test-kit.mjs","backend/chaos-public-tools.mjs","public/chaos-crucible-core.mjs","public/chaos-crucible-progress.mjs","public/chaos-crucible-shelf.mjs","public/chaos-flow-core.mjs"]);
export function validIntegrationPath(path){return INTEGRATION_PATHS.includes(path);}
export async function dispatchApprovedCandidate(env,row,{fetcher=fetch}={}){
 if(!env.CHAOS_INTEGRATION_TOKEN)throw Error("Integration credential is not configured.");
 if(row.status!=="approved"||!validIntegrationPath(row.path)||!/^[a-f0-9]{40}$/.test(row.source_sha||"")||typeof row.candidate!=="string")throw Error("Approved candidate with a pinned test recipe required.");
 const bytes=new TextEncoder().encode(row.candidate);if(!bytes.length||bytes.length>5000)throw Error("Candidate size invalid.");
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes)),x=>x.toString(16).padStart(2,"0")).join("");
 const base64=btoa(Array.from(bytes,x=>String.fromCharCode(x)).join(""));
 const res=await fetcher(WORKFLOW,{method:"POST",redirect:"error",signal:AbortSignal.timeout(12000),headers:{authorization:"Bearer "+env.CHAOS_INTEGRATION_TOKEN,accept:"application/vnd.github+json","content-type":"application/json","user-agent":"Knightfall-Owner-Integration"},body:JSON.stringify({ref:"main",inputs:{base_sha:row.source_sha,path:row.path,candidate_base64:base64,candidate_sha256:hash,confirmation:"APPLY TO MAIN"}})});
 if(!res.ok)throw Error("GitHub workflow dispatch rejected (HTTP "+res.status+").");
 return {status:"dispatch_accepted",candidate_sha256:hash,workflow_url:"https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions/workflows/miss-chaos-approved-integration.yml"};
}
