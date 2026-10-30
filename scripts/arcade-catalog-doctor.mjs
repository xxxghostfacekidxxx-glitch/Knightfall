#!/usr/bin/env node
// Dependency-free static arcade catalog validator. External games are reported, never treated as hosted.
import {readFile,stat,writeFile} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('public');
const catalog=JSON.parse(await readFile(path.join(root,'arcade/catalog.json'),'utf8'));
const errors=[],warnings=[],entries=[],ids=new Set(),routes=new Map();
for(const [i,g] of catalog.games.entries()){
 const id=String(g.id||''),route=String(g.route||'');
 if(!id||ids.has(id))errors.push('Duplicate/missing game id: '+id+' at '+i);
 ids.add(id);
 if(!g.title||!g.genre)warnings.push(id+': missing title or genre');
 if(route.startsWith('https://')){
   let url;try{url=new URL(route)}catch{errors.push(id+': invalid external URL');continue}
   if(url.protocol!=='https:')errors.push(id+': external URL not HTTPS');
   if(g.collection!=='external')warnings.push(id+': remote game not marked external');
   entries.push({id,route,status:'external-unverified'});continue;
 }
 if(!route.startsWith('/')||route.startsWith('//')||route.includes('\\')||route.includes('?')&&route.split('?')[0]==='') {errors.push(id+': unsafe/nonabsolute local route '+route);continue}
 let url;try{url=new URL(route,'https://ash-fall.com')}catch{errors.push(id+': invalid route');continue}
 const decoded=decodeURIComponent(url.pathname);
 const target=path.resolve(root,'.'+decoded);
 if(!target.startsWith(root+path.sep)){errors.push(id+': route escapes public directory');continue}
 const duplicate=routes.get(url.pathname);if(duplicate)warnings.push(id+': shares launch URL with '+duplicate);else routes.set(url.pathname,id);
 try{const s=await stat(target);if(!s.isFile())errors.push(id+': not a file '+decoded);else if(s.size===0)errors.push(id+': empty file '+decoded);else if(!/\.html?$/i.test(decoded))warnings.push(id+': launch is not HTML')}
 catch{errors.push(id+': missing '+decoded)}
 entries.push({id,route,status:'local'});
}
const report={checked:catalog.games.length,local:entries.filter(x=>x.status==='local').length,externalUnverified:entries.filter(x=>x.status==='external-unverified').length,errors,warnings};
console.log(JSON.stringify(report,null,2));
if(process.argv.includes('--report'))await writeFile('arcade-catalog-doctor-report.json',JSON.stringify(report,null,2)+'\n');
if(errors.length)process.exitCode=1;
