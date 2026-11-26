import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(path,"utf8");
const backend=read("backend/src/index.js"), turnSource=read("backend/src/arcade-turn-matches.js");
const fullscreen=read("public/arcade-fullscreen.js"), account=read("public/account.html"), messages=read("public/messages.html"), client=read("public/arcade/async-play.js");
const safetyStart=backend.indexOf("  // Member safety controls:");
const safetyEnd=backend.indexOf("  const homeActivityResponse=",safetyStart);
const handleSafety=new Function("request","env","url","requireUser","json","audit","origin","return (async()=>{"+backend.slice(safetyStart,safetyEnd)+"})()");
const handleTurn=new Function(turnSource.replace("export async function handleArcadeTurnMatches","async function handleArcadeTurnMatches")+"\nreturn handleArcadeTurnMatches;")();
const json=(data,status)=>({data,status});
const request=(method,body)=>({method,json:async()=>body});
const actor={id:1,username:"member"};
const quiet=async()=>{};
function safetyFixture(){
 const writes=[],queries=[];
 const env={DB:{prepare(sql){const q={sql,args:[],bind(...args){this.args=args;return this},first:async()=>({id:2}),all:async()=>({results:[]}),run:async()=>({meta:{last_row_id:1}})};queries.push(q);return q},batch:async(items)=>{writes.push(...items);return items.map(()=>({meta:{changes:1}}))}}};
 const run=(path,method,body,user=actor)=>handleSafety(request(method,body),env,{pathname:path},async()=>user,json,quiet,"");
 return {run,writes,queries};
}
test("social block and unblock use the canonical block relation and remove social ties",async()=>{
 const f=safetyFixture();
 assert.equal((await f.run("/api/social/blocks","POST",{user_id:2})).status,200);
 assert.equal(f.writes.length,3);
 assert.match(f.writes[0].sql,/INSERT INTO user_blocks/);
 assert.match(f.writes[1].sql,/DELETE FROM follows/);
 assert.match(f.writes[2].sql,/DELETE FROM friend_requests/);
 assert.deepEqual(f.writes[0].args.slice(0,2),[1,2]);
 await f.run("/api/social/blocks","GET");
 assert.ok(f.queries.some(q=>q.sql.includes("FROM user_blocks b JOIN users")&&q.args[0]===1));
 assert.equal((await f.run("/api/social/blocks/2","DELETE")).status,200);
 assert.match(f.writes[3].sql,/DELETE FROM user_blocks/);
 assert.match(f.writes[4].sql,/DELETE FROM social_user_blocks/);
});
test("malformed reports and block requests reject without mutating data",async()=>{
 const f=safetyFixture();
 for(const payload of [null,[],false]) {
  assert.equal((await f.run("/api/social/blocks","POST",payload)).status,400);
  assert.equal((await f.run("/api/social/report","POST",payload)).status,400);
 }
 assert.equal((await f.run("/api/social/blocks","POST",{user_id:1})).status,400);
 assert.equal((await f.run("/api/social/blocks","POST",{user_id:2},null)).status,401);
 assert.equal(f.writes.length,0);
});
function turnFixture(state,blocked=false){
 const row={id:"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",status:"active",game_key:"connect-four",player_one_id:1,player_two_id:2,current_player_id:1,turn_number:0,state_json:state};
 let batches=0;const queries=[];
 const env={DB:{prepare(sql){queries.push(sql);return {bind(){return this},first:async()=>sql.includes("FROM arcade_turn_matches m")?row:sql.includes("FROM user_blocks")&&blocked?{blocked:1}:null}},batch:async()=>{batches++;return [{meta:{changes:0}}]}}};
 const move=(body,user=actor)=>handleTurn(request("POST",body),env,{pathname:"/api/arcade/turn-matches/"+row.id+"/moves"},{getUser:async()=>user,json,rateLimit:async()=>true,origin:"",createNotification:quiet});
 return {move,queries,batches:()=>batches};
}
test("async moves reject null/string columns, stale turns and corrupt board without writes",async()=>{
 const valid=JSON.stringify({board:Array.from({length:6},()=>Array(7).fill(0))});
 const f=turnFixture(valid);
 for(const body of [{column:null,turn_number:0},{column:"0",turn_number:0},{column:0,turn_number:null}])assert.equal((await f.move(body)).status,400+(body.turn_number===null?9:0));
 assert.equal((await f.move({column:0,turn_number:1})).status,409);
 assert.equal(f.batches(),0);
 for(const state of ["null","invalid","{}"]){
  const bad=turnFixture(state);assert.equal((await bad.move({column:0,turn_number:0})).status,409);assert.equal(bad.batches(),0);
 }
});
test("blocked or unrelated users cannot act; move transaction rechecks block and expected turn",async()=>{
 const valid=JSON.stringify({board:Array.from({length:6},()=>Array(7).fill(0))});
 const blocked=turnFixture(valid,true);
 assert.equal((await blocked.move({column:0,turn_number:0})).status,404);
 assert.equal(blocked.batches(),0);
 const f=turnFixture(valid);
 assert.equal((await f.move({column:0,turn_number:0},{id:3,username:"outsider"})).status,403);
 assert.equal(f.batches(),0);
 assert.equal((await f.move({column:0,turn_number:0})).status,409);
 assert.equal(f.batches(),1);
 assert.ok(f.queries.some(sql=>sql.includes("UPDATE arcade_turn_matches SET state_json")&&sql.includes("AND NOT EXISTS (SELECT 1 FROM user_blocks")&&sql.includes("turn_number=?")));
});
test("recovery uses configured sender and only intended recipient",async()=>{
 const src=read("backend/src/password-reset-email.js").replaceAll("export ","");
 let sent;
 const mockFetch=async(url,opts)=>{sent={url,opts};return {ok:true,status:202}};
 const {resetEmailConfigured,deliverPasswordResetEmail}=new Function("fetch","AbortSignal",src+"\nreturn {resetEmailConfigured,deliverPasswordResetEmail};")(mockFetch,{timeout:ms=>ms});
 const env={PASSWORD_RESET_FROM:"Knightfall <accounts@ash-fall.com>",RESEND_API_KEY:"fixture"};
 assert.equal(resetEmailConfigured(env),true);
 assert.equal(resetEmailConfigured({PASSWORD_RESET_FROM:env.PASSWORD_RESET_FROM}),false);
 assert.deepEqual(await deliverPasswordResetEmail(env,{to:"test@example.invalid",subject:"Recovery",text:"fixture",html:"fixture"}),{ok:true,status:202});
 const payload=JSON.parse(sent.opts.body);
 assert.equal(payload.from,env.PASSWORD_RESET_FROM);
 assert.deepEqual(payload.to,["test@example.invalid"]);
 assert.equal(sent.opts.signal,10000);
});
function fullscreenFixture(){
 const listeners=new Map();let rejectNative,calls=0;
 function element(){
  const values=new Set();
  return {dataset:{},children:[],attributes:{},className:"",isConnected:true,disabled:false,focus(){},append(...items){this.children.push(...items)},prepend(...items){this.children.unshift(...items)},setAttribute(n,v){this.attributes[n]=v},addEventListener(n,fn){this[n]=fn},querySelector(){return this.children.flatMap(x=>x.children).find(x=>x.className==="af-fullscreen-toggle")||null},classList:{add:x=>values.add(x),remove:x=>values.delete(x),contains:x=>values.has(x),toggle(x,on){on?values.add(x):values.delete(x)}}};
 }
 const root=element(),body=element(),head=element();
 const document={body,head,readyState:"complete",hidden:false,createElement:element,querySelectorAll:()=>[root],querySelector:()=>root.classList.contains("af-game-theater")?root:null,addEventListener:(name,fn)=>listeners.set(name,fn)};
 root.requestFullscreen=()=>{calls++;return calls===1?new Promise((_,reject)=>{rejectNative=reject}):Promise.reject(Error("denied"))};
 const window={dispatchEvent(){},addEventListener:(name,fn)=>listeners.set("window:"+name,fn)};
 new Function("document","window","location","Event",fullscreen)(document,window,{pathname:"/arcade-games.html"},class{constructor(type){this.type=type}});
 return {root,document,button:root.querySelector(),reject:()=>rejectNative(Error("denied")),calls:()=>calls,listeners};
}
test("repeated fullscreen taps do not start overlapping transitions",async()=>{
 const f=fullscreenFixture();const first=f.button.click();assert.equal(f.button.disabled,true);
 await f.button.click();assert.equal(f.calls(),1);
 f.reject();await first;
 assert.equal(f.root.classList.contains("af-game-theater"),true);
 assert.equal(f.button.disabled,false);
});
test("backgrounding while native fullscreen is pending cannot reopen theater",async()=>{
 const f=fullscreenFixture();const first=f.button.click();
 f.document.hidden=true;f.listeners.get("visibilitychange")();f.reject();await first;
 assert.equal(f.root.classList.contains("af-game-theater"),false);assert.equal(f.button.disabled,false);
});
test("conversation routes resume actual matches and only preselect accepted friends",()=>{
 assert.match(messages,/pending\|\|relevant\.find\(item=>item\.needs_action\)/);
 assert.match(messages,/async-play\.html\?challenge=/);
 assert.match(messages,/!Number\(c\.messaging_blocked\)/);
 assert.match(client,/friends\.find\(item=>String\(item\.username/);
 assert.match(client,/if\(selectedId===id\)await openMatch\(id\)/);
 assert.match(client,/selectedMatch=null;selectedMoves=\[\]/);
});
test("optional onboarding is account-scoped, resettable, and routes to existing features",()=>{
 for(const path of ["profile-edit.html","friends.html","community.html","chaos-cartridge.html","sanctuary-realm.html","notifications.html"])assert.ok(account.includes('data-first-step="'+path+'"'));
 assert.match(account,/kf-first-steps:v1:"\+String\(user\.id\?\?user\.username\)/);
 assert.match(account,/first-steps-reset/);
 assert.match(account,/No reminders are enabled by this guide/);
 const inline=[...account.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
 for(const source of inline)assert.doesNotThrow(()=>new Function(source));
 assert.doesNotThrow(()=>new Function(client));
});

test("conversation mute rejects null payloads and nonmembers and scopes updates to the current member",async()=>{
 const start=backend.indexOf('  if(url.pathname==="/api/messages/conversations/mute"');
 assert.ok(start>=0);
 const line=backend.slice(start,backend.indexOf("\n",start));
 const handleMute=new Function("request","env","url","requireUser","json","origin","return (async()=>{"+line+"})()");
 let member=true;const queries=[],writes=[];
 const env={DB:{prepare(sql){return {args:[],bind(...args){this.args=args;queries.push({sql,args});return this},first:async()=>member?{conversation_id:5}:null,async run(){writes.push({sql,args:this.args});return {meta:{changes:1}}}}}}};
 const run=body=>handleMute(request("POST",body),env,{pathname:"/api/messages/conversations/mute"},async()=>actor,json,"");
 assert.equal((await run(null)).status,400);
 assert.equal((await run({conversation_id:5,minutes:-1})).status,400);
 member=false;assert.equal((await run({conversation_id:5,minutes:60})).status,404);
 assert.equal(writes.length,0);
 member=true;assert.equal((await run({conversation_id:5,minutes:0})).status,200);
 assert.deepEqual(writes[0].args,[null,5,1]);
 assert.match(writes[0].sql,/WHERE conversation_id=\? AND user_id=\?/);
});
