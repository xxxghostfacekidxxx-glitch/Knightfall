import test from "node:test";
import assert from "node:assert/strict";
import {WIDTH,CELL_COUNT,SHELF_SLOTS,shelfCapacity,generatorAt,relocateGenerator,MAX_ENERGY,ENERGY_HARD_CAP,awardEnergy,ENERGY_INTERVAL,RECIPES,makeGame,advance,spawn,move,serve,upgrade,recycle,stir,serialize,restore,findReady,findShelfReady,storeOnShelf,takeFromShelf,available,WHISK_CAP,WHISK_EVERY,findMergePair,magicWhisk,QUESTS,questTarget,questReward,claimQuest,discoveryCount,ORDER_REFRESH_COST,refreshOrder,VIP_CONTRACT_SERVES,VIP_CONTRACT_MERGES,vipContractInfo,claimVipContract,PATRONS,patronForOrder,KEEPSAKE_LEVELS,PATRON_KEEPSAKES,keepsakesForPatron,keepsakeUnlocked,nextKeepsakeProgress,orderProgress,FAVORITE_TIP_PERCENT,favoriteTipForOrder,LOYALTY_VISIT_INTERVAL,loyaltyStamps,loyaltyNext} from "../public/arcade/hosted/hex-and-whisk/engine.mjs";
const rng=()=>.3,now=1_800_000_000_000;
const blank=()=>{const s=makeGame(rng,now);s.board.fill(null);s.orders=[];return s};
test("a six-by-six board starts playable with three restaurant orders and original cooking chains",()=>{
 const s=makeGame(rng,now);
 assert.equal(WIDTH,6);assert.equal(CELL_COUNT,36);assert.equal(s.board.length,36);
 assert.equal(s.orders.length,3);assert.equal(s.energy,MAX_ENERGY);
 assert.deepEqual(Object.keys(RECIPES),["garden","bakery","sweets"]);
 assert.equal(available(s),28);
});
test("tapping a producer uses energy, respects unlocks and refuses full boards",()=>{
 const s=blank();
 assert.equal(spawn(s,"sweets",rng,now).reason,"locked");
 assert.equal(spawn(s,"garden",rng,now).ok,true);
 assert.equal(available(s),33);assert.equal(s.energy,MAX_ENERGY-1);
 s.board=Array(36).fill({chain:"garden",tier:1,id:3});
 assert.equal(spawn(s,"garden",rng,now).reason,"full");
});
test("dragging matching objects merges with an escalating timed combo",()=>{
 const s=blank();
 s.board[10]={chain:"garden",tier:1,id:10};
 s.board[11]={chain:"garden",tier:1,id:11};
 s.board[12]={chain:"garden",tier:2,id:12};
 const a=move(s,10,11,now);
 assert.equal(a.type,"merge");assert.equal(a.tier,2);assert.equal(a.combo,1);
 const b=move(s,11,12,now+500);
 assert.equal(b.type,"merge");assert.equal(b.tier,3);assert.equal(b.combo,2);
 assert.ok(b.gained>a.gained);assert.equal(s.best,s.score);
});
test("unlike a sliding 2048 board, nonmatches can move or swap freely",()=>{
 const s=blank();
 s.board[10]={chain:"garden",tier:1,id:1};
 s.board[11]={chain:"bakery",tier:1,id:2};
 assert.equal(move(s,10,11,now).type,"swap");
 assert.equal(s.board[10].chain,"bakery");
 assert.equal(move(s,11,13,now).type,"move");
 assert.equal(s.board[13].chain,"garden");
 assert.equal(move(s,13,13,now).reason,"invalid");
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
 state.board[10]={chain:"garden",tier:2,id:1};state.board[11]={chain:"garden",tier:2,id:2};
 assert.equal(discoveryCount(state),4);
 const coins=state.coins,score=state.score;
 const one=move(state,10,11,now);
 assert.equal(one.tier,3);assert.equal(one.discoveryBonus,41);
 assert.equal(state.coins,coins+41);assert.ok(state.score>score);
 assert.equal(state.discovered.garden,3);
 const reloaded=restore(serialize(state),rng,now);
 assert.equal(discoveryCount(reloaded),5);
 reloaded.board[12]={chain:"garden",tier:2,id:10};
 reloaded.board[13]={chain:"garden",tier:2,id:11};
 assert.equal(move(reloaded,12,13,now+7000).discoveryBonus,0);
});
test("three earning quests advance only for the correct action",()=>{
 const state=makeGame(rng,now);
 assert.deepEqual(Object.keys(QUESTS),["merge","serve","harvest"]);
 state.board[10]={chain:"garden",tier:1,id:110};
 state.board[11]={chain:"garden",tier:1,id:111};
 move(state,10,11,now);
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

test("Magic Whisk finds the most valuable available match for an open customer order",()=>{
 const state=makeGame(rng,now);
 state.board.fill(null);
 state.orders=[{id:1,chain:"bakery",tier:3,coins:20,xp:15,energy:2}];
 state.board[0]={chain:"garden",tier:2,id:101};
 state.board[1]={chain:"garden",tier:2,id:102};
 state.board[2]={chain:"bakery",tier:2,id:103};
 state.board[3]={chain:"bakery",tier:2,id:104};
 const chosen=findMergePair(state);
 assert.equal(chosen.chain,"bakery");
 assert.deepEqual([chosen.from,chosen.to],[2,3]);
 const previous=state.score;
 assert.equal(state.whisks,1);
 const result=magicWhisk(state,now);
 assert.equal(result.ok,true);
 assert.equal(result.type,"whisk");
 assert.equal(result.tier,3);
 assert.equal(state.board[2],null);
 assert.equal(state.board[3].tier,3);
 assert.equal(state.whisks,0);
 assert.ok(state.score>previous);
 assert.equal(magicWhisk(state,now+100).reason,"no-whisks");
});
test("Magic Whisk never spends charges on a board with no matching pairs",()=>{
 const state=makeGame(rng,now);
 state.board.fill(null);
 state.board[0]={chain:"garden",tier:1,id:100};
 state.board[1]={chain:"bakery",tier:2,id:101};
 assert.equal(findMergePair(state),null);
 assert.equal(magicWhisk(state,now).reason,"no-pair");
 assert.equal(state.whisks,1);
});
test("three served orders earn a free Magic Whisk, and old saves gain a starter charge",()=>{
 const state=makeGame(rng,now);
 state.whisks=0;state.served=2;
 const customer=state.orders[0];state.board[1]={id:999,chain:customer.chain,tier:customer.tier};
 const result=serve(state,0,rng,now);
 assert.equal(result.whiskEarned,true);
 assert.equal(state.whisks,1);
 const loaded=restore(serialize(state),rng,now);
 assert.equal(loaded.whisks,1);
 const old=JSON.parse(serialize(state));
 delete old.whisks;
 assert.equal(restore(old,rng,now).whisks,1);
 const tampered=JSON.parse(serialize(state));tampered.whisks=99999;
 assert.equal(restore(tampered,rng,now).whisks,WHISK_CAP);
 state.whisks=WHISK_CAP;state.served=5;
 const again=state.orders[0];state.board[5]={id:888,chain:again.chain,tier:again.tier};
 const served=serve(state,0,rng,now+500);
 assert.equal(served.whiskEarned,false);
 assert.equal(state.whisks,WHISK_CAP);
});

test("two-slot pantry stashes, swaps, and retrieves exact ingredients without spending energy",()=>{
 const state=blank(),energy=state.energy;
 assert.equal(SHELF_SLOTS,2);
 state.board[10]={id:500,chain:"garden",tier:4};
 state.board[11]={id:501,chain:"bakery",tier:2};
 const parked=storeOnShelf(state,10,0);
 assert.equal(parked.type,"shelf-store");assert.equal(state.board[10],null);
 assert.equal(state.shelf[0].id,500);
 assert.equal(storeOnShelf(state,10,1).reason,"empty");
 assert.equal(storeOnShelf(state,11,0).type,"shelf-swap");
 assert.equal(state.board[11].id,500);assert.equal(state.shelf[0].id,501);
 assert.equal(takeFromShelf(state,0,12).type,"shelf-take");
 assert.equal(state.board[12].id,501);assert.equal(state.shelf[0],null);
 assert.equal(takeFromShelf(state,0,15).reason,"shelf-empty");
 assert.equal(storeOnShelf(state,12,2).reason,"invalid");
 assert.equal(takeFromShelf(state,-1,10).reason,"invalid");
 assert.equal(state.energy,energy);
});
test("stored meals are ready to serve directly from pantry and earn the usual order rewards",()=>{
 const state=makeGame(rng,now),order=state.orders[0];
 state.board.fill(null);
 state.shelf[1]={id:503,chain:order.chain,tier:order.tier};
 assert.equal(findReady(state,order),-1);assert.equal(findShelfReady(state,order),1);
 const before=state.coins;
 const result=serve(state,0,rng,now);
 assert.equal(result.ok,true);assert.equal(result.place,-1);assert.equal(result.shelfPlace,1);
 assert.equal(state.shelf[1],null);assert.equal(state.served,1);
 assert.ok(state.coins>before);assert.equal(state.orders.length,3);
});
test("pantry state survives saves and upgrades old or corrupted kitchens safely",()=>{
 const state=makeGame(rng,now);
 state.board[0]={id:999,chain:"sweets",tier:5};
 storeOnShelf(state,0,0);
 const restored=restore(serialize(state),rng,now);
 assert.deepEqual(restored.shelf[0],state.shelf[0]);
 assert.equal(restored.discovered.sweets,5);
 assert.ok(restored.serial>999);
 const legacy=JSON.parse(serialize(state));delete legacy.shelf;
 assert.deepEqual(restore(legacy,rng,now).shelf,[null,null]);
 const corrupt=JSON.parse(serialize(state));
 corrupt.shelf=[{id:-1,chain:"garden",tier:200},{id:600,chain:"bakery",tier:4}];
 const recovered=restore(corrupt,rng,now);
 assert.equal(recovered.shelf[0],null);
 assert.equal(recovered.shelf[1].id,600);
 assert.equal(recovered.discovered.bakery>=4,true);
});

test("refreshing a customer request costs earned coins, keeps completed meals, and preserves saved state",()=>{
 const state=makeGame(rng,now);state.coins=120;
 const ready=state.orders[0];state.board[0]={chain:ready.chain,tier:ready.tier,id:1001};
 const oldId=state.orders[1].id;
 const result=refreshOrder(state,()=>0.7);
 assert.equal(result.ok,true);assert.equal(result.index,1);assert.equal(result.cost,ORDER_REFRESH_COST);
 assert.equal(state.coins,120-ORDER_REFRESH_COST);
 assert.equal(state.orders[0].id,ready.id);assert.notEqual(state.orders[1].id,oldId);
 assert.ok(state.board[0]);
 assert.equal(restore(serialize(state),rng,now).orders[1].id,state.orders[1].id);
 state.coins=0;assert.equal(refreshOrder(state,rng).reason,"coins");
 state.coins=200;
 for(let i=0;i<3;i++)state.board[i]={chain:state.orders[i].chain,tier:state.orders[i].tier,id:2000+i};
 assert.equal(refreshOrder(state,rng).reason,"all-ready");
});

test("board generators begin on the grid and move or exchange places without losing ingredients",()=>{
 const state=makeGame(rng,now);
 assert.equal(generatorAt(state,0),"garden");assert.equal(generatorAt(state,5),"bakery");
 assert.equal(available(state),28);
 assert.equal(move(state,0,1,now).type,"generator-move");
 assert.equal(generatorAt(state,1),"garden");assert.equal(generatorAt(state,0),null);
 const item=state.board[8];
 assert.equal(move(state,1,8,now).type,"generator-move");
 assert.equal(generatorAt(state,8),"garden");assert.equal(state.board[1].id,item.id);
 assert.equal(state.board[8],null);
 assert.equal(move(state,8,5,now).type,"generator-move");
 assert.equal(generatorAt(state,5),"garden");assert.equal(generatorAt(state,8),"bakery");
 const fromIngredient=state.board[9];
 assert.equal(move(state,9,5,now).type,"generator-move");
 assert.equal(generatorAt(state,9),"garden");assert.equal(state.board[5].id,fromIngredient.id);
 assert.equal(spawn(state,"garden",()=>0,now).ok,true);
 assert.equal(state.board[9],null);
 const restored=restore(serialize(state),rng,now);
 assert.deepEqual(restored.generators,state.generators);
 assert.equal(generatorAt(restored,9),"garden");
});
test("storage grows at levels 4, 7, 10 and 13 and keeps old pantry contents",()=>{
 assert.deepEqual([1,3,4,6,7,10,13,30].map(shelfCapacity),[2,2,3,3,4,5,6,6]);
 const state=makeGame(rng,now);
 state.shelf[0]={chain:"garden",tier:3,id:900};
 state.level=7;state.shelf.push(null,null);
 state.shelf[3]={chain:"bakery",tier:4,id:901};
 const loaded=restore(serialize(state),rng,now);
 assert.equal(loaded.shelf.length,4);
 assert.deepEqual(loaded.shelf[0],state.shelf[0]);
 assert.deepEqual(loaded.shelf[3],state.shelf[3]);
 assert.equal(loaded.shelf.length,shelfCapacity(7));
 assert.equal(storeOnShelf(loaded,8,3).ok,true);
 assert.equal(loaded.shelf[3]?.chain,"garden");
});
test("sweetshop generator unlocks on level 3 and a missing generator returns when space frees",()=>{
 const state=makeGame(rng,now);
 state.level=2;state.xp=0;
 const order=state.orders[0];state.board[4]={chain:order.chain,tier:order.tier,id:2300};
 state.xp=500;
 const served=serve(state,0,rng,now);
 assert.equal(served.ok,true);
 assert.equal(state.level>=3,true);
 assert.ok(state.generators.sweets>=0);assert.equal(generatorAt(state,state.generators.sweets),"sweets");
 const saved=restore(serialize(state),rng,now);
 assert.ok(saved.generators.sweets>=0);assert.ok(saved.generators.sweets>=0);assert.equal(generatorAt(saved,saved.generators.sweets),"sweets");
 saved.generators.sweets=-1;
 saved.board[7]={chain:"garden",tier:2,id:444};
 assert.equal(recycle(saved,7).ok,true);
 assert.equal(generatorAt(saved,saved.generators.sweets),"sweets");
});
test("generators cannot be parked on pantry or overwritten by a pantry retrieval",()=>{
 const state=makeGame(rng,now);
 state.shelf[0]={chain:"bakery",tier:2,id:700};
 assert.equal(storeOnShelf(state,0,0).ok,false);
 assert.equal(takeFromShelf(state,0,0).reason,"generator-slot");
 assert.equal(state.shelf[0].id,700);
 assert.equal(generatorAt(state,0),"garden");
});

test("earned energy can exceed natural regeneration cap and remain safe across saves",()=>{
 const state=makeGame(rng,now);
 assert.equal(MAX_ENERGY,40);
 assert.equal(awardEnergy(state,12,now),12);
 assert.equal(state.energy,52);
 assert.equal(advance(state,now+ENERGY_INTERVAL*30),0);
 assert.equal(state.energy,52);
 const saved=restore(serialize(state),rng,now+ENERGY_INTERVAL*30);
 assert.equal(saved.energy,52);
 saved.energy=39;saved.energyLast=now;
 assert.equal(advance(saved,now+ENERGY_INTERVAL*5),1);
 assert.equal(saved.energy,40);
 assert.equal(awardEnergy(saved,99999,now),ENERGY_HARD_CAP-40);
 assert.equal(saved.energy,ENERGY_HARD_CAP);
});
test("customer and quest rewards grant bonus energy instead of discarding energy at 40",()=>{
 const state=makeGame(rng,now);
 state.quests.merge.progress=questTarget("merge",1);
 const quest=claimQuest(state,"merge",now);
 assert.equal(quest.energy,6);
 assert.equal(state.energy,46);
 const order=state.orders[0];
 state.board[11]={id:5000,chain:order.chain,tier:order.tier};
 const served=serve(state,0,rng,now);
 assert.equal(served.ok,true);
 assert.ok(state.energy>46);
});

test("eight distinct patrons maintain stable identities and tastes with existing order IDs",()=>{
 assert.equal(PATRONS.length,8);
 assert.equal(new Set(PATRONS.map(p=>p.symbol)).size,8);
 assert.equal(new Set(PATRONS.map(p=>p.name)).size,8);
 const state=makeGame(rng,now);
 for(const order of state.orders){
  assert.equal(patronForOrder(order),PATRONS[order.id%PATRONS.length]);
  assert.equal(patronForOrder(restore(serialize(state),rng,now).orders.find(o=>o.id===order.id)),patronForOrder(order));
 }
 assert.equal(FAVORITE_TIP_PERCENT,20);
});
test("favorite meals produce a real extra tip, without altering saved orders or rush hour",()=>{
 const state=makeGame(rng,now);
 const order=state.orders[0],favorite=patronForOrder(order).favorite;
 const favoriteOrder={...order,chain:favorite,tier:2,coins:51};
 state.orders[0]=favoriteOrder;
 state.board[10]={chain:favorite,tier:2,id:9100};
 const tip=favoriteTipForOrder(favoriteOrder);
 assert.equal(tip,11);
 const before=state.coins;
 const result=serve(state,0,rng,now);
 assert.equal(result.ok,true);
 assert.equal(result.favoriteTip,tip);
 assert.equal(result.coins,51+tip);
 assert.equal(state.coins-before,result.coins);
 assert.equal(result.patron,patronForOrder(favoriteOrder).name);
 const otherChain=Object.keys(RECIPES).find(c=>c!==favorite);
 assert.equal(favoriteTipForOrder({...favoriteOrder,chain:otherChain}),0);
 const rush=makeGame(rng,now),o=rush.orders[0],fav=patronForOrder(o).favorite;
 rush.orders[0]={...o,chain:fav,tier:2,coins:51};
 rush.board[11]={chain:fav,tier:2,id:9101};rush.rushUntil=now+40000;
 const rushResult=serve(rush,0,rng,now);
 assert.equal(rushResult.coins,(51+11)*2);
 assert.equal(rushResult.favoriteTip,22);
});

test("regular customers remember visits and return with an earned bonus every third order",()=>{
 const state=makeGame(rng,now);
 const id=state.orders[0].id,patron=patronForOrder(state.orders[0]);
 assert.equal(LOYALTY_VISIT_INTERVAL,3);
 assert.equal(loyaltyStamps(state,patron),0);
 assert.equal(loyaltyNext(state,patron),3);
 for(let visit=1;visit<=4;visit++){
  const order={...state.orders[0],id,coins:50,tier:2,chain:patron.favorite};
  state.orders[0]=order;
  state.board[11]={id:8000+visit,chain:order.chain,tier:order.tier};
  const before=state.coins;
  const result=serve(state,0,rng,now);
  assert.equal(result.ok,true);assert.equal(result.visits,visit);
  assert.equal(loyaltyStamps(state,patron),visit);
  assert.equal(result.loyaltyBonus,visit===3?15+state.level*5:0);
  assert.equal(state.coins-before>=result.coins,true);
 }
 const saved=restore(serialize(state),rng,now);
 assert.equal(loyaltyStamps(saved,patron),4);
 assert.equal(loyaltyNext(saved,patron),2);
 const legacy=JSON.parse(serialize(state));delete legacy.patronVisits;
 assert.equal(loyaltyStamps(restore(legacy,rng,now),patron),0);
});

test("customer progress tracks closest recipe tier across countertop and pantry",()=>{
 const state=makeGame(rng,now);
 state.board.fill(null);state.shelf.fill(null);
 const order={id:5000,chain:"garden",tier:5,coins:100,xp:50};
 assert.deepEqual(orderProgress(state,order),{tier:0,steps:5,ready:false,pieces:0});
 state.board[11]={id:101,chain:"garden",tier:2};
 state.board[12]={id:102,chain:"bakery",tier:6};
 state.shelf[0]={id:103,chain:"garden",tier:4};
 assert.deepEqual(orderProgress(state,order),{tier:4,steps:1,ready:false,pieces:2});
 state.board[14]={id:104,chain:"garden",tier:5};
 assert.deepEqual(orderProgress(state,order),{tier:5,steps:0,ready:true,pieces:3});
 assert.deepEqual(orderProgress(state,null),{tier:0,steps:0,ready:false,pieces:0});
});

test("guestbook keepsakes unlock only on specific repeat visit milestones",()=>{
 const state=makeGame(rng,now),patron=patronForOrder(state.orders[0]);
 assert.deepEqual(KEEPSAKE_LEVELS,[1,3,9]);
 assert.equal(Object.keys(PATRON_KEEPSAKES).length,8);
 assert.deepEqual(keepsakesForPatron(state,patron),[]);
 for(const count of [1,2,3,8,9,10]){
  state.patronVisits[patron.symbol]=count;
  const items=keepsakesForPatron(state,patron);
  assert.equal(items.length,count>=9?3:count>=3?2:1);
  assert.equal(new Set(items.map(item=>item.name)).size,items.length);
 }
 assert.equal(keepsakeUnlocked(patron,2),null);
 assert.equal(keepsakeUnlocked(patron,3).visits,3);
 const saved=restore(serialize(state),rng,now);
 assert.deepEqual(keepsakesForPatron(saved,patron),keepsakesForPatron(state,patron));
});
test("serving a guest issues first, third and ninth visit keepsakes exactly once",()=>{
 const state=makeGame(rng,now);
 const order=state.orders[0],guest=patronForOrder(order);
 for(let i=1;i<=10;i++){
  state.orders[0]={...order};
  state.board[11]={id:6000+i,chain:order.chain,tier:order.tier};
  const result=serve(state,0,rng,now);
  assert.equal(result.ok,true);
  assert.equal(result.keepsake?.visits||0,[1,3,9].includes(i)?i:0);
 }
 assert.equal(keepsakesForPatron(state,guest).length,3);
});

test("guestbook progression tracks next milestone without altering visits",()=>{
 const state=makeGame(rng,now),guest=patronForOrder(state.orders[0]);
 const cases=[
  [0,1,1,0],[1,3,2,0],[2,3,1,.5],[3,9,6,0],
  [6,9,3,.5],[8,9,1,5/6],[9,9,0,1],[20,9,0,1]
 ];
 for(const [visits,goal,remaining,ratio] of cases){
  state.patronVisits[guest.symbol]=visits;
  const data=nextKeepsakeProgress(state,guest);
  assert.equal(data.visits,visits);assert.equal(data.goal,goal);
  assert.equal(data.remaining,remaining);assert.equal(data.ratio,ratio);
  assert.equal(data.complete,visits>=9);
 }
});

test("VIP Midnight Contract requires an advanced merge and two relevant served orders",()=>{
 const state=makeGame(rng,now);
 const start=vipContractInfo(state);
 assert.equal(start.stage,1);assert.equal(start.chain,"garden");
 assert.equal(VIP_CONTRACT_SERVES,2);assert.equal(VIP_CONTRACT_MERGES,1);
 assert.equal(claimVipContract(state,now).ok,false);
 state.board.fill(null);
 state.board[11]={id:8001,chain:"garden",tier:2};
 state.board[12]={id:8002,chain:"garden",tier:2};
 const merged=move(state,11,12,now);
 assert.equal(merged.ok,true);assert.equal(merged.tier,3);
 assert.equal(vipContractInfo(state).merges,1);
 for(let i=0;i<2;i++){
  const order={...state.orders[0],chain:"garden",tier:2,coins:25,xp:10,energy:3};
  state.orders[0]=order;
  state.board[14+i]={id:8100+i,chain:"garden",tier:2};
  const served=serve(state,0,rng,now);
  assert.equal(served.ok,true);
  assert.equal(vipContractInfo(state).serves,i+1);
 }
 const before=state.coins,info=vipContractInfo(state);
 assert.equal(info.ready,true);
 const claimed=claimVipContract(state,now);
 assert.equal(claimed.ok,true);assert.equal(claimed.coins,info.coins);
 assert.equal(state.coins,before+info.coins);
 assert.equal(vipContractInfo(state).stage,2);
 assert.equal(vipContractInfo(state).chain,"bakery");
 assert.equal(vipContractInfo(state).ready,false);
 assert.equal(claimVipContract(state,now).ok,false);
 const saved=restore(serialize(state),rng,now);
 assert.deepEqual(saved.vipContract,state.vipContract);
});
test("VIP progress ignores wrong food, lower-tier merges and legacy saves",()=>{
 const state=makeGame(rng,now);
 state.board.fill(null);
 state.board[10]={id:8101,chain:"bakery",tier:2};
 state.board[11]={id:8102,chain:"bakery",tier:2};
 move(state,10,11,now);
 assert.equal(vipContractInfo(state).merges,0);
 state.board[12]={id:8103,chain:"garden",tier:1};
 state.board[13]={id:8104,chain:"garden",tier:1};
 move(state,12,13,now);
 assert.equal(vipContractInfo(state).merges,0);
 const legacy=JSON.parse(serialize(state));delete legacy.vipContract;
 assert.deepEqual(restore(legacy,rng,now).vipContract,{stage:1,chain:"garden",serves:0,merges:0});
 const invalid=JSON.parse(serialize(state));invalid.vipContract={stage:2,chain:"sweets",serves:999,merges:-1};
 const sanitized=restore(invalid,rng,now);
 assert.equal(sanitized.vipContract.chain,"garden");
 assert.equal(sanitized.vipContract.serves,2);assert.equal(sanitized.vipContract.merges,0);
});
