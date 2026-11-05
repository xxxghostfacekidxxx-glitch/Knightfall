import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
const index=read("backend/src/index.js");
const backend=read("backend/src/chaos-card-matches.js");
const game=read("public/arcade/hosted/cards-against-chaos/index.html");
const client=read("public/arcade/hosted/cards-against-chaos/online.js");
const messages=read("public/messages.html");
const lobby=read("public/arcade/async-play.html");
const manifest=JSON.parse(read("public/assets/devil-tools/neon-nuisances/manifest.json"));
const petSQL=read("backend/migrations/0119_butters_trouble_pets.sql");
const cardSQL=read("backend/migrations/0118_chaos_card_matches.sql");
test("the direct-message invitation and async lobby open the original card table",()=>{
 assert.match(messages,/id="chaos-card-chat-invite"/);
 assert.match(messages,/cardLink\.href="\/arcade\/hosted\/cards-against-chaos\/index\.html\?invite="/);
 assert.match(lobby,/href="\/arcade\/hosted\/cards-against-chaos\/index\.html"/);
 assert.match(game,/id="cards-online-table"/);
 assert.match(game,/src="\.\/online\.js/);
 assert.match(client,/params\.get\("invite"\)/);
 assert.match(client,/\?match=/);
});
test("only two authenticated friends may play, even with scripted bot seats",()=>{
 assert.match(index,/import \{ handleChaosCardMatches \}/);
 assert.match(index,/await handleChaosCardMatches\(request,env,url/);
 assert.match(backend,/if\(!user\)return json/);
 assert.match(backend,/friend_requests WHERE status='accepted'/);
 assert.match(backend,/user_blocks/);
 assert.match(backend,/viewer<0/);
 assert.match(backend,/version=version\+1/);
 assert.match(backend,/WHERE id=\? AND version=\? AND status=\?/);
 assert.match(backend,/hand:canPlay\?s\.hands\[viewer\]:\[\]/);
 assert.match(backend,/choices:canJudge\?s\.choices\.map/);
});
test("separate D1 match migration preserves existing async Connect Four tables",()=>{
 assert.match(cardSQL,/CREATE TABLE IF NOT EXISTS arcade_chaos_card_matches/);
 assert.match(cardSQL,/CREATE UNIQUE INDEX IF NOT EXISTS idx_chaos_card_one_open_pair/);
 assert.doesNotMatch(cardSQL,/DROP TABLE/);
 assert.match(cardSQL,/REFERENCES users\(id\) ON DELETE CASCADE/);
});
test("Butters and Trouble are original fully animated, adoptable species",()=>{
 const ids=new Set(manifest.characters.map(p=>p.id));
 assert.equal(ids.size,30);
 for(const id of ["butters","trouble"]){
  const pet=manifest.characters.find(p=>p.id===id);
  assert.ok(pet);
  for(const asset of [pet.svg,pet.portrait,...Object.values(pet.variants)]){
   assert.match(asset,/^\/assets\/devil-tools\/neon-nuisances\//);
   assert.ok(existsSync("public"+asset),"Missing "+asset);
  }
  assert.match(petSQL,new RegExp("\\('"+id+"',"));
 }
 assert.match(petSQL,/COUNT\(\*\) FROM mascot_pets WHERE user_id=NEW\.user_id\)>=30/);
 assert.match(petSQL,/Choose a free starter/);
 assert.match(petSQL,/Not enough Cinders/);
});
