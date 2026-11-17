import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";

const read=path=>readFileSync(new URL("../public/"+path,import.meta.url),"utf8");
const source=read("arcade-chat-bridge.js");
const css=read("arcade-chat.css");
const bubble=read("chat-bubbles.js");
const sw=read("sw.js");
new vm.Script(source,{filename:"arcade-chat-bridge.js"});
new vm.Script(bubble,{filename:"chat-bubbles.js"});

function harness({signedIn=true,withNav=false,hostname="ash-fall.com"}={}){
 const requestLog=[],styles=[],scripts=[],classNames=new Set(),events=new Map(),clickListeners=[];
 const links=Array.from({length:2},()=>({
   href:"/messages.html",dataset:{},attrs:{},
   addEventListener(event,callback){if(event==="click")clickListeners.push(callback);},
   setAttribute(name,value){this.attrs[name]=value;},
   click(index=0){let prevented=false;const handler=clickListeners[index];if(handler)handler({preventDefault(){prevented=true}});return prevented;}
 }));
 const dock={classList:{add(name){classNames.add(name);}}};
 const window={
   KnightfallChat:undefined,
   addEventListener(name,callback){const old=events.get(name)||[];old.push(callback);events.set(name,old);},
   dispatchEvent(event){for(const listener of events.get(event.type)||[])listener(event);}
 };
 const document={
   querySelectorAll(selector){return selector==='a[data-kf-arcade-chat]'?links:[];},
   querySelector(selector){
     if(selector==='script[src^="/nav.js"]')return withNav?{}:null;
     if(selector==='link[data-kf-arcade-chat-css]')return styles.find(s=>s.dataset.kfArcadeChatCss)||null;
     if(selector==='script[data-kf-message-live]')return scripts.find(s=>s.dataset.kfMessageLive)||null;
     if(selector==='script[data-kf-chat-bubbles]')return scripts.find(s=>s.dataset.kfChatBubbles)||null;
     return null;
   },
   getElementById(id){return id==='kf-chat-heads'?dock:null;},
   createElement(tag){return {tag,dataset:{},handlers:{},addEventListener(name,callback){this.handlers[name]=callback;}};},
   head:{appendChild(node){styles.push(node);}},
   body:{appendChild(node){scripts.push(node);}}
 };
 async function fetch(url,options){
   requestLog.push({url,options});
   return {ok:signedIn,json:async()=>({user:signedIn?{id:42}:null})};
 }
 vm.runInNewContext(source,{window,document,location:{hostname},fetch,console},{timeout:1000});
 return {
   window,links,styles,scripts,classNames,requestLog,
   // The harness exercises the exact async script chain used by production.
   load(index){scripts[index].handlers.load?.();},
   connectChat(){
     let open=false;
     window.KnightfallChat={toggle(){open=!open;window.dispatchEvent({type:"kf:chat-visibility",detail:{open}});return open;},isOpen(){return open;}};
     window.dispatchEvent({type:"kf:chat-ready"});
     return ()=>open;
   }
 };
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));

test("authenticated hosted game loads existing Ruinwire, then toggles chat without page navigation",async()=>{
 const h=harness();
 await flush();
 assert.equal(h.requestLog.length,1);
 assert.equal(h.requestLog[0].url,"https://api.ash-fall.com/api/auth/me");
 assert.equal(h.requestLog[0].options.credentials,"include");
 assert.equal(h.requestLog[0].options.cache,"no-store");
 assert.ok(h.styles.some(x=>x.href.startsWith("/chat-bubbles.css?")));
 assert.ok(h.styles.some(x=>x.href.startsWith("/arcade-chat.css?")));
 assert.equal(h.styles.filter(x=>x.dataset.kfArcadeChatCss).length,1);
 assert.equal(h.scripts.length,1);
 assert.equal(h.scripts[0].src,"/message-live.js?v=20261113-realtime1");
 h.load(0);
 assert.equal(h.scripts.length,2);
 assert.equal(h.scripts[1].dataset.userId,"42");
 assert.match(h.scripts[1].src,/chat-bubbles\.js/);
 const isOpen=h.connectChat();
 assert.equal(h.classNames.has("kf-chat-arcade"),true);
 assert.equal(h.links[0].attrs["aria-expanded"],"false");
 assert.equal(h.links[0].click(),true,"authenticated chat trigger prevents navigation");
 assert.equal(isOpen(),true);
 assert.equal(h.links[0].attrs["aria-expanded"],"true");
 assert.equal(h.links[1].click(1),true,"online-table invite trigger shares the same chat");
 assert.equal(isOpen(),false);
 assert.equal(h.links[1].attrs["aria-expanded"],"false");
});

test("signed-out and unavailable sessions retain a normal inbox link, never load chat",async()=>{
 for(const signedIn of [false]){
   const h=harness({signedIn});
   await flush();
   assert.equal(h.scripts.length,0);
   assert.equal(h.styles.length,0);
   assert.equal(h.links[0].click(),false);
   assert.equal(h.links[0].href,"/messages.html");
 }
 const offline=harness({hostname:"127.0.0.1"});
 await flush();
 assert.equal(offline.requestLog.length,0,"local previews never use production authentication");
 assert.equal(offline.links[0].click(),false);
});

test("City of Cinders reuses nav-owned session and never mounts duplicate chat",async()=>{
 const h=harness({withNav:true});
 await flush();
 assert.equal(h.requestLog.length,0);
 assert.equal(h.scripts.length,0);
 h.connectChat();
 assert.equal(h.styles.filter(x=>x.dataset.kfArcadeChatCss).length,1);
 assert.equal(h.links[0].click(),true);
});

test("arcade chat lives in game headers, not over mobile attack controls",()=>{
 for(const file of [
  "arcade/hosted/imp-inferno/index.html",
  "arcade/hosted/hex-and-whisk/index.html",
  "city-of-cinders.html"
 ]){
   const html=read(file);
   assert.match(html,/arcade-chat-bridge\.js\?v=20261117-arcade1/);
   assert.match(html,/data-kf-arcade-chat/);
   assert.match(html,/href="\/messages\.html"/);
 }
 assert.match(read("city-of-cinders.html"),/class="kf-game-chat-toggle"/);
 assert.match(read("city-of-cinders.html"),/\.game-shell:fullscreen \.kf-game-chat-toggle/);
 assert.match(css,/#kf-chat-heads\.kf-chat-arcade:not\(\.kf-chat-open\)\{display:none!important\}/);
 assert.match(css,/#kf-chat-heads\.kf-chat-arcade\.kf-chat-expanded/);
 assert.match(css,/pointer-events:none!important/);
 assert.match(css,/pointer-events:auto!important/);
 assert.match(css,/#kf-chat-heads\.kf-chat-arcade\.kf-chat-expanded::before\{display:none!important\}/);
 assert.match(css,/kf-chat-panel/);
 assert.match(bubble,/window\.KnightfallChat=Object\.freeze/);
 assert.match(bubble,/event\.stopPropagation\(\);setVisible\(false\)/);
});

test("arcade bridge survives offline install and uses native message storage",()=>{
 assert.match(sw,/"\/arcade-chat-bridge\.js"/);
 assert.match(sw,/"\/arcade-chat\.css"/);
 assert.match(bubble,/\/api\/messages\/conversations\/"\+id/);
 assert.match(bubble,/new CustomEvent\("kf:chat-visibility"/);
 assert.match(source,/if\(onPageWithNavigation\|\|!liveHost\)return/);
 assert.doesNotMatch(source,/\/theme\.css|\/nav\.js\?/, "standalone games must not inject global site theme or navigation");
});
