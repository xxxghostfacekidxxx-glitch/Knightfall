import test from "node:test";
import assert from "node:assert/strict";
import {arcadePicks,moonBrief,shadowBrief,radarContext} from "./chaos-radar.js";
import {shadowPrompts} from "../../public/shadow-prompts.mjs";

test("arcade picks honor the requested controls, genre and session length",()=>{
 const {results}=arcadePicks({query:"puzzles",device:"touch",length:"mini"});
 assert.ok(results.length>0&&results.length<=4);
 for(const item of results){
  assert.equal(item.genre,"Puzzle");
  assert.equal(item.controls,"Touch supported");
  assert.equal(item.shelf,"Mini game");
  assert.match(item.url,/^\/(?!\/).*\.html$/);
 }
 assert.equal(arcadePicks({query:"cinder lander"}).results[0].title,"Cinder Lander");
 assert.deepEqual(arcadePicks({query:"zzzxxyyzz"}).results,[]);
 assert.deepEqual(arcadePicks({query:"casino"}).results,[]);
});

test("Moon data uses the ephemeris and reports a future primary phase",()=>{
 const sample=new Date("2026-11-09T07:02:00Z"), data=moonBrief(sample);
 assert.equal(data.phase,"New Moon");
 assert.ok(data.illumination<2);
 assert.ok(Date.parse(data.next_at)>+sample);
 assert.equal(data.as_of,sample.toISOString());
});

test("reflection prompts are shared public content and ordinary chat stays untouched",()=>{
 const source=shadowPrompts.find(item=>item.id==="boundaries");
 assert.equal(shadowBrief("boundaries").question,source.question);
 assert.match(radarContext("Give me a Shadow Work prompt about needs and boundaries"),/needs and boundaries/i);
 assert.equal(radarContext("Tell me a ghost story"),"");
 assert.match(radarContext("What's the current Moon phase?"),/next_phase/);
 assert.match(radarContext("Can you find me a quick puzzle game for my phone?"),/Touch supported/);
});
