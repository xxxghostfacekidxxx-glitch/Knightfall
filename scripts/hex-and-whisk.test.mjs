import test from "node:test";
import assert from "node:assert/strict";
import {WIDTH,CELL_COUNT,MAX_ENERGY,ENERGY_INTERVAL,RECIPES,makeGame,advance,spawn,move,serve,upgrade,recycle,stir,serialize,restore,findReady,available,QUESTS,questTarget,questReward,claimQuest,discoveryCount} from "../public/arcade/hosted/hex-and-whisk/engine.mjs";
const rng=()=>.3,now=1_800_000_000_000;
const blank=()=>{const s=makeGame(rng,now);s.board.fill(null);s.orders=[];return s};
test("a six-by-six board starts playable with three restaurant orders and original cooking chains",()=>{
 const s=makeGame(rng,now);
 assert.equal(WIDTH,6);assert.equal(CELL_COUNT,36);assert.equal(s.board.length,36);
 assert.equal(s.orders.length,3);assert.equal(s.energy,MAX_ENERGY);
 assert.deepEqual(Object.keys(RECIPES),["garden","bakery","sweets"]);
 assert.equal(available(s),30);
});
test("tapping a producer uses energy, respects unlocks and refuses full boards",()=>{
 const s=blank();
 assert.equal(spawn(s,"sweets",rng,now).reason,"locked");
 assert.equal(spawn(s,"garden",rng,now).ok,true);
 assert.equal(available(s),35);assert.equal(s.energy,MAX_ENERGY-1);
 s.board=Array(36).fill({chain:"garden",tier:1,id:3});
 assert.equal(spawn(s,"garden",rng,now).reason,"full");
});
test("dragging matching objects merges with an escalating timed combo",()=>{
 const s=blank();
 s.board[0]={chain:"garden",tier:1,id:10};
 s.board[1]={chain:"garden",tier:1,id:11};
 s.board[2]={chain:"garden",tier:2,id:12};
 const a=move(s,0,1,now);
 assert.equal(a.type,"merge");assert.equal(a.tier,2);assert.equal(a.combo,1);
 const b=move(s,1,2,now+500);
 assert.equal(b.type,"merge");assert.equal(b.tier,3);assert.equal(b.combo,2);
 assert.ok(b.gained>a.gained);assert.equal(s.best,s.score);
});
test("unlike a sliding 2048 board, nonmatches can move or swap freely",()=>{
 const s=blank();
 s.board[0]={chain:"garden",tier:1,id:1};
 s.board[1]={chain:"bakery",tier:1,id:2};
 assert.equal(move(s,0,1,now).type,"swap");
 assert.equal(s.board[0].chain,"bakery");
 assert.equal(move(s,1,3,now).type,"move");
 assert.equal(s.board[3].chain,"garden");
 assert.equal(move(s,3,3,now).reason,"invalid");
});
test("customer order is fulfilled by exact dish, gains coins XP and generates next",()=>{
 const s=makeGame(rng,now);
 const order=s.orders[0];
 s.board[0]={chain:order.chain,tier:order.tier,id:100};
 const originalCoins=s.coins,originalScore=s.score;
 assert.equal(findReady(s,order),0);
 const result=serve(s,0,rng,now);
 assert.equal(result.type,"serve");assert.equal(s.board[0],null);
 assert.ok(s.coins>originalCoins);assert.ok(s.score>originalScore);
 assert.equal(s.orders.length,3);assert.equal(s.served,1);
 assert.equal(serve(s,999,rng,now).ok,false);
});
test("levels unlock a third dessert producer; upgrades improve spawn tiers",()=>{
 const s=blank();s.level=3;s.coins=500;s.upgrades.sweets=0;
 assert.equal(upgrade(s,"sweets").ok,true);
 assert.equal(s.upgrades.sweets,1);
 assert.equal(spawn(s,"sweets",()=>0,now).tier,2);
 s.upgrades.sweets=3;
 assert.equal(upgrade(s,"sweets").reason,"maxed");
});
test("idle energy refills without overflowing, recycled objects free space",()=>{
 const s=blank();s.energy=1;
 assert.equal(advance(s,now+ENERGY_INTERVAL*3),3);
 assert.equal(s.energy,4);
 assert.equal(advance(s,now+ENERGY_INTERVAL*100),MAX_ENERGY-4);
 s.board[7]={chain:"bakery",tier:4,id:10};
 assert.equal(recycle(s,7).ok,true);assert.equal(s.board[7],null);
});
test("stir uses restaurant coins; serialized saves defend against corrupted boards",()=>{
 const s=makeGame(rng,now),before=s.coins;
 assert.equal(stir(s,rng).ok,true);
 assert.equal(s.coins,before-15);
 const revived=restore(serialize(s),rng,now);
 assert.equal(revived.coins,s.coins);assert.equal(revived.board.length,CELL_COUNT);
 assert.equal(restore("{bad",rng,now).board.length,CELL_COUNT);
 const fake=JSON.parse(serialize(s));fake.board[0]={chain:"totally-fake",tier:999,id:1};
 assert.equal(restore(fake,rng,now).board[0],null);
});

