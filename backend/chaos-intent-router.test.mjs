import test from "node:test";
import assert from "node:assert/strict";
import {explicitChaosMemberCall as member,explicitChaosSourceCalls as source,explicitChaosQuickCall as quick,explicitChaosSiteCall as site} from "./chaos-intent-router.mjs";
test("own-data requests map only to read-only account tools",()=>{
 for(const [query,name] of [
  ["Show my unread notifications","user.notifications"],
  ["Find my notes about arcade","user.notes"],
  ["Read my private journal entries about arcade","user.journal"],
  ["Show my Die-ary","user.journal"],
  ["Recall my memories about music","user.memories"],
  ["Check our shared handoff board","user.handoff"],
  ["Review my profile","user.profile"],
  ["Show my recent Chaosphere conversations","user.inbox"],
  ["Show my inbox","user.inbox"]
 ])assert.equal(member(query)?.name,name,query);
 assert.deepEqual(member("Find my notes about arcade").arguments,{query:"arcade"});
 assert.deepEqual(member("Read my private journal entries about arcade").arguments,{query:"arcade"});
});
test("prevent private tool use for non-command text or requests about another member",()=>{
 for(const text of [
  "Do not show my notes", "I wrote my notes yesterday",
  "Show Samantha's private messages","Show her profile","Show Samantha's journal","hello","show the public arcade"
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

test("quick arithmetic, word counts, moon and timezone use trusted fixed tools",()=>{
 assert.deepEqual(quick("Calculate 2+3*4"),{name:"utility.calculate",arguments:{expression:"2+3*4"}});
 assert.deepEqual(quick("Count words: bad little gremlins"),{name:"utility.word_count",arguments:{text:"bad little gremlins"}});
 assert.deepEqual(quick("What is the moon phase today?"),{name:"radar.moon",arguments:{}});
 assert.deepEqual(quick("What time in America/Chicago?"),{name:"utility.now",arguments:{timezone:"America/Chicago"}});
 for(const request of ["Calculate require('fs')","Word count", "Time in evil.example", "Solve everything"])
  assert.equal(quick(request),null,request);
});
test("site navigation is grounded and does not swallow unrelated research",()=>{
 assert.equal(site("Where is the arcade?").name,"site.search");
 assert.equal(site("Where can I find Chaos Forge?").arguments.query,"Where can I find Chaos Forge?");
 assert.equal(site("How do I find the Creator Foundry?").name,"site.search");
 for(const request of ["Where are ghosts made?","Tell me how to create a sword", "What is love"])
  assert.equal(site(request),null,request);
});
