import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const ctx={};runInNewContext(readFileSync('public/arcade/hosted/cinder-mines/engine.js','utf8'),ctx);
const Game=ctx.ChaosMines;
for(const level of ['easy','medium','hard'])test(level+': every possible opening is safe and mine counts stay exact',()=>{
 const size=new Game(level).size;
 for(let i=0;i<size*size;i++){
  const g=new Game(level,()=>.43);g.reveal(i);
  assert.notEqual(g.result,'lost');assert.equal(g.cells[i].n,0);
  assert.equal(g.cells.filter(c=>c.mine).length,g.mines);
  for(const j of [i,...g.neighbors(i)])assert.equal(g.cells[j].mine,false);
  g.cells.forEach((c,j)=>assert.equal(c.n,g.neighbors(j).filter(k=>g.cells[k].mine).length));
 }
});
test('flags cannot exceed mine count, block revealing, and can be removed',()=>{
 const g=new Game();for(let i=0;i<g.mines+1;i++)g.flag(i);
 assert.equal(g.flags,g.mines);g.reveal(0);assert.equal(g.started,false);
 g.flag(0);g.reveal(0);assert.equal(g.started,true);assert.equal(g.cells[0].open,true);
});
test('flare safely starts a field, reveals immediately, and is single use',()=>{
 const g=new Game('hard',()=>.41);assert.equal(g.flare(),true);assert.equal(g.started,true);
 assert.ok(g.cleared>0);assert.notEqual(g.result,'lost');assert.equal(g.flare(),false);
});
test('blocked flare is not consumed',()=>{
 const g=new Game();g.cells.forEach(c=>{c.flag=true});assert.equal(g.flare(),false);assert.equal(g.flareUsed,false);
});
test('correct flags allow number chording; wrong flags can lose',()=>{
 const g=new Game('hard',()=>.42);g.reveal(0);
 const i=g.cells.findIndex((c,i)=>c.open&&c.n&&g.neighbors(i).some(k=>!g.cells[k].mine&&!g.cells[k].open));
 assert.ok(i>=0);g.neighbors(i).filter(k=>g.cells[k].mine).forEach(k=>g.flag(k));
 const before=g.cleared;g.reveal(i);assert.ok(g.cleared>before);assert.notEqual(g.result,'lost');
 const bad=new Game('hard',()=>.42);bad.reveal(0);
 const j=bad.cells.findIndex((c,i)=>c.open&&c.n&&bad.neighbors(i).filter(k=>!bad.cells[k].mine&&!bad.cells[k].open).length>=c.n);
 assert.ok(j>=0);bad.neighbors(j).filter(k=>!bad.cells[k].mine&&!bad.cells[k].open).slice(0,bad.cells[j].n).forEach(k=>bad.flag(k));bad.reveal(j);assert.equal(bad.result,'lost');
});
test('win and loss freeze the game',()=>{
 const g=new Game('hard',()=>.42);g.reveal(0);g.cells.forEach((c,i)=>{if(!c.mine)g.reveal(i)});assert.equal(g.result,'won');
 const before=JSON.stringify(g.cells);g.flag(200);g.reveal(255);assert.equal(g.flare(),false);assert.equal(JSON.stringify(g.cells),before);
 const lost=new Game('hard',()=>.42);lost.reveal(0);lost.reveal(lost.cells.findIndex(c=>c.mine));assert.equal(lost.result,'lost');assert.ok(lost.cells.filter(c=>c.mine).every(c=>c.open));
});
