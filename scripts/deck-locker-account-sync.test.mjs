import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const script=readFileSync("public/card-deck-skins.js","utf8");
const dataStore={profiles:new Map(),premium:new Map(),cinders:new Map(),vip:new Set(),balance:new Map()};
function mockResponse(status,data){
 return {ok:status>=200&&status<300,status,async json(){return data}};
}
function simulateAPI(userId,log){
 return async (url,opts={})=>{
  assert.equal(url,"https://api.ash-fall.com/api/arcade/deck-locker");
  assert.equal(opts.credentials,"include");
  const method=opts.method||"GET",body=opts.body?JSON.parse(opts.body):{};
  log.push({userId,method,body});
  if(!userId)return mockResponse(401,{error:"Sign in"});
  let profile=dataStore.profiles.get(userId);
  if(!profile){profile={equipped_skin:"ash-classic",earned_deals:0,revision:0,local_imported:false};dataStore.profiles.set(userId,profile)}
  const owned=dataStore.premium.get(userId)||[];
  const ownedCinders=dataStore.cinders.get(userId)||[];
  if(!dataStore.balance.has(userId))dataStore.balance.set(userId,2000);
  if(method==="PUT"){
   if(body.revision!==profile.revision)return mockResponse(409,{error:"Conflict"});
   // Premium cosmetics require server-issued ownership even if local storage is forged.
   if(body.skin_id==="obsidian-cathedral"&&!owned.includes(body.skin_id))return mockResponse(403,{error:"Not owned"});
   if(body.skin_id==="ashen-baroque"&&!ownedCinders.includes(body.skin_id))return mockResponse(403,{error:"Not owned"});
   if(body.skin_id==="infernal-covenant"&&(!ownedCinders.includes(body.skin_id)||!dataStore.vip.has(userId)))return mockResponse(403,{error:"VIP required"});
   profile={...profile,equipped_skin:body.skin_id,revision:profile.revision+1};
   dataStore.profiles.set(userId,profile);
  }else if(method==="POST"&&body.action==="buy_cinders"){
   const prices={"ashen-baroque":300,"infernal-covenant":1200};
   const cost=prices[body.skin_id];
   if(!cost)return mockResponse(400,{error:"Unknown Cinders skin"});
   if(ownedCinders.includes(body.skin_id))return mockResponse(409,{error:"Already owned"});
   if(body.skin_id==="infernal-covenant"&&!dataStore.vip.has(userId))return mockResponse(403,{error:"VIP required"});
   if(dataStore.balance.get(userId)<cost)return mockResponse(409,{error:"Not enough Cinders"});
   dataStore.balance.set(userId,dataStore.balance.get(userId)-cost);
   dataStore.cinders.set(userId,[...ownedCinders,body.skin_id]);
  }else if(method==="POST"&&body.action==="deal"){
   profile={...profile,earned_deals:profile.earned_deals+1,revision:profile.revision+1};
   dataStore.profiles.set(userId,profile);
  }else if(method==="POST"&&body.action==="import"){
   profile={...profile,earned_deals:Math.max(profile.earned_deals,body.legacy_deals),local_imported:true,revision:profile.revision+1};
   dataStore.profiles.set(userId,profile);
  }
  return mockResponse(method==="POST"&&body.action==="buy_cinders"?201:200,{ok:true,user_id:userId,profile,owned_skin_ids:owned,owned_cinder_skin_ids:dataStore.cinders.get(userId)||[],vip_active:dataStore.vip.has(userId),wallet_balance:dataStore.balance.get(userId)});
 };
}
function client(userId,storage=new Map(),log=[]){
 const listeners=new Map();
 const root={dataset:{},style:{}};
 const window={
  localStorage:{getItem:key=>storage.get(key)||null,setItem:(k,v)=>storage.set(k,String(v))},
  fetch:simulateAPI(userId,log),dispatchEvent(){},
  addEventListener:(name,callback)=>listeners.set(name,callback)
 };
 const document={documentElement:root,readyState:"loading",addEventListener(name,cb){listeners.set("document-"+name,cb)}};
 vm.runInNewContext(script,{window,document,CustomEvent:class{}},{timeout:1500});
 return {api:window.AshFallDeckSkins,storage,root,log};
}
const settled=()=>new Promise(resolve=>setTimeout(resolve,15));

