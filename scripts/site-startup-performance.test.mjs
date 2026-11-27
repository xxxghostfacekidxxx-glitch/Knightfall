import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const source=read("backend/src/index.js");
const settings=source.slice(source.indexOf("async function getSettings(env, keys)"),source.indexOf("function slugify(value)"));
const auth=source.match(/async function getUser\(request, env\) \{[^\n]+\}/)?.[0];
test("public settings preserve defaults and explicit empty values in one bound database read",async()=>{
 const getSettings=new Function("SETTING_DEFAULTS",settings+";return getSettings")({maintenance_mode:"false",site_name:"Knightfall",ticker_osiris:"fallback"});
 let queries=0;
 const env={DB:{prepare(sql){
  queries++;assert.equal(sql,"SELECT key,value FROM site_settings WHERE key IN (?,?,?,?)");
  return {bind(...args){assert.deepEqual(args,["maintenance_mode","site_name","ticker_osiris","ticker_isis"]);return this},
   all:async()=>({results:[{key:"site_name",value:"Ash-Fall"},{key:"ticker_osiris",value:""}]})};
 }}};
 assert.deepEqual(await getSettings(env,["maintenance_mode","site_name","ticker_osiris","ticker_isis"]),{maintenance_mode:"false",site_name:"Ash-Fall",ticker_osiris:"",ticker_isis:null});
 assert.deepEqual(await getSettings(env,[]),{});assert.equal(queries,1);
});
test("authentication uses one account query without allowing suspended or service identities",async()=>{
 let queries=0,deletes=[],account={id:7,status:"active",role:"member"},bot=false,session=true;
 const env={DB:{prepare(sql){
  queries++;assert.match(sql,/NOT EXISTS\(SELECT 1 FROM god_bot_accounts WHERE user_id=users.id\)/);
  return {bind(id){assert.equal(id,7);return this},first:async()=>bot?null:account};
 }},SESSIONS:{delete:async key=>deletes.push(key)}};
 const getUser=new Function("getSession","getCookie","staffCapabilities","SESSION_COOKIE",auth+";return getUser")(async()=>session?{user_id:7}:null,()=>"fixture",()=>({rank_name:"Member"}),"session");
 assert.equal((await getUser({},env)).rank_name,"Member");assert.equal(queries,1);
 bot=true;assert.equal(await getUser({},env),null);assert.equal(deletes.length,1);
 bot=false;account={...account,status:"suspended"};assert.equal(await getUser({},env),null);assert.equal(deletes.length,2);
 session=false;assert.equal(await getUser({},env),null);assert.equal(queries,3);
});
test("optional floating chat tools are gated by panel visibility and coalesce refreshes",()=>{
 const chat=read("public/chat-bubbles.js");
 assert.match(chat,/if\(optionalToolsPending\)return optionalToolsPending/);
 assert.match(chat,/optionalToolsPending=Promise.allSettled\(jobs\)/);
 assert.match(chat,/if\(state.visible\)\{\s*void loadOptionalChatTools\(\)/);
 assert.match(chat,/if\(!window.ChaosphereSend\)import\(/);
});
test("lunar header skips hidden documents and does not repaint an unchanged phase",()=>{
 const moon=read("public/moon-widget.mjs");
 assert.match(moon,/if\(document.hidden\|\|pending\|\|Date.now\(\)-lastRefresh<55_000\)return/);
 assert.match(moon,/if\(index===lastIndex\)return/);
 assert.match(moon,/requestIdleCallback\(refresh/);
 assert.doesNotMatch(moon,/lunarSnapshot\(/);
});
