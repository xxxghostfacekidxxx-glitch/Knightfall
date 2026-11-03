import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderPage } from "./build-arcade-catalog.mjs";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const html = read("public/chaos-cartridge.html");
const js = read("public/arcade-leaderboards.js");
const css = read("public/arcade-leaderboards.css");
const server = read("backend/src/index.js");

test("live main arcade and regenerated catalog both preserve the hall of fame", () => {
  const expected = /<section id="arcade-leaderboards"[\s\S]*?<\/section>/;
  assert.match(html, expected);
  assert.match(renderPage(false), expected);
  assert.equal(html.match(expected)[0], renderPage(false).match(expected)[0]);
  assert.doesNotMatch(renderPage(true), /id="arcade-leaderboards"/);
  assert.match(html, /\/arcade-leaderboards\.css\?v=20261103-hall1/);
  assert.match(html, /\/arcade-leaderboards\.js\?v=20261103-hall1/);
});
test("leaderboard API ranks within each game, filters inactive players and respects auth", () => {
  assert.match(server, /\/api\/arcade\/leaderboards/);
  assert.match(server, /ROW_NUMBER\(\) OVER \([\s\S]*?PARTITION BY s\.game_key/);
  assert.match(server, /ORDER BY s\.best_score DESC,s\.achieved_at ASC,s\.user_id ASC/);
  assert.match(server, /u\.status='active'/);
  assert.match(server, /CASE WHEN user_id=\? THEN 1 ELSE 0 END AS is_mine/);
  assert.match(server, /viewer_signed_in:Boolean\(viewer\)/);
  assert.match(server, /"cache-control":"no-store"/);
});
test("frontend compares real scores, handles guests, and never fabricates records", () => {
  for (const id of [
    "arcade-lb-game", "arcade-lb-podium", "arcade-lb-duel",
    "arcade-lb-status", "arcade-lb-champions"
  ]) assert.ok(html.includes('id="' + id + '"'));
  assert.match(js, /fetch\("https:\/\/api\.ash-fall\.com\/api\/arcade\/leaderboards"/);
  assert.match(js, /escapeHtml\(name\(row\)\)/);
  assert.match(js, /signedIn = payload\.viewer_signed_in === true/);
  assert.match(js, /No community scores yet/);
  assert.match(js, /role="progressbar"/);
  assert.match(css, /prefers-reduced-motion/);
});
