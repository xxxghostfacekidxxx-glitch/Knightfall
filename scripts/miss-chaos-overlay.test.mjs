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
  assert.match(dock,/attributes:true,attributeFilter:\['open','hidden','aria-modal','aria-hidden','class','style'\]/);
  assert.match(dock,/r\.type==='attributes'\?!root\.contains\(r\.target\)/);
  assert.match(css,/\.mc-overlay-suspended\{visibility:hidden!important;pointer-events:none!important\}/);
  assert.doesNotMatch(css,/body\.zombie-immersive-open #miss-chaos-p\s*$/);
});
