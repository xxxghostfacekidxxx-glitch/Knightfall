import test from "node:test";
import assert from "node:assert/strict";
import {companionScope,companionFleet,handleChaosCompanion} from "./src/chaos-companion.mjs";
const pub={id:"a".repeat(32),name:"Public Imp",description:"Published",is_public:1,is_nsfw:0,updated_at:"2026-11-19"};
const hidden={id:"b".repeat(32),name:"Private",description:"Hidden",is_public:0,is_nsfw:0,updated_at:"2026-11-19"};
const create=(invite={user_id:42,invited_by:1,status:"accepted"})=>{
 const sqlLog=[];
 return {sqlLog,env:{DB:{prepare(sql){return{bind(...a){this.args=a;sqlLog.push({sql,args:a});return this},
  async first(){return invite},
  async all(){return{results:sql.includes("JOIN users u")?[pub]:[hidden,pub]}}}}}}};
};
const json=(v,status=200)=>Response.json(v,{status});
const run=(path,env,user)=>handleChaosCompanion(new Request("https://api.ash-fall.com"+path),env,new URL("https://api.ash-fall.com"+path),{requireUser:async()=>user,rateLimit:async()=>true,json,origin:"https://ash-fall.com"});
test("private companion only available after acceptance and from correct session",async()=>{
 const {env}=create();
 assert.equal((await companionScope(env,{id:42,role:"member"})).role,"partner");
 assert.equal((await companionScope(env,{id:1,role:"god"})).role,"owner");
 assert.equal((await companionScope(env,{id:55,role:"member"})).accepted,false);
 assert.equal((await companionScope(create({user_id:42,invited_by:1,status:"pending"}).env,{id:42,role:"member"})).accepted,false);
 assert.equal((await run("/api/chaos/companion",env,{id:42,role:"member"})).status,200);
 assert.equal((await run("/api/chaos/companion",env,{id:55,role:"member"})).status,403);
 assert.equal((await run("/api/chaos/companion",env,null)).status,401);
});
test("fleet shares only explicitly public, non adult bot metadata",async()=>{
 const {env,sqlLog}=create();
 const results=await companionFleet(env,{id:42,role:"member"});
 assert.equal(results.own_count,2);assert.equal(results.shared_count,1);
 assert.equal(results.shared_owner_public_bots[0].name,"Public Imp");
 assert.ok(!JSON.stringify(results).includes("system_prompt"));
 assert.ok(!JSON.stringify(results).includes("owner_memory"));
 const joined=sqlLog.find(e=>e.sql.includes("JOIN users u"));
 assert.deepEqual(joined.args,[1]);
 assert.match(joined.sql,/b.is_public=1 AND b.is_nsfw=0/);
 assert.equal((await companionFleet(env,{id:99,role:"member"})).shared_count,0);
});
test("GET responses are private no-store and never allow writes",async()=>{
 const {env}=create();
 const r=await run("/api/chaos/fleet",env,{id:42,role:"member"});
 assert.equal(r.status,200);assert.equal(r.headers.get("cache-control"),"private, no-store");
 assert.equal((await r.json()).shared_count,1);
});
