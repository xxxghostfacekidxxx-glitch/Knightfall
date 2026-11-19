/** Curated public bibliographic metadata. No arbitrary hosts, credentials or full-text claims. */
const UA="Knightfall-MissChaos/1.1 (https://ash-fall.com)";
function topic(value){
 if(typeof value!=="string")throw Error("Search a public topic (2–100 characters).");
 const q=value.trim();
 if(q.length<2||q.length>100||/[\x00-\x1f]/.test(q)||/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(q)||/\b\d{10,}\b/.test(q))
   throw Error("Search a public topic; do not enter email addresses, phone numbers or account details.");
 return q;
}
async function getJson(url,{fetcher=fetch}={}){
 const response=await fetcher(url,{method:"GET",headers:{"Accept":"application/json","User-Agent":UA},
   signal:typeof AbortSignal.timeout==="function"?AbortSignal.timeout(7000):undefined});
 if(!response?.ok)throw Error("Free reference service temporarily unavailable.");
 return response.json();
}
const trim=(v,max)=>typeof v==="string"?v.trim().slice(0,max):"";
const arr=(v)=>Array.isArray(v)?v:[];
export async function findOpenBooks(input,{fetcher=fetch}={}){
 const q=topic(input?.query);
 const url=new URL("https://openlibrary.org/search.json");
 url.searchParams.set("q",q);url.searchParams.set("limit","6");
 url.searchParams.set("fields","key,title,author_name,first_publish_year,edition_count");
 const body=await getJson(url.toString(),{fetcher});
 const results=arr(body?.docs).slice(0,6).filter(v=>v&&/^\/works\/OL\d+W$/.test(v.key||"")).map(v=>({
   title:trim(v.title,150)||"Untitled",
   authors:arr(v.author_name).slice(0,3).map(a=>trim(a,80)).filter(Boolean),
   first_publish_year:Number.isInteger(v.first_publish_year)&&v.first_publish_year>0&&v.first_publish_year<=3000?v.first_publish_year:null,
   editions:Number.isInteger(v.edition_count)&&v.edition_count>0?v.edition_count:null,
   url:"https://openlibrary.org"+v.key
 }));
 return {source:"Open Library",kind:"book catalog metadata",results,limits:"Catalog records do not imply a free full-text edition or verify book availability."};
}
export async function findCrossrefPapers(input,{fetcher=fetch}={}){
 const q=topic(input?.query);
 const url=new URL("https://api.crossref.org/works");
 url.searchParams.set("query.bibliographic",q);url.searchParams.set("rows","6");
 url.searchParams.set("select","DOI,title,author,published,container-title,type");
 const body=await getJson(url.toString(),{fetcher});
 const results=arr(body?.message?.items).slice(0,6).filter(v=>v&&/^10\.\d{4,9}\/[^\s<>"']{1,220}$/i.test(v.DOI||"")).map(v=>{
   const date=arr(v.published?.["date-parts"])[0];
   const year=Array.isArray(date)&&Number.isInteger(date[0])&&date[0]>=1500&&date[0]<=3000?date[0]:null;
   return {
     title:trim(arr(v.title)[0],180)||"Untitled publication",
     authors:arr(v.author).slice(0,4).map(a=>[trim(a?.given,55),trim(a?.family,75)].filter(Boolean).join(" ")).filter(Boolean),
     publication:trim(arr(v["container-title"])[0],125),
     published_year:year,
     type:trim(v.type,60),
     doi:trim(v.DOI,230),
     url:"https://doi.org/"+encodeURI(v.DOI).replace(/[?#]/g,c=>encodeURIComponent(c))
   };
 });
 return {source:"Crossref",kind:"scholarly bibliographic records",results,limits:"Crossref indexes publisher-supplied metadata; results are not proof of peer review, full-text access, or claims in a paper."};
}
