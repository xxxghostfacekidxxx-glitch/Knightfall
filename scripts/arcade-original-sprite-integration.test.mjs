import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
const catalog=JSON.parse(readFileSync("public/arcade/original-creations.json","utf8"));
for(const [id,names] of Object.entries({
 "ashen-dominion":["cinder-guard.svg","void-raider.svg","ember-outpost.svg"],
 "glitch-munch":["ember-devourer.svg","void-stalker.svg"],
 "rooftop-riot":["ash-runner.svg","ember-shard.svg"],
 "colossus-clash":["ash-bruiser.svg","cinder-fighter.svg"]
})){
 test(id+" original sprite assets are local, cataloged and used in gameplay",()=>{
  const game=catalog.games.find(g=>g.id===id);
  assert.ok(game);
  const html=readFileSync("public/arcade/hosted/"+id+"/index.html","utf8");
  assert.ok(html.includes("ctx.drawImage("),"sprites must render during gameplay");
  for(const name of names){
   const file="public/arcade/hosted/"+id+"/sprites/"+name;
   assert.ok(existsSync(file),file+" missing");
   const svg=readFileSync(file,"utf8");
   assert.match(svg,/<svg\s/);
   assert.match(svg,/<\/svg>/);
   assert.ok(!/<script|<image|href\s*=|onload\s*=|foreignObject/i.test(svg),"SVG must be self-contained and script-free");
   assert.ok(game.sprites.includes(name));
   assert.ok(game.assets.some(a=>a.path==="/arcade/hosted/"+id+"/sprites/"+name));
   assert.ok(html.includes(name),"game must actually load "+name);
  }
  assert.match(game.notes,/provenance/i,"catalog must not claim audited engine ownership");
 });
}
