#!/usr/bin/env node
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
const errors=[],warnings=[];
const read=async p=>readFile(p,'utf8').catch(e=>e.code==='ENOENT'?null:Promise.reject(e));
const modules=await read('.gitmodules');
if(modules){
 const paths=[...modules.matchAll(/^\s*path\s*=\s*(.+)\s*$/gm)].map(m=>m[1].trim());
 for(const p of paths){
  if(path.isAbsolute(p)||p.split(/[\\/]/).includes('..'))errors.push('Unsafe submodule path: '+p);
  else if(!await readdir(p).then(()=>true).catch(()=>false))warnings.push('Submodule not checked out: '+p);
 }
 if(new Set(paths).size!==paths.length)errors.push('Duplicate submodule path');
}
const ignored=await read('.gitignore')||'';
const rules=ignored.split(/\r?\n/).map(x=>x.trim()).filter(x=>x&&!x.startsWith('#'));
for(const pattern of ['.dev.vars*','.env*','toolkit/vendor/']){
 if(!rules.includes(pattern))errors.push('Missing required ignore rule: '+pattern);
}
for(const pattern of ['node_modules/','.env','*.log']){
 if(!rules.some(rule=>rule===pattern||rule===pattern+'*'))warnings.push('Consider ignoring '+pattern);
}
console.log(JSON.stringify({gitmodules:modules?'present':'absent',errors,warnings},null,2));
if(errors.length)process.exitCode=1;
