import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..','public');
const htmlFor=game=>readFileSync(resolve(root,'arcade/hosted',game,'index.html'),'utf8');
const scriptFor=html=>{
 const match=html.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
 assert.ok(match,'inline game script exists');
 return match[1];
};
for(const game of ['cinder-life','roads-of-cinder']){
 const html=htmlFor(game);
 assert.equal((html.match(/<\/html>/gi)||[]).length,1,game+' has exactly one HTML document');
 new vm.Script(scriptFor(html),{filename:game+'/index.html'});
 assert.match(html,/viewport/);
 console.log(game+': JavaScript syntax and document structure PASS');
}
const elements=new Map();
const element=(id)=>{if(!elements.has(id))elements.set(id,{id,hidden:false,disabled:false,textContent:'',children:[],replaceChildren(...children){this.children=children},append(...children){this.children.push(...children)}});return elements.get(id)};
const document={getElementById:element,createElement:tag=>({tag,children:[],append(...children){this.children.push(...children)}})};
vm.runInNewContext(scriptFor(htmlFor('roads-of-cinder')),{document,Math,console});
assert.equal(element('board').children.length,30);
assert.equal(element('roll').disabled,true,'career required on first launch');
assert.equal(element('career').hidden,false);
element('career').onclick();
assert.equal(element('roll').disabled,false,'career selection unlocks roll');
element('roll').onclick();
assert.match(element('log').textContent,/Ember: choose a career/);
element('restart').onclick();
assert.equal(element('roll').disabled,true,'restart requires career again');
assert.equal(element('career').hidden,false);
assert.equal(element('board').children.length,30);
console.log('Roads of Cinder career, turn transition, restart and 30-tile board: PASS');
