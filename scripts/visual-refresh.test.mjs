import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const read=path=>readFile(new URL("../public/"+path,import.meta.url),"utf8");
test("shared visual polish is loaded by nav, landing and standalone monster game",async()=>{
 const [nav,landing,game,css,theme]=await Promise.all([read("nav.js"),read("index.html"),read("monster-mmo.html"),read("visual-refresh.css"),read("theme.css")]);
 assert.ok(theme.includes('"/visual-refresh.css?v=20261116-cascade4"'), 'Standalone polish remains imported');
 assert.ok(landing.includes("/theme.css"),"Home must load theme.css");
 assert.ok(game.includes("visual-refresh.css")||game.includes("theme.css"),"Standalone game needs shared theme entry");
 assert.match(nav,/kfCanonicalTheme/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/profile-custom-theme/);
});
test("gameplay canvas and touch controls retain priority",async()=>{
 const css=await read("monster-mmo.css");
 assert.match(css,/\.game-screen canvas\{display:block;image-rendering:pixelated\}/);
 assert.match(css,/\.pad\{touch-action:manipulation\}/);
 assert.match(css,/#game-menu\{overscroll-behavior:contain\}/);
});
