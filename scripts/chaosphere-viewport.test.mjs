import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {readFileSync} from "node:fs";

const html=readFileSync(new URL("../public/messages.html",import.meta.url),"utf8");
const inline=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
 .map(x=>x[1]).filter(Boolean).pop();
const start=inline.indexOf("function syncMessagesViewport(){");
const end=inline.indexOf("\nsyncMessagesViewport();",start);
assert.ok(start>=0&&end>start,"Message viewport function exists");
const fn=inline.slice(start,end);
function viewport(headerBottom,visibleHeight,offsetTop=0){
 const vars={};
 const root={style:{setProperty(key,value){vars[key]=value}}};
 const ctx=vm.createContext({
  window:{visualViewport:{height:visibleHeight,offsetTop},innerHeight:visibleHeight},
  document:{querySelector:()=>({getBoundingClientRect:()=>({bottom:headerBottom})}),documentElement:root}
 });
 vm.runInContext(fn+"\nsyncMessagesViewport();",ctx);
 return vars;
}
test("mobile chat starts below Knightfall's full tall sticky header",()=>{
 const result=viewport(159,844);
 assert.equal(result["--messages-chat-top"],"159px");
 assert.equal(result["--messages-chat-height"],"685px");
});
test("keyboard viewports cap header allowance so the composer remains visible",()=>{
 const result=viewport(159,400);
 assert.equal(result["--messages-chat-top"],"128px");
 assert.equal(result["--messages-chat-height"],"272px");
});
test("scrolled-away header does not leave a phantom conversation offset",()=>{
 const result=viewport(-10,740);
 assert.equal(result["--messages-chat-top"],"0px");
 assert.equal(result["--messages-chat-height"],"740px");
});
test("visualViewport offsets are handled without overlapping top safe area",()=>{
 const result=viewport(110,600,35);
 assert.equal(result["--messages-chat-top"],"110px");
 assert.equal(result["--messages-chat-height"],"525px");
});
