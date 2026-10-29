import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
const js=readFileSync("public/monster-mmo.js","utf8");
const html=readFileSync("public/monster-mmo.html","utf8");
const css=readFileSync("public/monster-mmo.css","utf8");
test("creature frontend parses as a module",()=>{
 const result=spawnSync(process.execPath,["--check","--input-type=module"],{input:js,encoding:"utf8"});
 assert.equal(result.status,0,result.stderr);
});
test("online and offline maps share the 16 by 12 world",()=>{
 assert.match(js,/x<=16&&y>=1&&y<=12/);
 assert.match(js,/const width=16,height=12/);
 assert.match(js,/obstacles=new Set/);
 assert.match(js,/function render\(/);
 assert.match(js,/map\.style\.gridTemplateColumns/);
});
test("mobile controls and gameplay are wired",()=>{
 for(const id of ["world","party","battle","trainer","connect","disconnect","rest","encounter","log"])assert.ok(html.includes('id="'+id+'"'),"Missing "+id);
 for(const action of ["attack","capture","flee"])assert.ok(html.includes('data-action="'+action+'"'));
 for(const dir of ["up","down","left","right"])assert.ok(html.includes('data-move="'+dir+'"'));
 assert.match(js,/async function move\(/);
 assert.match(js,/function offlineAction\(/);
});
test("cloud play uses server intents and protects offline state",()=>{
 assert.match(js,/expected_version:version/);
 assert.match(js,/type:"move",direction/);
 assert.match(js,/offlineSave=structuredClone\(save\)/);
 assert.match(js,/credentials:"include"/);
 assert.match(js,/new WebSocket\(wsUrl\)/);
});

test("journal and starter selection are wired to original species",()=>{
 for(const id of ["journal","quests","starter-select","reset-preview"])assert.ok(html.includes('id="'+id+'"'),"Missing "+id);
 for(const id of ["mossbit","embercub","driftfin"])assert.ok(html.includes('data-starter="'+id+'"'),"Missing starter "+id);
 for(const id of ["mossbit","embercub","driftfin","gloamlet","thornspit","zipfang","grubruckle","mournwing","squibblex","glorpbot","noodloid","blipmoth"])assert.ok(js.includes(id+":["),"Missing original species "+id);
 assert.match(js,/function persist\(/);
 assert.match(js,/offlineSeen=new Set\(seen\)/);
 assert.match(js,/seen\.add\(id\)/);
});

test("eight original chibi infernal creature portraits are generated without external art",()=>{
 assert.match(js,/const infernalLooks=/);
 assert.match(js,/function monsterPortrait\(/);
 assert.match(js,/document\.createElementNS\("http:\/\/www\.w3\.org\/2000\/svg","svg"\)/);
 assert.match(js,/monsterPortrait\(battle\.id,"large"\)/);
 assert.match(js,/monsterPortrait\(id,"tiny"\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.ok(html.includes("Infernal Bestiary"));
});

test("original alien invasion episodes and creature roster exist",()=>{
 for(const id of ["story-title","story-text","story-progress"])assert.ok(html.includes('id="'+id+'"'));
 for(const id of ["squibblex","glorpbot","noodloid","blipmoth"])assert.ok(js.includes(id+":["));
 assert.match(js,/const invasionChapters=/);
 assert.match(js,/function renderStory\(/);
 assert.match(js,/ALIEN INVASION!/);
 assert.match(js,/const zone=territory\(save\.x,save\.y\)\.type/);
});

test("canonical ending is a demon-alien treaty, not either faction winning",()=>{
 assert.match(js,/FINAL EPISODE · THE GREAT GALACTIC DIVORCE OF EARTH/);
 assert.match(js,/They divide Earth into alien and infernal territories/);
 assert.match(js,/Hell is welcomed into intergalactic society/);
 assert.match(js,/moderately intelligent livestock with excellent snack-making capabilities/);
 assert.match(js,/Treaty signed\. Earth partitioned\. Humanity reclassified/);
 assert.match(js,/Witness the Treaty of Two Extremely Bad Landlords/);
});

test("player is a ten-percent Appendix 404 dual-faction handler",()=>{
 assert.match(js,/const controllerLore=/);
 assert.match(js,/Exactly ten percent of humans developed an Appendix 404/);
 assert.match(js,/Aliens hear an executive override/);
 assert.match(js,/Demons hear an ancient summoning command/);
 for(const id of ["controller-title","controller-text","controller-note"])assert.ok(html.includes('id="'+id+'"'));
 assert.match(js,/Pair your Appendix 404 with an alien/);
});

test("broken galactic calendar replaces the real-world origin year",()=>{
 assert.ok(html.includes('id="absurd-date"'));
 assert.match(js,/Year 7½ of the 43rd Yesterday/);
 assert.match(js,/Tuesday 92 of Month -3/);
 assert.match(js,/function nonsenseDate\(steps=0\)/);
 assert.match(js,/absurdWeekdays/);
 assert.match(js,/absurdMonths/);
 assert.doesNotMatch(js,/In 1999, a galactic firmware update/);
});

test("offline galactic bureau contracts award one-time capture supplies",()=>{
 assert.ok(html.includes('id="bureau-contracts"'));
 assert.ok(html.includes('id="bureau-status"'));
 for(const id of ["microwave","pigeons","toaster","treaty"])assert.match(js,new RegExp('id:"'+id+'"'));
 assert.match(js,/save\.claimedContracts\.includes\(id\)/);
 assert.match(js,/save\.bag=\(save\.bag\|\|0\)\+contract\.reward/);
 assert.match(js,/if\(connected\)\{action\("contract",\{id\}\);return\}/);
 assert.match(js,/function render\(\)\{renderStory\(\);renderBureau\(\);/);
});

test("faction commander bosses are playable, uncatchable, and award rewards once",()=>{
 assert.ok(html.includes('id="faction-commanders"'));
 assert.ok(html.includes('id="commander-status"'));
 for(const id of ["squibblex-prime","ember-auditor","glorp-collector"])assert.match(js,new RegExp('id:"'+id+'"'));
 assert.match(js,/battle=\{\.\.\.make\(boss\.species,boss\.level\),bossId:id,name:boss\.name\}/);
 assert.match(js,/if\(battle\.bossId\)\{log\("Commanders are contractually uncatchable/);
 assert.match(js,/save\.defeatedCommanders\.includes\(id\)/);
 assert.match(js,/const commanderReward=battle\.bossId\?defeatCommander\(battle\.bossId\):""/);
});

test("faction world has three reward landmarks and location-specific encounters",()=>{
 assert.ok(html.includes('id="territory-status"'));
 for(const id of ["dish","tax","border"])assert.match(js,new RegExp('id:"'+id+'"'));
 assert.match(js,/function visitLandmark\(x,y\)/);
 assert.match(js,/save\.visitedLandmarks\.includes\(site\.id\)/);
 assert.match(js,/const width=16,height=12/);
 assert.match(js,/zone==="alien"\?wildIds\.filter/);
 assert.match(css,/tile\.zone-alien/);
 assert.match(css,/tile\.zone-demon/);
});

test("settlement NPCs support proximity dialogue and one-time landmark quest rewards",()=>{
 assert.ok(html.includes('id="settlement-npcs"'));
 assert.ok(html.includes('id="settlement-status"'));
 for(const id of ["mox","vex","quibble"])assert.match(js,new RegExp('id:"'+id+'"'));
 assert.match(js,/function speakToNPC\(id\)/);
 assert.match(js,/Math\.abs\(npc\.x-save\.x\)\+Math\.abs\(npc\.y-save\.y\)>1/);
 assert.match(js,/save\.npcQuestsDone\.includes\(id\)/);
 assert.match(js,/save\.bag=\(save\.bag\|\|0\)\+npc\.reward/);
 assert.match(js,/renderSettlements\(\)/);
});

test("twenty original monsters include six evolution lines",()=>{
 for(const id of ["ashhorn","mossreaper","cryptfin","voltmaw","squibmarshal","glorpcannon","hexpup","starjelly"])assert.match(js,new RegExp(id+':\\['));
 assert.match(js,/const evolutions=/);
 assert.match(js,/function evolveCreature\(creature\)/);
 assert.match(js,/function awardExperience\(creature,amount\)/);
 assert.match(js,/evolveCreature\(creature\)/);
});
test("offline battles support charged specials and guarding without changing staging actions",()=>{
 assert.ok(html.includes('data-action="special"'));
 assert.ok(html.includes('data-action="guard"'));
 assert.match(js,/function battleStrike\(attacker,defender,special=false,quick=false\)/);
 assert.match(js,/if\(\["attack","special","guard","quick","mend"\]\.includes\(name\)\)/);
 assert.match(js,/lead\.energy-=2/);
 assert.match(js,/guarding\?\.35:1/);
 assert.doesNotMatch(js,/connected&&\["special","guard"\]\.includes\(b\.dataset\.action\)/);
});

test("offline battle adds original move names, status damage and accessible visual effects",()=>{
 assert.ok(html.includes('id="battle-effect"'));
 assert.match(js,/const speciesMoves=/);
 assert.match(js,/function inflictStatus\(attacker,defender\)/);
 assert.match(js,/function statusTick\(target\)/);
 assert.match(js,/function showBattleEffect\(kind,message\)/);
 assert.match(js,/if\(evolutionMessage\.includes\("EVOLVED"\)\)showBattleEffect/);
 assert.match(js,/p\.status=null;p\.energy=0/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});

test("online battle actions render server-confirmed effects and allow creature switching",()=>{
 assert.match(js,/btn\.textContent=battle\?"Switch":"Lead"/);
 assert.match(js,/action\("switch",\{index:i\}\)/);
 assert.match(js,/if\(name==="switch"\)/);
 assert.match(js,/if\(data\.message\?\.includes\("evolved into"\)\)showBattleEffect/);
 assert.doesNotMatch(js,/connected&&\["special","guard"\]\.includes\(b\.dataset\.action\)/);
});

test("online map, missions and bosses are enabled in the shared world",()=>{
 assert.match(js,/if\(connected\)\{action\("npc",\{id\}\);return\}/);
 assert.match(js,/if\(connected\)\{action\("commander",\{id\}\);return\}/);
 assert.match(js,/save\.visitedLandmarks=data\.player\.visitedLandmarks/);
 assert.match(js,/const width=16,height=12/);
});

test("three legendary shrines have unique portraits, rarity and one-time captures",()=>{
 for(const id of ["minionmouse","minivillain","minieddie"]){assert.ok(js.includes(id+':'+String.fromCharCode(91)));assert.ok(html.includes('id="legendary-creatures"'));}
 assert.match(js,/function summonLegendary\(id\)/);
 assert.match(js,/legendaryIds\.has\(k\)/);
 assert.match(js,/save\.capturedLegendaries\.push\(battle\.legendaryId\)/);
 assert.match(js,/action\("legendary",\{id\}\)/);
});

test("expanded evolution families and new tactical moves are visible",()=>{
 for(const id of ["gloamshade","thornmaw","gravruckle","doomwing","noodlarch","bliporacle","hexhound","astraljelly"])assert.ok(js.includes(id+':'));
 for(const action of ["quick","mend"])assert.ok(html.includes('data-action="'+action+'"'));
 assert.match(js,/gloamlet:\["gloamshade",5\]/);
 assert.match(js,/quick\?2:1/);
 assert.match(js,/Second Wind/);
});


test("original canvas pixel overworld is wired into online and offline builds",()=>{
 const pixel=readFileSync("public/monster-mmo-pixel-world.js","utf8");
 const offline=readFileSync("public/monster-mmo-offline-download.js","utf8");
 assert.match(html,/src="\/monster-mmo-pixel-world\.js"/);
 assert.match(css,/#pixel-overworld/);
 assert.match(pixel,/new MutationObserver\(schedule\)/);
 assert.match(pixel,/canvas\.width = TILE \* W/);
 assert.match(pixel,/const TILE = 32, W = 16, H = 12/);
 assert.match(pixel,/function ground\(/);
 assert.match(pixel,/function character\(/);
 assert.match(pixel,/function npc\(/);
 assert.match(offline,/load\("\/monster-mmo-pixel-world\.js"\)/);
 assert.match(offline,/replace\(pixelTag/);
 const parsed=spawnSync(process.execPath,["--check"],{input:pixel,encoding:"utf8"});
 assert.equal(parsed.status,0,parsed.stderr);
 const packaged=spawnSync(process.execPath,["--check"],{input:offline,encoding:"utf8"});
 assert.equal(packaged.status,0,packaged.stderr);
});

test("pixel battle renderer is present in both online and offline builds",()=>{
 const battleArt=readFileSync("public/monster-mmo-pixel-battle.js","utf8");
 const offline=readFileSync("public/monster-mmo-offline-download.js","utf8");
 assert.match(html,/monster-mmo-pixel-battle\.js/);
 assert.match(js,/hell-high-orbit:battle/);
 assert.match(css,/#pixel-battle/);
 assert.match(battleArt,/function creature\(/);
 assert.match(battleArt,/function stage\(/);
 assert.match(offline,/pixelBattle/);
 assert.match(offline,/replace\(battleTag/);
 for(const content of [battleArt,offline]){
  const result=spawnSync(process.execPath,["--check"],{input:content,encoding:"utf8"});
  assert.equal(result.status,0,result.stderr);
 }
});

test("offline creatures unlock four named moves by level without trusting client moves in staging",()=>{
 for(let i=0;i<4;i++)assert.ok(html.includes('data-move-slot="'+i+'"'));
 assert.match(js,/const moveLearnsets=/);
 assert.match(js,/const moveUnlockLevels=\[1,1,3,6\]/);
 assert.match(js,/function learnedMoves\(creature\)/);
 assert.match(js,/if\(name==="move"\)/);
 assert.match(js,/chosen\.unlocked/);
 assert.match(js,/extra\.movePower/);
 assert.match(js,/b\.dataset\.moveSlot!==undefined/);
 assert.match(js,/if\(connected\)\{const data=await request\("\/api\/game\/action"/);
});

test("all 31 original creatures have animated atlas frames and offline packaging",()=>{
 const atlas=readFileSync("public/monster-mmo-sprite-atlas.js","utf8");
 const offline=readFileSync("public/monster-mmo-offline-download.js","utf8");
 assert.match(html,/monster-mmo-sprite-atlas\.js/);
 assert.match(atlas,/atlas\.width=32\*4/);
 assert.match(atlas,/ids\.length/);
 assert.match(atlas,/window\.HellOrbitSprites/);
 assert.match(atlas,/minionmouse minivillain minieddie/);
 assert.match(js,/minionmouse/);
 assert.match(offline,/spriteAtlas/);
 assert.match(offline,/replace\(spriteTag/);
 assert.match(readFileSync("public/monster-mmo-pixel-battle.js","utf8"),/requestAnimationFrame\(animate\)/);
 for(const code of [atlas,offline]){
  const result=spawnSync(process.execPath,["--input-type=module","--check"],{input:code,encoding:"utf8"});
  assert.equal(result.status,0,result.stderr);
 }
});

test("creature artwork and battle effects remain locally bundled and parseable",()=>{
 const atlas=readFileSync("public/monster-mmo-sprite-atlas.js","utf8");
 const battle=readFileSync("public/monster-mmo-pixel-battle.js","utf8");
 for(const id of ["embercub","ashhorn","mossbit","mossreaper","driftfin","cryptfin","zipfang","voltmaw","squibblex","squibmarshal","glorpbot","glorpcannon","gloamlet","gloamshade","thornspit","thornmaw","grubruckle","gravruckle","mournwing","doomwing","noodloid","noodlarch","blipmoth","bliporacle","hexpup","hexhound","starjelly","astraljelly","minionmouse","minivillain","minieddie"]){
  assert.ok(atlas.includes(id),"Missing sprite: "+id);
 }
 assert.match(atlas,/features\[id\]\?\.\(\)/);
 assert.match(battle,/hell-high-orbit:effect/);
 assert.match(js,/new CustomEvent\("hell-high-orbit:effect"/);
 assert.doesNotMatch(battle,/\\n function animate/);
 for(const code of [atlas,battle]){
  const check=spawnSync(process.execPath,["--input-type=module","--check"],{input:code,encoding:"utf8"});
  assert.equal(check.status,0,check.stderr);
 }
});

test("evolution cinematic uses previous and evolved sprite IDs and responsive overlay",()=>{
 const battle=readFileSync("public/monster-mmo-pixel-battle.js","utf8");
 const atlas=readFileSync("public/monster-mmo-sprite-atlas.js","utf8");
 assert.match(js,/hell-high-orbit:evolution/);
 assert.match(js,/from:previousId,to:creature\.id/);
 assert.match(battle,/document\.addEventListener\("hell-high-orbit:evolution"/);
 assert.match(battle,/HellOrbitSprites\.draw\(ec/);
 assert.match(battle,/duration=2400/);
 assert.match(css,/#pixel-evolution\[hidden\]/);
 for(const code of [battle,atlas]){
  const check=spawnSync(process.execPath,["--input-type=module","--check"],{input:code,encoding:"utf8"});
  assert.equal(check.status,0,check.stderr);
 }
});

test("four-slot battles preserve guard and validate multiplayer evolution animation",()=>{
 const battle=readFileSync("public/monster-mmo-pixel-battle.js","utf8");
 assert.match(html,/data-action="guard">Guard/);
 for(let slot=0;slot<4;slot++)assert.ok(html.includes('data-move-slot="'+slot+'"'));
 assert.match(js,/const previousLead=save\.party/);
 assert.match(js,/previousLead\.id!==save\.party\[0\]\.id/);
 assert.match(js,/name!=="switch"/);
 assert.match(js,/const index=extra\.index/);
 assert.match(js,/Number\.isInteger\(index\)&&index>=0&&index<4/);
 assert.match(battle,/prefers-reduced-motion/);
 assert.match(battle,/!document\.hidden/);
 const check=spawnSync(process.execPath,["--check"],{input:battle,encoding:"utf8"});
 assert.equal(check.status,0,check.stderr);
});

test("species ultimate attacks and nine elemental battle effects",()=>{
 const battle=readFileSync("public/monster-mmo-pixel-battle.js","utf8");
 const server=readFileSync("backend/src/index.mmo-staging.js","utf8");
 assert.match(js,/name:index===3\?\(speciesMoves\[creature\?\.id\]/);
 assert.match(server,/const speciesUltimate=/);
 assert.match(server,/index===3\?\(speciesUltimate\[lead\.id\]/);
 for(const type of ["fire","grass","water","electric","cosmic","ghost","air","thorn","stone"]){
  assert.ok(battle.includes(type),"Missing elemental animation: "+type);
 }
 for(const id of ["minionmouse","minivillain","minieddie"]){
  assert.ok(battle.includes(id),"Missing legendary animation: "+id);
 }
 assert.match(js,/\["attack","special","quick","move"\]\.includes\(name\)/);
 for(const code of [battle,server]){
  const check=spawnSync(process.execPath,["--input-type=module","--check"],{input:code,encoding:"utf8"});
  assert.equal(check.status,0,check.stderr);
 }
});

test("combat feedback displays real HP deltas, status and final faint frame",()=>{
 const battle=readFileSync("public/monster-mmo-pixel-battle.js","utf8");
 assert.match(js,/damage,multiplier,target:"enemy",fainted:battle\.hp===0/);
 assert.match(js,/previousBattle\.hp-\(battle\?\.hp\?\?0\)/);
 assert.match(battle,/Number\.isFinite\(effect\.damage\)/);
 assert.match(battle,/effect\.multiplier>1/);
 assert.match(battle,/effect\.status/);
 assert.match(battle,/FAINTED/);
 assert.match(battle,/else if\(!effect\)current=null/);
 for(const code of [battle,js]){
  const result=spawnSync(process.execPath,["--input-type=module","--check"],{input:code,encoding:"utf8"});
  assert.equal(result.status,0,result.stderr);
 }
});

test("XP curve and rarity rewards are visible in offline progression",()=>{
 assert.ok(js.includes("const xpRequired=level=>"));
 assert.ok(js.includes("awardExperience(lead,experienceReward(battle))"));
 assert.ok(js.includes("power:[1,.8,1.55,1.9]"));
 assert.ok(js.includes("Evolves Lv "));
 assert.ok(js.includes(" · XP "));
});


test("map-first pause UI keeps all gameplay panels accessible",()=>{
 const pause=readFileSync("public/monster-mmo-pause-menu.js","utf8");
 const offline=readFileSync("public/monster-mmo-offline-download.js","utf8");
 for(const id of ["game-menu","game-menu-toggle","game-menu-close","game-menu-backdrop"])assert.ok(html.includes('id="'+id+'"'));
 for(const tab of ["creatures","bag","missions","bestiary","story","settings"]){assert.ok(html.includes('data-pause-tab="'+tab+'"'));assert.ok(html.includes('data-pause-section="'+tab+'"'));}
 assert.match(pause,/stopImmediatePropagation/);
 assert.match(pause,/aria-expanded/);
 assert.match(pause,/battleActive/);
 assert.match(css,/#game-menu\.is-open/);
 assert.match(offline,/load\("\/monster-mmo-pause-menu\.js"\)/);
 assert.match(offline,/replace\(pauseTag/);
 for(const code of [pause,offline]){const parsed=spawnSync(process.execPath,["--input-type=module","--check"],{input:code,encoding:"utf8"});assert.equal(parsed.status,0,parsed.stderr);}
});


test("one pause menu and self-contained handheld dialogue are wired",()=>{
 const dialogue=readFileSync("public/monster-mmo-dialogue.js","utf8");
 const offline=readFileSync("public/monster-mmo-offline-download.js","utf8");
 assert.doesNotMatch(html,/monster-mmo-compact\.(js|css)/);
 assert.ok(html.includes('id="field-dialogue"'));
 assert.ok(html.includes('id="field-dialogue-next"'));
 assert.match(js,/hell-high-orbit:log/);
 assert.match(js,/classList\.contains\("dialogue-open"\)/);
 assert.match(dialogue,/hell-high-orbit:log/);
 assert.match(offline,/load\("\/monster-mmo-dialogue\.js"\)/);
 assert.match(offline,/replace\(dialogueTag/);
 assert.match(css,/\.field-dialogue\[hidden\]/);
 for(const code of [dialogue,offline]){const check=spawnSync(process.execPath,["--input-type=module","--check"],{input:code,encoding:"utf8"});assert.equal(check.status,0,check.stderr);}
});


test("battle party switch is accessible and fainting preserves healthy reserves",()=>{
 assert.ok(html.includes('id="battle-party"'));
 assert.match(js,/const battleParty=\$\("battle-party"\)/);
 assert.match(js,/swap\.addEventListener\("click",\(\)=>action\("switch",\{index:i\}\)\)/);
 assert.match(js,/swap\.disabled=busy\|\|p\.hp<=0/);
 assert.match(js,/if\(lead\.hp<=0\)\{log\(save\.party\[0\]\.name\+" enters the battle!"\);return\}/);
 assert.match(js,/if\(save\.party\.some\(\(p,i\)=>i>0&&p\.hp>0\)\)log\(lead\.name\+" fainted! Choose a healthy creature below to continue\."\)/);
 assert.match(css,/#battle-party \.battle-switch/);
});


test("handheld battle commands expose one panel at a time",()=>{
 const pause=readFileSync("public/monster-mmo-pause-menu.js","utf8");
 const pixelWorld=readFileSync("public/monster-mmo-pixel-world.js","utf8");
 for(const tab of ["fight","party","bag"])assert.ok(html.includes('data-battle-tab="'+tab+'"'));
 for(const section of ["fight","party","bag"])assert.ok(html.includes('data-battle-section="'+section+'"'));
 assert.match(pause,/function chooseBattleTab\(name\)/);
 assert.match(pause,/section\.hidden=section\.dataset\.battleSection!==name/);
 assert.match(pause,/current\.lead\?\.hp<=0/);
 assert.match(css,/\.battle-command-tabs/);
 assert.match(css,/#battle-panel \.battle-moves/);
 assert.match(pixelWorld,/Original faction terrain props/);
 for(const code of [pause,pixelWorld]){const check=spawnSync(process.execPath,["--input-type=module","--check"],{input:code,encoding:"utf8"});assert.equal(check.status,0,check.stderr);}
});


test("overworld interaction and faction battle art remain wired",()=>{
 const battleArt=readFileSync("public/monster-mmo-pixel-battle.js","utf8");
 assert.ok(html.includes('id="world-interact"'));
 assert.match(js,/const interact=\$\("world-interact"\)/);
 assert.match(js,/interact\.dataset\.npc=nearby\?\.id/);
 assert.match(js,/speakToNPC\(id\)/);
 assert.match(css,/#world-interact:not\(\[hidden\]\)/);
 assert.match(battleArt,/Faction-specific skyline and arena props/);
 assert.match(battleArt,/const alien=\["cosmic","electric","water"\]/);
 const check=spawnSync(process.execPath,["--check"],{input:battleArt,encoding:"utf8"});
 assert.equal(check.status,0,check.stderr);
});


test("game social menu and offline bundle are wired",()=>{
 const social=readFileSync("public/monster-mmo-social.js","utf8");
 const offline=readFileSync("public/monster-mmo-offline-download.js","utf8");
 for(const id of ["game-global-feed","game-global-form","game-friends-list","game-friend-requests","game-friend-form"])assert.ok(html.includes('id="'+id+'"'));
 assert.match(html,/data-pause-tab="social"/);
 assert.match(html,/monster-mmo-social\.js/);
 assert.match(social,/\/api\/game\/global-chat/);
 assert.match(social,/\/api\/friends\/request/);
 assert.match(offline,/safeSocial/);
 for(const code of [social,offline]){const check=spawnSync(process.execPath,["--input-type=module","--check"],{input:code,encoding:"utf8"});assert.equal(check.status,0,check.stderr);}
});
