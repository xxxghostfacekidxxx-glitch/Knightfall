import test from "node:test";
import assert from "node:assert/strict";
import {BLACK,WHITE} from "./chaos-card-deck.js";
import {newChaosState,beginChaosRound,playChaosCard,judgeChaosCard,visibleChaosMatch,handleChaosCardMatches} from "./chaos-card-matches.js";

const row=(s,status="active")=>({
 id:"00000000-0000-4000-8000-000000000001",player_one_id:17,player_two_id:24,
 first_username:"first",first_display_name:"First Human",second_username:"second",second_display_name:"Second Human",
 version:2,status,state_json:JSON.stringify(s),created_at:"2026-11-05T00:00:00Z",updated_at:"2026-11-05T00:00:00Z"
});
const seeded=()=>{const s=newChaosState();s.hands=[WHITE.slice(0,7),WHITE.slice(7,14)];return s;};
test("original card deck remains substantial, independent Knightfall writing",()=>{
 assert.ok(BLACK.length>=45);assert.ok(WHITE.length>=140);
 assert.ok(BLACK.every(x=>typeof x==="string"&&x.length>10));
 assert.ok(WHITE.every(x=>typeof x==="string"&&x.length>8));
});
test("two humans and Lydibug, Butters, Eddie form five seats",()=>{
 const s=beginChaosRound(seeded());const match=visibleChaosMatch(row(s),24);
 assert.deepEqual(match.seats.map(p=>p.name),["First Human","Second Human","Lydibug","Butters","Eddie"]);
 assert.deepEqual(match.seats.map(p=>p.kind),["human","human","ai","ai","ai"]);
 assert.equal(match.judge,0);assert.equal(match.submitted_count,3);
 assert.equal(match.hand.length,7);assert.equal(match.can_play,true);
 assert.equal(visibleChaosMatch(row(s),17).can_play,false,"judge must not submit an answer");
});
test("private hands and anonymous answer attribution remain server-only",()=>{
 const s=seeded();s.hands[0]=["SECRET_FIRST",...s.hands[0].slice(1)];s.hands[1]=["PLAYED_FROM_SECOND","SECRET_SECOND",...s.hands[1].slice(2)];
 beginChaosRound(s);
 const second=visibleChaosMatch(row(s),24);
 assert.equal(second.hand[1],"SECRET_SECOND");
 assert.ok(!JSON.stringify(second).includes("SECRET_FIRST"),"second user must never receive first hand");
 assert.ok(playChaosCard(s,1,0));assert.equal(s.phase,"judge");
 const first=visibleChaosMatch(row(s),17);
 assert.equal(first.choices.length,4);
 assert.ok(first.choices.every(choice=>Object.keys(choice).sort().join(",")==="card,index"),"judging must not reveal author seat");
 assert.ok(!JSON.stringify(first).includes("SECRET_SECOND"),"judge may see played answer but must not see the opponent's untouched hand");
 assert.equal(visibleChaosMatch(row(s),24).choices.length,0,"non-judge must not see judging choices");
 assert.ok(judgeChaosCard(s,0,0));
 assert.equal(s.phase,"results");
 assert.ok(s.result&&s.scores.reduce((a,b)=>a+b,0)===1);
});
test("AI judges rotate after two human rounds and award the third automatically",()=>{
 const s=beginChaosRound(seeded());
 assert.ok(playChaosCard(s,1,0));assert.ok(judgeChaosCard(s,0,0));
 beginChaosRound(s);
 assert.equal(s.judge,1);assert.ok(playChaosCard(s,0,0));assert.equal(s.phase,"judge");
 assert.ok(judgeChaosCard(s,1,0));
 beginChaosRound(s);
 assert.equal(s.judge,2);assert.equal(s.phase,"submit");
 assert.ok(playChaosCard(s,0,0));assert.ok(playChaosCard(s,1,0));
 assert.equal(s.phase,"results","Lydibug should judge and finish after both human cards arrive");
 assert.equal(s.result.judge,2);
});
test("out-of-turn, invalid and duplicate submissions cannot consume cards",()=>{
 const s=beginChaosRound(seeded());
 const hand=s.hands[1].slice();
 assert.equal(playChaosCard(s,0,0),false);
 assert.equal(playChaosCard(s,1,999),false);
 assert.deepEqual(s.hands[1],hand);
 assert.equal(playChaosCard(s,1,0),true);
 assert.equal(playChaosCard(s,1,1),false);
 assert.equal(judgeChaosCard(s,1,0),false);
 assert.throws(()=>visibleChaosMatch(row(s),777),/not a table participant/);
});
test("anonymous unauthenticated players cannot access card API or any private hands",async()=>{
 const response=await handleChaosCardMatches({method:"GET"},null,new URL("https://api.ash-fall.com/api/arcade/chaos-cards"),{
 getUser:async()=>null,json:(data,status)=>({data,status}),rateLimit:async()=>true,origin:"https://ash-fall.com",createNotification:async()=>{}
 });
 assert.equal(response.status,401);
 assert.ok(!JSON.stringify(response).includes("hands"));
});
