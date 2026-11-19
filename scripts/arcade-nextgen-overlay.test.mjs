import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source=readFileSync('public/arcade/nextgen.js','utf8');
const css=readFileSync('public/arcade/nextgen.css','utf8');

function boot(pathname) {
  const created=[];
  const listeners=new Map();
  const ctx={setTransform(){},clearRect(){},save(){},restore(){},beginPath(){},arc(){},fill(){}};
  const document={
    readyState:'loading',hidden:false,
    documentElement:{classList:{toggle(){}}},
    body:{appendChild(el){created.push(el);}},
    addEventListener(name,fn){listeners.set(name,fn);},
    getElementById(){return null;},
    createElement(tag){return {tagName:tag.toUpperCase(),setAttribute(){},getContext(){return ctx;}};}
  };
  const window={innerWidth:390,innerHeight:844,devicePixelRatio:2,matchMedia:()=>({matches:false})};
  const sandbox={window,document,location:{pathname},navigator:{hardwareConcurrency:8},
    localStorage:{getItem(){return null;},setItem(){}},
    requestAnimationFrame(){}};
  runInNewContext(source,sandbox,{timeout:1000});
  return {window,document,created,listeners};
}

test('hosted games never add a full-viewport FX canvas, even after score bursts',()=>{
  for(const game of ['ash-veil','cinder-gauntlet','ash-sudoku','crypt-smash']){
    const {window,created}=boot('/arcade/hosted/'+game+'/index.html');
    for(let i=0;i<5;i++)window.AshFallVisuals.burst(120,200,2);
    assert.equal(created.filter(el=>el.id==='af-vfx-canvas').length,0,game);
  }
});

test('directory can keep its decorative FX without enabling the hosted game overlay',()=>{
  const {window,created}=boot('/chaos-cartridge.html');
  window.AshFallVisuals.burst(120,200,1);
  assert.equal(created.filter(el=>el.id==='af-vfx-canvas').length,1);
});

test('hosted games have a CSS fallback against stale full-screen canvas scripts',()=>{
  assert.match(css,/body\.af-nextgen:not\(\[data-af-game="directory"\]\) #af-vfx-canvas\s*\{display:none!important;pointer-events:none!important\}/);
});
