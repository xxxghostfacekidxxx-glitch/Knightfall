/** Free, fixed-host public GitHub repo lookup. No private account data or arbitrary URL fetches. */
function topic(raw){
 if(typeof raw!=="string")throw Error("Provide a public topic.");
 const value=raw.trim();
 if(value.length<2||value.length>100||/[\x00-\x1f<>@\\]|ghp_|gho_|bearer |sk-[A-Za-z0-9]{12}/i.test(value)||
    /\b\d{10,}\b/.test(value))throw Error("Search public project topics only.");
 return value;
}
const clip=(v,n)=>typeof v==="string"?v.trim().slice(0,n):"";
export async function findChaosGithubRepos(input={}, {fetcher=fetch}={}){
 const query=topic(input.query);
 const u=new URL("https://api.github.com/search/repositories");
 u.searchParams.set("q",query+" in:name,description archived:false");
 u.searchParams.set("sort","stars");u.searchParams.set("order","desc");u.searchParams.set("per_page","10");
 let response;
 try{response=await fetcher(u.toString(),{method:"GET",
  headers:{"Accept":"application/vnd.github+json","User-Agent":"Knightfall-MissChaos/1.0"},
  signal:typeof AbortSignal.timeout==="function"?AbortSignal.timeout(6500):undefined});}
 catch{throw Error("GitHub public search unavailable.");}
 if(!response?.ok)throw Error("GitHub public search unavailable or rate-limited.");
 const data=await response.json();
 if(!Array.isArray(data?.items))throw Error("Invalid GitHub search response.");
 const results=data.items.slice(0,10).filter(item=>item&&!item.private&&!item.archived&&
   /^[A-Za-z0-9_.-]{1,70}\/[A-Za-z0-9_.-]{1,100}$/.test(item.full_name||"")&&
   typeof item.license?.spdx_id==="string"&&item.license.spdx_id!=="NOASSERTION").slice(0,6).map(item=>({
   name:clip(item.full_name,175),url:"https://github.com/"+item.full_name,
   description:clip(item.description,220),license:clip(item.license.spdx_id,40),
   stars:Number.isSafeInteger(item.stargazers_count)?item.stargazers_count:null,
   language:clip(item.language,40)||null,
   updated_at:typeof item.updated_at==="string"&&/^\d{4}-\d{2}-\d{2}T/.test(item.updated_at)?item.updated_at:null
 }));
 return {source:"GitHub public repository search",query,results,
  scope:"Public and non-archived repositories with GitHub license metadata; sorted by stars.",
  limitations:"Search is rate-limited. Declared license, popularity and maintenance are not independently audited. No private GitHub access, clones or installations."};
}
