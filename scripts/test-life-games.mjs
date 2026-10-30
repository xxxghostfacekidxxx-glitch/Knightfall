import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..','public');
for(const game of ['cinder-life','roads-of-cinder']){
 const html=readFileSync(resolve(root,'arcade/hosted',game,'index.html'),'utf8');
 const scripts=[html.split('<script>')[1]?.split('</script>')[0]].filter(Boolean);
 assert.ok(scripts.length,game+' has inline JavaScript');
 for(const script of scripts)new vm.Script(script,{filename:game+'/index.html'});
 assert.match(html,/viewport/);assert.match(html,/pointer|onclick/);
 console.log(game+': inline JavaScript syntax PASS');
}
