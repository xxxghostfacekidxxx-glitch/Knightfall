/* Hex & Whisk / original Knightfall merge-cooking rules. Pure state engine. */
export const WIDTH=6;
export const CELL_COUNT=WIDTH*WIDTH;
export const MAX_ENERGY=40;
export const ENERGY_INTERVAL=9000;
export const RECIPES=Object.freeze({
 garden:Object.freeze({name:"Garden",hue:"#ee987b",unlock:1,items:["Seedling","Ruby tomato","Chopped tomatoes","Scarlet sauce","Moonlit pasta","Firestone pizza","Infernal banquet"]}),
 bakery:Object.freeze({name:"Bakery",hue:"#f3c87b",unlock:1,items:["Golden wheat","Flour sack","Soft dough","Honey loaf","Moon croissant","Velvet cupcake","Celebration cake"]}),
 sweets:Object.freeze({name:"Sweetshop",hue:"#eaa6cf",unlock:3,items:["Wild berry","Berry jam","Tart shell","Berry tart","Dream parfait","Moon cheesecake","Starry sundae"]})
});
const keys=Object.keys(RECIPES);
const cap=n=>Math.max(0,Math.min(1000000000,Math.floor(Number(n)||0)));
const rnd=random=>Math.min(.999999,Math.max(0,Number(random())||0));
const num=(x,fallback,min,max)=>Number.isFinite(Number(x))?Math.max(min,Math.min(max,Math.floor(Number(x)))):fallback;
export const xpNeeded=level=>32+level*24;
export const upgradeCost=level=>70+level*110;
export function unlocked(state,chain){return !!RECIPES[chain]&&state.level>=RECIPES[chain].unlock}
export const available=state=>state.board.filter(tile=>tile===null).length;
export const findReady=(state,order)=>state.board.findIndex(tile=>tile&&order&&tile.chain===order.chain&&tile.tier===order.tier);
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
export function makeGame(random=Math.random,now=Date.now()){
 const state={version:1,board:Array(CELL_COUNT).fill(null),orders:[],serial:1,level:1,xp:0,coins:90,energy:MAX_ENERGY,energyLast:now,score:0,best:0,served:0,combo:0,lastMerge:0,rushUntil:0,upgrades:{garden:0,bakery:0,sweets:0}};
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
 state.board.forEach((tile,i)=>{if(!tile)empty.push(i)});
 if(!empty.length)return {ok:false,reason:"full"};
 const place=empty[Math.floor(rnd(random)*empty.length)];
 const level=state.upgrades[chain]||0;
 const tier=rnd(random)<Math.min(.7,.12+level*.19)?2:1;
 state.board[place]={chain,tier,id:state.serial++};
 state.energy--;
 state.combo=0;
 return {ok:true,type:"spawn",place,chain,tier};
}
export function move(state,from,to,now=Date.now()){
 if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<0||from>=CELL_COUNT||to>=CELL_COUNT||from===to)return {ok:false,reason:"invalid"};
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
  return {ok:true,type:"merge",place:to,chain:source.chain,tier:source.tier+1,gained,combo};
 }
 if(target&&source.chain===target.chain&&source.tier===7)return {ok:false,reason:"highest"};
 state.board[to]=source;state.board[from]=target||null;
 state.combo=0;
 return {ok:true,type:target?"swap":"move",from,to};
}
export function serve(state,index,random=Math.random,now=Date.now()){
 advance(state,now);
 if(!Number.isInteger(index)||index<0||index>=state.orders.length)return {ok:false,reason:"order"};
 const order=state.orders[index],place=findReady(state,order);
 if(place<0)return {ok:false,reason:"missing"};
 state.board[place]=null;
 const rush=state.rushUntil>now;
 const coins=order.coins*(rush?2:1);
 const gained=order.xp*10*(rush?2:1);
 state.coins=cap(state.coins+coins);state.score=cap(state.score+gained);state.best=Math.max(state.best,state.score);
 state.energy=Math.min(MAX_ENERGY,state.energy+order.energy);
 if(state.energy===MAX_ENERGY)state.energyLast=now;
 state.xp+=order.xp;state.served++;state.combo=0;
 let leveled=false,unlockedSweetshop=false;
 while(state.xp>=xpNeeded(state.level)&&state.level<30){
  state.xp-=xpNeeded(state.level);state.level++;leveled=true;
  state.coins=cap(state.coins+35+state.level*12);
  state.energy=Math.min(MAX_ENERGY,state.energy+8);
  if(state.energy===MAX_ENERGY)state.energyLast=now;
  if(state.level===3)unlockedSweetshop=true;
 }
 if(state.served%5===0)state.rushUntil=now+45000;
 state.orders.splice(index,1);
 state.orders.push(orderFor(state,random));
 return {ok:true,type:"serve",place,coins,gained,leveled,unlockedSweetshop,level:state.level,rush:state.served%5===0};
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
 return {ok:true,type:"recycle",place:index,chain:tile.chain,tier:tile.tier};
}
export function stir(state,random=Math.random){
 if(state.coins<15)return {ok:false,reason:"coins"};
 const positions=state.board.filter(Boolean);
 for(let i=positions.length-1;i>0;i--){const j=Math.floor(rnd(random)*(i+1));[positions[i],positions[j]]=[positions[j],positions[i]]}
 const cells=Array(CELL_COUNT).fill(null);
 for(const tile of positions){let empty=Math.floor(rnd(random)*CELL_COUNT);while(cells[empty])empty=(empty+1)%CELL_COUNT;cells[empty]=tile}
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
 state.energy=num(value.energy,MAX_ENERGY,0,MAX_ENERGY);
 state.energyLast=num(value.energyLast,now,0,now);
 state.score=num(value.score,0,0,1000000000);
 state.best=Math.max(state.score,num(value.best,state.score,0,1000000000));
 state.served=num(value.served,0,0,10000000);
 state.combo=num(value.combo,0,0,5);
 state.lastMerge=num(value.lastMerge,0,0,now);
 state.rushUntil=num(value.rushUntil,0,0,now+45000);
 state.serial=num(value.serial,100,1,1000000000);
 for(const name of keys)state.upgrades[name]=num(value.upgrades?.[name],0,0,3);
 const goodTile=x=>x&&typeof x==="object"&&!!RECIPES[x.chain]&&Number.isInteger(x.tier)&&x.tier>=1&&x.tier<=7&&Number.isSafeInteger(x.id)&&x.id>0;
 state.board=value.board.map(x=>goodTile(x)?{chain:x.chain,tier:x.tier,id:x.id}:null);
 const goodOrder=x=>x&&typeof x==="object"&&!!RECIPES[x.chain]&&Number.isInteger(x.tier)&&x.tier>=2&&x.tier<=7&&Number.isSafeInteger(x.id)&&x.id>0;
 if(value.orders.every(goodOrder))state.orders=value.orders.map(x=>({id:x.id,chain:x.chain,tier:x.tier,coins:num(x.coins,35,1,1000),xp:num(x.xp,20,1,200),energy:num(x.energy,5,0,20)}));
 else state.orders=Array.from({length:3},()=>orderFor(state,random));
 state.serial=Math.max(state.serial,1+Math.max(0,...state.board.filter(Boolean).map(x=>x.id),...state.orders.map(x=>x.id)));
 advance(state,now);
 return state;
}
