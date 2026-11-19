import test from "node:test";
import assert from "node:assert/strict";
import {findOpenBooks,findCrossrefPapers} from "./chaos-reference-sources.mjs";
const ok=object=>({ok:true,json:async()=>object});
test("Open Library uses fixed host, limited fields and grounded work links",async()=>{
 let path;
 const out=await findOpenBooks({query:"gothic sewing"},{fetcher:async(url,args)=>{
  path=new URL(url);assert.equal(args.method,"GET");
  return ok({docs:[{key:"/works/OL123W",title:"Crafting",author_name:["A. Artist"],first_publish_year:2010,edition_count:7},
    {key:"https://evil.example/test",title:"Injected"}]});
 }});
 assert.equal(path.hostname,"openlibrary.org");
 assert.equal(path.searchParams.get("q"),"gothic sewing");
 assert.ok(path.searchParams.get("fields").includes("first_publish_year"));
 assert.deepEqual(out.results.map(r=>r.url),["https://openlibrary.org/works/OL123W"]);
 assert.match(out.limits,/not imply a free/);
});
test("Crossref restricts DOI to grounded links and identifies records as metadata",async()=>{
 let url;
 const out=await findCrossrefPapers({query:"textile design"},{fetcher:async(query)=>{url=new URL(query);
  return ok({message:{items:[{DOI:"10.1234/example.5",title:["Fabric study"],
    author:[{given:"A",family:"Maker"}],published:{"date-parts":[[2024,3,1]]},
    "container-title":["Journal of Fabric"],type:"journal-article"},{DOI:"https://evil.invalid",title:["Bad"]}]}});
 }});
 assert.equal(url.hostname,"api.crossref.org");
 assert.equal(url.searchParams.get("rows"),"6");
 assert.equal(out.results.length,1);
 assert.equal(out.results[0].published_year,2024);
 assert.equal(out.results[0].url,"https://doi.org/10.1234/example.5");
 assert.match(out.limits,/not proof of peer review/);
});
test("Free research rejects obvious private data and invalid payloads before fetching",async()=>{
 for(const fn of [findOpenBooks,findCrossrefPapers]){
  await assert.rejects(fn({query:"test@example.com"},{fetcher:()=>{throw Error("should not fetch")}}),/public topic/);
  await assert.rejects(fn({query:""},{fetcher:()=>{throw Error("should not fetch")}}),/public topic/);
 }
});
