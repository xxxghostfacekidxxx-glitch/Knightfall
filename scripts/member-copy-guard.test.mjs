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
      const displayTitle = game.title ?? game.name;
      assert.equal(typeof displayTitle, "string");
      assert.ok(displayTitle.trim().length > 0);
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

test("homepage discovery links resolve to existing public pages", () => {
  const home = read("public/index.html");
  const css = read("public/home-start.css");
  const section = home.match(/<div class="kf-chaos-categories"[^>]*>([\s\S]*?)<\/div>/);
  assert.ok(section, "homepage discovery section is missing");
  const atlas = home.match(/<section class="kf-realm-atlas"[^>]*>([\s\S]*?)<\/section>/);
  assert.ok(atlas, "illustrated realm atlas is missing");
  const links = [...(section[1]+atlas[1]).matchAll(/<a href="(\/[^"]+\.html)"/g)].map(m => m[1]);
  assert.ok(links.length >= 10, "expected all current navigable discovery categories");
  assert.equal(new Set(links).size,links.length,"duplicate discovery destinations");
  for(const route of ["/chaos-cartridge.html","/community.html","/mascot-pets.html","/devil-tools.html","/chaosphere.html","/profile.html","/miss-chaos-guide.html","/celestial-sanctum.html","/music.html","/shadow-work.html","/social.html","/chatbots.html"]) assert.ok(links.includes(route),"missing discovery category: "+route);
  for (const route of links) {
    assert.doesNotThrow(() => read("public" + route), "missing destination: " + route);
  }
  assert.match(css, /\.kf-chaos-categories a:focus-visible/);
});
