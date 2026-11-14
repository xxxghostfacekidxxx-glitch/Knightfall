import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const html=read("public/messages.html");
const bubbles=read("public/chat-bubbles.js");
const backend=read("backend/src/index.js");
const deferred=()=>{let resolve,reject;const promise=new Promise((ok,no)=>{resolve=ok;reject=no});return {promise,resolve,reject};};

function inbox(){
 const nodes=new Map();
 const $=key=>{
  if(!nodes.has(key))nodes.set(key,{
   value:"",hidden:false,disabled:false,style:{},
   focus(){},dispatchEvent(){}
  });
  return nodes.get(key);
 };
 const requests=[],sent=[],drafts=new Map();
 const context={
  $,currentId:7,conversationDrafts:drafts,messageSendQueues:new Map(),
  pendingAttachments:[],attachmentUploads:0,historyPinnedConversationId:null,
  sendingConversation:null,sendingAttachmentIds:new Set(),typingHandle:null,
  currentUser:{id:3},document:{hidden:false},Event,Number,JSON,Set,
  clearTimeout,console,
  rememberConversationDraft(id,text){if(text)drafts.set(id,text);else drafts.delete(id)},
  drawPendingAttachments(){},activeConversation:()=>({id:7,messaging_blocked:0}),
  status(){},sendTypingState:async()=>{},loadConversations:async()=>{},
  refreshCurrent:async()=>{},
  api(path,opts){const request=deferred();requests.push(request);sent.push({path,body:JSON.parse(opts.body)});return request.promise;}
 };
 vm.createContext(context);
 const start=html.indexOf('$("#composer").onsubmit='),end=html.indexOf("\nfunction drawPendingAttachments()",start);
 assert.ok(start>0&&end>start);
 vm.runInContext(html.slice(start,end),context);
 return {context,$,requests,sent};
}
test("full inbox sends twice in the same open chat even when first POST is pending",async()=>{
 const h=inbox(),event={preventDefault(){}};
 h.$("#body").value="first";
 const one=h.$("#composer").onsubmit(event);
 assert.equal(h.$("#body").value,"","first draft clears immediately");
 assert.equal(h.$("#body").disabled,false);
 h.$("#body").value="second";
 const two=h.$("#composer").onsubmit(event);
 assert.equal(h.$("#body").value,"","second draft clears without a chat switch");
 await Promise.resolve();
 assert.equal(h.sent.length,1,"second POST queues behind the first");
 h.requests[0].resolve({id:101});await one;await Promise.resolve();
 assert.equal(h.sent.length,2,"second POST starts after first accepts");
 assert.equal(h.sent[0].body.body,"first");assert.equal(h.sent[1].body.body,"second");
 h.requests[1].resolve({id:102});await two;
 assert.equal(h.context.currentId,7);
 assert.equal(h.$("#composer").hidden,false);
 assert.equal(h.$("#body").disabled,false);
 assert.equal(h.$("#body").value,"");
});
test("failed first send restores its draft and does not trap the composer",async()=>{
 const h=inbox(),event={preventDefault(){}};
 h.$("#body").value="recover me";
 const one=h.$("#composer").onsubmit(event);
 await Promise.resolve();
 h.requests[0].reject(Error("network"));
 await one;
 assert.equal(h.$("#body").value,"recover me");
 assert.equal(h.$("#body").disabled,false);
 assert.equal(h.$("#composer").hidden,false);
 h.$("#body").value="another attempt";
 const two=h.$("#composer").onsubmit(event);
 await Promise.resolve();
 assert.equal(h.sent.length,2);
 h.requests[1].resolve({id:303});await two;
});
function bubble(){
 const composer={hidden:false,addEventListener(type,handler){if(type==="submit")this.submit=handler;}};
 const input={value:"",disabled:false,focus(){}};
 const button={disabled:false};
 const state={active:7,visible:true,sending:false};
 const requests=[],sent=[],drafts=new Map();
 const ctx={
  composer,input,state,drafts,messageSendQueues:new Map(),document:{hidden:false},
  Number,JSON,console,
  getConversation:id=>({id,messaging_blocked:0}),
  rememberDraft(id,value){if(value)drafts.set(id,value);else drafts.delete(id);},
  $:()=>button,announce(){},renderPanel(){},refreshThread:async()=>{},
  refreshConversations:async()=>{},
  api(path,opts){const req=deferred();requests.push(req);sent.push({path,body:JSON.parse(opts.body)});return req.promise;}
 };
 vm.createContext(ctx);
 const a=bubbles.indexOf('composer.addEventListener("submit"'),b=bubbles.indexOf('input.addEventListener("keydown"',a);
 assert.ok(a>0&&b>a);
 vm.runInContext(bubbles.slice(a,b),ctx);
 return {ctx,composer,input,state,requests,sent,button};
}
test("floating bubble accepts a second message while remaining open",async()=>{
 const h=bubble(),event={preventDefault(){}};
 h.input.value="first bubble";
 const one=h.composer.submit(event);
 assert.equal(h.input.value,"");
 h.input.value="second bubble";
 const two=h.composer.submit(event);
 await Promise.resolve();
 assert.equal(h.sent.length,1);
 h.requests[0].resolve({id:11});await one;await Promise.resolve();
 assert.equal(h.sent.length,2);
 h.requests[1].resolve({id:12});await two;
 assert.deepEqual(h.sent.map(x=>x.body.body),["first bubble","second bubble"]);
 assert.equal(h.state.active,7);assert.equal(h.state.visible,true);
 assert.equal(h.composer.hidden,false);assert.equal(h.input.disabled,false);
 assert.equal(h.button.disabled,false);
});
test("message acknowledgement never waits for push notification delivery",async()=>{
 const begin=backend.indexOf("function queueMessageNotifications(");
 const end=backend.indexOf("const DEFAULT_BEHAVIOR_CONFIG=",begin);
 assert.ok(begin>0&&end>begin);
 const delivery=deferred(),waiting=[],notices=[],mentions=[];
 const ctx=vm.createContext({
  Date,Promise,console,
  createNotification:async (_env,notice)=>{notices.push(notice);await delivery.promise;},
  notifyMentions:async (...args)=>{mentions.push(args);}
 });
 vm.runInContext(backend.slice(begin,end),ctx);
 const workerCtx={waitUntil(promise){waiting.push(promise);}};
 const returned=ctx.queueMessageNotifications(workerCtx,{},[
  {user_id:8,muted_until:null}
 ],{id:2,username:"tester"},7,"hello @friend");
 assert.equal(returned,undefined,"response does not await notification");
 assert.equal(waiting.length,1);
 assert.equal(notices.length,1);
 delivery.resolve();
 await waiting[0];
 assert.equal(mentions.length,1);
 assert.match(backend,/queueMessageNotifications\(ctx,env,recipients.results\|\|\[\],user,conversationId,message\)/);
});
