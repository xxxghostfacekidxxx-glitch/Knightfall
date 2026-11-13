import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const publicDir = fileURLToPath(new URL("../public/", import.meta.url));
const redirects = readFileSync(join(publicDir, "_redirects"), "utf8");
const nav = readFileSync(join(publicDir, "nav.js"), "utf8");
const catalog = readFileSync(join(publicDir, "chaos-cartridge.html"), "utf8");
const vault = readFileSync(join(publicDir, "arcade-vault.html"), "utf8");

const rules = redirects.split(/\r?\n/).map(line => line.trim())
  .filter(line => line && !line.startsWith("#"))
  .map((line, index) => {
    const fields = line.split(/\s+/);
    assert.equal(fields.length, 3, `Malformed _redirects entry ${index + 1}: ${line}`);
    const [source, destination, status] = fields;
    assert.match(source, /^\/(?!\/)[^?#\s]*$/, `Bad redirect source: ${source}`);
    assert.match(destination, /^\/(?!\/)[^\s]*$/, `Bad redirect target: ${destination}`);
    assert.equal(status, "301", `Legacy route must use permanent HTTP redirect: ${source}`);
    return { source, destination, status };
  });
const paths = new Map(rules.map(rule => [rule.source, rule]));
const targetExists = raw => {
  const destination = new URL(raw, "https://ash-fall.com").pathname;
  if (destination === "/") return existsSync(join(publicDir, "index.html"));
  const full = join(publicDir, destination.replace(/^\//, ""));
  return existsSync(full) || existsSync(full + ".html") || existsSync(join(full, "index.html"));
};

test("redirects have unique sources, real targets, and no redirect chains", () => {
  assert.equal(paths.size, rules.length, "Duplicate redirect sources are not allowed");
  assert.ok(rules.length < 100, "Redirect aliases should stay small and intentional");
  for (const { source, destination } of rules) {
    assert.notEqual(source, new URL(destination, "https://ash-fall.com").pathname);
    assert.ok(targetExists(destination), `Redirect target missing: ${source} => ${destination}`);
    assert.ok(!paths.has(new URL(destination, "https://ash-fall.com").pathname),
      `Redirect chain: ${source} => ${destination}`);
  }
});

test("single canonical home and arcade discovery routes", () => {
  const expected = {
    "/homepage": "/",
    "/homepage.html": "/",
    "/landing": "/",
    "/landing.html": "/",
    "/arcade": "/chaos-cartridge.html",
    "/arcade/": "/chaos-cartridge.html",
    "/arcade.html": "/chaos-cartridge.html",
    "/games": "/chaos-cartridge.html",
    "/games.html": "/chaos-cartridge.html",
    "/arcade-30-games": "/chaos-cartridge.html",
    "/arcade-30-games.html": "/chaos-cartridge.html",
    "/arcade-card-board": "/chaos-cartridge.html",
    "/arcade-card-board.html": "/chaos-cartridge.html",
    "/arcade-vault": "/arcade-vault.html"
  };
  for (const [source, destination] of Object.entries(expected)) {
    assert.equal(paths.get(source)?.destination, destination, `Incorrect alias ${source}`);
  }
  for (const canonical of ["/", "/chaos-cartridge.html", "/arcade-progress.html", "/arcade-card-room.html"]) {
    assert.ok(!paths.has(canonical), `Playable/canonical route was redirected: ${canonical}`);
  }
  assert.match(catalog, /id="game-shelf"/, "Arcade shelf anchor must survive");
  for (const [oldAnchor, newGame] of [
    ["#vault-mines", "/arcade/hosted/cinder-mines/index.html"],
    ["#vault-breakout", "/arcade/hosted/afterburn-breakout/index.html"],
    ["#vault-snake", "/arcade/hosted/ash-serpent/index.html"]
  ]) {
    assert.ok(vault.includes(oldAnchor) && vault.includes(newGame), `Old Vault game bookmark lost: ${oldAnchor}`);
    assert.ok(targetExists(newGame), `Vault game link is broken: ${newGame}`);
  }
});

test("retired game links resolve to maintained playable cabinets", () => {
  const replacements = {
    "ball-and-wall": "afterburn-breakout",
    "ember-echo": "cursed-circuit",
    "void-sequence": "cursed-circuit",
    "fifteen-puzzle": "ash-tiles",
    "void-lanterns": "lights-out-afterburn",
    "wordlee": "crypt-words",
    "crossy-road": "cinder-crossing"
  };
  for (const [oldSlug, newSlug] of Object.entries(replacements)) {
    const source = `/arcade/hosted/${oldSlug}/index.html`;
    assert.equal(paths.get(source)?.destination, `/arcade/hosted/${newSlug}/index.html`);
  }
});

test("global navigation exposes only one arcade directory", () => {
  const menu = nav.match(/<nav id="kf-primary-nav"[\s\S]*?<\/nav>/)?.[0];
  assert.ok(menu, "Shared primary navigation not found");
  const hrefs = [...menu.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)].map(match => match[1]);
  assert.equal(hrefs.filter(href => href === "/#ecosystem").length, 0, "Explore duplicates the home brand route");
  assert.match(nav, /class="kf-brand" href="\/" aria-label="Ash-Fall home"/);
  assert.match(nav, /brand\.setAttribute\("aria-current", "page"\)/);
  assert.equal(hrefs.filter(href => href === "/chaos-cartridge.html").length, 1);
  assert.equal(new Set(hrefs).size, hrefs.length, "Duplicate links in primary navigation");
  assert.ok(hrefs.every(href => !["/arcade-games.html", "/arcade-vault.html", "/arcade-30-games.html", "/arcade-card-board.html"].includes(href)),
    "Retired arcade discovery page reappeared in navigation");
});

test("mobile drawer toggles scroll lock and keeps section context", () => {
  const theme = readFileSync(join(publicDir, "theme.css"), "utf8");
  const neon = readFileSync(join(publicDir, "neon-global.css"), "utf8");
  const unified = readFileSync(join(publicDir, "knightfall-unified-theme.css"), "utf8");
  assert.match(nav, /const mobileNavViewport = window\.matchMedia\("\(max-width: 1080px\)"\)/);
  assert.match(nav, /document\.body\.classList\.toggle\("kf-navigation-open", visible\)/);
  assert.match(theme, /body\.kf-navigation-open\{overflow:hidden\}/);
  for (const stylesheet of [theme, neon, unified]) {
    assert.ok(!stylesheet.includes(".kf-nav-more"), "Retired dropdown rules reappeared");
  }
  for (const route of ["/profile-edit", "/thread", "/community-topic", "/create-thread"]) {
    assert.ok(nav.includes(`["${route}", `), "Section breadcrumb missing: " + route);
  }
  assert.match(nav, /currentPath\.startsWith\("\/arcade\/"/);
});
