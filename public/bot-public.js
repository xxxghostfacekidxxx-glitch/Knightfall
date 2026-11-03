(() => {
"use strict";
const API="https://api.ash-fall.com",q=s=>document.querySelector(s),esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const id=new URLSearchParams(location.search).get("id"),history=[];
let busy=false,available=false;
async function api(path,options={}){const r=await fetch(API+path,{cache:"no-store",credentials:"include",...options,headers:{"content-type":"application/json",...(options.headers||{})}}),d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||"Request failed.");return d;}
function status(t,error=false){q("#public-status").textContent=t;q("#public-status").classList.toggle("error",error);}
function render(){const log=q("#public-chat-log");log.innerHTML=history.length?history.map(m=>'<div class="public-message '+m.role+'">'+esc(m.content)+'</div>').join(""):'<div class="welcome-message">Messages in this demo are temporary and aren\'t saved as bot memory.</div>';log.scrollTop=log.scrollHeight;}
function showStarters(bot){
 const container=q("#bot-starters"),list=q("#bot-starter-prompts"),specialty=q("#bot-specialty");
 if(specialty&&bot.category){specialty.textContent=String(bot.category);specialty.hidden=false;}
 if(!container||!list||!Array.isArray(bot.starters)||!bot.starters.length)return;
 list.replaceChildren();
 for(const suggestion of bot.starters.slice(0,4)){
  if(typeof suggestion!=="string"||!suggestion.trim()||suggestion.length>160)continue;
  const button=document.createElement("button");button.type="button";button.className="bot-starter-suggestion";
  button.textContent=suggestion;
  button.addEventListener("click",()=>{
   const input=q("#public-chat-form input");
   if(!input||input.disabled)return;
   input.value=suggestion;input.focus();
  });
  list.append(button);
 }
 container.hidden=!list.children.length;
}
(async()=>{if(!id||!/^[a-f0-9]{32}$/.test(id)){status("This link is invalid.",true);q("#bot-name").textContent="Bot not found";return;}try{const d=await api("/api/public-bots/"+id);q("#bot-name").textContent=d.bot.name;q("#bot-description").textContent=d.bot.description||"A personal AI bot on Knightfall.";q("#bot-owner").textContent=d.bot.system_bot?"KNIGHTFALL ORIGINAL · OFFICIAL STARTER":"Created by @"+d.bot.owner_username;showStarters(d.bot);const badge=document.querySelector(".public-pill");if(d.bot.is_nsfw){badge.classList.add("nsfw");badge.textContent="NSFW · 18+";const age=await api("/api/adult/status");if(!age.confirmed){const note=q("#public-status");note.textContent="This bot is age-restricted. ";const link=document.createElement("a");link.href="/homepage.html";link.textContent="Open the forum homepage to confirm 18+.";note.append(link);note.classList.add("error");return;}}else{badge.classList.remove("nsfw");badge.textContent=d.bot.system_bot?"KNIGHTFALL ORIGINAL · SFW":"PUBLIC BOT · SFW";}document.title=d.bot.name+" | Knightfall";available=true;q("#public-chat-form input").disabled=false;q("#public-chat-form button").disabled=false;status("Ready. Messages are processed by the bot's AI model.");}catch(e){q("#bot-name").textContent="Not available";q("#bot-description").textContent="This bot may have been made private or removed.";status(e.message,true);}})();
q("#public-chat-form").addEventListener("submit",async e=>{e.preventDefault();const form=e.currentTarget,input=form.elements.message,message=input.value.trim();if(!available||busy||!message)return;history.push({role:"user",content:message});input.value="";busy=true;form.querySelector("button").disabled=true;form.querySelector("button").textContent="Thinking…";render();try{const d=await api("/api/public-bots/"+id+"/chat",{method:"POST",body:JSON.stringify({message,history:history.slice(0,-1)})});history.push({role:"assistant",content:d.reply});status("Reply received.");}catch(x){history.push({role:"assistant",content:"I couldn't get a reply: "+x.message});status(x.message,true);}finally{busy=false;form.querySelector("button").disabled=!available;form.querySelector("button").textContent="Send ↗";render();if(available)input.focus();}});
})();