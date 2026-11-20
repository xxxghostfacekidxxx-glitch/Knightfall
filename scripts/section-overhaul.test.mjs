import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const read=name=>readFile(new URL("../public/"+name,import.meta.url),"utf8");
test("section polish loads with and without navigation",async()=>{
 const [theme,nav,css]=await Promise.all([read("theme.css"),read("nav.js"),read("knightfall-unified-theme.css")]);
 assert.ok(theme.includes('"/knightfall-unified-theme.css?v=20261120-tokens1"'), 'Section styles must load from canonical CSS');
 assert.match(nav,/kfCanonicalTheme/);
 assert.ok(css.includes("CANONICAL KNIGHTFALL CHROME: SECTION FOUNDATIONS"));
 for(const root of [".community-directory",".cartridge-shelf",".messages-shell",".admin-shell",".profile-shell",".foundry",".dt-workspace-nav"])assert.ok(css.includes(root),root);
});
test("section overhaul supports small screens, keyboard access and personal themes",async()=>{
 const css=await read("knightfall-unified-theme.css");
 assert.match(css,/@media\(max-width:600px\)/);
 assert.match(css,/:focus-visible/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/body:not\(\.profile-custom-theme\) \.profile-shell/);
});


test("common section colors reuse canonical tokens instead of copying hardcoded palette values",async()=>{
 const css=await read("knightfall-unified-theme.css");
 assert.match(css,/--section-surface:var\(--af-v2-card\)/);
 assert.match(css,/--section-raised:var\(--kf-panel-2\)/);
 assert.match(css,/--section-green:var\(--kf-antique-gold\)/);
 assert.match(css,/--section-pink:var\(--kf-oxblood\)/);
 assert.match(css,/--kf-antique-gold:#c7a77c/);
 assert.match(css,/--kf-oxblood:#b25b68/);
});
