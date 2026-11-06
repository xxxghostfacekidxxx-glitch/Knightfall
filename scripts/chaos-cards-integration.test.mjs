import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
const read=path=>readFileSync(path,"utf8");
const backend=read("backend/src/chaos-card-matches.js");
const server=read("backend/src/index.js");
const game=read("public/arcade/hosted/cards-against-chaos/index.html");
const client=read("public/arcade/hosted/cards-against-chaos/online.js");
const messaging=read("public/messages.html");
const lobby=read("public/arcade/async-play.html");
const schema=read("backend/migrations/0120_four_seat_chaos_cards.sql");
const manifest=JSON.parse(read("public/assets/devil-tools/neon-nuisances/manifest.json"));
test("four-seat table reachable from arcade and direct messages",()=>{
 assert.match(messaging,/id="chaos-card-chat-invite"/);
 assert.match(messaging,/cardLink\.href="\/arcade\/hosted\/cards-against-chaos\/index\.html\?invite="/);
 assert.match(lobby,/href="\/arcade\/hosted\/cards-against-chaos\/index\.html"/);
 assert.match(game,/id="cards-online-table"/);
 assert.match(game,/src="\.\/online\.js/);
 assert.match(client,/params\.get\("invite"\)/);
 assert.match(client,/cards-online-human-count/);
 assert.match(game,/<option value="1">1 human \+ 3 AI<\/option>/);
 assert.match(game,/<option value="4">4 humans \+ 0 AI<\/option>/);
 assert.match(game,/id="player-count"><option>1<\/option><option>2<\/option><option>3<\/option><option>4<\/option>/);
 assert.doesNotMatch(game,/sharing one screen.*3–8|<option>8<\/option>/);
});
test("server checks friendships, block restrictions, viewer and version for all human counts",()=>{
 assert.match(server,/import \{ handleChaosCardMatches \}/);
 assert.match(server,/await handleChaosCardMatches\(request,env,url/);
 assert.match(backend,/if\(!user\)return json/);
 assert.match(backend,/SELECT 1 FROM friend_requests WHERE status='accepted'/);
 assert.match(backend,/SELECT 1 FROM user_blocks/);
 assert.match(backend,/memberSeat\(state,user\.id\)/);
 assert.match(backend,/version=version\+1/);
 assert.match(backend,/WHERE id=\? AND version=\? AND status=\?/);
 assert.match(backend,/hand:canPlay\?\[\.\.\.state\.hands\[viewer\]\]:\[\]/);
 assert.match(backend,/choices:canJudge\?state\.choices\.map/);
 assert.match(backend,/opponent_ids/);
 assert.match(backend,/startChaosTable/);
});
test("new four-seat D1 schema supports optional humans without dropping historical matches",()=>{
 assert.match(schema,/CREATE TABLE IF NOT EXISTS arcade_chaos_four_matches/);
 assert.match(schema,/player_two_id INTEGER REFERENCES users/);
 assert.match(schema,/player_three_id INTEGER REFERENCES users/);
 assert.match(schema,/player_four_id INTEGER REFERENCES users/);
 assert.doesNotMatch(schema,/DROP TABLE|DELETE FROM arcade_chaos_card_matches/);
 assert.match(schema,/CHECK\(version>=0\)/);
});
test("original four-player local mode and three AI personalities remain independent",()=>{
 assert.match(game,/const AI_LABELS=\[/);
 assert.match(game,/4-players\.length/);
 assert.match(game,/players\.length!==4/);
 assert.match(game,/if\(player\.ai\)/);
 assert.match(game,/if\(players\[czar\]\.ai\)/);
 assert.match(backend,/SEAT_COUNT=4/);
});
test("Butters, Trouble and Skunk Riot retain unique animated Sanctuary assets",()=>{
 assert.ok(manifest.characters.length>=31,"expanded pet roster must keep existing species");
 const names=new Set(manifest.characters.map(char=>char.id));
 for(const id of ["butters","trouble","skunk-riot"]){
  assert.ok(names.has(id));
  const char=manifest.characters.find(char=>char.id===id);
  for(const image of [char.svg,char.portrait,...Object.values(char.variants)])
   assert.ok(existsSync("public"+image),image);
 }
});
