import test from "node:test";
import assert from "node:assert/strict";
import {navigationContext} from "./chaos-navigation.mjs";
test("navigation questions include curated links",()=>{
  const context=navigationContext("where are offline personal bots?");
  assert.match(context,/https:\/\/ash-fall\.com\/personal-bots-offline\.html/);
  assert.match(context,/not web research/);
});
test("unrelated conversation does not trigger site lookup",()=>{
  assert.equal(navigationContext("tell me a story about a dragon"),"");
});
test("unknown site terms do not invent links",()=>{
  assert.equal(navigationContext("find zzznonexistent"),"");
});
