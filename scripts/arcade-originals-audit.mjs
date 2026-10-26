import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
const root=resolve("public");
const catalog=readFileSync(join(root,"arcade-30-games.html"),"utf8");
const manifest=JSON.parse(readFileSync(join(root,"arcade/original-creations.json"),"utf8"));
const errors=[],seen=new Set();
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
 for(const asset of game.assets||[]){
  if(asset.path!=="/arcade/hosted/"+game.id+"/sprites/"+asset.name)errors.push(game.id+": sprite path mismatch: "+asset.name);
 }
}
if(errors.length){console.error(errors.join("\n"));process.exitCode=1}
else console.log("Original creations validated: "+seen.size+" games, "+manifest.games.reduce((n,g)=>n+(g.assets||[]).length,0)+" sprites");
