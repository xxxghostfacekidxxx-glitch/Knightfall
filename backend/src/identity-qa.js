// Read-only evidence; no account provisioning, secrets or workflow dispatch.
export const IDENTITY_QA_WORKERS=Object.freeze([
 {name:"Null Saint",job:"Null Saint / capability matrix",scope:"Role permissions and expired sessions"},
 {name:"Vesper Vile",job:"Vesper Vile / browser visibility",scope:"Mobile and desktop simulated identities"},
 {name:"Deadbolt.exe",job:"Deadbolt.exe / live authentication",scope:"Dedicated account login, read-only authorization and logout"}
]);
const repo="https://api.github.com/repos/xxxghostfacekidxxx-glitch/Knightfall";
const web="https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions";
const validId=x=>Number.isSafeInteger(x)&&x>0;
const status=x=>["queued","in_progress","completed","waiting","pending","requested"].includes(x)?x:"unknown";
const conclusion=x=>["success","failure","cancelled","skipped","timed_out","action_required","neutral","stale"].includes(x)?x:null;
export async function readIdentityQA(fetcher=fetch){
 const common={workers:IDENTITY_QA_WORKERS,workflow:web+"/workflows/identity-qa.yml"};
 const unavailable=message=>({...common,verified:false,message});
 const options={headers:{accept:"application/vnd.github+json","user-agent":"KnightfallIdentityQA/1.0"},cf:{cacheTtl:120,cacheEverything:true},signal:AbortSignal.timeout(6000)};
 try{
  const response=await fetcher(repo+"/actions/workflows/identity-qa.yml/runs?branch=main&per_page=1",options);
  if(!response.ok)return unavailable("GitHub status unavailable ("+response.status+").");
  const r=(await response.json()).workflow_runs?.[0];
  if(!validId(r?.id))return unavailable("No identity QA run found.");
  const run={id:r.id,status:status(r.status),conclusion:conclusion(r.conclusion),sha:/^[a-f0-9]{40}$/.test(r.head_sha||"")?r.head_sha:null,url:web+"/runs/"+r.id};
  const responseJobs=await fetcher(repo+"/actions/runs/"+r.id+"/jobs?per_page=50",options);
  if(!responseJobs.ok)return {...common,verified:true,run,jobs_verified:false,jobs:[]};
  const raw=(await responseJobs.json()).jobs||[];
  const jobs=IDENTITY_QA_WORKERS.map(w=>{const j=raw.find(x=>x.name===w.job);return {...w,status:j?status(j.status):"not_reported",conclusion:conclusion(j?.conclusion),url:validId(j?.id)?run.url+"/job/"+j.id:null}});
  return {...common,verified:true,run,jobs_verified:true,jobs};
 }catch{return unavailable("GitHub QA evidence could not be retrieved.");}
}
