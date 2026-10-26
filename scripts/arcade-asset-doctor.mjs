#!/usr/bin/env node
// Arcade asset doctor: deterministic, narrow repairs only. Never rewrites game logic.
import { readdir, readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
const root=path.resolve("public");
const apply=process.argv.includes("--fix");
const report=[];
let changed=0,broken=0;
async function exists(file){try{await access(file);return true}catch{return false}}
async function visit(dir){
 for(const entry of await readdir(dir,{withFileTypes:true})){
  const file=path.join(dir,entry.name);
  if(entry.isDirectory()){await visit(file);continue}
  if(!entry.isFile()||!entry.name.endsWith(".html"))continue;
  let source=await readFile(file,"utf8"),next=source;
  // Repair only literal root-relative asset URLs that accidentally include /public/.
  const rx=/((?:src|href)=["'])\/public\/([^"'?#]+)([^"']*)(["'])/g;
  for(const match of source.matchAll(rx)){
   const target=path.resolve(root,match[2]);
   if(!target.startsWith(root+path.sep)||!await exists(target))continue;
   const replacement=match[1]+"/"+match[2]+match[3]+match[4];
   next=next.replace(match[0],replacement);
   report.push({kind:"safe-fix",file:path.relative(root,file),from:match[0],to:replacement});
  }
  // Report missing literal local JS/CSS/images, but never guess replacements.
  const refs=/(?:src|href)=["'](\/[^"'?#]+\.(?:js|css|png|jpg|jpeg|webp|svg|woff2?))(?=[?#"'])/gi;
  for(const match of next.matchAll(refs)){
   const target=path.resolve(root,"."+match[1]);
   if(!target.startsWith(root+path.sep)||!await exists(target)){
    broken++;report.push({kind:"missing-asset",file:path.relative(root,file),url:match[1]});
   }
  }
  if(next!==source){changed++;if(apply)await writeFile(file,next)}
 }
}
await visit(path.join(root,"arcade"));
console.log(JSON.stringify({mode:apply?"fix":"audit",changedFiles:changed,missingAssets:broken,findings:report},null,2));
if(broken)process.exitCode=2;
