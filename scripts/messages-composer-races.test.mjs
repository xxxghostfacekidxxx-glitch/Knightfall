import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const html=readFileSync('public/messages.html','utf8');
function deferred(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return {promise,resolve,reject}}
function harness(){
 const nodes=new Map();const $=s=>{if(!nodes.has(s))nodes.set(s,{value:'',style:{},addEventListener(type,fn){this[type]=fn},focus(){}});return nodes.get(s)};
 const request=deferred(),posts=[],deleted=[];
 const c={$ ,currentId:1,composerEpoch:1,sendingConversation:null,sendingAttachmentIds:new Set(),conversationDrafts:new Map(),pendingAttachments:[],attachmentUploads:0,typingHandle:null,clearTimeout,Set,Number,JSON,
 activeConversation:()=>({}),status(){},drawPendingAttachments(){},sendTypingState:async()=>{},loadConversations:async()=>{},refreshCurrent:async()=>{},
 api:async(path,opts)=>{posts.push({path,opts});return request.promise},uploadAttachment:async()=>request.promise,deletePendingAttachment:async id=>deleted.push(id)};
 vm.createContext(c);vm.runInContext(html.slice(html.indexOf('$("#composer").onsubmit='),html.indexOf('\nfunction drawPendingAttachments')),c);
 vm.runInContext(html.slice(html.indexOf('$("#attachment-input").addEventListener'),html.indexOf('\n$("#pending-attachments").addEventListener')),c);
 return {c,$,request,posts,deleted};
}
test('late send keeps another conversation draft and attachments intact',async()=>{
 const h=harness();h.$('#body').value='first draft';h.c.pendingAttachments=[{id:5}];
 const send=h.$('#composer').onsubmit({preventDefault(){}});await Promise.resolve();
 h.c.conversationDrafts.set(1,'first draft');h.c.currentId=2;h.$('#body').value='second draft';h.c.pendingAttachments=[{id:6}];
 h.request.resolve({});await send;
 assert.equal(h.$('#body').value,'second draft');assert.equal(h.c.pendingAttachments[0].id,6);assert.equal(h.c.conversationDrafts.has(1),false);assert.equal(h.posts.length,1);assert.match(h.posts[0].path,/\/1$/);
});
test('keyboard resubmit cannot send twice while request is pending',async()=>{
 const h=harness();h.$('#body').value='hello';const event={preventDefault(){}};
 const send=h.$('#composer').onsubmit(event);await h.$('#composer').onsubmit(event);h.request.resolve({});await send;assert.equal(h.posts.length,1);
});
test('failed send retains draft and releases sending lock',async()=>{
 const h=harness();h.$('#body').value='keep me';const send=h.$('#composer').onsubmit({preventDefault(){}});h.request.reject(Error('network'));await send;assert.equal(h.$('#body').value,'keep me');assert.equal(h.c.sendingConversation,null);
});
for(const returnToOriginal of [false,true])test('late upload is discarded after switch'+(returnToOriginal?' and return':''),async()=>{
 const h=harness();const upload=h.$('#attachment-input').change({target:{files:[{}],value:'file'}});h.c.currentId=returnToOriginal?1:2;h.c.composerEpoch+=2;h.request.resolve({id:9});await upload;assert.equal(h.c.pendingAttachments.length,0);assert.deepEqual(h.deleted,[9]);assert.equal(h.c.attachmentUploads,0);
});
test('attachment refresh leaves older history attachments intact outside its request window',async()=>{
 const nodes=Array.from({length:105},(_,i)=>({dataset:{message:String(i+1)},box:{innerHTML:'saved-'+i},querySelector(){return this.box}}));
 const c={currentId:1,Number,console,API:'https://example.test',esc:String,$:()=>({querySelectorAll:()=>nodes}),api:async()=>({attachments:[]})};vm.createContext(c);
 vm.runInContext(html.slice(html.indexOf('async function refreshAttachments()'),html.indexOf('\n$("#body").addEventListener("keydown"')),c);await c.refreshAttachments();
 assert.equal(nodes[0].box.innerHTML,'saved-0');assert.equal(nodes[4].box.innerHTML,'saved-4');assert.equal(nodes[5].box.innerHTML,'');
});
test('reactions refresh leaves older history reactions intact outside its request window',async()=>{
 const nodes=Array.from({length:55},(_,i)=>({dataset:{message:String(i+1)},classList:{contains:()=>false},box:{innerHTML:'saved-'+i},querySelector(){return this.box}}));
 const c={currentId:1,Number,console,esc:String,$:()=>({querySelectorAll:()=>nodes}),api:async()=>({reactions:[]})};vm.createContext(c);
 const start=html.indexOf('async function refreshReactions()');vm.runInContext(html.slice(start,html.indexOf('\n',start)),c);await c.refreshReactions();
 assert.equal(nodes[0].box.innerHTML,'saved-0');assert.equal(nodes[4].box.innerHTML,'saved-4');assert.equal(nodes[5].box.innerHTML,'');
});
