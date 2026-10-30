import test from "node:test";
import assert from "node:assert/strict";
import {readFile,access} from "node:fs/promises";
const root=new URL("../public/",import.meta.url);
const read=path=>readFile(new URL(path,root),"utf8");
const selected=["radius-raid","progress-knight"];
test("both imported open-source games have complete local script and stylesheet dependencies",async()=>{
 for(const game of selected){
  const base="arcade/hosted/"+game+"/";
  const html=await read(base+"index.html");
  for(const match of html.matchAll(/<(?:script|link)[^>]*(?:src|href)=["']([^"']+)["']/g)){
   const ref=match[1];
   if(ref.startsWith("http")||ref.startsWith("#"))continue;
   if(ref.startsWith("/")){if(ref.startsWith("/arcade/"))await access(new URL(ref.slice(1),root));continue;}
   await access(new URL(base+ref,root));
  }
  assert.ok(html.includes("/arcade-30-games.html"),game+" missing arcade navigation");
 }
});
test("upstream license notices are preserved",async()=>{
 const mit=await read("arcade/hosted/radius-raid/LICENSE.md");
 const unlicense=await read("arcade/hosted/progress-knight/LICENSE");
 assert.ok(mit.includes("The MIT License"));
 assert.ok(mit.includes("Jack Rugile"));
 assert.ok(unlicense.includes("public domain"));
});
test("arcade catalog links both playable imports without claiming they are original Ash-Fall games",async()=>{
 const html=await read("arcade-30-games.html");
 for(const game of selected)assert.ok(html.includes("/arcade/hosted/"+game+"/index.html"));
 for(const url of ["https://github.com/doublespeakgames/adarkroom","https://github.com/ncase/trust"])assert.ok(html.includes(url),"upstream source attribution missing: "+url);
});

test("Progress Knight includes narrow-screen panel stacking and avoids remote CSS dependencies",async()=>{
 const html=await read("arcade/hosted/progress-knight/index.html");
 assert.ok(html.includes("@media(max-width:800px)"));
 assert.ok(html.includes('display:flex;flex-direction:column'));
 assert.ok(!html.includes("www.w3schools.com"));
 assert.ok(!html.includes("cdn.icon-icons.com"));
});
