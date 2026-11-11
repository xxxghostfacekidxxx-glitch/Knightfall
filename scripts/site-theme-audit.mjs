// Regression guard for Knightfall's unified pink/lime theme and restrained yellow details.
// Runs without a browser, account credentials, or build dependencies.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL(path, import.meta.url), "utf8");
const css = read("../public/knightfall-unified-theme.css");
const tokens = read("../public/design-system.css");
const global = read("../public/theme.css");
const nav = read("../public/nav.js");

assert.match(tokens, /--af-ember:#ff55d8/);
assert.match(tokens, /--af-ember-light:#c6ff45/);
assert.match(tokens, /--af-yellow:#ffe36b/);
for (const hex of ["#ff55d8", "#c6ff45", "#ffe36b", "#070710"]) {
  assert.ok(css.includes(hex), `Unified palette missing ${hex}`);
}
assert.match(global, /@import url\("\/knightfall-unified-theme\.css\?v=20261111-yellow1"\)/);
assert.match(nav, /data-knightfall-unified-theme/);
assert.match(nav, /knightfall-unified-theme\.css\?v=20261111-yellow1/);
assert.match(css, /body:not\(\.profile-custom-theme\)/);
assert.match(css, /\.kf-header::after/);
assert.match(css, /\.messages-shell \.conversation\.active/);
assert.match(css, /\.admin-shell \.admin-tabs \.active/);
assert.match(css, /\.cartridge-shelf \.cartridge-number/);
assert.match(css, /@media\(max-width:760px\)/);
assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
assert.doesNotMatch(css, /^\s*canvas\s*\{/m, "Do not theme interactive game canvas art");
let depth = 0;
for (const c of css) {
  if (c === "{") depth++;
  if (c === "}") depth--;
  assert.ok(depth >= 0, "CSS has an unmatched closing brace");
}
assert.equal(depth, 0, "CSS has an unmatched opening brace");
console.log("Unified site theme audit passed: pink/lime retained, subtle yellow wired, game/profile safeguards intact.");
