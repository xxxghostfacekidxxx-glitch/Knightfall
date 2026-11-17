/* Hex & Whisk / original Knightfall merge-cooking rules. Pure state engine. */
export const WIDTH=6;
export const CELL_COUNT=WIDTH*WIDTH;
export const SHELF_SLOTS=2;
export const MAX_SHELF_SLOTS=6;
export const shelfCapacity=level=>Math.min(MAX_SHELF_SLOTS,SHELF_SLOTS+Math.max(0,Math.floor((level-1)/3)));
export const MAX_ENERGY=40; // Natural regeneration ceiling.
export const ENERGY_HARD_CAP=999; // Earned rewards can accumulate above the regeneration ceiling.
export function awardEnergy(state,amount,now=Date.now()){
 const previous=state.energy;
 state.energy=Math.min(ENERGY_HARD_CAP,state.energy+Math.max(0,Math.floor(Number(amount)||0)));
 if(state.energy>=MAX_ENERGY)state.energyLast=now;
 return state.energy-previous;
}
export const ENERGY_INTERVAL=9000;
export const RECIPES=Object.freeze({
 garden:Object.freeze({name:"Garden",hue:"#ee987b",unlock:1,items:["Seedling","Ruby tomato","Chopped tomatoes","Scarlet sauce","Moonlit pasta","Firestone pizza","Infernal banquet"]}),
 bakery:Object.freeze({name:"Bakery",hue:"#f3c87b",unlock:1,items:["Golden wheat","Flour sack","Soft dough","Honey loaf","Moon croissant","Velvet cupcake","Celebration cake"]}),
 sweets:Object.freeze({name:"Sweetshop",hue:"#eaa6cf",unlock:3,items:["Wild berry","Berry jam","Tart shell","Berry tart","Dream parfait","Moon cheesecake","Starry sundae"]})
});
// Stable customer identities are derived from existing order ids: old saves stay compatible.
export const PATRONS=Object.freeze([
 Object.freeze({name:"Pip the Imp",symbol:"imp",favorite:"garden",personality:"mischievous"}),
 Object.freeze({name:"Mochi Bat",symbol:"bat",favorite:"bakery",personality:"shy"}),
 Object.freeze({name:"Wisp Ghost",symbol:"ghost",favorite:"sweets",personality:"dreamy"}),
 Object.freeze({name:"Marnie Witch",symbol:"witch",favorite:"bakery",personality:"dramatic"}),
 Object.freeze({name:"Grumble Gargoyle",symbol:"gargoyle",favorite:"garden",personality:"grumpy"}),
 Object.freeze({name:"Nix the Moth",symbol:"moth",favorite:"sweets",personality:"starstruck"}),
 Object.freeze({name:"Rook the Crow",symbol:"crow",favorite:"bakery",personality:"suspicious"}),
 Object.freeze({name:"Bubbles Slime",symbol:"slime",favorite:"garden",personality:"excitable"})
]);
export const patronForOrder=order=>PATRONS[(Number.isSafeInteger(order?.id)?order.id:0)%PATRONS.length];
export const FAVORITE_TIP_PERCENT=20;
export const LOYALTY_VISIT_INTERVAL=3;
export const loyaltyStamps=(state,patron)=>Math.max(0,Math.floor(Number(state.patronVisits?.[patron.symbol])||0));
export const loyaltyNext=(state,patron)=>LOYALTY_VISIT_INTERVAL-loyaltyStamps(state,patron)%LOYALTY_VISIT_INTERVAL;
export const favoriteTipForOrder=order=>order?.chain===patronForOrder(order).favorite?Math.ceil(order.coins*FAVORITE_TIP_PERCENT/100):0;
export const KEEPSAKE_LEVELS=Object.freeze([1,3,9]);
export const PATRON_KEEPSAKES=Object.freeze({
 imp:Object.freeze(["Scorched Matchstick","Tiny Trouble Crown","Infernal VIP Pass"]),
 bat:Object.freeze(["Velvet Ribbon","Moonlit Cupcake Pin","Bat-Family Heirloom"]),
 ghost:Object.freeze(["Silver Tear","Midnight Memory","Ethereal Locket"]),
 witch:Object.freeze(["Spellbound Button","Enchanted Teaspoon","Witch's Royal Seal"]),
 gargoyle:Object.freeze(["Stone Pebble","Secret Smile","Cathedral Key"]),
 moth:Object.freeze(["Glitter Dust","Lunar Lantern","Starlight Crest"]),
 crow:Object.freeze(["Shiny Trinket","Black Feather","Midnight Detective Badge"]),
 slime:Object.freeze(["Jelly Bubble","Happy Goo Star","Rainbow Slime Crown"])
});
export const keepsakesForPatron=(state,patron)=>KEEPSAKE_LEVELS.filter(limit=>loyaltyStamps(state,patron)>=limit).map((limit,index)=>({visits:limit,name:PATRON_KEEPSAKES[patron.symbol][index]}));
export const keepsakeUnlocked=(patron,visits)=>KEEPSAKE_LEVELS.includes(visits)?{visits,name:PATRON_KEEPSAKES[patron.symbol][KEEPSAKE_LEVELS.indexOf(visits)]}:null;
export function nextKeepsakeProgress(state,patron){
 const visits=loyaltyStamps(state,patron);
 const next=KEEPSAKE_LEVELS.find(milestone=>milestone>visits);
 if(!next)return {visits,complete:true,goal:9,current:9,remaining:0,ratio:1};
 const previous=[0,...KEEPSAKE_LEVELS].filter(milestone=>milestone<next).at(-1);
 return {visits,complete:false,goal:next,current:visits,remaining:next-visits,ratio:(visits-previous)/(next-previous)};
}


