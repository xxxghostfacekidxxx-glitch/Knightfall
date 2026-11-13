import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {readFileSync} from "node:fs";

const code=readFileSync(new URL("../public/message-live.js",import.meta.url),"utf8");
const inbox=readFileSync(new URL("../public/messages.html",import.meta.url),"utf8");
const heads=readFileSync(new URL("../public/chat-bubbles.js",import.meta.url),"utf8");
const navigation=readFileSync(new URL("../public/nav.js",import.meta.url),"utf8");
new vm.Script(code);

function harness(){
 const sockets=[],listeners={},pageListeners={},events=[];
 class Socket {
  static CONNECTING=0;static OPEN=1;static CLOSING=2;static CLOSED=3;
  constructor(url){this.url=url;this.readyState=0;sockets.push(this);}
  open(){this.readyState=1;this.onopen?.();}
  sendEvent(data){this.onmessage?.({data:JSON.stringify(data)});}
  close(){this.readyState=3;this.onclose?.();}
 }
 const context=vm.createContext({
   window:{addEventListener:(name,fn)=>{listeners[name]=fn}},
   document:{hidden:false,addEventListener:(name,fn)=>{pageListeners[name]=fn}},
   navigator:{onLine:true},WebSocket:Socket,
   console,JSON,Number,Math,
   setTimeout:()=>42,clearTimeout:()=>{}
 });
 vm.runInContext(code,context);
 return {api:context.window.KnightfallLive,sockets,events,context,listeners,pageListeners};
}
test("one shared WebSocket serves multiple subscribers",()=>{
 const h=harness();
 h.api.subscribe(event=>h.events.push(event));
 h.api.subscribe(event=>h.events.push(event));
 assert.equal(h.sockets.length,1);
 assert.equal(h.sockets[0].url,"wss://api.ash-fall.com/api/messages/live");
 h.sockets[0].open();
 assert.equal(h.api.connected,true);
 assert.equal(h.events.filter(e=>e.connected===true).length,2);
});
test("socket forwards only validated identifiers and ignores malformed messages",()=>{
 const h=harness();h.api.subscribe(event=>h.events.push(event));
 const socket=h.sockets[0];socket.open();
 socket.sendEvent({type:"message-event",kind:"message",action:"created",conversationId:17,messageId:9});
 socket.sendEvent({type:"message-event",kind:"other",conversationId:17});
 socket.sendEvent({type:"message-event",kind:"message",conversationId:-4});
 assert.equal(h.events.filter(x=>x.type==="message-event").length,1);
 assert.equal(h.events.find(x=>x.type==="message-event").conversationId,17);
});
test("background tabs close their WebSocket; visible tabs reconnect",()=>{
 const h=harness();h.api.subscribe(()=>{});h.sockets[0].open();
 h.context.document.hidden=true;
 h.pageListeners.visibilitychange();
 assert.equal(h.api.connected,false);
 assert.equal(h.sockets[0].readyState,3);
 h.context.document.hidden=false;
 h.pageListeners.visibilitychange();
 assert.equal(h.sockets.length,2);
});
test("full inbox uses WebSocket on change with a slower HTTP-only fallback",()=>{
 assert.match(inbox,/message-live\.js\?v=/);
 assert.match(inbox,/window\.KnightfallLive/);
 assert.match(inbox,/if\(!window\.KnightfallLive\?\.connected\)liveRefresh/);
 assert.match(inbox,/if\(!window\.KnightfallLive\?\.connected\)refreshTyping/);
 assert.match(inbox,/message-live-state/);
});
test("floating heads use the same signal and avoid frequent polling when live",()=>{
 assert.match(heads,/window\.KnightfallLive\.subscribe/);
 assert.match(heads,/if\(!document\.hidden&&!window\.KnightfallLive\?\.connected\)tick/);
 assert.match(navigation,/message-live\.js\?v=/);
});
