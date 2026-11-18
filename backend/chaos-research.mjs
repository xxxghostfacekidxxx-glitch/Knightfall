/**
 * Free, attributed, constrained encyclopedia lookup. Fixed host prevents SSRF.
 * No arbitrary URL fetching, no paid API, no account content in queries.
 */
export async function wikipediaLookup(input={}, {fetcher=fetch}={}){
  const query=String(input.query||"").trim();
  if(query.length<2||query.length>160||/[@\r\n]|\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/.test(query))
    throw Error("Search a public topic of 2–160 characters, not private information.");
  const endpoint=new URL("https://en.wikipedia.org/w/rest.php/v1/search/page");
  endpoint.searchParams.set("q",query);
  endpoint.searchParams.set("limit","3");
  const response=await fetcher(endpoint.href,{
    method:"GET",
    headers:{"accept":"application/json","api-user-agent":"KnightfallMissChaos/1.0 (https://ash-fall.com)"},
    signal:typeof AbortSignal.timeout==="function"?AbortSignal.timeout(6500):undefined
  });
  if(!response?.ok)throw Error("Wikipedia search temporarily unavailable.");
  const body=await response.json();
  const results=(Array.isArray(body.pages)?body.pages:[]).slice(0,3).map(page=>{
    const title=String(page.title||"").slice(0,160);
    const key=String(page.key||title).slice(0,160);
    const excerpt=String(page.excerpt||page.description||"")
      .replace(/<[^>]*>/g,"").replace(/&quot;/g,'"').replace(/&amp;/g,"&").slice(0,450);
    return {title,url:"https://en.wikipedia.org/wiki/"+encodeURIComponent(key.replaceAll(" ","_")),excerpt};
  }).filter(x=>x.title);
  return {source:"Wikipedia (encyclopedia, not live news)",retrieved_at:new Date().toISOString(),results,
    attribution:"Wikipedia contributors; follow the linked articles for verification and references."};
}
export function currentClock({timezone="UTC"}={}){
  const zone=String(timezone||"UTC").trim().slice(0,80);
  let local;
  try{local=new Intl.DateTimeFormat("en-US",{timeZone:zone,dateStyle:"full",timeStyle:"long"}).format(new Date());}
  catch{throw Error("Provide a valid IANA time zone.");}
  return {now_utc:new Date().toISOString(),timezone:zone,local};
}
