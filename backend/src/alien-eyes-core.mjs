// Original public project metadata inspector. No person or username discovery.
export function parseRepository(input){
 const s=String(input??"").trim();
 if(s.length>220)throw Error("Repository reference too long");
 const raw=s.replace(/^https:\/\/github\.com\//i,"").replace(/\/$/,"").replace(/\.git$/i,"");
 const m=/^([a-z\d](?:[a-z\d-]{0,38}))\/([a-z\d_.-]{1,100})$/i.exec(raw);
 if(!m||[".",".."].includes(m[2]))throw Error("Enter an exact public GitHub owner/repository or repository URL");
 return {owner:m[1],repo:m[2],url:"https://api.github.com/repos/"+encodeURIComponent(m[1])+"/"+encodeURIComponent(m[2])};
}
export function summarizeRepository(data){
 if(!data||data.private!==false||typeof data.full_name!=="string")throw Error("Public repository metadata unavailable");
 const parsed=parseRepository(data.full_name);
 const clean=(s,n)=>typeof s==="string"?s.slice(0,n):"";
 const date=s=>typeof s==="string"&&Number.isFinite(Date.parse(s))?new Date(s).toISOString():null;
 const count=n=>Number.isSafeInteger(n)&&n>=0?n:null;
 const license=clean(data.license?.spdx_id,80);
 return {project:parsed.owner+"/"+parsed.repo,source:"https://github.com/"+parsed.owner+"/"+parsed.repo,description:clean(data.description,500),license:license&&license!=="NOASSERTION"?license:"Unverified",language:clean(data.language,80)||"Not reported",stars:count(data.stargazers_count),openIssues:count(data.open_issues_count),archived:data.archived===true,lastPush:date(data.pushed_at),defaultBranch:clean(data.default_branch,100),topics:Array.isArray(data.topics)?data.topics.slice(0,20).map(x=>clean(x,50)).filter(Boolean):[],notes:["Metadata is publisher-reported; verify license files and dependencies before adopting code.","Open issues may include pull requests. Stars are not a security or quality rating."]};
}
const runtimeFetch=(...args)=>globalThis.fetch(...args);
export async function inspectRepository(input,{fetcher=runtimeFetch,signal}={}){
 const r=parseRepository(input);
 const response=await fetcher(r.url,{method:"GET",credentials:"omit",redirect:"error",headers:{Accept:"application/vnd.github+json","User-Agent":"Knightfall-Alien-Eyes/2.0"},signal});
 if(!response.ok)throw Error(response.status===403||response.status===429?"Public API rate limit or access denied. Try later.":"Public project unavailable ("+response.status+")");
 const data=await response.json();
 if(typeof data.full_name!=="string"||data.full_name.toLowerCase()!==(r.owner+"/"+r.repo).toLowerCase())throw Error("Repository identity mismatch");
 return summarizeRepository(data);
}

const safe=(value,n=120)=>typeof value==="string"?value.slice(0,n):"";
const asCount=n=>Number.isSafeInteger(n)&&n>=0?n:null;
async function boundedJson(response){if(!response.ok)throw Object.assign(Error("Upstream response unavailable"),{status:response.status});const reader=response.body?.getReader();if(!reader)throw Error("Missing response body");const decoder=new TextDecoder();let text="",bytes=0;try{while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>160000){await reader.cancel();throw Error("Response size limit");}text+=decoder.decode(value,{stream:true});}return JSON.parse(text+decoder.decode());}finally{reader.releaseLock();}}
export async function inspectProjectDetails(input,{fetcher=runtimeFetch,signal}={}){
 const ref=parseRepository(input),base=await inspectRepository(input,{fetcher,signal});
 const headers={Accept:"application/vnd.github+json","User-Agent":"Knightfall-Alien-Eyes/2.0"};
 const endpoints={languages:"/languages",license:"/license",release:"/releases/latest",contents:"/contents"};
 const results=await Promise.all(Object.entries(endpoints).map(async ([key,suffix])=>{try{const data=await boundedJson(await fetcher(ref.url+suffix,{method:"GET",credentials:"omit",redirect:"error",headers,signal}));return [key,{status:"available",data}];}catch(e){return [key,{status:e?.status===404?"not-reported":e?.status===429||e?.status===403?"rate-limited":"unavailable"}];}}));
 const parts=Object.fromEntries(results),languages=parts.languages.data,license=parts.license.data,release=parts.release.data,contents=parts.contents.data;
 return {...base,checkedAt:new Date().toISOString(),collectedBy:"scheduled-or-direct-worker",sections:Object.fromEntries(results.map(([k,v])=>[k,v.status])),languages:languages&&typeof languages==="object"&&!Array.isArray(languages)?Object.entries(languages).filter(([k,v])=>k.length<=100&&asCount(v)!==null).sort((a,b)=>b[1]-a[1]).slice(0,20).map(([language,bytes])=>({language,bytes})):[],licenseFile:license&&typeof license==="object"?{name:safe(license.name),spdx:safe(license.license?.spdx_id),path:safe(license.path),sha:/^[a-f0-9]{40}$/i.test(license.sha||"")?license.sha:null}:null,latestRelease:release&&typeof release==="object"&&!Array.isArray(release)?{tag:safe(release.tag_name),name:safe(release.name),published:safe(release.published_at),prerelease:release.prerelease===true}:null,projectFiles:Array.isArray(contents)?contents.filter(x=>x.type==="file"&&/^(?:readme(?:\..+)?|licen[cs]e(?:\..+)?|copying(?:\..+)?|security\.md|contributing\.md|package\.json|pyproject\.toml|cargo\.toml|cmakelists\.txt|go\.mod|requirements\.txt|makefile|dockerfile)$/i.test(x.name||"")).slice(0,25).map(x=>({name:safe(x.name),size:asCount(x.size)})):[],sourceEndpoints:Object.fromEntries(Object.entries(endpoints).map(([k,suffix])=>[k,ref.url+suffix]))};
}
export const ALIEN_PROJECTS=Object.freeze(["tree-sitter/tree-sitter","microsoft/pyright","huggingface/tokenizers","ggml-org/llama.cpp","EleutherAI/lm-evaluation-harness","bytecodealliance/wasmtime"]);
export async function readAlienCatalog(env){const rows=(await env.DB.prepare("SELECT value,updated_at FROM site_settings WHERE key LIKE 'alien_software_report:%' ORDER BY updated_at DESC LIMIT 6").all()).results||[];return rows.flatMap(row=>{try{const x=JSON.parse(row.value);return ALIEN_PROJECTS.some(p=>p.toLowerCase()===String(x.project).toLowerCase())?[x]:[];}catch{return [];}});}
export async function refreshAlienCatalog(env,time,{fetcher=runtimeFetch}={}){
 const control=await env.DB.prepare("SELECT k.enabled,e.paused FROM chaos_knowledge_66_control k JOIN eye_chaos_controls e ON e.id=1 WHERE k.id=1").first();if(Number(control?.enabled)!==1||Number(control?.paused)!==0)return {status:"paused"};
 const setting=await env.DB.prepare("SELECT value FROM site_settings WHERE key='eye_tool_review:alien-eyes'").first();if(setting){try{if(JSON.parse(setting.value).decision==="scrapped")return {status:"disabled"};}catch{return {status:"invalid-control"};}}
 const hour=Math.floor(Number(time)/3600000);if(!Number.isSafeInteger(hour)||hour<0)throw Error("Invalid schedule");const project=ALIEN_PROJECTS[hour%ALIEN_PROJECTS.length],key="alien_software_report:"+project.toLowerCase();
 const prior=await env.DB.prepare("SELECT updated_at FROM site_settings WHERE key=?").bind(key).first();if(prior&&Number(time)-Date.parse(prior.updated_at)<6*3600000)return {status:"fresh",project};
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
 try{const report=await inspectProjectDetails(project,{fetcher,signal:controller.signal});await env.DB.prepare("INSERT INTO site_settings(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at").bind(key,JSON.stringify(report),report.checkedAt).run();return {status:"complete",project};}finally{clearTimeout(timer);}
}

export function matchAlienCatalog(reports,message){const text=String(message||"").toLowerCase();const aliases={"tree-sitter/tree-sitter":/\b(?:tree.sitter|parser|syntax tree)\b/,"microsoft/pyright":/\b(?:pyright|python type|type.check)\b/,"huggingface/tokenizers":/\b(?:tokenizer|tokenizers|tokenization|subword)\b/,"ggml-org/llama.cpp":/\b(?:llama\.cpp|gguf|local inference)\b/,"eleutherai/lm-evaluation-harness":/\b(?:lm.eval|evaluation harness|benchmark)\b/,"bytecodealliance/wasmtime":/\b(?:wasmtime|webassembly|wasm)\b/};return reports.filter(r=>aliases[String(r.project).toLowerCase()]?.test(text)).slice(0,3).map(r=>({project:r.project,source:r.source,description:String(r.description||"").slice(0,300),license:r.license,language:r.language,release:r.latestRelease?.tag||null,checkedAt:r.checkedAt}));}