const keys=Object.keys(RECIPES);
const cap=n=>Math.max(0,Math.min(1000000000,Math.floor(Number(n)||0)));
const rnd=random=>Math.min(.999999,Math.max(0,Number(random())||0));
const num=(x,fallback,min,max)=>Number.isFinite(Number(x))?Math.max(min,Math.min(max,Math.floor(Number(x)))):fallback;
export const xpNeeded=level=>32+level*24;
export const upgradeCost=level=>70+level*110;

/* Repeatable earnable tasks are not daily-login streaks or monetized energy. */
export const QUESTS=Object.freeze({
 merge:Object.freeze({title:"Whisk Wizard",subtitle:"Combine matching dishes",icon:"✧"}),
 serve:Object.freeze({title:"Dinner Dash",subtitle:"Finish customer orders",icon:"♡"}),
 harvest:Object.freeze({title:"Pantry Patrol",subtitle:"Harvest ingredients",icon:"✦"})
});
export const questTarget=(kind,stage)=>kind==="merge"?4+2*stage:kind==="serve"?2+stage:kind==="harvest"?7+4*stage:0;
export const questReward=(kind,stage)=>({coins:20+stage*(kind==="serve"?30:kind==="merge"?22:14),energy:kind==="serve"?8:kind==="merge"?6:4});
function tickQuest(state,kind){
 const quest=state.quests?.[kind];
 if(!quest)return;
 quest.progress=Math.min(questTarget(kind,quest.stage),quest.progress+1);
}
export function claimQuest(state,kind,now=Date.now()){
 const quest=state.quests?.[kind];
 if(!quest||!QUESTS[kind])return {ok:false,reason:"quest"};
 if(quest.progress<questTarget(kind,quest.stage))return {ok:false,reason:"incomplete"};
 const reward=questReward(kind,quest.stage);
 state.coins=cap(state.coins+reward.coins);
 const grantedEnergy=awardEnergy(state,reward.energy,now);
 const result={ok:true,type:"quest",kind,stage:quest.stage,coins:reward.coins,energy:grantedEnergy};
 quest.stage=Math.min(100,quest.stage+1);
 quest.progress=0;
 return result;
}
export function discoveryCount(state){
 return keys.reduce((n,k)=>n+Math.min(7,Math.max(0,state.discovered?.[k]||0)),0);
}
function discover(state,chain,tier){
 const previous=state.discovered?.[chain]||0;
 if(tier<=previous)return 0;
 state.discovered[chain]=tier;
 const bonus=8+11*tier;
 state.coins=cap(state.coins+bonus);
 state.score=cap(state.score+bonus*5);
 state.best=Math.max(state.best,state.score);
 return bonus;
}


