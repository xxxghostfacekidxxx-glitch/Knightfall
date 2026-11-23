#!/usr/bin/env node
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('public'),html=await readFile(path.join(root,'devil-tools.html'),'utf8');
const errors=[],warnings=[],seen=new Set();
for(const match of html.matchAll(/(?:href|src)=["']([^"'#]+)["']/g)){
 const raw=match[1];
 if(/^(?:https?:|mailto:|tel:|data:)/i.test(raw))continue;
 if(!raw.startsWith('/')||raw.startsWith('//'))continue;
 const pathname=new URL(raw,'https://ash-fall.com').pathname;
 let decoded;
 try{decoded=decodeURIComponent(pathname)}catch{errors.push('Bad encoding: '+raw);continue}
 const target=path.resolve(root,'.'+decoded);
 if(!target.startsWith(root+path.sep)&&target!==root){errors.push('Unsafe path: '+raw);continue}
 if(seen.has(target))continue;seen.add(target);
 try{const s=await stat(target);if(s.isDirectory()){await stat(path.join(target,'index.html'))}else if(!s.isFile()||s.size===0)errors.push('Empty or invalid: '+raw)}
 catch{errors.push('Missing local resource: '+raw)}
}
console.log(JSON.stringify({checked:seen.size,errors,warnings},null,2));
if(errors.length)process.exitCode=1;
