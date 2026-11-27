import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const page=readFileSync("public/grimoire-archives.html","utf8");
const source=readFileSync("public/grimoire-archives.js","utf8");
test("archive contains 72 unique numbered seals, 14 manuscripts and 8 ceremonial records",()=>{
 const ids=[...page.matchAll(/GOETIA · (\d\d)/g)].map(m=>Number(m[1]));
 assert.deepEqual(ids,Array.from({length:72},(_,i)=>i+1));
 assert.equal((page.match(/class="ga-card" data-ga-item/g)||[]).length,22);
 assert.equal((page.match(/View seal and provenance/g)||[]).length,72);
 assert.match(page,/modern copyrighted literature/);
 assert.match(page,/https:\/\/www.gutenberg.org\/ebooks\/72679/);
});
test("archive anchors, local assets and Veil entry",()=>{
 const ids=[...page.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(ids).size,ids.length);
 for(const [,id] of page.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(id),id);
 for(const [,file] of page.matchAll(/(?:href|src)="\/(grimoire-archives\.(?:css|js))"/g))assert.ok(readFileSync("public/"+file,"utf8").length);
 assert.match(readFileSync("public/the-veil.html","utf8"),/href="\/grimoire-archives\.html"/);
});
test("search matches case-insensitively, clears and reports empty results",()=>{
 const items=[{textContent:"Paimon Goetia"},{textContent:"Urilia Text"}];
 const input={value:"",addEventListener:(name,fn)=>{assert.equal(name,"input");input.filter=fn;}};
 const status={textContent:""};
 vm.runInNewContext(source,{document:{getElementById:id=>id==="ga-query"?input:status,querySelectorAll:()=>items}});
 assert.equal(status.textContent,"2 of 2 records shown.");
 input.value=" PAIMON ";input.filter();assert.equal(items[0].hidden,false);assert.equal(items[1].hidden,true);
 input.value="unknown";input.filter();assert.equal(status.textContent,"0 of 2 records shown.");
 input.value="";input.filter();assert.equal(status.textContent,"2 of 2 records shown.");
});
