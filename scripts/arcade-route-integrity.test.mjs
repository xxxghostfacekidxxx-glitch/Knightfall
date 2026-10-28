import {readFileSync,existsSync} from "node:fs";
import assert from "node:assert/strict";
const catalogs=["public/chaos-cartridge.html","public/arcade-30-games.html"];
const failures=[],routes=new Map();
for(const catalog of catalogs){
 const html=readFileSync(catalog,"utf8");
 const cards=[...html.matchAll(/<article\b[^>]*class="(?:cartridge-cabinet arcade-flat-card|game)"[\s\S]*?<\/article>/g)];
 for(const [index,match] of cards.entries()){
  const href=match[0].match(/<a\b[^>]*href="([^"]+)"[^>]*class="(?:button button-primary|play)"/)?.[1]
   ??match[0].match(/<a\b[^>]*class="(?:button button-primary|play)"[^>]*href="([^"]+)"/)?.[1];
  if(!href){failures.push(catalog+" card "+(index+1)+": missing playable link");continue}
  if(!href.startsWith("/arcade/hosted/"))continue;
  const path=href.split(/[?#]/)[0];
  if(!existsSync("public"+path))failures.push(catalog+" card "+(index+1)+": missing "+path);
  routes.set(href,(routes.get(href)||0)+1);
 }
}
const retired=["dino-run","balloon-pop","hanoi","snek-souls","custom-tetris","hextris","maze-muncher","sokoban","air-hockey","lights-out","whack-a-mole","minesweeper","memory-match","breakout"];
for(const slug of retired)if(existsSync("public/arcade/hosted/"+slug+"/index.html"))failures.push("Retired import restored: "+slug);
if(failures.length){console.error(failures.join("\n"));process.exitCode=1}else console.log("Arcade route audit passed: "+routes.size+" unique playable routes checked across both catalogs.");
