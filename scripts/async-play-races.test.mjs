import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const html=readFileSync(new URL("../public/arcade/async-play.html",import.meta.url),"utf8");
const script=readFileSync(new URL("../public/arcade/async-play.js",import.meta.url),"utf8");

test("out-of-order async match refreshes cannot replace the newer board",()=>{
  assert.match(html,/async-play\.js\?v=20261124-turn-race1/);
  assert.match(script,/matchListRequest=0,matchDetailRequest=0/);
  assert.match(script,/const request=\+\+matchDetailRequest;selectedId=id/);
  assert.match(script,/request!==matchDetailRequest\|\|selectedId!==id/);
  assert.match(script,/const request=\+\+matchListRequest/);
  assert.match(script,/if\(request!==matchListRequest\)return/);
  assert.match(script,/if\(request===matchListRequest\)showError/);
  assert.match(script,/matchDetailRequest\+\+;selectedId=''/);
});

test("async game help accurately describes four seats and AI fillers",()=>{
  assert.match(html,/four-seat table with up to three friends/i);
  assert.match(html,/fill any open seats/i);
  assert.doesNotMatch(html,/FIVE-SEAT CARD TABLE|take the other three seats/i);
});
