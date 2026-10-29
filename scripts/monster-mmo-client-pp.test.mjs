import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const client=await readFile(new URL("../public/monster-mmo.js",import.meta.url),"utf8");
test("battle buttons show server-owned PP and disable depleted slots",()=>{
 assert.match(client,/Array\.isArray\(battle\?\.movePp\)/);
 assert.match(client,/PP "\+pp/);
 assert.match(client,/pp!==null&&pp<=0/);
});
test("offline move PP and misses respect level and charge rules",()=>{
 assert.match(client,/battle\.movePp=\[30,25,15,8\]/);
 assert.match(client,/battle\.movePp\[index\]--/);
 assert.match(client,/extra\.moveMissed=Math\.random\(\)\*100/);
 assert.match(client,/charged&&!missed\?inflictStatus/);
});
