import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
const source=readFileSync("backend/src/index.mmo-staging.js","utf8");
test("monster staging Worker parses",()=>{const result=spawnSync(process.execPath,["--check","--input-type=module"],{input:source,encoding:"utf8"});assert.equal(result.status,0,result.stderr);});
test("battle damage can faint the lead and end the encounter",()=>{
 assert.match(source,/active\.hp=Math\.max\(0,active\.hp-counter\)/);
 assert.match(source,/if\(active\.hp===0\)/);
 assert.match(source,/if\(battleFinished\)battle=null/);
});
test("fainted creatures cannot lead or start encounters",()=>{
 assert.match(source,/if\(save\.party\[index\]\.hp<=0\)/);
 assert.match(source,/if\(lead\.hp<=0\)return json/);
});
test("capture odds are bounded and supply is consumed server-side",()=>{
 assert.match(source,/Math\.min\(\.9,\.35\+/);
 assert.match(source,/save\.bag--/);
});
test("staging cannot silently expose production origins",()=>{
 const header=source.slice(0,source.indexOf("function json"));
 assert.doesNotMatch(header,/https:\/\/(?:www\.)?ash-fall\.com/);
});

test("multiplayer movement is blocked during active battles",()=>{
 assert.match(source,/const activeBattle = await this\.env\.DB\.prepare/);
 assert.match(source,/if \(activeBattle\) \{ socket\.send\(JSON\.stringify\(\{ type: "move-blocked", reason: "battle" \}\)\)/);
});

test("online server supports all twenty monsters and six evolutions",()=>{
 for(const id of ["ashhorn","mossreaper","cryptfin","voltmaw","squibmarshal","glorpcannon","hexpup","starjelly"])assert.ok(source.includes(id+':{name:'));
 assert.match(source,/const evolutions=/);
 assert.match(source,/const grantXp=/);
});
test("online battles authorize specials, guarding, switching, statuses and enemy AI",()=>{
 assert.match(source,/\["start","encounter-check","attack","special","guard","switch"/);
 assert.match(source,/if\(\["attack","special","guard","switch"\]\.includes\(action\)\)/);
 assert.match(source,/Number\.isInteger\(index\)/);
 assert.match(source,/if\(special&&\(lead\.energy\|\|0\)<2\)/);
 assert.match(source,/const tick=target=>/);
 assert.match(source,/const enemySpecial=Math\.random\(\)<\.22/);
 assert.match(source,/member\.energy\|\|0/);
});
