import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const read=p=>readFileSync(p,"utf8");
const source=read("public/card-deck-skins.js");
const css=read("public/card-deck-skins.css");
const catalog=JSON.parse(read("public/arcade/catalog.json"));
const shop=read("public/cinder-shop.html");
const paths=catalog.games.filter(g=>g.genre==="Card").map(g=>g.route);

function startWardrobe(memory=new Map()){
 const root={dataset:{},style:{}};
 const listeners=new Map();
 const window={
  localStorage:{
   getItem:k=>memory.get(k)||null,
   setItem:(k,v)=>memory.set(k,String(v))
  },
  addEventListener:(name,fn)=>listeners.set(name,fn),
  dispatchEvent:()=>{}
 };
 const document={
  documentElement:root,readyState:"loading",
  addEventListener:(event,fn)=>listeners.set("document-"+event,fn)
 };
 vm.runInNewContext(source,{window,document,CustomEvent:class {constructor(type,detail){this.type=type;this.detail=detail}}},{timeout:1500});
 return {api:window.AshFallDeckSkins,root,listeners,memory};
}

test("one canonical 12-skin wardrobe with free/earned/premium categories",()=>{
 const {api,root}=startWardrobe();
 assert.equal(api.skins.length,12);
 assert.equal(new Set(api.skins.map(s=>s.id)).size,12);
 assert.equal(api.skins.filter(s=>s.kind==="free").length,3);
 assert.equal(api.skins.filter(s=>s.kind==="unlock").length,4);
 assert.equal(api.skins.filter(s=>s.kind==="premium").length,5);
 assert.equal(api.current,"ash-classic");
 assert.equal(root.dataset.kfDeckSkin,"ash-classic");
 assert.equal(api.chooseSkin("neon-riot"),true);
 assert.equal(api.current,"neon-riot");
 assert.equal(api.chooseSkin("not-a-real-skin"),false);
 assert.equal(api.chooseSkin("void-royalty"),false,"premium cosmetics cannot be equipped for free");
 assert.equal(api.isAvailable("holo-wraith"),false);
});

test("free unlock progression persists and applies on every subsequent card-game page",()=>{
 const memory=new Map();
 const a=startWardrobe(memory);
 assert.equal(a.api.chooseSkin("grave-velvet"),false);
 for(let i=0;i<3;i++)a.api.recordDeal("chaos-blackjack");
 assert.equal(a.api.localDeals,3);
 assert.equal(a.api.chooseSkin("grave-velvet"),true);
 const b=startWardrobe(memory);
 assert.equal(b.api.current,"grave-velvet","the same skin applies when another card game loads");
 assert.equal(b.root.dataset.kfDeckSkin,"grave-velvet");
 for(let i=3;i<50;i++)b.api.recordDeal("cards-against-chaos");
 for(const skin of b.api.skins.filter(s=>s.kind==="unlock"))assert.equal(b.api.isAvailable(skin.id),true);
 assert.equal(b.api.chooseSkin("infernal-foil"),true);
 assert.equal(b.api.isAvailable("eclipse-noir"),false,"premium is not earned by farming play counters");
 assert.equal(b.api.recordDeal("../bad path"),50,"invalid event sources must not count");
 const c=startWardrobe(memory);
 assert.equal(c.api.current,"infernal-foil");
 assert.equal(c.api.localDeals,50);
});

test("stale or forged premium selection in local storage never grants ownership",()=>{
 const memory=new Map([["ashfall:deck-locker:selected:v1","void-royalty"],["ashfall:deck-locker:deals:v1","10000"]]);
 const {api,root}=startWardrobe(memory);
 assert.equal(api.current,"ash-classic");
 assert.equal(root.dataset.kfDeckSkin,"ash-classic");
 assert.equal(api.chooseSkin("void-royalty"),false);
});

test("every catalogued card-game entry imports the same asset pipeline",()=>{
 assert.equal(paths.length,4,"new Card catalog routes must be opted into deck skins explicitly");
 for(const route of paths){
  const html=read("public"+route);
  assert.match(html,/<link[^>]+card-deck-skins\.css\?v=/,route+" missing shared skin CSS");
  assert.match(html,/<script[^>]+card-deck-skins\.js\?v=/,route+" missing shared skin selector");
 }
 assert.match(read("public/arcade-card-room.html"),/recordDeal\('chaos-war'\)/);
 assert.match(read("public/arcade-card-expansion.html"),/recordDeal\('chaos-freecell'\)/);
 assert.match(read("public/arcade/hosted/cinder-eights/game.js"),/className="af-deck-card "/);
 assert.match(read("public/arcade/hosted/cinder-eights/index.html"),/game\.js\?v=/);
 assert.match(read("public/arcade/hosted/cards-against-chaos/index.html"),/recordDeal\('cards-against-chaos'\)/);
 assert.match(read("public/arcade/hosted/cards-against-chaos/online.js"),/recordDeal\('cards-against-chaos'\)/);
});

test("each face and back skin preserves suit readability and premium shop has no checkout",()=>{
 for(const skin of startWardrobe().api.skins){
  assert.ok(css.includes('data-kf-deck-skin="'+skin.id+'"')||skin.id==="ash-classic",skin.id+" missing skin gradient");
  if(skin.kind==="premium"){
   assert.ok(shop.includes('id="deck-skin-'+skin.id+'"'),skin.id+" missing shop listing");
   assert.match(shop,new RegExp('id="deck-skin-'+skin.id+'"[\\s\\S]*?<button[^>]+disabled'),skin.id+" must not pretend to charge");
  }
 }
 assert.match(css,/\.playing-card\.red/);
 assert.match(css,/\.playing-card:is\(\.back,\.backside\)/);
 assert.match(css,/\.cac-shell \.prompt-card/);
 assert.match(css,/#hand button\.af-deck-card/);
 assert.match(shop,/No purchases are being accepted/);
});
