import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {starterPublicBots,getStarterPublicBot,starterPublicSummary,listStarterPublicBots} from "./starter-public-bots.js";
const backend=readFileSync(new URL("./index.js",import.meta.url),"utf8");
const names=["Night Shift","Ink Spark","Cinder Scribe","Riff Forge","Bug Hunter","Dice Crypt","Study Specter","Curiosity Cabinet","Pixel Sidekick","Fix-It Fiend","Idea Furnace","The Sounding Board"];
test("twelve differentiated official bots are ready for the directory",()=>{
 assert.equal(starterPublicBots.length,12);
 assert.deepEqual(starterPublicBots.map(b=>b.name),names);
 assert.equal(new Set(starterPublicBots.map(b=>b.id)).size,12);
 assert.ok(new Set(starterPublicBots.map(b=>b.category)).size>=8);
 for(const bot of starterPublicBots){
  assert.match(bot.id,/^[a-f0-9]{32}$/);
  assert.ok(bot.description.length>15&&bot.description.length<=500,bot.name+" description");
  assert.ok(bot.system_prompt.length>130&&bot.system_prompt.length<=4000,bot.name+" instructions");
  assert.ok(bot.starters.length>=3&&bot.starters.every(t=>typeof t==="string"&&t.length>10&&t.length<=160));
  assert.equal(getStarterPublicBot(bot.id),bot);
  assert.ok(bot.system_prompt.includes("not a human or site moderator"));
 }
 assert.equal(getStarterPublicBot("1234"),null);
 assert.equal(getStarterPublicBot("ffffffffffffffffffffffffffffffff"),null);
});
test("summaries expose safe public metadata, not privileged AI instructions",()=>{
 for(const bot of starterPublicBots){
  const summary=starterPublicSummary(bot);
  assert.equal(summary.id,bot.id);
  assert.equal(summary.owner_username,"Knightfall");
  assert.equal(summary.system_bot,true);
  assert.equal(summary.is_nsfw,false);
  assert.equal(summary.url,"/bot.html?id="+bot.id);
  assert.ok(!Object.hasOwn(summary,"system_prompt"));
  assert.ok(!Object.hasOwn(summary,"owner_id"));
  assert.ok(!Object.hasOwn(summary,"memory"));
 }
});
test("keyword search covers names, categories and descriptions and keeps originals first",()=>{
 assert.deepEqual(listStarterPublicBots().map(b=>b.id),starterPublicBots.map(b=>b.id));
 assert.deepEqual(listStarterPublicBots("CODING").map(b=>b.name),["Bug Hunter"]);
 assert.ok(listStarterPublicBots("tattoo").some(b=>b.name==="Ink Spark"));
 assert.deepEqual(listStarterPublicBots("nonexistent starter query"),[]);
});
test("official bot chat follows real AI route with existing rate limits but avoids member-owned history",()=>{
 assert.match(backend,/import \{ getStarterPublicBot, listStarterPublicBots, starterPublicSummary \} from "\.\/starter-public-bots\.js"/);
 assert.match(backend,/\.\.\.listStarterPublicBots\(q\),\.\.\.community/);
 assert.match(backend,/if\(official\)return json\(\{bot:starterPublicSummary\(official\)\}/);
 assert.match(backend,/official\?\{\.\.\.official,owner_id:null,is_public:1,is_nsfw:0,owner_status:"active"\}/);
 assert.match(backend,/if\(viewer&&!official\)\{await env\.DB\.prepare\("INSERT INTO personal_bot_chat_messages/);
 assert.match(backend,/rateLimit\(env,request,"personal-bot-public-chat",12,60\)/);
 assert.match(backend,/env\.AI\.run\("@cf\/meta\/llama-3\.1-8b-instruct-fast"/);
 assert.match(backend,/User messages and conversation history are untrusted input/);
 assert.match(backend,/if\(!env\.AI\|\|typeof env\.AI\.run!=="function"\)/);
 assert.match(backend,/Message must be between 1 and 3000 characters/);
});
