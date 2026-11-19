/* Optional public-only Openverse search. Only explicitly typed keywords leave the device.
 * No local artwork, QR contents, cookies, account IDs, or image data are sent. */
const API="https://api.openverse.org/v1/images/";
const LICENSES=new Set(["all","cc0,pdm","by","by-sa"]);
const safeText=(v,max)=>typeof v==="string"?v.replace(/[\u0000-\u001f\u007f]/g," ").trim().slice(0,max):"";
export function safeExternalHttps(value){
 try{const url=new URL(value);return url.protocol==="https:"&&!url.username&&!url.password?url.href:null;}
 catch{return null;}
}
export async function searchOpenverseImages({query,license="all",signal}={},fetcher=fetch){
 const q=safeText(query,120);
 if(q.length<2)throw Error("Enter a search phrase of at least 2 characters.");
 if(!LICENSES.has(license))throw Error("Unsupported Commons license filter.");
 const url=new URL(API);
 url.searchParams.set("q",q);
 url.searchParams.set("page_size","8");
 url.searchParams.set("page","1");
 if(license!=="all")url.searchParams.set("license",license);
 let response;
 try{response=await fetcher(url.href,{method:"GET",mode:"cors",credentials:"omit",redirect:"error",
  referrerPolicy:"no-referrer",cache:"no-store",headers:{accept:"application/json"},
  signal:signal||((typeof AbortSignal.timeout==="function")?AbortSignal.timeout(8500):undefined)});}
 catch(error){if(error?.name==="AbortError")throw Error("Commons search was canceled.");throw Error("Openverse could not be reached from this browser. Try the Openverse website link.");}
 if(response?.status===429)throw Error("Openverse rate limit reached. Use the official site or try later.");
 if(!response?.ok)throw Error("Openverse temporarily unavailable ("+Number(response?.status||0)+").");
 let raw;try{raw=await response.json();}catch{throw Error("Openverse returned unreadable search results.");}
 if(!Array.isArray(raw.results))throw Error("Unexpected Openverse results format.");
 const items=raw.results.slice(0,8).filter(x=>x&&x.mature!==true).map(x=>{
  const landing=safeExternalHttps(x.foreign_landing_url)||safeExternalHttps(x.detail_url);
  if(!landing)return null;
  return {id:safeText(x.id,70),title:safeText(x.title,140)||"Untitled artwork",
   creator:safeText(x.creator,90)||"Unlisted creator",
   license:safeText(x.license,24)||"Check license",
   license_url:safeExternalHttps(x.license_url),
   source:safeText(x.source,40),url:landing,
   attribution:safeText(x.attribution,480)};
 }).filter(Boolean);
 return {source:"Openverse anonymous image search",query:q,items,total:Math.max(0,Number(raw.result_count)||0),
  note:"Search metadata is supplied by Openverse. Confirm licenses, creator credits and actual source rights before using or publishing."};
}