// A free, earnable one-tap helper. No premium currency, no timer, no purchases.
export const WHISK_CAP=5;
export const WHISK_EVERY=3;
/* Prefer merges which create a currently ordered dish, then progress toward orders.
   The selection is deterministic, so players can preview the exact pair first. */
export function findMergePair(state){
 const wants=Array.isArray(state.orders)?state.orders:[];
 let best=null;
 for(let i=0;i<CELL_COUNT;i++){
  const a=state.board[i];
  if(!a||a.tier>=7)continue;
  for(let j=i+1;j<CELL_COUNT;j++){
   const b=state.board[j];
   if(!b||b.chain!==a.chain||b.tier!==a.tier)continue;
   const next=a.tier+1;
   let weight=next*10;
   for(const order of wants){
    if(order.chain!==a.chain)continue;
    if(order.tier===next)weight+=10000;
    else if(order.tier>next)weight+=1000-25*(order.tier-next);
   }
   if(!best||weight>best.weight||(weight===best.weight&&i<best.from))
    best={from:i,to:j,chain:a.chain,tier:next,weight};
  }
 }
 return best?{from:best.from,to:best.to,chain:best.chain,tier:best.tier}:null;
}
export function magicWhisk(state,now=Date.now()){
 if(state.whisks<=0)return {ok:false,reason:"no-whisks"};
 const pair=findMergePair(state);
 if(!pair)return {ok:false,reason:"no-pair"};
 const result=move(state,pair.from,pair.to,now);
 if(!result.ok)return result;
 state.whisks--;
 return {...result,type:"whisk",from:pair.from,to:pair.to,charges:state.whisks};
}

export function unlocked(state,chain){return !!RECIPES[chain]&&state.level>=RECIPES[chain].unlock}
export const generatorAt=(state,index)=>Object.keys(state.generators||{}).find(chain=>state.generators[chain]===index)||null;
export const available=state=>state.board.reduce((n,tile,i)=>n+(tile===null&&!generatorAt(state,i)?1:0),0);
function attachGenerator(state,chain){
 if(!unlocked(state,chain)||Number.isInteger(state.generators[chain])&&state.generators[chain]>=0)return;
 const preferred={garden:0,bakery:5,sweets:30}[chain];
 const spots=[preferred,...Array.from({length:CELL_COUNT},(_,i)=>i)];
 const spot=spots.find(i=>state.board[i]===null&&!generatorAt(state,i));
 if(spot!==undefined)state.generators[chain]=spot;
}
export function relocateGenerator(state,from,to){
 if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<0||from>=CELL_COUNT||to>=CELL_COUNT||from===to)return {ok:false,reason:"invalid"};
 const source=generatorAt(state,from),target=generatorAt(state,to);
 if(!source&&!target)return {ok:false,reason:"generator"};
 if(source&&target){state.generators[source]=to;state.generators[target]=from;}
 else if(source){state.generators[source]=to;state.board[from]=state.board[to];state.board[to]=null;}
 else {state.generators[target]=from;state.board[to]=state.board[from];state.board[from]=null;}
 state.combo=0;
 return {ok:true,type:"generator-move",from,to,chain:source||target};
}

