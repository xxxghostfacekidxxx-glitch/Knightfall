/** Bounded public-data adapters. No arbitrary model-selected URLs, API secrets or scraping. */
const MAX_QUERY=90;
const USER_AGENT="Knightfall-MissChaos-Forgelab/1.0 (https://ash-fall.com)";
function queryText(q){
 const text=String(q||"").trim();
 if(text.length<2||text.length>MAX_QUERY||/[\u0000-\u001f]/.test(text)||/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(text)||/\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/.test(text)||/\b\d{10,}\b/.test(text))throw Error("Enter a public search topic (2–90 characters), not private information.");
 return text;
}
async function jsonGet(url,{fetcher=fetch,agent=false}={}){
 const response=await fetcher(url,{method:"GET",headers:{"Accept":"application/json",...(agent?{"User-Agent":USER_AGENT}: {})},
   signal:typeof AbortSignal.timeout==="function"?AbortSignal.timeout(6000):undefined});
 if(!response?.ok)throw Error("The free catalog is temporarily unavailable.");
 return response.json();
}
export async function metSearch(input,{fetcher=fetch}={}){
 const q=queryText(input.query);
 const search=new URL("https://collectionapi.metmuseum.org/public/collection/v1.1/search");
 search.searchParams.set("q",q);search.searchParams.set("hasImages","true");search.searchParams.set("limit","8");
 const found=await jsonGet(search.toString(),{fetcher});
 const ids=(Array.isArray(found.objectIDs)?found.objectIDs:[]).filter(n=>Number.isSafeInteger(n)&&n>0).slice(0,7);
 const items=await Promise.all(ids.map(async id=>{
   try{const obj=await jsonGet("https://collectionapi.metmuseum.org/public/collection/v1/objects/"+id,{fetcher});
     if(!obj.isPublicDomain)return null;
     const url=String(obj.objectURL||"");
     return {title:String(obj.title||"Untitled").slice(0,160),creator:String(obj.artistDisplayName||"Unknown").slice(0,90),
       period:String(obj.objectDate||"").slice(0,70),medium:String(obj.medium||"").slice(0,120),
       dimensions:String(obj.dimensions||"").slice(0,120),
       image:/^https:\/\/images\.metmuseum\.org\//i.test(obj.primaryImageSmall||"")?obj.primaryImageSmall:"",
       url:/^https:\/\/www\.metmuseum\.org\//i.test(url)?url:"https://www.metmuseum.org/art/collection/search/"+id,
       license:"Public domain / CC0 data"};
   }catch{return null;}
 }));
 return {source:"The Metropolitan Museum of Art Open Access",license:"Only records explicitly marked public domain are shown",
   results:items.filter(Boolean).slice(0,5)};
}
export async function polyhavenSearch(input,{fetcher=fetch}={}){
 const q=queryText(input.query).toLowerCase();
 const type=["models","textures","hdris"].includes(input.type)?input.type:"models";
 const url=new URL("https://api.polyhaven.com/assets");url.searchParams.set("t",type);
 const data=await jsonGet(url.toString(),{fetcher,agent:true});
 const tokens=q.match(/[a-z0-9]{2,}/g)||[];
 const results=Object.entries(data||{}).slice(0,12000).map(([id,item])=>{
   // Upstream catalogs are outside our control: tags may be missing or not an array.
   if(!item||typeof item!=="object"||Array.isArray(item))return {id,item:null,score:0};
   const tags=Array.isArray(item.tags)?item.tags.join(" "):typeof item.tags==="string"?item.tags:"";
   const hay=(id+" "+String(item.name||"")+" "+String(item.description||"")+" "+tags).toLowerCase();
   const score=tokens.reduce((n,t)=>n+(hay.includes(t)?1:0),0);
   return {id,item,score};
 }).filter(x=>x.score>0&&/^[a-z0-9_-]{1,100}$/.test(x.id))
   .sort((a,b)=>b.score-a.score).slice(0,8).map(({id,item})=>({
     title:String(item.name||id).slice(0,160),description:String(item.description||"").slice(0,250),
     type,url:"https://polyhaven.com/a/"+id,
     image:/^https:\/\/cdn\.polyhaven\.com\//.test(item.thumbnail_url||"")?item.thumbnail_url:"",
     license:"CC0"
   }));
 return {source:"Poly Haven",attribution:"Powered by Poly Haven",license:"Assets CC0; live API usage requires source credit",results};
}
export async function wikidataSearch(input,{fetcher=fetch}={}){
 const q=queryText(input.query);
 const url=new URL("https://www.wikidata.org/w/api.php");
 for(const [k,v]of Object.entries({action:"wbsearchentities",format:"json",language:"en",search:q,limit:"6"}))url.searchParams.set(k,v);
 const body=await jsonGet(url.toString(),{fetcher,agent:true});
 const results=(Array.isArray(body.search)?body.search:[]).slice(0,6).filter(x=>/^Q\d+$/.test(x.id||""))
  .map(x=>({title:String(x.label||x.id).slice(0,140),description:String(x.description||"").slice(0,260),
   url:"https://www.wikidata.org/wiki/"+x.id,license:"CC0 structured data"}));
 return {source:"Wikidata",license:"CC0 structured data; verify individual statements",results};
}
export async function searchChaosResources({source,query,type}={},opts={}){
 if(source==="met")return metSearch({query},opts);
 if(source==="polyhaven")return polyhavenSearch({query,type},opts);
 if(source==="wikidata")return wikidataSearch({query},opts);
 throw Error("Unknown resource library.");
}
