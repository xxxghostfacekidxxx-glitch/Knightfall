import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {handleMessageSearch,messageSearchPattern} from "./message-search.js";

const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{"content-type":"application/json"}});

function setup({user={id:17},member=true,rows=[]}={}){
 const calls=[];
 const env={DB:{prepare(sql){const call={sql,args:[]};calls.push(call);return {
   bind(...args){call.args=args;return {
     async first(){return member?{ok:1}:null;},
     async all(){return {results:rows};}
   }}};
 }}};
 async function find(params="/api/messages/search?q=hello"){
   const request=new Request("https://api.ash-fall.com"+params);
   const response=await handleMessageSearch(request,env,new URL(request.url),{
     getUser:async()=>user,json,origin:"https://ash-fall.com"
   });
   return {status:response.status,body:await response.json()};
 }
 return {find,calls};
}

test("LIKE wildcards, backslashes and quotes are escaped as literal search terms",()=>{
 assert.equal(messageSearchPattern("50%_\\off"),"%50\\%\\_\\\\off%");
 assert.equal(messageSearchPattern("l'avenir"),"%l'avenir%");
});
test("anonymous searches cannot enumerate messages",async()=>{
 const h=setup({user:null});const r=await h.find();
 assert.equal(r.status,401);assert.equal(h.calls.length,0);
});
test("search must include at least two characters; query text remains parameter-bound",async()=>{
 const h=setup();assert.equal((await h.find("/api/messages/search?q=x")).status,400);
 const result=await h.find("/api/messages/search?q=%25%27%5F");
 assert.equal(result.status,200);
 const query=h.calls.at(-1);
 assert.match(query.sql,/JOIN conversation_members cm ON cm.conversation_id=m.conversation_id AND cm.user_id=\?/);
 assert.match(query.sql,/m.deleted_at IS NULL/);
 assert.match(query.sql,/m.body LIKE \? ESCAPE/);
 assert.equal(query.sql.includes("%'_"),false,"untrusted query never interpolated into SQL");
 assert.equal(query.args[1],17);
 assert.equal(query.args[2],"%\\%'\\_%");
});
test("conversation-scoped search requires membership, even for an administrator",async()=>{
 const h=setup({user:{id:1,role:"god"},member:false});
 const r=await h.find("/api/messages/search?q=secret&conversation_id=42");
 assert.equal(r.status,404);
 assert.equal(h.calls.length,1);
 assert.equal(h.calls[0].args[0],42);assert.equal(h.calls[0].args[1],1);
});
test("search filters results, paginates via descending IDs, and excludes deleted content",async()=>{
 const rows=Array.from({length:3},(_,i)=>({id:103-i,conversation_id:42,body:"Hello "+i}));
 const h=setup({rows});
 const response=await h.find("/api/messages/search?q=hello&limit=2&before=110");
 assert.equal(response.status,200);
 assert.equal(response.body.messages.length,2);
 assert.equal(response.body.has_more,true);
 assert.equal(response.body.next_before,102);
 const query=h.calls.at(-1);
 assert.match(query.sql,/ORDER BY m.id DESC LIMIT \?/);
 assert.equal(query.args.at(-1),3,"request one extra row to determine if another page exists");
 assert.equal(query.args.at(-3),110);
});
test("invalid cursors and conversation identifiers fail closed",async()=>{
 const h=setup();
 assert.equal((await h.find("/api/messages/search?q=test&before=1.5")).status,400);
 assert.equal((await h.find("/api/messages/search?q=test&conversation_id=-7")).status,400);
 assert.equal((await h.find("/api/messages/search?q=test&before=9007199254740993")).status,400);
 assert.equal(h.calls.length,0);
});
test("no matching results return an empty list, not messages from another account",async()=>{
 const h=setup({rows:[]});const r=await h.find("/api/messages/search?q=something");
 assert.deepEqual(r.body.messages,[]);assert.equal(r.body.next_before,null);
});
test("frontend and backend use the same authenticated search endpoint",()=>{
 const html=readFileSync(new URL("../../public/messages.html",import.meta.url),"utf8");
 assert.match(html,/\/api\/messages\/search\?/);
 assert.match(html,/history-search-results/);
 assert.match(html,/searchHistory\(true\)/);
 assert.match(html,/highlightMessageId/);
 assert.match(html,/Jump to latest/);
});
