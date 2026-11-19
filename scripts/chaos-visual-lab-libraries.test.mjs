import test from "node:test";
import assert from "node:assert/strict";
import {searchOpenverseImages,safeExternalHttps} from "../public/chaos-openverse.mjs";
import qrcode from "../public/vendor/visual-lab/qrcode.mjs";

test("Openverse is called only for supplied search terms, anonymously, on the fixed HTTPS endpoint",async()=>{
 let requested;
 const results=await searchOpenverseImages({query:"  gothic bat  ",license:"cc0,pdm"},async(url,options)=>{
  requested={url,options};
  return Response.json({result_count:2,results:[
   {id:"a",title:"Original Gothic Bat",creator:"Artist One",license:"cc0",
    foreign_landing_url:"https://commons.wikimedia.org/wiki/File:bat.jpg",
    license_url:"https://creativecommons.org/publicdomain/zero/1.0/",
    attribution:"Bat by Artist One",source:"wikimedia",mature:false},
   {id:"b",title:"Skip bad link",creator:"Hacker",license:"by",foreign_landing_url:"javascript:alert(1)",detail_url:"http://unsafe",mature:false}
  ]});
 });
 const url=new URL(requested.url);
 assert.equal(url.origin,"https://api.openverse.org");
 assert.equal(url.pathname,"/v1/images/");
 assert.equal(url.searchParams.get("q"),"gothic bat");
 assert.equal(url.searchParams.get("license"),"cc0,pdm");
 assert.equal(url.searchParams.get("page_size"),"8");
 assert.equal(requested.options.method,"GET");
 assert.equal(requested.options.credentials,"omit");
 assert.equal(requested.options.referrerPolicy,"no-referrer");
 assert.equal(results.items.length,1);
 assert.equal(results.items[0].url,"https://commons.wikimedia.org/wiki/File:bat.jpg");
 assert.equal(results.items[0].license_url,"https://creativecommons.org/publicdomain/zero/1.0/");
});
test("Commons rejects unsafe URLs, invalid filters and network errors",async()=>{
 for(const url of ["javascript:alert(1)","data:text/html,a","http://example.com","https://user:password@example.com"])
  assert.equal(safeExternalHttps(url),null);
 assert.equal(safeExternalHttps("https://example.org/resource"),"https://example.org/resource");
 await assert.rejects(searchOpenverseImages({query:" "},async()=>Response.json({results:[]})),/at least 2/);
 await assert.rejects(searchOpenverseImages({query:"bat",license:"untrusted"},async()=>Response.json({results:[]})),/Unsupported/);
 await assert.rejects(searchOpenverseImages({query:"bat"},async()=>new Response("",{status:429})),/rate limit/);
 await assert.rejects(searchOpenverseImages({query:"bat"},async()=>{throw Error("private backend token");}),/could not be reached/);
});
test("MIT QR generator produces actual scan data matrix with ECC",()=>{
 const code=qrcode(0,"M");
 code.addData("https://ash-fall.com/profile.html");
 code.make();
 assert.ok(code.getModuleCount()>=21);
 assert.equal(typeof code.isDark(0,0),"boolean");
 assert.ok(code.createSvgTag(3,4).includes("<svg"));
});
