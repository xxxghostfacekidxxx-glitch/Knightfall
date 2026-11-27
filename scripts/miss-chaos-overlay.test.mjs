import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import test from "node:test";

const read=path=>readFileSync(new URL("../public/"+path,import.meta.url),"utf8");
const dock=read("miss-chaos-dock.js");
const css=read("miss-chaos-presence.css");

test("Miss Chaos yields its floating dock to visible page dialogs",()=>{
  const match=dock.match(/function syncOverlaySuspension\(\)\{[\s\S]*?\n\}/);
  assert.ok(match,"overlay arbitration function exists");
  const ownPanel={hidden:false};
  const root={contains:el=>el===ownPanel,classList:{toggle(name,value){this[name]=value}}};
  const ctx=vm.createContext({
    root,
    modalSelector:'dialog[open],[aria-modal="true"],[role="dialog"][data-overlay-blocking="true"]',
    document:{querySelectorAll:()=>ctx.layers},
    getComputedStyle:el=>el.style||{display:"block",visibility:"visible",opacity:"1"}
  });
  vm.runInContext(match[0],ctx);
  const sync=vm.runInContext("syncOverlaySuspension",ctx);

  ctx.layers=[ownPanel,{hidden:false,style:{display:"block",visibility:"visible",opacity:"1"}}];
  sync();
  assert.equal(root.classList["mc-overlay-suspended"],true);

  ctx.layers=[ownPanel,{hidden:true,style:{display:"block",visibility:"visible",opacity:"1"}}];
  sync();
  assert.equal(root.classList["mc-overlay-suspended"],false);
});

test("overlay arbitration tracks modal state without observing its own style writes",()=>{
  assert.match(dock,/dialog\[open\],\[aria-modal="true"\],\[role="dialog"\]\[data-overlay-blocking="true"\]/);
  assert.match(dock,/attributes:true,attributeFilter:\['open','hidden','aria-modal','aria-hidden','class','data-overlay-blocking'\]/);
  assert.match(dock,/if\(root\.contains\(r\.target\)\)return false/);
  assert.match(css,/\.mc-overlay-suspended\{visibility:hidden!important;pointer-events:none!important\}/);
  assert.doesNotMatch(css,/body\.zombie-immersive-open #miss-chaos-p\s*$/);
});

test("dock batches scroll bursts, preserves a trailing scan and sleeps when hidden",()=>{
 const source=dock.match(/function schedule\(\)\{[\s\S]*?\n\}/)?.[0];
 assert.ok(source);
 let clock=1000,scans=0,scheduled=[],raf=[];
 const ctx=vm.createContext({
  frame:0,timer:0,lastScan:0,SCAN_INTERVAL:180,document:{hidden:false},
  performance:{now:()=>clock},
  requestAnimationFrame:fn=>{raf.push(fn);return raf.length},
  setTimeout:(fn,delay)=>{scheduled.push({fn,delay});return scheduled.length},
  recalculate:()=>{scans++;ctx.frame=0;ctx.lastScan=clock}
 });
 vm.runInContext(source,ctx);
 const schedule=vm.runInContext("schedule",ctx);
 for(let i=0;i<60;i++)schedule();
 assert.equal(raf.length,1);
 raf.shift()();
 assert.equal(scans,1);
 clock+=20;
 for(let i=0;i<60;i++)schedule();
 assert.equal(scheduled.length,1);
 assert.equal(scheduled[0].delay,160);
 clock+=160;
 scheduled.shift().fn();
 raf.shift()();
 assert.equal(scans,2);
 ctx.document.hidden=true;
 schedule();
 assert.equal(raf.length+scheduled.length,0);
});
