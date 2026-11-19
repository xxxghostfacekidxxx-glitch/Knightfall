import test from "node:test";
import assert from "node:assert/strict";
import {metSearch,polyhavenSearch,wikidataSearch,searchChaosResources} from "./chaos-resources.mjs";
const example=(obj)=>({ok:true,json:async()=>obj});
test("Met open access results include only verified public-domain objects",async()=>{
 const visited=[];
 const fetcher=async url=>{visited.push(url);
  if(url.includes("/v1.1/search"))return example({objectIDs:[10,11]});
  return example({objectID:Number(url.split("/").pop()),title:"Museum vest",isPublicDomain:url.endsWith("/10"),objectURL:"https://www.metmuseum.org/art/collection/search/10",primaryImageSmall:"https://images.metmuseum.org/a.jpg",dimensions:"2 ft"});
 };
 const r=await metSearch({query:"vest"},{fetcher});
 assert.equal(r.results.length,1);
 assert.equal(r.results[0].title,"Museum vest");
 assert.ok(visited[0].includes("/v1.1/search"));
 assert.equal(new URL(visited[0]).searchParams.get("hasImages"),"true");
});
test("Poly Haven returns matching CC0 assets with visible attribution",async()=>{
 let requested="";
 const r=await polyhavenSearch({query:"leather",type:"textures"},{fetcher:async(url,opts)=>{
  requested=url;assert.equal(opts.headers["User-Agent"].includes("Knightfall"),true);
  return example({leather01:{name:"Rough Leather",description:"Leather fabric texture",type:1,thumbnail_url:"https://cdn.polyhaven.com/example.png"},
    granite:{name:"Granite",description:"Rock",type:1}});
 }});
 assert.equal(new URL(requested).searchParams.get("t"),"textures");
 assert.equal(r.results.length,1);
 assert.match(r.attribution,/Poly Haven/);
});
test("Wikidata uses a fixed host and permits only Q identifiers",async()=>{
 const r=await wikidataSearch({query:"textile"},{fetcher:async url=>{
  assert.equal(new URL(url).hostname,"www.wikidata.org");return example({search:[{id:"Q120",label:"Textile"},{id:"bad",label:"Wrong"}]});
 }});
 assert.equal(r.results.length,1);assert.equal(r.results[0].url,"https://www.wikidata.org/wiki/Q120");
});
test("no arbitrary URLs and invalid query rejected",async()=>{
 await assert.rejects(searchChaosResources({source:"private",query:"test"}),/Unknown/);
 await assert.rejects(metSearch({query:""}),/public search topic/);
});

test("Poly Haven metadata schema drift cannot crash resource search",async()=>{
 const got=await polyhavenSearch({query:"fabric",type:"textures"},{fetcher:async()=>example({
    good:{name:"Fabric",tags:{fabric:true},description:null},
    other:{name:"Fabric weave",tags:"cloth fabric"},
    junk:null
 })});
 assert.equal(got.results.length,2);
 assert.equal(got.attribution,"Powered by Poly Haven");
});
