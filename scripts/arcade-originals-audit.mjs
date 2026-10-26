import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { Script } from "node:vm";
const root=resolve("public");
const catalog=readFileSync(join(root,"arcade-30-games.html"),"utf8");
const manifest=JSON.parse(readFileSync(join(root,"arcade/original-creations.json"),"utf8"));
const errors=[],seen=new Set();
const catalogLinks=[...catalog.matchAll(/href="(\/arcade\/hosted\/[^"]+\/index\.html)"/g)].map(m=>m[1]);
if(!Array.isArray(manifest.games))throw Error("Original creations manifest missing games array");
for(const game of manifest.games){
 if(!/^[a-z0-9-]+$/.test(game.id)||seen.has(game.id)){errors.push("Invalid or duplicate game id: "+game.id);continue}
 seen.add(game.id);
 const expected="/arcade/hosted/"+game.id+"/index.html";
 if(game.engine!==expected)errors.push(game.id+": engine path mismatch");
 if(!catalog.includes('href="'+expected+'"'))errors.push(game.id+": missing catalog play link");
 const local=[game.engine,...(game.assets||[]).map(a=>a.path)];
 for(const url of local){
  if(typeof url!=="string"||!url.startsWith("/")||url.includes("..")||!existsSync(join(root,url.slice(1))))errors.push(game.id+": missing or unsafe asset "+url);
 }
 const htmlPath=join(root,game.engine.slice(1));
 if(existsSync(htmlPath)){
  const html=readFileSync(htmlPath,"utf8");
  if(!html.includes('src="/arcade-save.js"')&&!html.includes('src="/arcade/hosted/arcade-account-bridge.js"'))errors.push(game.id+": missing shared score bridge");
  if(!html.includes("recordScore(")&&!html.includes('src="/arcade/hosted/arcade-account-bridge.js"'))errors.push(game.id+": missing score submission");
  for(const m of html.matchAll(/(?:src|href)="(\.\/sprites\/[^"]+)"/g)){
   if(!existsSync(join(root,"arcade/hosted",game.id,m[1])))errors.push(game.id+": broken sprite reference "+m[1]);
  }
  const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(Boolean);
  for(let index=0;index<scripts.length;index++){
   try{new Script(scripts[index],{filename:game.id+"-inline-"+index+".js"})}
   catch(error){errors.push(game.id+": invalid inline JavaScript: "+error.message)}
  }
 }
 for(const asset of game.assets||[]){
  if(asset.path!=="/arcade/hosted/"+game.id+"/sprites/"+asset.name)errors.push(game.id+": sprite path mismatch: "+asset.name);
 }
}
for(const url of catalogLinks)if(!existsSync(join(root,url.slice(1))))errors.push("Catalog links to missing game: "+url);
for(const game of manifest.games){
 const link='/arcade/hosted/'+game.id+'/index.html';
 const count=catalogLinks.filter(x=>x===link).length;
 if(count!==1)errors.push(game.id+": expected exactly one catalog link, found "+count);
}
if(errors.length){console.error(errors.join("\n"));process.exitCode=1}
else console.log("Original creations validated: "+seen.size+" games, "+manifest.games.reduce((n,g)=>n+(g.assets||[]).length,0)+" sprites");
