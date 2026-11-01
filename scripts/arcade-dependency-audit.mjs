#!/usr/bin/env node
// Verify static src/href dependencies for catalog HTML entrypoints.
import {readFile,stat} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
const publicRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../public");
const catalog=JSON.parse(await readFile(path.join(publicRoot,"arcade/catalog.json"),"utf8"));
const paths=[...new Set(catalog.games.filter(g=>g.route?.startsWith("/")).map(g=>g.route.split(/[?#]/)[0]))];
const failures=[],checked=new Set();
for(const route of paths){
 const file=path.resolve(publicRoot,"."+route);
 if(!file.startsWith(publicRoot+path.sep))continue;
 let html;
 try{html=await readFile(file,"utf8")}catch{failures.push(route+": entry file missing");continue;}
 const refs=[...html.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)].map(m=>m[1]);
 for(const ref of refs){
  if(!ref||/^(?:https?:|data:|blob:|mailto:|tel:|javascript:|#|\/\/)/i.test(ref))continue;
  const clean=ref.split(/[?#]/)[0];
  if(!clean)continue;
  let decoded;
  try{decoded=decodeURIComponent(clean)}catch{failures.push(route+": malformed URL "+ref);continue;}
  const target=decoded.startsWith("/")?path.resolve(publicRoot,"."+decoded):path.resolve(path.dirname(file),decoded);
  if(!target.startsWith(publicRoot+path.sep)){failures.push(route+": asset escapes public root "+ref);continue;}
  checked.add(target);
  try{if(!(await stat(target)).isFile())failures.push(route+": missing asset "+ref)}
  catch{failures.push(route+": missing asset "+ref)}
 }
}
console.log("Arcade dependency audit:",paths.length,"entry files,",checked.size,"distinct local references,",failures.length,"failures");
for(const issue of failures)console.error("FAIL:",issue);
if(failures.length)process.exitCode=1;
