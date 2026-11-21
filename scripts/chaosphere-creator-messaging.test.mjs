import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {readFileSync} from "node:fs";

const inbox=readFileSync(new URL("../public/messages.html",import.meta.url),"utf8");
const backend=readFileSync(new URL("../backend/src/index.js",import.meta.url),"utf8");
const css=readFileSync(new URL("../public/chaosphere-polish.css",import.meta.url),"utf8");
const inline=[...inbox.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1]).filter(Boolean).at(-1);
if(!inline)throw Error("Chaosphere inline controller missing");
const from=inline.indexOf(" function composeNotice(");
const friendBoundary=from<0?-1:inline.slice(from).search(/\
\s*let friendData=/);
const until=friendBoundary<0?-1:from+friendBoundary;
if(from<0||until<from)throw Error("Direct conversation startup functions missing");
const helper=inline.slice(from,until);

function harness({apiError=null,pending=false}={}){
 const calls=[],opened=[],notices=[],drafts=[];
 const trigger={disabled:false,textContent:"Message"};
 const directStart={disabled:false};
 const feedback={hidden:true,textContent:"",classList:{toggle(){}}};
 const input={focused:false,focus(){this.focused=true}};
 const dialog={closed:false,close(){this.closed=true}};
 let finish;
 const blocker=new Promise(resolve=>finish=resolve);
 const ctx=vm.createContext({
  composeFeedback:feedback,directRecipient:input,directStart,composeDialog:dialog,
  currentUser:{id:215,username:"alexxmayfield_1302",role:"member",public_title:"Digital Creator"},
  status:(msg)=>notices.push(msg),
  async api(path,options){
   calls.push({path,body:options?.body});
   if(pending)await blocker;
   if(apiError)throw Error(apiError);
   return {id:918};
  },
  async loadConversations(opts){drafts.push(opts)},
  async openConversation(id){opened.push(id)}
 });
 vm.runInContext("let directMessageStarting=false;\n"+helper,ctx);
 return {ctx,calls,opened,notices,drafts,feedback,input,dialog,trigger,directStart,finish};
}

test("Digital Creator title is not a direct-message authorization restriction",()=>{
 assert.match(backend,/rateLimit\(env,request,"conversation-create",20,600,user\.id\)/);
 assert.doesNotMatch(backend,/rateLimit\(env,request,"conversation-create",20,600\)/);
 const create=backend.slice(backend.indexOf('if(url.pathname==="/api/messages/conversations"&&request.method==="POST")'),backend.indexOf("const reactionsListMatch",backend.indexOf('if(url.pathname==="/api/messages/conversations"&&request.method==="POST")')));
 assert.match(create,/const user=await requireUser\(request,env\)/);
 assert.match(create,/other\.status!=="active"/);
 assert.match(create,/SELECT 1 FROM user_blocks/);
 assert.doesNotMatch(create,/public_title|digital.creator|creator.role|role==="member"/i);
});
test("New Message lists active members without waiting for the friends API",()=>{
 const search=inline.slice(inline.indexOf("memberSearch.oninput="),inline.indexOf('memberResults.addEventListener("click"',inline.indexOf("memberSearch.oninput=")));
 assert.match(search,/api\("\/api\/discover\?q="/);
 assert.doesNotMatch(search,/api\("\/api\/friends/);
 assert.match(search,/term\?250:0/);
 assert.match(inline,/if\(tab!=="discover"\)await loadFriends\(\)/);
 assert.match(inline,/memberSearch\.dispatchEvent\(new Event\("input"\)\)/);
});
test("Direct username entry starts a chat for the Creator account without friend prerequisites",async()=>{
 const t=harness();
 await vm.runInContext('startDirectMessage("  @Knightfall  ", null)',t.ctx);
 assert.equal(t.calls.length,1);
 assert.equal(t.calls[0].path,"/api/messages/conversations");
 assert.equal(JSON.parse(t.calls[0].body).username,"knightfall");
 assert.deepEqual(t.opened,[918]);
 assert.equal(t.dialog.closed,true);
 assert.equal(t.feedback.hidden,false);
 assert.equal(t.directStart.disabled,false);
});
test("Invalid and self usernames get visible errors, without requests or a closed dialog",async()=>{
 const t=harness();
 await vm.runInContext('startDirectMessage("!!!",null)',t.ctx);
 assert.equal(t.calls.length,0);
 assert.match(t.feedback.textContent,/exact username/);
 assert.equal(t.input.focused,true);
 await vm.runInContext('startDirectMessage("@alexxmayfield_1302",null)',t.ctx);
 assert.equal(t.calls.length,0);
 assert.match(t.feedback.textContent,/yourself/);
 assert.equal(t.dialog.closed,false);
});
test("A blocked or unavailable direct conversation reports an error inside the open dialog",async()=>{
 const t=harness({apiError:"Messaging is unavailable between these accounts."});
 await vm.runInContext('startDirectMessage("another_member",null)',t.ctx);
 assert.equal(t.dialog.closed,false);
 assert.match(t.feedback.textContent,/Messaging is unavailable/);
 assert.equal(t.trigger.disabled,false);
});
test("Repeated New Message taps cannot create duplicate conversations while a request is active",async()=>{
 const t=harness({pending:true});
 const first=vm.runInContext('startDirectMessage("recipient_123",null)',t.ctx);
 await vm.runInContext('startDirectMessage("recipient_123",null)',t.ctx);
 assert.equal(t.calls.length,1);
 assert.equal(t.directStart.disabled,true);
 t.finish();await first;
 assert.equal(t.calls.length,1);
 assert.equal(t.directStart.disabled,false);
});
test("New-message entry and empty-inbox controls remain usable on narrow mobile screens",()=>{
 assert.match(inbox,/id="direct-recipient"[^>]+maxlength="25"/);
 assert.match(inbox,/id="direct-start" type="submit"/);
 assert.match(inbox,/id="compose-feedback"[^>]+aria-live="polite"/);
 assert.match(inbox,/data-open-compose/);
 assert.match(inline,/e\.target\.closest\("\[data-open-compose\]"\)/);
 assert.match(css,/@media\(max-width:520px\)[\s\S]*?#direct-start/);
 assert.match(css,/#compose-dialog \.cs-compose-feedback\.error/);
 assert.doesNotMatch(css,/[{,]\s*#profile\s*\{/);
});
