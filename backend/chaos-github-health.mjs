/**
 * Read-only owner diagnostic for Knightfall's PUBLIC GitHub workflow data.
 * Does not use stored GitHub credentials, GitHub installations or repo write APIs.
 */
const REPO="xxxghostfacekidxxx-glitch/Knightfall";
const ROOT="https://github.com/"+REPO;
const API="https://api.github.com/repos/"+REPO+"/actions/runs";
const trim=(x,max)=>typeof x==="string"?x.slice(0,max):"";
const knownStatuses=new Set(["queued","in_progress","completed","pending","waiting","requested"]);
const knownConclusions=new Set(["success","failure","cancelled","skipped","timed_out","action_required","neutral","startup_failure"]);
const validDate=value=>typeof value==="string"&&/^\d{4}-\d{2}-\d{2}T/.test(value)?value.slice(0,24):null;
function proposal(run){
 const name=run.name.toLowerCase();
 let recommendation;
 if(/auth|ownership|audit|security/.test(name)){
  recommendation="Review the actual audit job logs and missing credential configuration. Do not weaken or skip the audit gate.";
 }else if(/deploy|workers?|pages/.test(name)){
  recommendation="Inspect the failing deployment step, configuration, quota and binding errors. Draft a minimal change only after confirming the cause.";
 }else if(/smoke|browser|regression/.test(name)){
  recommendation="Reproduce the failing UI or regression assertion, fix the affected code and test, and rerun the relevant jobs.";
 }else{
  recommendation="Inspect failed job steps and logs, determine a specific cause, then prepare a minimal reviewed patch.";
 }
 return {workflow:run.name,run_url:run.url,severity:"needs_review",
  diagnosis:"Not confirmed by workflow metadata alone",recommended_action:recommendation,
  next_step:"Owner reviews job logs and approves any proposed code change separately.",
  approved:false,code_changed:false};
}
export async function getKnightfallGithubHealth({fetcher=fetch}={}){
 const endpoint=new URL(API);
 endpoint.searchParams.set("branch","main");endpoint.searchParams.set("per_page","12");
 let response;
 try{
  response=await fetcher(endpoint.toString(),{method:"GET",
   headers:{"Accept":"application/vnd.github+json","User-Agent":"Knightfall-MissChaos/1.0"},
   signal:typeof AbortSignal.timeout==="function"?AbortSignal.timeout(6500):undefined});
 }catch{throw Error("Public GitHub workflow diagnostics unavailable.");}
 if(!response?.ok)throw Error("Public GitHub workflow diagnostics unavailable or rate-limited.");
 const data=await response.json();
 if(!Array.isArray(data?.workflow_runs))throw Error("GitHub returned invalid workflow data.");
 const workflows=data.workflow_runs.slice(0,12).filter(run=>{
  return Number.isSafeInteger(run?.id)&&run.id>0&&run.head_branch==="main";
 }).map(run=>({
  name:trim(run.name,110)||"Unnamed workflow",id:run.id,
  status:knownStatuses.has(run.status)?run.status:"unknown",
  conclusion:knownConclusions.has(run.conclusion)?run.conclusion:run.conclusion===null?null:"unknown",
  commit:/^[a-f0-9]{40}$/i.test(run.head_sha||"")?run.head_sha.slice(0,12):null,
  created_at:validDate(run.created_at),
  url:ROOT+"/actions/runs/"+run.id
 }));
 const failures=workflows.filter(run=>run.conclusion==="failure");
 return {source:"GitHub public Actions API",repo:REPO,branch:"main",read_only:true,
  checked_count:workflows.length,failed_count:failures.length,workflows,
  repair_proposals:failures.slice(0,6).map(proposal),
  owner_approval_required:true,no_code_modified:true,
  limitations:"Only the newest 12 public workflow runs are checked; job logs and secret configuration were not retrieved. API rate limits apply. No authentication or repository write permission is used."};
}
