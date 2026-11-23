import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";

const read=path=>readFileSync(new URL("../public/"+path,import.meta.url),"utf8");
const social=read("social-hub.js"),html=read("social.html"),friends=read("friends.js"),messages=read("messages.html");
test("group discovery uses authenticated server search and prevents stale results",()=>{
 assert.match(html,/id="group-search"/);
 assert.match(social,/encodeURIComponent\(query\)/);
 assert.match(social,/epoch!==groupSearchEpoch/);
 assert.match(social,/groupSearchTimer=setTimeout\(loadGroups,250\)/);
 assert.match(social,/credentials:"include"/);
});
test("social feed prevents duplicate pagination and recovers its loading state",()=>{
 assert.match(social,/if\(loadingFeed\|\|\(older&&!before\)\)return/);
 assert.match(social,/finally\{loadingFeed=false/);
 assert.match(social,/next&&next!==before/);
});
test("friend list refuses malformed API data and escapes action IDs",()=>{
 assert.match(friends,/Array\.isArray\(d\[key\]\)/);
 assert.match(friends,/esc\(u\.id\)/);
 assert.match(friends,/data-add-friend/);
});
test("message history deduplicates and orders older pages",()=>{
 assert.match(messages,/const seen=new Set\(existing\)/);
 assert.match(messages,/id>=cursor/);
 assert.match(messages,/seen\.add\(String\(id\)\)/);
 assert.match(messages,/sort\(\(a,b\)=>Number\(a\.id\)-Number\(b\.id\)\)/);
 assert.match(messages,/box\.scrollTop=top\+\(box\.scrollHeight-height\)/);
});
test("social and friend clients parse as JavaScript",()=>{
 for(const [name,code] of [["social",social],["friends",friends]])assert.doesNotThrow(()=>new vm.Script(code,{filename:name}));
});