test("local and offline game previews never contact the production account API",async()=>{
 const log=[];
 // In a browser the hostname is always set; Node VM tests omit it by default.
 // Re-evaluate the shared module with a local hostname to simulate the test fleet.
 const root={dataset:{},style:{}},listeners=new Map(),storage=new Map();
 const window={
  location:{hostname:"127.0.0.1"},
  localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v))},
  fetch:simulateAPI(910,log),
  addEventListener:(n,fn)=>listeners.set(n,fn),
  dispatchEvent(){}
 };
 const document={documentElement:root,readyState:"loading",addEventListener:(n,fn)=>listeners.set(n,fn)};
 vm.runInNewContext(script,{window,document,CustomEvent:class{}},{timeout:1500});
 const local=window.AshFallDeckSkins;
 assert.equal(await local.refresh(),false);
 assert.equal(log.length,0,"local games must not hit live API");
 assert.equal(local.chooseSkin("neon-riot"),true);
 assert.equal(local.recordDeal("chaos-blackjack"),1);
 assert.equal(local.accountSynced,false);
 assert.equal(log.length,0);
});
test("account A syncs an equipped skin to phone B but not account C",async()=>{
 dataStore.profiles.clear();dataStore.premium.clear();
 const a=client(100),b=client(100),c=client(101);
 assert.equal(await a.api.refresh(),true);
 assert.equal(await b.api.refresh(),true);
 assert.equal(await c.api.refresh(),true);
 assert.equal(a.api.chooseSkin("neon-riot"),true);
 await settled();
 assert.equal(await b.api.refresh(),true);
 assert.equal(b.api.current,"neon-riot");
 assert.equal(b.root.dataset.kfDeckSkin,"neon-riot");
 assert.equal(c.api.current,"ash-classic");
 assert.equal(c.api.accountId,101);
 assert.equal(a.api.accountId,100);
});
test("stale revisions synchronize and safely retry latest user choice",async()=>{
 dataStore.profiles.clear();dataStore.premium.clear();
 const a=client(202),b=client(202);
 await a.api.refresh();await b.api.refresh();
 a.api.chooseSkin("neon-riot");await settled();
 b.api.chooseSkin("bone-white");await settled();
 await a.api.refresh();
 assert.equal(a.api.current,"bone-white");
 assert.equal(b.api.current,"bone-white");
 assert.equal(dataStore.profiles.get(202).revision,2);
});
test("former premium skins are now free and sync between devices",async()=>{
 dataStore.profiles.clear();dataStore.premium.clear();
 const storage=new Map([["ashfall:deck-locker:selected:v1","void-royalty"]]);
 const a=client(303,storage),b=client(303);
 assert.equal(a.api.current,"void-royalty");
 await a.api.refresh();await b.api.refresh();
 assert.equal(a.api.chooseSkin("void-royalty"),true);
 await settled();
 await b.api.refresh();
 assert.equal(b.api.current,"void-royalty");
 assert.equal(dataStore.profiles.get(303).equipped_skin,"void-royalty");
 dataStore.premium.clear();
 assert.equal(await a.api.refresh(),true);
 assert.equal(a.api.current,"void-royalty");
});
test("progress imports at most once and guest fallback remains usable",async()=>{
 dataStore.profiles.clear();dataStore.premium.clear();
 const local=new Map([["ashfall:deck-locker:deals:v1","25"]]);
 const signedIn=client(404,local);
 await signedIn.api.refresh();
 assert.equal(signedIn.api.accountSynced,true);
 assert.equal(signedIn.api.localDeals,0);
 assert.equal(signedIn.api.importLegacy(),true);
 await settled();
 assert.equal(signedIn.api.localDeals,25);
 assert.equal(signedIn.api.importLegacy(),false);
 const phone=client(404);
 await phone.api.refresh();
 assert.equal(phone.api.localDeals,25);
 const guest=client(null);
 assert.equal(await guest.api.refresh(),false);
 assert.equal(guest.api.accountSynced,false);
 assert.equal(guest.api.chooseSkin("neon-riot"),true);
 assert.equal(guest.api.recordDeal("chaos-blackjack"),1);
});

test("new collector skins require ownership and persist only for the purchasing account",async()=>{
 dataStore.profiles.clear();dataStore.premium.clear();
 const stored=new Map([["ashfall:deck-locker:selected:v1","obsidian-cathedral"]]);
 const a=client(501,stored),b=client(502);
 assert.equal(a.api.current,"ash-classic");
 assert.equal(a.api.chooseSkin("obsidian-cathedral"),false);
 await a.api.refresh();await b.api.refresh();
 assert.equal(a.api.chooseSkin("obsidian-cathedral"),false);
 dataStore.premium.set(501,["obsidian-cathedral"]);
 await a.api.refresh();
 assert.equal(a.api.chooseSkin("obsidian-cathedral"),true);
 await settled();
 assert.equal(a.api.current,"obsidian-cathedral");
 assert.equal(b.api.chooseSkin("obsidian-cathedral"),false);
 dataStore.premium.delete(501);
 await a.api.refresh();
 assert.equal(a.api.current,"ash-classic");
});

test("Cinders ownership follows account and VIP use expires without forfeiting the purchase",async()=>{
 dataStore.profiles.clear();dataStore.premium.clear();dataStore.cinders.clear();dataStore.vip.clear();dataStore.balance.clear();
 const a=client(810),b=client(811);
 await a.api.refresh();await b.api.refresh();
 assert.equal(a.api.walletBalance,2000);
 assert.equal(a.api.isAvailable("ashen-baroque"),false);
 assert.equal(await a.api.purchaseCinderSkin("ashen-baroque"),true);
 assert.equal(a.api.walletBalance,1700);
 assert.equal(a.api.isAvailable("ashen-baroque"),true);
 assert.equal(b.api.isAvailable("ashen-baroque"),false);
 assert.equal(await a.api.purchaseCinderSkin("ashen-baroque"),false);
 assert.equal(dataStore.balance.get(810),1700);
 assert.equal(await a.api.purchaseCinderSkin("infernal-covenant"),false);
 dataStore.vip.add(810);
 await a.api.refresh();
 assert.equal(await a.api.purchaseCinderSkin("infernal-covenant"),true);
 assert.equal(a.api.walletBalance,500);
 assert.equal(a.api.chooseSkin("infernal-covenant"),true);
 await settled();
 dataStore.vip.delete(810);
 await a.api.refresh();
 assert.equal(a.api.isAvailable("infernal-covenant"),false);
 assert.equal(a.api.current,"ash-classic");
 assert.equal(a.api.ownedCinders.includes("infernal-covenant"),true);
 dataStore.vip.add(810);
 await a.api.refresh();
 assert.equal(a.api.isAvailable("infernal-covenant"),true);
});
