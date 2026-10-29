import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const root=new URL("../public/",import.meta.url);
const manifest=JSON.parse(await readFile(new URL("arcade/hosted/account-bridge-manifest.json",root),"utf8"));

test("every arcade account bridge has a unique ID and an existing page",async()=>{
 const seen=new Set();
 for(const game of manifest.games){
  assert.ok(!seen.has(game.gameId),"Duplicate arcade game ID: "+game.gameId);
  seen.add(game.gameId);
  assert.match(game.path,/^\/arcade\/hosted\/[a-z0-9-]+\/index\.html$/);

 }
});

test("original Slush Rush and modern Ashslide Rush use independent save identities and score selectors",async()=>{
 const modern=manifest.games.find(g=>g.gameId==="cabinet-slush-rush");
 const original=manifest.games.find(g=>g.gameId==="cabinet-slush-rush-original");
 assert.equal(modern?.scoreSelector,"#score");
 assert.equal(original?.scoreSelector,"#distance");
 assert.equal(modern?.path,"/arcade/hosted/slush-rush/index.html");
 assert.equal(original?.path,"/arcade/hosted/slush-rush-original/index.html");
});
