import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {readFileSync} from "node:fs";
const source=readFileSync(new URL("../public/arcade-repair.js",import.meta.url),"utf8");
const sw=readFileSync(new URL("../public/sw.js",import.meta.url),"utf8");
const html=readFileSync(new URL("../public/chaos-cartridge.html",import.meta.url),"utf8");
const sudoku=readFileSync(new URL("../public/arcade/hosted/ash-sudoku/index.html",import.meta.url),"utf8");
function harness(){
 const clickHandlers=[],removed=[],storage=new Map(),cached=[
  {url:"https://ash-fall.com/arcade/hosted/ash-sudoku/index.html"},
  {url:"https://ash-fall.com/arcade/hosted/hex-and-whisk/game.js"},
  {url:"https://ash-fall.com/messages.html"},
  {url:"https://ash-fall.com/theme.css"}
 ];
 const button={disabled:false,attrs:{},textContent:"",events:{},setAttribute(k,v){this.attrs[k]=v;},
   removeAttribute(k){delete this.attrs[k];},addEventListener(k,fn){this.events[k]=fn;},click(){this.events.click?.();}};
 const status={hidden:true,textContent:""};
 const document={
  getElementById(id){return id==="arcade-repair"?button:id==="arcade-repair-status"?status:null;},
  addEventListener(k,fn,capture){if(k==="click")clickHandlers.push(fn);}
 };
 const cache={async keys(){return cached;},async delete(item){removed.push(item.url);return true;}};
 const caches={async keys(){return ["knightfall-shell-v75","other-site-cache"];},async open(n){assert.equal(n,"knightfall-shell-v75");return cache;}};
 const context={window:{caches},document,caches,URL,Date,location:{origin:"https://ash-fall.com",href:"https://ash-fall.com/chaos-cartridge.html"},
   sessionStorage:{getItem(k){return storage.get(k)||null;},setItem(k,v){storage.set(k,v);}}};
 vm.runInNewContext(source,context,{timeout:1000});
 return {button,status,removed,storage,async settle(){await new Promise(r=>setImmediate(r));},
   link(raw){
     const link={href:new URL(raw,context.location.origin).href};
     clickHandlers.forEach(fn=>fn({target:{closest(){return link;}},button:0,defaultPrevented:false}));
     return link.href;
   }
 };
}
test("arcade repair leaves private conversations, theme, and saved data alone",async()=>{
 const h=harness();h.button.click();await h.settle();
 assert.equal(h.removed.length,2);
 assert.ok(h.removed.every(u=>u.includes("/arcade/")));
 assert.equal(h.storage.get("kf-arcade-fresh-launch"),"1");
 assert.match(h.status.textContent,/saves and messages are untouched/);
 assert.equal(h.button.disabled,false);
});
test("fresh launches modify only same-origin hosted game links",async()=>{
 const h=harness();h.button.click();await h.settle();
 assert.match(h.link("https://ash-fall.com/arcade/hosted/ash-sudoku/index.html"),/kf-fresh=\d+/);
 assert.equal(h.link("https://ash-fall.com/messages.html"),"https://ash-fall.com/messages.html");
 assert.equal(h.link("https://example.com/arcade/hosted/x/index.html"),"https://example.com/arcade/hosted/x/index.html");
});
test("new PWA fetch always refreshes game documents, preserving kitchen offline fallback",()=>{
 assert.match(sw,/const navigation=request\.url\.includes\("\/arcade\/hosted\/"\)/);
 assert.match(sw,/new Request\(request,\{cache:"no-store"\}\)/);
 assert.match(sw,/caches\.match\("\/arcade\/hosted\/hex-and-whisk\/index\.html"/);
 assert.match(sw,/knightfall-shell-v75/);
 assert.match(html,/id="arcade-repair"/);
 assert.match(html,/arcade-repair\.js/);
});
test("Sudoku board precedes controls on narrow phones",()=>{
 assert.ok(sudoku.includes("@media(max-width:850px)"),"mobile breakpoint retained");
 assert.ok(sudoku.includes(".play-area{order:0}.sudoku-sidebar{order:1"),"board is first in the mobile grid");
});
