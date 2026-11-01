#!/usr/bin/env node
// Read-only arcade inventory: route integrity, duplicates and orphan candidates.
import {readdir,readFile,stat,writeFile,mkdir} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const publicRoot=path.join(repo,"public");
const hosted=path.join(publicRoot,"arcade/hosted");
const catalog=JSON.parse(await readFile(path.join(publicRoot,"arcade/catalog.json"),"utf8"));
const groups=new Map(),missing=[],unsafe=[],external=[],invalid=[];
for(const game of catalog.games||[]){
 if(game.collection==="unavailable")continue;
 const route=game.route;
 if(typeof route!=="string"){invalid.push({id:game.id,reason:"missing route"});continue;}
 if(/^https:\/\//.test(route)){external.push({id:game.id,route});continue;}
 if(!route.startsWith("/")||route.startsWith("//")){unsafe.push({id:game.id,route});continue;}
 const normalized=path.posix.normalize(route.split(/[?#]/)[0]);
 const file=path.resolve(publicRoot,"."+normalized);
 if(!file.startsWith(publicRoot+path.sep)){unsafe.push({id:game.id,route});continue;}
 groups.set(normalized,[...(groups.get(normalized)||[]),game.id]);
 try{if(!(await stat(file)).isFile())missing.push({id:game.id,route});}
 catch{missing.push({id:game.id,route});}
}
const directories=(await readdir(hosted,{withFileTypes:true})).filter(x=>x.isDirectory()).map(x=>x.name).sort();
const unlisted=[];
for(const name of directories){
 const entry="/arcade/hosted/"+name+"/index.html";
 if(!groups.has(entry))unlisted.push({directory:name,entrypoint:entry,note:"Candidate only; may be a dependency or work in progress"});
}
const duplicates=[...groups].filter(([,ids])=>ids.length>1).map(([route,ids])=>({route,ids}));
const report={invalid,generatedAt:new Date().toISOString(),catalogEntries:(catalog.games||[]).length,hostedDirectories:directories.length,localRoutes:groups.size,externalLinks:external.length,missing,unsafe,duplicates,unlisted};
const output=process.argv.find(x=>x.startsWith("--output="))?.slice(9);
if(output){const file=path.resolve(output);await mkdir(path.dirname(file),{recursive:true});await writeFile(file,JSON.stringify(report,null,2)+"\n");}
console.log(JSON.stringify(report,null,2));
if(missing.length||unsafe.length||invalid.length)process.exitCode=1;
