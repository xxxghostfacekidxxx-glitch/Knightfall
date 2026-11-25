"use strict";
(()=>{
const root=document.getElementById("research-register");if(!root)return;
const heading=document.createElement("h2");heading.textContent="Research reference catalogue";
const label=document.createElement("label");label.textContent="Filter research references";const input=document.createElement("input");input.type="search";input.id="research-filter";label.htmlFor=input.id;
const select=document.createElement("select");select.setAttribute("aria-label","Source classification");
const status=document.createElement("p");status.setAttribute("role","status");const results=document.createElement("div");
root.append(heading,label,input,select,status,results);
let entries=[];
function render(){const q=input.value.trim().toLowerCase();const category=select.value;const matches=entries.filter(e=>(!category||e.classification===category)&&[e.title,e.note,e.classification].join(" ").toLowerCase().includes(q));results.replaceChildren();for(const e of matches){const card=document.createElement("article"),h=document.createElement("h3"),a=document.createElement("a"),tag=document.createElement("small"),p=document.createElement("p");card.className="realm-card";a.href=e.url;a.rel="noopener noreferrer";a.textContent=e.title;h.append(a);tag.textContent=e.classification;p.textContent=e.note;card.append(h,tag,p);results.append(card)}status.textContent=matches.length+" of "+entries.length+" reference entries";}
input.addEventListener("input",render);select.addEventListener("change",render);
async function load(){status.textContent="Loading reference catalogue…";try{const res=await fetch("/assets/force-research-register.json",{cache:"no-cache"});if(!res.ok)throw Error("Catalogue unavailable");const data=await res.json();if(!Array.isArray(data.entries))throw Error("Invalid catalogue");entries=data.entries.filter(e=>{try{return typeof e.title==="string"&&typeof e.note==="string"&&typeof e.classification==="string"&&new URL(e.url).protocol==="https:"}catch{return false}});select.replaceChildren(new Option("All source types",""));for(const c of [...new Set(entries.map(e=>e.classification))].sort())select.add(new Option(c,c));render()}catch(e){status.textContent=e.message;const retry=document.createElement("button");retry.textContent="Retry catalogue";retry.onclick=()=>{retry.remove();load()};results.replaceChildren(retry)}}load();
})();