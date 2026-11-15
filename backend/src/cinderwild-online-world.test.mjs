import test from "node:test";
import assert from "node:assert/strict";
import {handleCinderwildOnlineWorld} from "./cinderwild-online-world.js";

const ORIGIN="https://ash-fall.com";
function fixture(){
 const players=new Map(),quests=new Map();
 const users=new Map([[1,{id:1,username:"alpha",display_name:"Alpha",status:"active"}],[2,{id:2,username:"beta",display_name:"Beta",status:"active"}]]);
 const blocks=new Set();
 const db={
  prepare(sql){
   let args=[];
   return {
    bind(...params){args=params;return this;},
    async first(){
     if(sql.includes("FROM cinderwild_world_players WHERE user_id=?"))
      return players.get(args[0])?{...players.get(args[0])}:null;
     throw Error("Unexpected first query: "+sql);
    },
    async all(){
     if(sql.includes("FROM cinderwild_world_quests")){
      return {results:[...(quests.get(args[0])||[])].map(quest_id=>({quest_id}))};
     }
     if(sql.includes("FROM cinderwild_world_players p")){
      const [since,userId,minX,maxX,centerX,centerY]=args;
      return {results:[...players.values()].filter(p=>
       p.user_id!==userId&&p.online===1&&p.last_seen_ms>=since&&p.x>=minX&&p.x<=maxX&&
       Math.abs(p.x-centerX)+Math.abs(p.y-centerY)<=22&&users.get(p.user_id)?.status==="active"&&
       !blocks.has(userId+":"+p.user_id)&&!blocks.has(p.user_id+":"+userId)
      ).map(p=>({...p,...users.get(p.user_id)}))};
     }
     throw Error("Unexpected all query: "+sql);
    },
    async run(){
     if(sql.startsWith("INSERT INTO cinderwild_world_players")){
      const [userId,now]=args;const p=players.get(userId);
      if(p){p.online=1;p.last_seen_ms=now;}
      else players.set(userId,{user_id:userId,x:8,y:18,steps:0,facing:"down",version:1,last_move_ms:0,last_seen_ms:now,online:1});
      return {meta:{changes:1}};
     }
     if(sql.startsWith("INSERT OR IGNORE INTO cinderwild_world_quests")){
      const [userId,questId]=args;
      if(!quests.has(userId))quests.set(userId,new Set());
      quests.get(userId).add(questId);return {meta:{changes:1}};
     }
     if(sql.includes("SET x=?,y=?,steps=?")){
      const [x,y,steps,facing,now,,userId,expectedVersion,minMoveMs]=args,p=players.get(userId);
      if(!p||p.version!==expectedVersion||p.last_move_ms>minMoveMs||!p.online)return {meta:{changes:0}};
      Object.assign(p,{x,y,steps,facing,last_move_ms:now,last_seen_ms:now,version:p.version+1});
      return {meta:{changes:1}};
     }
     if(sql.includes("SET online=0")){
      const p=players.get(args[0]);if(p){p.online=0;p.last_seen_ms=0;}return {meta:{changes:p?1:0}};
     }
     if(sql.includes("SET last_seen_ms=")){
      const p=players.get(sql.includes("last_seen_ms=?,updated")?args[1]:args[1]);
      if(p)p.last_seen_ms=args[0];return {meta:{changes:p?1:0}};
     }
     throw Error("Unexpected run query: "+sql);
    }
   };
  }
 };
 const deps={getUser:async req=>req.member||null,json:(payload,status=200)=>({...payload,httpStatus:status}),rateLimit:async()=>true,origin:ORIGIN};
 async function call(action="view",member=users.get(1),body={},origin=ORIGIN){
  const path="/api/cinderwild/world"+(action==="view"?"":"/"+action);
  const method=action==="view"?"GET":"POST";
  const request={method,member,headers:{get:()=>origin},json:async()=>body};
  return handleCinderwildOnlineWorld(request,{DB:db},new URL("https://api.ash-fall.com"+path),deps);
 }
 return {call,players,quests,users,blocks};
}

test("authenticated join starts at a server-owned Cinder Town position and returns quests",async()=>{
 const f=fixture();
 assert.equal((await f.call("join",null)).httpStatus,401);
 const joined=await f.call("join");
 assert.equal(joined.httpStatus,200);
 assert.deepEqual(joined.me,{x:8,y:18,steps:0,facing:"down",version:1,zone:"Cinder Town"});
 assert.equal(joined.quests.length,5);
 assert.equal(f.players.get(1).x,8);
});
test("move accepts directions, ignores forged destination and client badge fields",async()=>{
 const f=fixture();await f.call("join");
 const moved=await f.call("move",f.users.get(1),{direction:"right",x:57,y:18,badges:["bramble","storm"]});
 assert.equal(moved.me.x,9);assert.equal(moved.me.y,18);
 assert.equal(f.players.get(1).x,9);
 assert.equal((await f.call("move",f.users.get(1),{direction:"teleport",x:60})).httpStatus,400);
});
test("cross-site writes are refused and players cannot bypass server progression gates",async()=>{
 const f=fixture();await f.call("join");
 assert.equal((await f.call("move",f.users.get(1),{direction:"right"},"https://evil.example")).httpStatus,403);
 Object.assign(f.players.get(1),{x:31,y:18,last_move_ms:0});
 const forbidden=await f.call("move",f.users.get(1),{direction:"right",badges:["bramble"]});
 assert.equal(forbidden.httpStatus,409);assert.equal(forbidden.error,"BRAMBLE_CREST_REQUIRED");
});
test("blocking and proximity prevent unwanted online-player exposure",async()=>{
 const f=fixture();await f.call("join",f.users.get(1));await f.call("join",f.users.get(2));
 let near=await f.call();
 assert.equal(near.players.length,1);assert.equal(near.players[0].username,"beta");
 f.blocks.add("1:2");near=await f.call();assert.equal(near.players.length,0);
 f.blocks.clear();Object.assign(f.players.get(2),{x:40,y:18});
 near=await f.call();assert.equal(near.players.length,0,"other region should not appear");
});
test("only server-confirmed exploration or NPC proximity completes quests",async()=>{
 const f=fixture();await f.call("join");
 const denied=await f.call("interact",f.users.get(1),{target:"warden_briar"});
 assert.equal(denied.httpStatus,403);
 const welcome=await f.call("interact",f.users.get(1),{target:"nurse_ember"});
 assert.equal(welcome.httpStatus,200);
 assert.ok(welcome.quests.some(q=>q.id==="nurse_ember"&&q.completed));
 for(let n=0;n<5;n++){
  const move=await f.call("move",f.users.get(1),{direction:"right"});
  assert.equal(move.httpStatus,200);
  f.players.get(1).last_move_ms=0;
 }
 assert.ok(f.quests.get(1).has("first_steps"));
});
test("stale player markers vanish and leave explicitly clears presence",async()=>{
 const f=fixture();await f.call("join",f.users.get(1));await f.call("join",f.users.get(2));
 f.players.get(2).last_seen_ms=0;
 assert.equal((await f.call()).players.length,0);
 assert.equal((await f.call("leave")).httpStatus,200);
 assert.equal((await f.call()).needs_join,true);
});
