import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=name=>readFileSync(root+name,'utf8');
const pages={
  'radius-raid':'#wrap','terravia':'#app','interstellar-armada':'body',
  'single-html-space-shooter':'body','browserquest-solo':'body',
  'openfront-solo':'body','cinder-life':'main','cinder-slots':'main'
};
const source=read('public/arcade/hosted/arcade-playback-assist.js');

test('opt-in hosted arcade pages include shared fullscreen and recovery affordances',()=>{
  for(const [id,target] of Object.entries(pages)){
    const html=read('public/arcade/hosted/'+id+'/index.html');
    const needle='data-target="'+target+'"';
    assert.ok(html.includes(needle),id+' missing its explicit game surface');
    assert.equal((html.match(/arcade-playback-assist\.js/g)||[]).length,1,id+' must only load one assist');
    assert.match(html,/<\/body>/i);
  }
});

test('fullscreen bridge uses a user gesture and restores browser layout on exit',()=>{
  assert.match(source,/button\.addEventListener\('click',async/);
  assert.match(source,/request\.call\(document\.documentElement\)/);
  assert.match(source,/document\.addEventListener\('fullscreenchange',sync\)/);
  assert.match(source,/event\.key==='Escape' && theater/);
  assert.match(source,/requestFullscreen/);
  assert.match(source,/aria-pressed/);
  assert.match(source,/prefers-reduced-motion/);
});

test('fatal load failures offer a retry and arcade return without touching saves',()=>{
  assert.match(source,/window\.addEventListener\('unhandledrejection'/);
  assert.match(source,/webglcontextlost/);
  assert.match(source,/location\.replace\(fresh\.href\)/);
  assert.match(source,/webglcontextcreationerror/);
  assert.match(source,/chaos-cartridge\.html/);
  assert.doesNotMatch(source,/localStorage\.clear|indexedDB\.deleteDatabase|sessionStorage\.clear/);
});

test('Neon Surge preserves its built-in fullscreen control and provides a missing-module recovery path',()=>{
  const html=read('public/arcade/hosted/neon-surge/index.html');
  assert.match(html,/id="fsBtn"/);
  assert.match(html,/data-fullscreen="existing"/);
  assert.match(html,/data-ready="__NS"/);
  assert.ok(html.indexOf('arcade-playback-assist.js')<html.indexOf('<script type="module">'));
  assert.match(source,/el\.type==='module'/);
  assert.match(source,/game-boot-timeout/);
});

test('additional full-game pages expose fallback fullscreen without modifying game engines',()=>{
  const extra=[
    ['public/monster-mmo.html','main'],
    ['public/arcade/hosted/mutation-merge/index.html','main'],
    ['public/arcade/hosted/fable-gta/index.html','body'],
    ['public/arcade/hosted/sanctuary-original/sanctuary.html','body'],
    ['public/arcade/hosted/sanctuary-end/sanctuary.html','body']
  ];
  for(const [file,target] of extra){
    const html=read(file);
    assert.ok(html.includes('arcade-playback-assist.js'),file+' lacks fallback loader');
    assert.ok(html.includes('data-target="'+target+'"'),file+' lacks target');
    assert.equal((html.match(/arcade-playback-assist\.js/g)||[]).length,1,file+' duplicate fallback');
  }
});

test('portrait Interstellar Armada has readable guidance rather than a silent black screen',()=>{
 const html=read('public/arcade/hosted/interstellar-armada/index.html');
 assert.match(html,/id="kf-armada-rotate-help"/);
 assert.match(html,/Rotate your phone sideways/);
 assert.match(html,/@media \(orientation:portrait\)/);
 assert.match(html,/landscape screen/);
});
test('shared first-party fullscreen toolbar works without native fullscreen support',()=>{
 const src=read('public/arcade-cabinet-ui.js');
 assert.match(src,/document\.fullscreenEnabled/);
 assert.match(src,/main\.webkitRequestFullscreen/);
 assert.match(src,/kf-cabinet-theater/);
 assert.match(src,/event\.key==='Escape'&&theater/);
 assert.match(src,/main\.querySelector\('#full,#fullscreen,#toggle-fullscreen/);
});

test('Sanctuary Original uses a theater-only fullscreen path to avoid heavy WebGPU mode transitions',()=>{
  const html=read('public/arcade/hosted/sanctuary-original/sanctuary.html');
  assert.match(html,/data-theater-only="true"/);
  assert.match(source,/const theaterOnly = loader\?\.dataset\.theaterOnly === 'true'/);
  assert.match(source,/if\(theaterOnly\)\{theater=true;setState\(true\);return;\}/);
});

test('recovery button removes only scoped cached game resources, keeping offline kitchen and private data',async()=>{
 const vm=await import('node:vm');
 for(const game of ['hex-and-whisk','imp-inferno']){
  const removed=[],listeners={},created=[];
  const urls=[
   'https://ash-fall.com/arcade/hosted/'+game+'/game.js',
   'https://ash-fall.com/arcade/hosted/'+game+'/game.css',
   'https://ash-fall.com/arcade/hosted/hex-and-whisk/index.html',
   'https://ash-fall.com/arcade/hosted/other-game/game.js',
   'https://ash-fall.com/messages.html',
   'https://ash-fall.com/theme.css'
  ];
  function node(tag){
   const el={tagName:tag,id:'',textContent:'',children:[],events:{},
    classList:{toggle(){}},setAttribute(){},addEventListener(kind,fn){this.events[kind]=fn},
    append(...items){this.children.push(...items)},remove(){}};
   created.push(el);return el;
  }
  const body=node('body'),head=node('head');
  const document={currentScript:{dataset:{target:'body'}},readyState:'complete',body,head,
   getElementById:()=>null,createElement:node,addEventListener(){}};
  const cache={keys:async()=>urls.map(url=>({url})),delete:async req=>{removed.push(req.url);return true}};
  const caches={keys:async()=>['knightfall-shell-v75','unrelated-cache'],
   open:async name=>{assert.equal(name,'knightfall-shell-v75');return cache;}};
  let navigated=null;
  const location={origin:'https://ash-fall.com',href:'https://ash-fall.com/arcade/hosted/'+game+'/index.html',
   replace(value){navigated=value;}};
  const window={caches,addEventListener:(name,fn)=>{listeners[name]=fn;},dispatchEvent(){}};
  vm.runInNewContext(source,{document,window,location,caches,navigator:{onLine:true},URL,Date,Event:class{}},{timeout:2000});
  listeners.unhandledrejection();
  const recovery=body.children.find(el=>el.id==='kf-arcade-recovery');
  assert.ok(recovery,'missing recovery dialog');
  const reload=recovery.children.find(el=>el.tagName==='button'&&el.textContent.includes('Reload'));
  assert.ok(reload,'missing fresh retry');
  await reload.events.click();
  assert.ok(navigated?.includes('kf-fresh='),'retry did not navigate to a fresh URL');
  assert.ok(removed.some(url=>url.includes('/'+game+'/game.js')),'game JS cache not cleared');
  assert.ok(removed.some(url=>url.includes('/'+game+'/game.css')),'game CSS cache not cleared');
  assert.ok(removed.every(url=>url.includes('/arcade/hosted/'+game+'/')),'unrelated cached files were removed');
  assert.ok(!removed.some(url=>url.endsWith('/hex-and-whisk/index.html')),'offline merge kitchen document was removed');
 }
});
