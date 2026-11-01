#!/usr/bin/env node
// Read-only packaging audit. The catalog JSON is the source of truth.
import {readFile,access} from "node:fs/promises";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const manifest=JSON.parse(await readFile(resolve(root,"public/arcade/catalog.json"),"utf8"));
const errors=[],warnings=[],seen=new Map();
for(const game of manifest.games||[]){
 const name=game.title||game.id||"Unnamed game";
 const route=game.route;
 if(game.collection==="unavailable"){warnings.push(name+": intentionally unavailable");continue;}
 if(typeof route!=="string"||!route){errors.push(name+": missing launch route");continue;}
 if(/^https:\/\//i.test(route)){
  if(game.collection!=="external")errors.push(name+": external launch not marked external");
  continue;
 }
 if(!route.startsWith("/")||route.startsWith("//")||!route.split(/[?#]/)[0].endsWith(".html")){
  errors.push(name+": invalid local launch "+route);continue;
 }
 const file=resolve(root,"public","."+route.split(/[?#]/)[0]);
 const publicRoot=resolve(root,"public");
 if(!file.startsWith(publicRoot+"/")){errors.push(name+": path escapes public directory");continue;}
 try{await access(file)}catch{errors.push(name+": missing "+route)}
 if(seen.has(route))warnings.push(name+": shares launch URL with "+seen.get(route));
 else seen.set(route,name);
 if(/^https:\/\//i.test(game.source||"")){
  warnings.push(name+": verify third-party license and asset redistribution separately");
 }else if(!game.source){
  warnings.push(name+": no source/credits reference in catalog");
 }
}
if(!(manifest.games||[]).length)errors.push("Catalog contains no games");
console.log("Arcade import audit:",(manifest.games||[]).length,"catalog entries,",seen.size,"distinct local routes");
for(const warning of warnings)console.warn("WARN:",warning);
for(const error of errors)console.error("FAIL:",error);
console.log("Static packaging audit only; gameplay and asset rights need separate verification.");
if(errors.length)process.exitCode=1;
