import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const worker=await readFile(new URL("../backend/src/index.mmo-staging.js",import.meta.url),"utf8");
test("online move slots enforce server-owned PP before a turn",()=>{
 assert.match(worker,/const ppLimits=\[30,25,15,8\]/);
 assert.match(worker,/battle\.movePp\[index\]<=0/);
 assert.match(worker,/battle\.movePp\[chosenMove\.index\]--/);
});
test("online move accuracy and misses are rolled server-side",()=>{
 assert.match(worker,/const missed=chosenMove&&Math\.random\(\)\*100>=\[100,95,90,85\]/);
 assert.match(worker,/battle\.hp=Math\.max\(0,battle\.hp-\(missed\?0:damage\)\)/);
 assert.match(worker,/missed\?" but missed!/);
});
test("level locks and charge checks remain server authoritative",()=>{
 assert.match(worker,/const levelRequired=\[1,1,3,6\]\[index\]/);
 assert.match(worker,/if\(\(lead\.energy\|\|0\)<chosenMove\.charge\)/);
});

test("legacy attack actions cannot bypass server move PP",()=>{
 assert.match(worker,/\["move","attack","quick","special"\]\.includes\(action\)/);
 assert.match(worker,/action==="move"\?body\.index:action==="attack"\?0:action==="quick"\?1:2/);
 assert.match(worker,/if\(battle\.movePp\[index\]<=0\)return json/);
});
