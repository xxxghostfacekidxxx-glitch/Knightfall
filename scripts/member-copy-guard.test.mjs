import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("homepage retains both exact Knightfall mottos", () => {
  const html = read("public/index.html");
  assert.match(html, /The world is a beautiful fucking disaster\./);
  assert.match(html, /Through chaos I make my way\./);
  assert.match(html, /id="home-title"/);
});

test("arcade catalogs remain valid and preserve their game counts", () => {
  const main = JSON.parse(read("public/arcade/catalog.json"));
  const originals = JSON.parse(read("public/arcade/original-creations.json"));
  assert.ok(Array.isArray(main.games) && main.games.length >= 155);
  assert.ok(Array.isArray(originals.games) && originals.games.length >= 95);
  for (const catalog of [main, originals]) {
    for (const game of catalog.games) {
      assert.equal(typeof game.id, "string");
      assert.ok(game.id.length > 0);
      assert.equal(typeof game.title, "string");
      assert.ok(game.title.length > 0);
    }
  }
});

test("install page does not claim an unverified APK is available", () => {
  const html = read("public/install.html");
  assert.match(html, /Signed APK release not available yet\./);
});

test("public AI and maker pages retain critical disclosures", () => {
  assert.match(read("public/miss-chaos-guide.html"), /Nothing is posted automatically\./);
  assert.match(read("public/chaos-forge.html"), /No input images, models or patterns are uploaded to Knightfall storage\./);
  assert.match(read("public/support.html"), /Donating is optional\./);
});
