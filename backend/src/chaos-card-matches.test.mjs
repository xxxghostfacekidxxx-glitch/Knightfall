import test from "node:test";
import assert from "node:assert/strict";
import {BLACK,WHITE} from "./chaos-card-deck.js";
import {CHAOS_CARD_BOTS,newChaosState,startChaosTable,beginChaosRound,playChaosCard,judgeChaosCard,visibleChaosMatch,handleChaosCardMatches,chaosCardTurnAction,shouldNotifyChaosCardTurn} from "./chaos-card-matches.js";

const ids=[17,24,31,44];
const row=(state,status="active")=>({
 id:"00000000-0000-4000-8000-000000000001",
 player_one_id:ids[0],player_two_id:state.members[1],player_three_id:state.members[2],player_four_id:state.members[3],
 first_username:"alice",first_display_name:"Alice",second_username:"bob",second_display_name:"Bob",
 third_username:"charlie",third_display_name:"Charlie",fourth_username:"delta",fourth_display_name:"Delta",
 status,version:2,state_json:JSON.stringify(state),created_at:"2026-11-05T00:00:00Z",updated_at:"2026-11-05T00:00:00Z"
});
function table(humans){const state=newChaosState(ids[0],ids.slice(1,humans));state.invite_status=state.invite_status.map(v=>v==="pending"?"accepted":v);assert.equal(startChaosTable(state),true);return state;}
test("original Knightfall deck stays independent and substantial",()=>{
 assert.equal(BLACK.length,500);assert.equal(WHITE.length,1500);
 assert.equal(new Set(BLACK.map(x=>x.normalize("NFKC").trim().toLowerCase())).size,BLACK.length,"black prompts are unique");
 assert.equal(new Set(WHITE.map(x=>x.normalize("NFKC").trim().toLowerCase())).size,WHITE.length,"white answers are unique");
 assert.ok(BLACK.every(card=>typeof card==="string"&&card.length>=15&&card.length<=180));
 assert.ok(WHITE.every(card=>typeof card==="string"&&card.length>=5&&card.length<=180));
 assert.equal(CHAOS_CARD_BOTS.length,3);
 assert.deepEqual(CHAOS_CARD_BOTS.map(bot=>bot.name),["Lydibug","Butters","Eddie"]);
});
test("deck snapshots are compact numeric IDs and original cards remain compatible",()=>{
 const state=newChaosState(17);
 assert.equal(state.decks.black.length,500);
 assert.equal(state.decks.white.length,1500);
 assert.ok(state.decks.black.every(Number.isInteger));
 assert.ok(state.decks.white.every(Number.isInteger));
 assert.ok(JSON.stringify(state).length<18000,"saved match must not duplicate 2,000 strings in D1");
 assert.equal(startChaosTable(state),true);
 assert.ok(BLACK.includes(state.prompt));
 assert.ok(state.decks.white.every(Number.isInteger));
 assert.ok(Object.values(state.submitted).every(card=>WHITE.includes(card)));
 // A state from the original 200-card release may still have strings on its decks.
 const legacy=newChaosState(17);
 legacy.decks.black=[BLACK[0]];
 legacy.decks.white=[WHITE[0],WHITE[1],...legacy.decks.white];
 assert.equal(startChaosTable(legacy),true);
 assert.equal(legacy.prompt,BLACK[0]);
 assert.ok(Object.values(legacy.submitted).every(card=>WHITE.includes(card)));
});
test("always four seats for every valid combination of human and AI players",()=>{
 const names=[
 ["Alice","Lydibug","Butters","Eddie"],
 ["Alice","Bob","Lydibug","Butters"],
 ["Alice","Bob","Charlie","Lydibug"],
 ["Alice","Bob","Charlie","Delta"]
 ];
 for(let humans=1;humans<=4;humans++){
  const state=table(humans),match=visibleChaosMatch(row(state),ids[0]);
  assert.equal(match.seats.length,4);
  assert.deepEqual(match.seats.map(seat=>seat.name),names[humans-1]);
  assert.equal(match.seats.filter(seat=>seat.kind==="human").length,humans);
  assert.equal(match.seats.filter(seat=>seat.kind==="ai").length,4-humans);
  assert.equal(match.submitted_count,3-(humans-1),"AI players submit automatically when first human judges");
  assert.equal(match.can_judge,humans===1,"single human initially judges the three bots");
 }
});
test("invited humans remain AI placeholders until accepted; host may start early",()=>{
 const state=newChaosState(17,[24,31,44]);
 assert.equal(state.phase,"lobby");assert.equal(state.invite_status.filter(s=>s==="pending").length,3);
 const lobby=visibleChaosMatch(row(state,"lobby"),24);
 assert.equal(lobby.can_accept,true);
 assert.deepEqual(lobby.seats.map(s=>s.kind),["human","ai","ai","ai"]);
 state.invite_status[1]="accepted";
 assert.ok(startChaosTable(state));
 assert.deepEqual(state.invite_status,["accepted","accepted","expired","expired"]);
 const started=visibleChaosMatch(row(state),24);
 assert.deepEqual(started.seats.map(s=>s.name),["Alice","Bob","Lydibug","Butters"]);
 assert.throws(()=>visibleChaosMatch(row(state),31),/not a table participant/);
});
test("private hands and three anonymous submissions remain protected",()=>{
 const state=newChaosState(17,[24]);state.invite_status[1]="accepted";
 state.hands[0]=[];state.hands[1]=[];startChaosTable(state);
 state.hands[0]=["SECRET_ALICE",...state.hands[0].slice(1)];
 state.hands[1]=["PLAYED_BOB","SECRET_BOB",...state.hands[1].slice(2)];
 const bob=visibleChaosMatch(row(state),24);
 assert.equal(bob.hand[1],"SECRET_BOB");
 assert.ok(!JSON.stringify(bob).includes("SECRET_ALICE"));
 assert.equal(playChaosCard(state,1,0),true);assert.equal(state.phase,"judge");
 const alice=visibleChaosMatch(row(state),17);
 assert.equal(alice.choices.length,3);
 assert.ok(alice.choices.every(c=>Object.keys(c).sort().join(",")==="card,index"));
 assert.ok(!JSON.stringify(alice).includes("SECRET_BOB"));
 assert.equal(visibleChaosMatch(row(state),24).choices.length,0);
 assert.ok(judgeChaosCard(state,0,0));
 assert.equal(state.phase,"results");
});
test("each of the four human counts completes a valid match, rotating AI judges",()=>{
 for(let humans=1;humans<=4;humans++){
  const state=table(humans);
  for(let attempts=0;attempts<110&&state.phase!=="finished";attempts++){
   if(state.phase==="results")assert.equal(beginChaosRound(state),true);
   if(state.phase==="submit"){
    for(let seat=0;seat<humans;seat++)if(seat!==state.judge&&state.submitted[seat]===undefined)
     assert.ok(playChaosCard(state,seat,0));
   }
   if(state.phase==="judge"){
    assert.ok(state.judge<humans,"AI must judge automatically");
    assert.ok(judgeChaosCard(state,state.judge,0));
   }
  }
  assert.equal(state.phase,"finished",humans+" human participants should finish");
  assert.equal(state.scores.length,4);
  assert.ok(Math.max(...state.scores)>=5);
 }
});
test("illegal, repeated and out-of-turn moves are rejected",()=>{
 const state=table(2),before=state.hands[1].slice();
 assert.equal(playChaosCard(state,0,0),false);
 assert.equal(playChaosCard(state,1,999),false);
 assert.deepEqual(state.hands[1],before);
 assert.ok(playChaosCard(state,1,0));
 assert.equal(playChaosCard(state,1,0),false);
 assert.equal(judgeChaosCard(state,1,0),false);
 assert.throws(()=>visibleChaosMatch(row(state),999),/not a table participant/);
 assert.throws(()=>newChaosState(17,[24,31,44,55]),/One to four/);
});
test("card turn notifications only fire on new actions, not every opponent move",()=>{
 const state=newChaosState(17,[24,31]);
 state.invite_status[1]="accepted";
 state.invite_status[2]="accepted";
 assert.equal(startChaosTable(state),true);
 const before=structuredClone(state);
 assert.equal(chaosCardTurnAction(state,1),"Choose your answer");
 assert.equal(chaosCardTurnAction(state,2),"Choose your answer");
 assert.equal(shouldNotifyChaosCardTurn(null,state,1),true);
 assert.equal(playChaosCard(state,1,0),true);
 assert.equal(shouldNotifyChaosCardTurn(before,state,1),false,"already-played member must not be notified");
 assert.equal(shouldNotifyChaosCardTurn(before,state,2),false,"still-waiting member must not get duplicate alert");
 assert.equal(playChaosCard(state,2,0),true);
 assert.equal(state.phase,"judge");
 assert.equal(shouldNotifyChaosCardTurn(before,state,0),true,"judge just became actionable");
 assert.equal(shouldNotifyChaosCardTurn(before,state,1),false);
 const judging=structuredClone(state);
 assert.equal(judgeChaosCard(state,0,0),true);
 assert.equal(state.phase,"results");
 assert.equal(shouldNotifyChaosCardTurn(judging,state,1),true,"round-result alert is new");
 assert.equal(shouldNotifyChaosCardTurn(state,state,1),false,"same results must not alert again");
 const results=structuredClone(state);
 assert.equal(beginChaosRound(state),true);
 assert.equal(shouldNotifyChaosCardTurn(results,state,1),false,"next round judge cannot submit");
 assert.equal(shouldNotifyChaosCardTurn(results,state,2),true,"new round allows a fresh notification");
});

test("account required before exposing private game data",async()=>{
 const result=await handleChaosCardMatches({method:"GET"},null,new URL("https://api.ash-fall.com/api/arcade/chaos-cards"),{
 getUser:async()=>null,json:(data,status)=>({data,status}),rateLimit:async()=>true,origin:"https://ash-fall.com",createNotification:async()=>{}
 });
 assert.equal(result.status,401);
 assert.ok(!JSON.stringify(result).includes("hands"));
});
