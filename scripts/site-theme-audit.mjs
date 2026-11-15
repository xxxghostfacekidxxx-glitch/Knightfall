import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const css=read("../public/knightfall-unified-theme.css"),tokens=read("../public/design-system.css");
const theme=read("../public/theme.css"),nav=read("../public/nav.js"),home=read("../public/index.html");
const sw=read("../public/sw.js"),manifest=JSON.parse(read("../public/manifest.webmanifest"));
for(const color of ["#0d1013","#ece1d3","#b25b68","#c7a77c","#92a18a"])
 assert.ok(css.includes(color),"Missing approved Gothic color "+color);
assert.match(tokens,/--af-bg:#0d1013/);
assert.match(tokens,/--af-ember:#b25b68/);
assert.match(tokens,/--af-ember-light:#c7a77c/);
assert.match(theme,/knightfall-unified-theme\.css\?v=20261115-gothic2/);
assert.doesNotMatch(theme,/@import url\("\/neon-global\.css/);
assert.match(nav,/data-knightfall-unified-theme/);
assert.match(nav,/knightfall-unified-theme\.css\?v=20261115-gothic2/);
for(const old of ["/gravewave-takeover.js","/gravewave-decor.js","/neon-global.css","/gravewave-consistency.css"])
 assert.ok(!nav.includes(old),"Nav reintroduces legacy neon theme: "+old);
assert.doesNotMatch(home,/\/gravewave-takeover\.(js|css)/);
assert.match(css,/knightfall-crest-192\.png/);
assert.match(css,/knightfall-crest-512\.png/);
assert.match(css,/body:not\(\.profile-custom-theme\)/);
assert.match(css,/\.messages-shell \.conversation\.active/);
assert.match(css,/\.admin-shell \.admin-tabs \.active/);
assert.match(css,/\.cartridge-shelf \.cartridge-number/);
assert.match(css,/@media\(max-width:760px\)/);
assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
assert.doesNotMatch(css,/^\s*canvas\s*\{/m);
assert.match(sw,/const CACHE_NAME = "knightfall-shell-v40";/);
assert.match(sw,/"\/knightfall-unified-theme\.css"/);
assert.match(sw,/"\/icons\/knightfall-crest-192\.png"/);
assert.equal(manifest.background_color,"#0d1013");
assert.equal(manifest.theme_color,"#111217");
assert.ok(manifest.icons.some(i=>i.src==="/icons/knightfall-crest-maskable.png"));
let depth=0;for(const c of css){if(c==="{")depth++;if(c==="}")depth--;assert.ok(depth>=0)}
assert.equal(depth,0,"Invalid CSS nesting");
console.log("Approved Gothic Creator theme, crest, and offline refresh verified.");
