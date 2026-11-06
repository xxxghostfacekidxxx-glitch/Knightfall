import test from "node:test";
import assert from "node:assert/strict";
import {handleArcadeDeckLocker,canEquipDeckSkin,DECK_PREMIUM_SKINS,DECK_ACTIVITY_GAMES} from "./arcade-deck-locker.js";

class DB {
 constructor(){this.profiles=new Map();this.owned=new Map();this.events=new Set();}
 prepare(sql){
  const db=this;let args=[];
  return {
   bind(...xs){args=xs;return this;},
   async first(){
    if(sql.startsWith("SELECT equipped_skin"))return db.profiles.get(args[0])||null;
    if(sql.includes("SET equipped_skin=?")){
     const [skin,,id,revision]=args,p=db.profiles.get(id);
     if(!p||revision!==p.revision)return null;
     p.equipped_skin=skin;p.revision++;return {user_id:id};
    }
    if(sql.includes("SET earned_deals=MAX")){
     const [amount,,id]=args,p=db.profiles.get(id);
     if(!p||p.local_imported)return null;
     p.earned_deals=Math.max(p.earned_deals,amount);p.local_imported=1;p.revision++;return {user_id:id};
    }
    if(sql.includes("SET earned_deals=MIN")){
     const [now,,id,cutoff]=args,p=db.profiles.get(id);
     if(!p||(p.last_deal_at&&p.last_deal_at>cutoff))return null;
     p.earned_deals++;p.last_deal_at=now;p.revision++;return {user_id:id};
    }
    throw Error("Unknown first query: "+sql);
   },
   async all(){
    if(sql.startsWith("SELECT skin_id"))return {results:(db.owned.get(args[0])||[]).map(skin_id=>({skin_id}))};
    throw Error("Unknown all query: "+sql);
   },
   async run(){
    if(sql.startsWith("INSERT OR IGNORE INTO arcade_deck_profiles")){
     if(db.profiles.has(args[0]))return {meta:{changes:0}};
     db.profiles.set(args[0],{equipped_skin:"ash-classic",earned_deals:0,local_imported:0,revision:0,last_deal_at:null});return {meta:{changes:1}};
    }
    if(sql.startsWith("INSERT OR IGNORE INTO arcade_deck_events")){
     const key=args[0]+":"+args[1];
     if(db.events.has(key))return {meta:{changes:0}};
     db.events.add(key);return {meta:{changes:1}};
    }
    throw Error("Unknown run query: "+sql);
   }
  };
 }
}
async function api(db,{id=1,method="GET",body,authed=true,origin="https://ash-fall.com"}={}){
 const url="https://api.ash-fall.com/api/arcade/deck-locker";
 const req=new Request(url,{method,headers:{"origin":origin,...(body?{"content-type":"application/json"}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const res=await handleArcadeDeckLocker(req,{DB:db},new URL(url),{
  getUser:async()=>authed?{id}:null,
  rateLimit:async()=>true,
  json:(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json"}}),
  origin
 });
 return {status:res.status,...await res.json()};
}
test("12 account-defined skins and five premium ownership gates",()=>{
 assert.equal(DECK_ACTIVITY_GAMES.length,10);
 assert.equal(DECK_PREMIUM_SKINS.length,5);
 assert.ok(canEquipDeckSkin("neon-riot"));
 assert.ok(!canEquipDeckSkin("grave-velvet",2));
 assert.ok(canEquipDeckSkin("grave-velvet",3));
 assert.ok(!canEquipDeckSkin("infernal-foil",49));
 assert.ok(canEquipDeckSkin("infernal-foil",50));
 assert.ok(!canEquipDeckSkin("holo-wraith",100000));
 assert.ok(canEquipDeckSkin("holo-wraith",0,["holo-wraith"]));
 assert.ok(!canEquipDeckSkin("fake",100000,["fake"]));
});
test("a session is required, and profiles remain isolated between accounts",async()=>{
 const db=new DB();
 assert.equal((await api(db,{authed:false})).status,401);
 assert.equal((await api(db,{id:1})).profile.equipped_skin,"ash-classic");
 assert.equal((await api(db,{id:1,method:"PUT",body:{skin_id:"neon-riot",revision:0}})).status,200);
 assert.equal((await api(db,{id:2})).profile.equipped_skin,"ash-classic");
 assert.equal((await api(db,{id:1})).profile.equipped_skin,"neon-riot");
});
test("stale revisions and guessed premium ownership cannot equip skins",async()=>{
 const db=new DB();
 assert.equal((await api(db,{method:"PUT",body:{skin_id:"void-royalty",revision:0}})).status,403);
 assert.equal((await api(db,{method:"PUT",body:{skin_id:"neon-riot",revision:0}})).status,200);
 assert.equal((await api(db,{method:"PUT",body:{skin_id:"bone-white",revision:0}})).status,409);
 db.owned.set(1,["void-royalty"]);
 assert.equal((await api(db,{method:"PUT",body:{skin_id:"void-royalty",revision:1}})).status,200);
 db.owned.delete(1); // refunded or revoked: no more premium ownership
 assert.equal((await api(db)).profile.equipped_skin,"ash-classic");
});
test("legacy device progress imports only once, max 50, without resetting higher account totals",async()=>{
 const db=new DB();
 assert.equal((await api(db,{method:"POST",body:{action:"import",legacy_deals:51}})).status,400);
 const first=await api(db,{method:"POST",body:{action:"import",legacy_deals:25}});
 assert.equal(first.status,200);
 assert.equal(first.profile.earned_deals,25);
 assert.equal(first.profile.local_imported,true);
 assert.equal((await api(db,{method:"POST",body:{action:"import",legacy_deals:50}})).status,409);
 assert.equal((await api(db)).profile.earned_deals,25);
});
test("deal events are idempotent and cool down, unknown games are rejected",async()=>{
 const db=new DB();
 const body={action:"deal",game_key:"chaos-blackjack",event_id:"distinct-game-event-100"};
 const first=await api(db,{method:"POST",body});
 assert.equal(first.status,200);assert.equal(first.counted,true);assert.equal(first.profile.earned_deals,1);
 const replay=await api(db,{method:"POST",body});assert.equal(replay.counted,false);
 assert.equal(replay.profile.earned_deals,1);
 const rapid=await api(db,{method:"POST",body:{...body,event_id:"distinct-game-event-200"}});
 assert.equal(rapid.counted,false);
 assert.equal(rapid.profile.earned_deals,1);
 assert.equal((await api(db,{method:"POST",body:{...body,game_key:"not-registered",event_id:"valid-event-name-123"}})).status,400);
});
test("cross-origin writes and invalid HTTP methods are rejected",async()=>{
 const db=new DB();
 assert.equal((await api(db,{method:"POST",origin:"https://hostile.example",body:{action:"import",legacy_deals:50}})).status,403);
 assert.equal((await api(db,{method:"PUT",body:{skin_id:"ash-classic",revision:"0"}})).status,400);
});
