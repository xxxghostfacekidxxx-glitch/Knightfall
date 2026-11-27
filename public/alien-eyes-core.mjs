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
export async function inspectRepository(input,{fetcher=fetch,signal}={}){
 const r=parseRepository(input);
 const response=await fetcher(r.url,{method:"GET",credentials:"omit",redirect:"error",headers:{Accept:"application/vnd.github+json"},signal});
 if(!response.ok)throw Error(response.status===403||response.status===429?"Public API rate limit or access denied. Try later.":"Public project unavailable ("+response.status+")");
 const data=await response.json();
 if(typeof data.full_name!=="string"||data.full_name.toLowerCase()!==(r.owner+"/"+r.repo).toLowerCase())throw Error("Repository identity mismatch");
 return summarizeRepository(data);
}
