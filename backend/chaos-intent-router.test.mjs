import test from "node:test";
import assert from "node:assert/strict";
import {explicitChaosMemberCall as member,explicitChaosSourceCalls as source} from "./chaos-intent-router.mjs";
test("own-data requests map only to read-only account tools",()=>{
 for(const [query,name] of [
  ["Show my unread notifications","user.notifications"],
  ["Find my notes about arcade","user.notes"],
  ["Recall my memories about music","user.memories"],
  ["Check our shared handoff board","user.handoff"],
  ["Review my profile","user.profile"],
  ["Show my recent Chaosphere conversations","user.inbox"],
  ["Show my inbox","user.inbox"]
 ])assert.equal(member(query)?.name,name,query);
 assert.deepEqual(member("Find my notes about arcade").arguments,{query:"arcade"});
});
test("prevent private tool use for non-command text or requests about another member",()=>{
 for(const text of [
  "Do not show my notes", "I wrote my notes yesterday",
  "Show Samantha's private messages","Show her profile","hello","show the public arcade"
 ])assert.equal(member(text),null,text);
});
test("source-specific research requests use fixed library names and bounded queries",()=>{
 const cases=[
  ["Search Wikidata for woven textiles","resource.wikidata","woven textiles"],
  ["Find historical costumes at The Met","resource.met","historical costumes"],
  ["Search Wikipedia for Gothic architecture","research.wikipedia","Gothic architecture"],
  ["Find CC0 leather textures on Poly Haven","resource.polyhaven","leather"],
  ["Find demon models on Poly Haven","resource.polyhaven","demon"],
 ];
 for(const [message,name,expected] of cases){
   const calls=source(message);
   assert.equal(calls.length,1,message);
   assert.equal(calls[0].name,name,message);
   assert.ok(calls[0].arguments.query.toLowerCase().includes(expected.toLowerCase()),message);
 }
 assert.equal(source("Find CC0 leather textures on Poly Haven")[0].arguments.type,"textures");
});
test("two reference sources allowed, no unbounded multi-library search",()=>{
 const pair=source("Research Wikipedia and Wikidata for dragonflies");
 assert.deepEqual(pair.map(x=>x.name),["resource.wikidata","research.wikipedia"]);
 assert.deepEqual(pair.map(x=>x.arguments.query),["dragonflies","dragonflies"]);
 assert.deepEqual(source("Find articles at the Met and Poly Haven for cosplay"),[]);
 assert.deepEqual(source("I'm reading Wikipedia"),[]);
});