export function orderProgress(state,order){
 if(!order||!RECIPES[order.chain])return {tier:0,steps:0,ready:false,pieces:0};
 const items=[...state.board,...(state.shelf||[])].filter(tile=>tile&&tile.chain===order.chain);
 const exact=items.some(tile=>tile.tier===order.tier);
 const closest=items.filter(tile=>tile.tier<=order.tier).reduce((highest,tile)=>Math.max(highest,tile.tier),0);
 return {tier:closest,steps:Math.max(0,order.tier-closest),ready:exact,pieces:items.length};
}
export const findReady=(state,order)=>state.board.findIndex(tile=>tile&&order&&tile.chain===order.chain&&tile.tier===order.tier);
export const findShelfReady=(state,order)=>(state.shelf||[]).findIndex(tile=>tile&&order&&tile.chain===order.chain&&tile.tier===order.tier);
/* The pantry shelf is free storage, not another generator. Each move preserves item identity. */
export function storeOnShelf(state,boardIndex,shelfIndex){
 if(!Number.isInteger(boardIndex)||boardIndex<0||boardIndex>=CELL_COUNT||!Number.isInteger(shelfIndex)||shelfIndex<0||shelfIndex>=state.shelf.length)return {ok:false,reason:"invalid"};
 const tile=state.board[boardIndex];if(!tile)return {ok:false,reason:"empty"};
 const previous=state.shelf[shelfIndex];state.shelf[shelfIndex]=tile;state.board[boardIndex]=previous||null;state.combo=0;
 for(const chain of keys)attachGenerator(state,chain);
 return {ok:true,type:previous?"shelf-swap":"shelf-store",place:boardIndex,shelfIndex};
}
export function takeFromShelf(state,shelfIndex,boardIndex){
 if(!Number.isInteger(boardIndex)||boardIndex<0||boardIndex>=CELL_COUNT||!Number.isInteger(shelfIndex)||shelfIndex<0||shelfIndex>=state.shelf.length)return {ok:false,reason:"invalid"};
 if(generatorAt(state,boardIndex))return {ok:false,reason:"generator-slot"};
 const tile=state.shelf[shelfIndex];if(!tile)return {ok:false,reason:"shelf-empty"};
 const previous=state.board[boardIndex];state.board[boardIndex]=tile;state.shelf[shelfIndex]=previous||null;state.combo=0;
 return {ok:true,type:previous?"shelf-swap":"shelf-take",place:boardIndex,shelfIndex};
}
function orderFor(state,random){
 const unlockedKeys=keys.filter(k=>unlocked(state,k));
 const maxTier=state.level<3?3:state.level<5?4:state.level<8?5:6;
 let chain=unlockedKeys[Math.floor(rnd(random)*unlockedKeys.length)];
 let tier=2+Math.floor(rnd(random)*(maxTier-1));
 const previous=new Set(state.orders.map(o=>o.chain+":"+o.tier));
 if(previous.has(chain+":"+tier)){
  const options=[];
  for(const name of unlockedKeys)for(let t=2;t<=maxTier;t++)if(!previous.has(name+":"+t))options.push({name,t});
  if(options.length){const choice=options[Math.floor(rnd(random)*options.length)];chain=choice.name;tier=choice.t}
 }
 return {id:state.serial++,chain,tier,coins:14+tier*14,xp:10+tier*9,energy:5+Math.floor(tier/2)};
}
// A paid-in-game-coins escape hatch for stalled customer queues. Never reroll a ready meal.
export const ORDER_REFRESH_COST=35;
export function refreshOrder(state,random=Math.random){
 if(!Array.isArray(state.orders)||state.orders.length!==3)return {ok:false,reason:"order"};
 const index=state.orders.findIndex(order=>findReady(state,order)<0&&findShelfReady(state,order)<0);
 if(index<0)return {ok:false,reason:"all-ready"};
 if(state.coins<ORDER_REFRESH_COST)return {ok:false,reason:"coins",cost:ORDER_REFRESH_COST};
 const previous=state.orders[index];
 // Exclude the discarded order so it cannot immediately reappear.
 const kept=state.orders.filter((_,i)=>i!==index);
 state.orders=kept.concat(previous);
 const replacement=orderFor(state,random);
 state.orders[index]=replacement;
 state.orders.length=3;
 state.coins-=ORDER_REFRESH_COST;
 state.combo=0;
 return {ok:true,type:"refresh-order",index,previous,replacement,cost:ORDER_REFRESH_COST};
}
export function makeGame(random=Math.random,now=Date.now()){
 const state={version:1,board:Array(CELL_COUNT).fill(null),generators:{garden:0,bakery:5,sweets:-1},shelf:Array(SHELF_SLOTS).fill(null),orders:[],serial:1,level:1,xp:0,coins:90,energy:MAX_ENERGY,energyLast:now,score:0,best:0,served:0,combo:0,lastMerge:0,rushUntil:0,upgrades:{garden:0,bakery:0,sweets:0},discovered:{garden:2,bakery:2,sweets:0},quests:{merge:{stage:1,progress:0},serve:{stage:1,progress:0},harvest:{stage:1,progress:0}},patronVisits:{},whisks:1};
 const seeds=[{chain:"garden",tier:1},{chain:"garden",tier:1},{chain:"bakery",tier:1},{chain:"bakery",tier:1},{chain:"garden",tier:2},{chain:"bakery",tier:2}];
 const locations=[8,9,14,15,20,21];
 seeds.forEach((seed,i)=>{state.board[locations[i]]={...seed,id:state.serial++}});
 for(let i=0;i<3;i++)state.orders.push(orderFor(state,random));
 return state;
}
export function advance(state,now=Date.now()){
 const at=Number.isFinite(now)?now:Date.now();
 if(!Number.isFinite(state.energyLast)||state.energyLast>at){state.energyLast=at;return 0}
 if(state.energy>=MAX_ENERGY){state.energyLast=at;return 0}
 const steps=Math.floor((at-state.energyLast)/ENERGY_INTERVAL);
 if(steps<=0)return 0;
 const gained=Math.min(MAX_ENERGY-state.energy,steps);
 state.energy+=gained;
 state.energyLast=state.energy===MAX_ENERGY?at:state.energyLast+steps*ENERGY_INTERVAL;
 return gained;
}
export function spawn(state,chain,random=Math.random,now=Date.now()){
 advance(state,now);
 if(!unlocked(state,chain))return {ok:false,reason:"locked"};
 if(state.energy<=0)return {ok:false,reason:"energy"};
 const empty=[];
 state.board.forEach((tile,i)=>{if(!tile&&!generatorAt(state,i))empty.push(i)});
 if(!empty.length)return {ok:false,reason:"full"};
 const place=empty[Math.floor(rnd(random)*empty.length)];
 const level=state.upgrades[chain]||0;
 const tier=rnd(random)<Math.min(.7,.12+level*.19)?2:1;
 state.board[place]={chain,tier,id:state.serial++};
 state.energy--;
 state.combo=0;
 const discoveryBonus=discover(state,chain,tier);
 tickQuest(state,"harvest");
 return {ok:true,type:"spawn",place,chain,tier,discoveryBonus};
}
export function move(state,from,to,now=Date.now()){
 if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<0||from>=CELL_COUNT||to>=CELL_COUNT||from===to)return {ok:false,reason:"invalid"};
 if(generatorAt(state,from)||generatorAt(state,to))return relocateGenerator(state,from,to);
 const source=state.board[from],target=state.board[to];
 if(!source)return {ok:false,reason:"empty"};
 if(target&&source.chain===target.chain&&source.tier===target.tier&&source.tier<7){
  const combo=now-state.lastMerge<6500?Math.min(5,state.combo+1):1;
  state.combo=combo;state.lastMerge=now;
  state.board[from]=null;
  state.board[to]={chain:source.chain,tier:source.tier+1,id:state.serial++};
  const gained=(10+source.tier*source.tier*9)*combo;
  state.score=cap(state.score+gained);
  state.best=Math.max(state.best,state.score);
  const discoveryBonus=discover(state,source.chain,source.tier+1);
  tickQuest(state,"merge");
  return {ok:true,type:"merge",place:to,chain:source.chain,tier:source.tier+1,gained,combo,discoveryBonus};
 }
 if(target&&source.chain===target.chain&&source.tier===7)return {ok:false,reason:"highest"};
 state.board[to]=source;state.board[from]=target||null;
 state.combo=0;
 return {ok:true,type:target?"swap":"move",from,to};
}
export function serve(state,index,random=Math.random,now=Date.now()){
 advance(state,now);
 if(!Number.isInteger(index)||index<0||index>=state.orders.length)return {ok:false,reason:"order"};
 const order=state.orders[index],place=findReady(state,order),shelfPlace=place<0?findShelfReady(state,order):-1;
 if(place<0&&shelfPlace<0)return {ok:false,reason:"missing"};
 if(place>=0)state.board[place]=null;
 else state.shelf[shelfPlace]=null;
 const rush=state.rushUntil>now;
 const favoriteTip=favoriteTipForOrder(order);
 const patron=patronForOrder(order);
 const visits=loyaltyStamps(state,patron)+1;
 const loyaltyBonus=visits%LOYALTY_VISIT_INTERVAL===0?15+state.level*5:0;
 const keepsake=keepsakeUnlocked(patron,visits);
 const coins=(order.coins+favoriteTip+loyaltyBonus)*(rush?2:1);
 const gained=order.xp*10*(rush?2:1);
 state.coins=cap(state.coins+coins);state.score=cap(state.score+gained);
 state.patronVisits=state.patronVisits||{};state.patronVisits[patron.symbol]=visits;state.best=Math.max(state.best,state.score);
 awardEnergy(state,order.energy,now);
 state.xp+=order.xp;state.served++;state.combo=0;
 const whiskEarned=state.served%WHISK_EVERY===0 && state.whisks<WHISK_CAP;
 if(whiskEarned)state.whisks++;
 tickQuest(state,"serve");
 const previousShelfSize=state.shelf.length;
 let leveled=false,unlockedSweetshop=false;
 while(state.xp>=xpNeeded(state.level)&&state.level<30){
  state.xp-=xpNeeded(state.level);state.level++;leveled=true;
  state.coins=cap(state.coins+35+state.level*12);
  awardEnergy(state,8,now);
  if(state.level===3){unlockedSweetshop=true;attachGenerator(state,"sweets")}
  while(state.shelf.length<shelfCapacity(state.level))state.shelf.push(null);
 }
 if(state.served%5===0)state.rushUntil=now+45000;
 state.orders.splice(index,1);
 state.orders.push(orderFor(state,random));
 for(const chain of keys)attachGenerator(state,chain);
 return {ok:true,type:"serve",place,shelfPlace,coins,favoriteTip:favoriteTip*(rush?2:1),loyaltyBonus:loyaltyBonus*(rush?2:1),keepsake,visits,patron:patron.name,gained,leveled,unlockedSweetshop,storageUnlocked:state.shelf.length>previousShelfSize,storageCapacity:state.shelf.length,level:state.level,rush:state.served%5===0,whiskEarned};
}
export function upgrade(state,chain){
 if(!unlocked(state,chain))return {ok:false,reason:"locked"};
 const current=state.upgrades[chain]||0,cost=upgradeCost(current);
 if(current>=3)return {ok:false,reason:"maxed"};
 if(state.coins<cost)return {ok:false,reason:"coins",cost};
 state.coins-=cost;state.upgrades[chain]=current+1;
 return {ok:true,type:"upgrade",chain,tier:current+1,cost};
}
export function recycle(state,index){
 if(!Number.isInteger(index)||index<0||index>=CELL_COUNT||!state.board[index])return {ok:false,reason:"empty"};
 const tile=state.board[index];
 state.board[index]=null;state.combo=0;
 for(const chain of keys)attachGenerator(state,chain);
 return {ok:true,type:"recycle",place:index,chain:tile.chain,tier:tile.tier};
}
export function stir(state,random=Math.random){
 if(state.coins<15)return {ok:false,reason:"coins"};
 const positions=state.board.filter(Boolean);
 if(positions.length>CELL_COUNT-Object.values(state.generators||{}).filter(x=>x>=0).length)return {ok:false,reason:"full"};
 for(let i=positions.length-1;i>0;i--){const j=Math.floor(rnd(random)*(i+1));[positions[i],positions[j]]=[positions[j],positions[i]]}
 const cells=Array(CELL_COUNT).fill(null);
 const spaces=Array.from({length:CELL_COUNT},(_,i)=>i).filter(i=>!generatorAt(state,i));
 for(const tile of positions){let offset=Math.floor(rnd(random)*spaces.length);while(cells[spaces[offset]])offset=(offset+1)%spaces.length;cells[spaces[offset]]=tile}
 state.board=cells;state.coins-=15;state.combo=0;
 return {ok:true,type:"stir"};
}
export function serialize(state){return JSON.stringify({...state,version:1})}
export function restore(raw,random=Math.random,now=Date.now()){
 let value=raw;
 try{if(typeof raw==="string")value=JSON.parse(raw)}catch{return makeGame(random,now)}
 if(!value||value.version!==1||!Array.isArray(value.board)||value.board.length!==CELL_COUNT||!Array.isArray(value.orders)||value.orders.length!==3)return makeGame(random,now);
 const state=makeGame(random,now);
 state.level=num(value.level,1,1,30);
 state.xp=num(value.xp,0,0,2000);
 state.coins=num(value.coins,90,0,1000000000);
 state.energy=num(value.energy,MAX_ENERGY,0,ENERGY_HARD_CAP);
 state.energyLast=num(value.energyLast,now,0,now);
 state.score=num(value.score,0,0,1000000000);
 state.best=Math.max(state.score,num(value.best,state.score,0,1000000000));
 state.served=num(value.served,0,0,10000000);
 state.whisks=num(value.whisks,1,0,WHISK_CAP);
 state.patronVisits=Object.fromEntries(PATRONS.map(p=>[p.symbol,num(value.patronVisits?.[p.symbol],0,0,1000000)]));
 state.combo=num(value.combo,0,0,5);
 state.lastMerge=num(value.lastMerge,0,0,now);
 state.rushUntil=num(value.rushUntil,0,0,now+45000);
 state.serial=num(value.serial,100,1,1000000000);
 for(const name of keys){
  state.upgrades[name]=num(value.upgrades?.[name],0,0,3);
  state.discovered[name]=num(value.discovered?.[name],state.discovered[name],0,7);
 }
 for(const kind of Object.keys(QUESTS)){
  const stage=num(value.quests?.[kind]?.stage,1,1,100);
  state.quests[kind]={stage,progress:num(value.quests?.[kind]?.progress,0,0,questTarget(kind,stage))};
 }
 const goodTile=x=>x&&typeof x==="object"&&!!RECIPES[x.chain]&&Number.isInteger(x.tier)&&x.tier>=1&&x.tier<=7&&Number.isSafeInteger(x.id)&&x.id>0;
 state.board=value.board.map(x=>goodTile(x)?{chain:x.chain,tier:x.tier,id:x.id}:null);
 state.shelf=Array.from({length:shelfCapacity(state.level)},(_,i)=>Array.isArray(value.shelf)&&i<value.shelf.length&&goodTile(value.shelf[i])?{chain:value.shelf[i].chain,tier:value.shelf[i].tier,id:value.shelf[i].id}:null);
 for(const tile of [...state.board,...state.shelf])if(tile)state.discovered[tile.chain]=Math.max(state.discovered[tile.chain],tile.tier);
 // Legacy kitchens had no board generators. Prefer original corners, then any free cell.
 state.generators={garden:-1,bakery:-1,sweets:-1};
 for(const chain of keys){
  if(!unlocked(state,chain))continue;
  const desired=value.generators?.[chain];
  if(Number.isInteger(desired)&&desired>=0&&desired<CELL_COUNT&&!state.board[desired]&&!generatorAt(state,desired))state.generators[chain]=desired;
  else attachGenerator(state,chain);
 }

 const goodOrder=x=>x&&typeof x==="object"&&!!RECIPES[x.chain]&&Number.isInteger(x.tier)&&x.tier>=2&&x.tier<=7&&Number.isSafeInteger(x.id)&&x.id>0;
 if(value.orders.every(goodOrder))state.orders=value.orders.map(x=>({id:x.id,chain:x.chain,tier:x.tier,coins:num(x.coins,35,1,1000),xp:num(x.xp,20,1,200),energy:num(x.energy,5,0,20)}));
 else state.orders=Array.from({length:3},()=>orderFor(state,random));
 state.serial=Math.max(state.serial,1+Math.max(0,...state.board.filter(Boolean).map(x=>x.id),...state.shelf.filter(Boolean).map(x=>x.id),...state.orders.map(x=>x.id)));
 advance(state,now);
 return state;
}
