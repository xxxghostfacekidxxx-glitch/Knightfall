import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync("public/arcade/franchise-imports.html","utf8");
const builder=readFileSync("scripts/build-arcade-catalog.mjs","utf8");
const catalog=JSON.parse(readFileSync("public/arcade/catalog.json","utf8"));
test("franchise directory exposes catalog-backed external games",()=>{
 assert.match(html,/fetch\("\/arcade\/catalog\.json"/);
 assert.match(html,/franchise-catalog/);
 assert.match(html,/game\.route/);
 assert.match(html,/noopener noreferrer/);
 assert.ok(catalog.games.some(g=>g.collection==="external"&&/dragon.?ball|saiyan/i.test(g.title)));
 assert.ok(catalog.games.some(g=>g.collection==="external"&&/star.?wars/i.test(g.title)));
});
test("franchise menu does not promise eleven hosted games",()=>{
 assert.doesNotMatch(builder,/Star Wars &amp; Dragon Ball · 11 projects/);
});

test("franchise directory has no-script fallback for all cataloged fan links",()=>{
 const external=catalog.games.filter(g=>g.collection==="external"&&/dragon.?ball|saiyan|star.?wars|7balls/i.test([g.id,g.title,g.description].join(" ")));
 assert.ok(external.length>=4);
 for(const game of external)assert.ok(html.includes('href="'+game.route+'"'),"Missing static fallback for "+game.id);
 assert.match(html,/area\.replaceChildren\(\)/);
});
