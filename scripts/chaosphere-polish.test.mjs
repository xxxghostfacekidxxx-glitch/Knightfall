import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {readFileSync} from "node:fs";

const source=file=>readFileSync(new URL("../public/"+file,import.meta.url),"utf8");
const html=source("messages.html");
const css=source("chaosphere-polish.css");
const extras=source("chaosphere-extras.js");
const inline=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).filter(Boolean).pop();

test("Chaosphere's polished surface is scoped, accessible and retains existing security paths",()=>{
 assert.match(html,/href="\/chaosphere-polish\.css\?v=20261120-messenger1"/);
 assert.match(html,/src="\/chaosphere-extras\.js\?v=20261120-messenger1"/);
 assert.match(html,/data-quote-message="'\+m\.id\+'"/);
 assert.match(html,/id="cs-emoji-toggle"[^>]+aria-expanded="false"/);
 assert.match(html,/id="cs-emoji-tray"[^>]+hidden/);
 assert.match(html,/type="button" data-insert-emoji="🔥"/);
 assert.match(extras,/dispatchEvent\(new Event\("input",\{bubbles:true\}\)\)/);
 assert.match(extras,/article\.classList\.contains\("deleted"\)/);
 assert.match(extras,/if\(composer\.hidden\|\|body\.disabled\)return false/);
 assert.doesNotMatch(extras,/fetch\s*\(|XMLHttpRequest|localStorage|sessionStorage/);
 assert.match(html,/messageSendQueues\.set\(conversationId,queued\)/);
 assert.match(html,/pendingAttachments/);
 assert.match(html,/aria-label="Copy link to message"/);
 new vm.Script(extras);
 new vm.Script(inline);
});
test("New appearance preserves existing layout and member theme constraints",()=>{
 assert.match(css,/\.messages-shell\{/);
 assert.match(css,/\.messages-shell \.message\.mine/);
 assert.match(css,/\.messages-shell \.message\.theirs/);
 assert.match(css,/\.messages-shell \.composer/);
 assert.match(css,/\.messages-shell \.conversation\.active/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/@media\(max-width:480px\)/);
 assert.doesNotMatch(css,/[\n}]\s*(?:body|canvas|\.profile-shell|#profile)\s*\{/);
 assert.doesNotMatch(css,/url\(\s*['"]?https?:/);
 assert.doesNotMatch(css,/#[fF][fF]55[dD]8|#[cC]6[fF][fF]45/);
 const old=source("messages.css");
 assert.match(old,/\.chat-panel>#messages\{grid-row:5/);
 assert.match(old,/--messages-chat-top/);
});
test("Quote and emoji actions update the existing draft without sending or storing private text",()=>{
 const controls=new Map(),listeners=new Map();
 const elem=(name,props={})=>({
  name,hidden:false,disabled:false,attrs:{},listeners:{},
  addEventListener(type,callback){this.listeners[type]=callback},
  dispatchEvent(event){this.listeners[event.type]?.(event);return true},
  setAttribute(name,value){this.attrs[name]=value},
  contains(){return false},
  ...props
 });
 const composer=elem("composer");
 const body=elem("body",{value:"",selectionStart:0,selectionEnd:0,
  setRangeText(text,start,end){this.value=this.value.slice(0,start)+text+this.value.slice(end);
   this.selectionStart=this.selectionEnd=start+text.length},
  focus(){this.focused=true},
 });
 const tray=elem("tray",{hidden:true});
 const toggle=elem("toggle");
 const transcript=elem("transcript");
 const status=elem("status",{textContent:"",className:""});
 const elements=new Map([["body",body],["composer",composer],["messages",transcript],["cs-emoji-toggle",toggle],["cs-emoji-tray",tray],["status",status]]);
 const doc={
  querySelector(sel){return sel===".messages-shell"?{}:null},
  getElementById(id){return elements.get(id)||null},
  addEventListener(type,handler){listeners.set(type,handler)}
 };
 const ctx=vm.createContext({document:doc,MutationObserver:class{observe(){}},Event:class{constructor(type,props){this.type=type;this.bubbles=props?.bubbles}}});
 let inputCount=0;body.listeners.input=()=>inputCount++;
 vm.runInContext(extras,ctx);
 toggle.listeners.click();
 assert.equal(tray.hidden,false);assert.equal(toggle.attrs["aria-expanded"],"true");
 const insertEmoji={dataset:{insertEmoji:"🔥"}};
 tray.listeners.click({target:{closest:()=>insertEmoji}});
 assert.equal(body.value,"🔥");assert.equal(inputCount,1);assert.equal(tray.hidden,true);
 const paragraph={textContent:"Private thoughts are mine to quote, not upload"};
 const sender={textContent:"Velvet Venom"};
 const article={classList:{contains:()=>false},querySelector(sel){return sel==="p"?paragraph:sender}};
 const button={closest:()=>article};
 const target={closest:()=>button};
 transcript.listeners.click({target});
 assert.match(body.value,/↳ Velvet Venom: “Private thoughts are mine to quote, not upload”/);
 assert.equal(inputCount,2);assert.equal(body.focused,true);
 assert.match(status.textContent,/Quote inserted/);
 body.disabled=true;const previous=body.value;
 transcript.listeners.click({target});
 assert.equal(body.value,previous,"Disabled composer refuses injection");
 body.disabled=false;body.value="x".repeat(3999);body.selectionStart=3999;body.selectionEnd=3999;
 transcript.listeners.click({target});
 assert.equal(body.value.length,3999,"Long quotes never exceed server body limit");
 assert.match(status.textContent,/4,000-character limit/);
});


test("Pasted image attachments reuse the existing private upload picker and never auto-send",()=>{
 assert.match(extras,/body\.addEventListener\("paste"/);
 assert.match(extras,/attachmentInput\.dispatchEvent\(new Event\("change",\{bubbles:true\}\)\)/);
 assert.match(extras,/^image\\\/\\\(\\?:png\\\|jpeg\\\|gif\\\|webp\\\)/);
 assert.doesNotMatch(extras,/requestSubmit\(|\/api\/messages\/conversations|fetch\s*\(/);
 assert.match(html,/Paste a picture to attach/);
});
test("Mobile conversation keeps Miss Chaos available above the composer",()=>{
 assert.match(css,/body:has\(\.messages-shell \.message-layout\.show-chat\) #miss-chaos-presence/);
 assert.match(css,/top:calc\(var\(--messages-chat-top,62px\) \+ 76px\)!important/);
 assert.match(css,/>:not\(#miss-chaos-launcher\):not\(#mc-restore\)/);
});
