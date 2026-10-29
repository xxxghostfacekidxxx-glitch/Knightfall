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
 assert.match(source,/Math\.min\(battle\.legendaryId\?\.35:\.9/);
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
 assert.match(source,/\["start","encounter-check","attack","special","guard","quick","mend","switch"/);
 assert.match(source,/if\(\["attack","special","guard","quick","mend","switch"\]\.includes\(action\)\)/);
 assert.match(source,/Number\.isInteger\(index\)/);
 assert.match(source,/if\(special&&\(lead\.energy\|\|0\)<2\)/);
 assert.match(source,/const tick=target=>/);
 assert.match(source,/enemySpecial=Math\.random\(\)<\.22/);
 assert.match(source,/member\.energy\|\|0/);
});

test("multiplayer shares full map, faction encounters and landmark rewards",()=>{
 assert.match(source,/x > 16 \|\| y < 1 \|\| y > 12/);
 assert.match(source,/const landmarks=\{"14,3":/);
 assert.match(source,/save\.visitedLandmarks\.push\(landmark\.id\)/);
 assert.match(source,/const zone=save\.x>=11/);
 assert.match(source,/visitedLandmarks:save\.visitedLandmarks\|\|\[\]/);
});
test("server validates online quests and persists all completion flags",()=>{
 assert.match(source,/if\(action==="contract"\)/);
 assert.match(source,/if\(action==="npc"\)/);
 assert.match(source,/if\(action==="commander"\)/);
 assert.match(source,/save\.claimedContracts\.includes\(body\.id\)/);
 assert.match(source,/save\.npcQuestsDone\.push\(body\.id\)/);
 assert.match(source,/save\.defeatedCommanders\.push\(battle\.bossId\)/);
 assert.match(source,/previousSave\?\.claimedContracts\|\|\[\]/);
});

test("legendary creatures have authoritative one-time capture rules",()=>{
 for(const id of ["minionmouse","minivillain","minieddie"])assert.ok(source.includes(id+':{name:'));
 assert.match(source,/if\(action==="legendary"\)/);
 assert.match(source,/save\.capturedLegendaries\.push\(battle\.legendaryId\)/);
 assert.match(source,/capturedLegendaries:save\.capturedLegendaries\|\|\[\]/);
 assert.match(source,/const wildIds=Object\.keys\(species\)/);
});

test("multiplayer validates tactical recovery and expanded evolution roster",()=>{
 for(const id of ["gloamshade","thornmaw","gravruckle","doomwing","noodlarch","bliporacle","hexhound","astraljelly"])assert.ok(source.includes(id+':{name:'));
 assert.match(source,/if\(\(special\|\|mend\)&&\(lead\.energy\|\|0\)<2\)/);
 assert.match(source,/quick\?2:1/);
 assert.match(source,/lead\.status=null/);
 assert.match(source,/const evolutions=/);
});
