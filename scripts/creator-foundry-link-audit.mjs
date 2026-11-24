#!/usr/bin/env node
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('public'),html=await readFile(path.join(root,'devil-tools.html'),'utf8');
const errors=[],warnings=[],seen=new Set();
const anchors=new Set();
for(const match of html.matchAll(/\s+id=["']([^"']+)["']/g)){
 if(anchors.has(match[1]))errors.push('Duplicate anchor: '+match[1]);
 anchors.add(match[1]);
}
for(const match of html.matchAll(/\bhref=["']#([^"']+)["']/g)){
 let fragment;try{fragment=decodeURIComponent(match[1])}catch{errors.push('Invalid fragment encoding: '+match[1]);continue}
 if(fragment && !anchors.has(fragment))errors.push('Missing in-page target: #'+fragment);
}
for(const match of html.matchAll(/(?:href|src)=["']([^"'#]+)["']/g)){
 const raw=match[1];
 if(/^(?:https?:|mailto:|tel:|data:)/i.test(raw))continue;
 if(!raw.startsWith('/')||raw.startsWith('//'))continue;
 let pathname;try{pathname=new URL(raw,'https://ash-fall.com').pathname}catch{errors.push('Invalid URL: '+raw);continue}
 let decoded;
 try{decoded=decodeURIComponent(pathname)}catch{errors.push('Bad encoding: '+raw);continue}
 const target=path.resolve(root,'.'+decoded);
 if(!target.startsWith(root+path.sep)&&target!==root){errors.push('Unsafe path: '+raw);continue}
 if(seen.has(target))continue;seen.add(target);
 try{const s=await stat(target);if(s.isDirectory()){await stat(path.join(target,'index.html'))}else if(!s.isFile()||s.size===0)errors.push('Empty or invalid: '+raw)}
 catch{errors.push('Missing local resource: '+raw)}
}
console.log(JSON.stringify({checked:seen.size,anchors:anchors.size,errors,warnings},null,2));
if(errors.length)process.exitCode=1;
