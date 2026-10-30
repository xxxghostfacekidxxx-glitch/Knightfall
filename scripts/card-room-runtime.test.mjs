import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../public/arcade-card-expansion.html',import.meta.url),'utf8');
const source=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(code=>code.includes('function solInit'));
function table(){
 class Element {
  constructor(){this.style={};this.children=[];this.textContent='';this.listeners={};}
  append(...nodes){this.children.push(...nodes);}
  replaceChildren(...nodes){this.children=nodes;}
  setAttribute(){}
  addEventListener(name,fn){this.listeners[name]=fn;}
  click(){(this.onclick||this.listeners.click)?.();}
 }
 const elements=new Map(),saved=new Map();
 const document={getElementById(id){if(!elements.has(id))elements.set(id,new Element());return elements.get(id);},createElement(){return new Element();},querySelectorAll(){return [];}};
 const context=vm.createContext({document,window:{},localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)},confirm:()=>true,console});
 const expose=`globalThis.game={solSelect,solDest,fcSelect,fcDest,meldDead,rank5,persistCardStats,
 setSol:state=>{({stock,waste,found,tab}=state);sel=null;solRender();},
 sol:()=>({stock,waste,found,tab,moves}),
 setFree:state=>{({fcCols,fcFree,fcFound}=state);fcSel=null;fcRender();},free:()=>({fcCols,fcFree,fcFound})};`;
 vm.runInContext(source.replace(/\}\)\(\);\s*$/,expose+'})();'),context);
 return {game:context.game,element:id=>document.getElementById(id),saved};
}
const card=(r,s='♠')=>({r,s,v:r==='A'?14:r==='K'?13:r==='Q'?12:r==='J'?11:Number(r),up:true});
test('all five tables initialize and record controls share the game scope',()=>{
 const t=table();assert.equal(t.element('all-record').textContent,'0W · 0L · 0 games');
 for(const id of ['sol-new','fc-new','e8-new','gin-new','he-new'])assert.doesNotThrow(()=>t.element(id).click());
 t.game.persistCardStats('chaos-freecell',{result:'win'});assert.equal(t.element('all-record').textContent,'1W · 0L · 1 games');
 t.element('card-reset-stats').click();assert.equal(t.element('all-record').textContent,'0W · 0L · 0 games');
});
test('Solitaire card selection and clear selection update the status without throwing',()=>{
 const t=table();t.game.solSelect('t',0,0);assert.match(t.element('sol-status').textContent,/Card selected/);
 t.element('sol-undo').click();assert.match(t.element('sol-status').textContent,/Selection cleared/);
});
test('Solitaire foundations accept Ace then Two; tableau accepts Ace on opposite-color Two',()=>{
 const t=table(),g=t.game;
 g.setSol({stock:[],waste:[card('2'),card('A')],found:[[],[],[],[]],tab:[[],[],[],[],[],[],[]]});
 g.solSelect('w',1);g.solDest('f',0);g.solSelect('w',0);g.solDest('f',0);
 assert.equal(g.sol().found[0].length,2);assert.equal(g.sol().waste.length,0);
 g.setSol({stock:[],waste:[card('A')],found:[[],[],[],[]],tab:[[card('2','♥')],[],[],[],[],[],[]]});
 g.solSelect('w',0);g.solDest('t',0);assert.equal(g.sol().tab[0].length,2);
});
test('FreeCell occupied foundation accepts the next card',()=>{
 const t=table(),g=t.game;
 g.setFree({fcCols:[[card('2')],[],[],[],[],[],[],[]],fcFree:[null,null,null,null],fcFound:[[card('A')],[],[],[]]});
 g.fcSelect('col',0,0);t.element('fc-foundations').children[0].children[0].click();
 assert.equal(g.free().fcFound[0].length,2);assert.equal(g.free().fcCols[0].length,0);
});
test('Gin counts an unmatched Ace as one, and permits Ace-low runs while poker keeps Ace high',()=>{
 const {game:g}=table();assert.equal(g.meldDead([card('A')]),1);
 assert.equal(g.meldDead([card('A'),card('2'),card('3')]),0);
 assert.equal(g.rank5([card('A'),card('K'),card('Q'),card('J'),card('10')])[0],8);
});