test("recipe collection earns first-discovery bonuses exactly once and survives saved kitchens",()=>{
 const state=makeGame(rng,now);
 state.board.fill(null);
 state.board[0]={chain:"garden",tier:2,id:1};state.board[1]={chain:"garden",tier:2,id:2};
 assert.equal(discoveryCount(state),4);
 const coins=state.coins,score=state.score;
 const one=move(state,0,1,now);
 assert.equal(one.tier,3);assert.equal(one.discoveryBonus,41);
 assert.equal(state.coins,coins+41);assert.ok(state.score>score);
 assert.equal(state.discovered.garden,3);
 const reloaded=restore(serialize(state),rng,now);
 assert.equal(discoveryCount(reloaded),5);
 reloaded.board[2]={chain:"garden",tier:2,id:10};
 reloaded.board[3]={chain:"garden",tier:2,id:11};
 assert.equal(move(reloaded,2,3,now+7000).discoveryBonus,0);
});
test("three earning quests advance only for the correct action",()=>{
 const state=makeGame(rng,now);
 assert.deepEqual(Object.keys(QUESTS),["merge","serve","harvest"]);
 state.board[0]={chain:"garden",tier:1,id:110};
 state.board[1]={chain:"garden",tier:1,id:111};
 move(state,0,1,now);
 assert.equal(state.quests.merge.progress,1);assert.equal(state.quests.serve.progress,0);
 spawn(state,"garden",rng,now);
 assert.equal(state.quests.harvest.progress,1);
 const order=state.orders[0];
 state.board[4]={chain:order.chain,tier:order.tier,id:120};
 serve(state,0,rng,now);
 assert.equal(state.quests.serve.progress,1);
});
test("claiming a completed kitchen quest pays once, resets progress and increases next target",()=>{
 const state=makeGame(rng,now);
 const target=questTarget("merge",1),reward=questReward("merge",1);
 state.quests.merge.progress=target;
 const before=state.coins;
 const win=claimQuest(state,"merge",now);
 assert.equal(win.ok,true);assert.equal(win.coins,reward.coins);
 assert.equal(state.coins,before+reward.coins);
 assert.equal(state.quests.merge.stage,2);assert.equal(state.quests.merge.progress,0);
 assert.equal(claimQuest(state,"merge",now).reason,"incomplete");
 assert.ok(questTarget("merge",2)>target);
});
test("old save format restores new progression fields and corrupt quest rewards cannot inflate money",()=>{
 const state=makeGame(rng,now),legacy=JSON.parse(serialize(state));
 delete legacy.quests;delete legacy.discovered;
 legacy.board[0]={chain:"sweets",tier:5,id:99};
 const migrated=restore(legacy,rng,now);
 assert.equal(migrated.discovered.sweets,5);
 assert.equal(migrated.quests.harvest.stage,1);
 assert.equal(migrated.quests.merge.progress,0);
 const corrupt=JSON.parse(serialize(state));
 corrupt.quests.merge={stage:999999999,progress:999999999};
 const bounded=restore(corrupt,rng,now);
 assert.equal(bounded.quests.merge.stage,100);
 assert.equal(bounded.quests.merge.progress,questTarget("merge",100));
 assert.equal(claimQuest(bounded,"nonsense",now).ok,false);
});

test("invalid saves with missing restaurant orders reset safely instead of restoring a broken kitchen",()=>{
 const state=blank();
 const restored=restore(serialize(state),rng,now);
 assert.equal(restored.orders.length,3);
 assert.equal(restored.board.length,36);
});
