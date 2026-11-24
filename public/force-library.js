"use strict";
const $=id=>document.getElementById(id);
let generation=0,cursor=null,criteria={q:"",category:""},busy=false;
async function load(reset){
 if(!reset&&busy)return;
 const g=++generation;busy=true;$("more").disabled=true;
 if(reset){criteria={q:$("query").value.trim(),category:$("category").value};cursor=null}
 const params=new URLSearchParams(criteria);if(cursor)params.set("before",String(cursor));
 $("status").textContent="Searching…";
 try{
 const res=await fetch("https://api.ash-fall.com/api/force-library?"+params,{cache:"no-store"});if(!res.ok)throw Error("Search unavailable ("+res.status+")");
 const data=await res.json();if(g!==generation)return;
 if(reset)$("results").replaceChildren();
 for(const item of data.items){const article=document.createElement("article"),h=document.createElement("h2"),a=document.createElement("a"),p=document.createElement("p"),tag=document.createElement("small");a.href="/thread.html?id="+encodeURIComponent(item.id);a.textContent=item.title;h.append(a);tag.textContent=item.category.replaceAll("-"," ");p.textContent=item.excerpt;article.append(h,tag,p);$("results").append(article)}
 cursor=data.next;$("more").hidden=!cursor;$("status").textContent=$("results").children.length+" studies displayed.";
 }catch(e){if(g===generation)$("status").textContent=e.message}finally{if(g===generation){busy=false;$("more").disabled=false}}
}
const initial=new URLSearchParams(location.search).get("category");if(initial&&Array.from($("category").options).some(o=>o.value===initial))$("category").value=initial;
$("search").onsubmit=e=>{e.preventDefault();load(true)};$("more").onclick=()=>load(false);load(true);
