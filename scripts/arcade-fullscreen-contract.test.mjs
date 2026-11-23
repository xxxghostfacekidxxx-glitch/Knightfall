import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const script=readFileSync(new URL("../public/arcade-fullscreen.js",import.meta.url),"utf8");
const cabinet=readFileSync(new URL("../public/arcade-cabinet-ui.js",import.meta.url),"utf8");

function fakePage(nativeFullscreen=false){
  const listeners=new Map(),resizeEvents=[];
  function element(tag){
    const el={tag,children:[],dataset:{},attributes:{},listeners:new Map(),className:"",textContent:"",isConnected:true,focus(){this.focused=true},
      append(...items){this.children.push(...items)},
      prepend(...items){this.children.unshift(...items)},
      setAttribute(name,value){this.attributes[name]=value},
      addEventListener(name,fn){this.listeners.set(name,fn)},
      querySelector(selector){return selector===".af-fullscreen-toggle"?this.children.flatMap(x=>x.children||[]).find(x=>x.className==="af-fullscreen-toggle")||null:null}
    };
    el.classList={values:new Set(),add(x){this.values.add(x)},remove(x){this.values.delete(x)},contains(x){return this.values.has(x)},toggle(x,on){if(on)this.add(x);else this.remove(x)}};
    return el;
  }
  const root=element("section");
  const gameHUD=element("div"),canvas=element("canvas");
  gameHUD.className="game-hud";canvas.width=640;canvas.height=360;
  root.append(gameHUD,canvas);
  const body=element("body");
  const document={
    readyState:"complete",body,head:element("head"),fullscreenElement:null,
    createElement:element,
    querySelectorAll(selector){if(selector===".game-panel"||selector===".af-game-root")return [root];return []},
    querySelector(selector){return selector===".af-game-root.af-game-theater"&&root.classList.contains("af-game-theater")?root:null},
    addEventListener(name,cb){listeners.set(name,cb)},
    exitFullscreen:async()=>{document.fullscreenElement=null;listeners.get("fullscreenchange")?.()}
  };
  if(nativeFullscreen)root.requestFullscreen=async()=>{document.fullscreenElement=root;listeners.get("fullscreenchange")?.()};
  else root.requestFullscreen=async()=>{throw Error("Native fullscreen denied")};
  const window={dispatchEvent:e=>resizeEvents.push(e.type),addEventListener(name,cb){listeners.set("window:"+name,cb)}};
  vm.runInNewContext(script,{document,window,location:{pathname:"/arcade-games.html"},Event:class{constructor(type){this.type=type}}});
  const button=root.querySelector(".af-fullscreen-toggle");
  return {root,gameHUD,canvas,button,document,listeners,resizeEvents};
}
test("game controls, HUD and intrinsic canvas dimensions survive mobile theater enter and exit",async()=>{
  const {root,gameHUD,canvas,button,document,listeners}=fakePage(false);
  assert.ok(button,"fullscreen entry control exists");
  assert.equal(canvas.width,640);assert.equal(canvas.height,360);
  await button.listeners.get("click")();
  assert.equal(root.classList.contains("af-game-theater"),true);
  assert.equal(document.body.classList.contains("af-game-theater-open"),true);
  assert.equal(button.attributes["aria-pressed"],"true");
  assert.ok(root.children.includes(gameHUD));
  assert.ok(root.children.includes(canvas));
  listeners.get("keydown")({key:"Escape",preventDefault(){}});
  assert.equal(root.classList.contains("af-game-theater"),false);
  assert.equal(document.body.classList.contains("af-game-theater-open"),false);
  assert.equal(button.attributes["aria-pressed"],"false");
  assert.equal(canvas.width,640);assert.equal(canvas.height,360);
});
test("native fullscreen toggles without hiding the game UI",async()=>{
  const {root,gameHUD,canvas,button,document}=fakePage(true);
  await button.listeners.get("click")();
  assert.equal(document.fullscreenElement,root);
  assert.equal(button.attributes["aria-pressed"],"true");
  assert.ok(root.children.includes(gameHUD));
  assert.ok(root.children.includes(canvas));
  await button.listeners.get("click")();
  assert.equal(document.fullscreenElement,null);
  assert.equal(button.attributes["aria-pressed"],"false");
});
test("shared fullscreen handlers never erase gameplay, scores or controls",()=>{
  assert.doesNotMatch(script,/\.style\.display\s*=\s*["']none/);
  assert.doesNotMatch(script,/\.style\.width\s*=\s*["']100%/);
  assert.doesNotMatch(script,/root\.style\.cssText\s*=/);
  assert.match(script,/af-game-theater/);
  assert.match(script,/canvas,video/);
  assert.match(cabinet,/object-fit:contain/);
  assert.match(cabinet,/height:auto/);
});

test("Android theater cleans up on pagehide and returns focus to its trigger",async()=>{
 const {root,button,document,listeners}=fakePage(false);
 await button.listeners.get("click")();
 assert.equal(root.classList.contains("af-game-theater"),true);
 listeners.get("window:pagehide")();
 assert.equal(root.classList.contains("af-game-theater"),false);
 assert.equal(document.body.classList.contains("af-game-theater-open"),false);
 assert.equal(button.focused,true);
});
test("backgrounding a mobile game closes theater without removing HUD",async()=>{
 const {root,button,document,listeners,gameHUD}=fakePage(false);
 await button.listeners.get("click")();
 document.hidden=true;
 listeners.get("visibilitychange")();
 assert.equal(root.classList.contains("af-game-theater"),false);
 assert.ok(root.children.includes(gameHUD));
});
