/* Account-scoped conversation organization; no server-side visibility or access changes. */
(function(root){
"use strict";
const clean=ids=>Array.isArray(ids)?[...new Set(ids.map(Number).filter(id=>Number.isSafeInteger(id)&&id>0))].slice(0,200):[];
function read(storage,account){if(!Number.isSafeInteger(Number(account))||Number(account)<1)return {pinned:[],archived:[]};try{const data=JSON.parse(storage.getItem("kf-cs-organization-"+Number(account))||"{}");return {pinned:clean(data?.pinned),archived:clean(data?.archived)};}catch{return {pinned:[],archived:[]};}}
function toggle(storage,account,id,kind){const prefs=read(storage,account);id=Number(id);if(!Number.isSafeInteger(Number(account))||Number(account)<1||!Number.isSafeInteger(id)||id<1||!["pinned","archived"].includes(kind))return prefs;const on=!prefs[kind].includes(id);prefs[kind]=on?[id,...prefs[kind]].slice(0,200):prefs[kind].filter(x=>x!==id);if(on){const other=kind==="pinned"?"archived":"pinned";prefs[other]=prefs[other].filter(x=>x!==id);}try{storage.setItem("kf-cs-organization-"+Number(account),JSON.stringify(prefs));}catch{}return prefs;}
function matches(prefs,c,filter){const id=Number(c.id),archived=prefs.archived.includes(id);if(filter==="archived")return archived;if(archived)return false;if(filter==="pinned")return prefs.pinned.includes(id);if(filter==="online")return c.kind==="group"?Number(c.online_count)>0:Number(c.other_is_online)>0;return true;}
function order(prefs,a,b){return Number(prefs.pinned.includes(Number(b.id)))-Number(prefs.pinned.includes(Number(a.id)));}
root.ChaosphereOrganization=Object.freeze({read,toggle,matches,order});
})(globalThis);