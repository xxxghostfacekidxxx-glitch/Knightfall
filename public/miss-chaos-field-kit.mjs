/* Miss Chaos field kit: useful, consent-first controls for the floating assistant.
   No additional AI calls, hidden automation, account crossover or third-party dependencies. */
export const FIELD_KIT_PROMPTS=Object.freeze([
 {id:"plan",label:"🧠 Plan",text:"Turn my idea into an achievable plan with priorities, dependencies, free tools, and a clear first step."},
 {id:"code",label:"⌘ Debug",text:"Help me debug a problem. Ask for the failing behavior, expected behavior, reproduction steps, and relevant code before proposing a minimal fix."},
 {id:"craft",label:"✂ Pattern",text:"Help me reverse-engineer a garment, object, or craft from my description or attached photo. Give measurements to take, a materials list, and a practical build pattern. Mark estimates clearly."},
 {id:"art",label:"🎨 Create",text:"Help me design an original character, artwork, game asset, or tattoo concept. Ask about size, style, colors, and production requirements."},
 {id:"write",label:"✍ Write",text:"Help me turn rough notes into polished writing. Preserve my intended meaning and voice, and separate confirmed facts from uncertainties."},
 {id:"learn",label:"🔎 Explain",text:"Teach me a topic in plain language, with a worked example, limitations, and reliable sources to verify."},
 {id:"games",label:"🎮 Games",text:"Recommend real Knightfall arcade games that work well on my device, with the controls and links to play. Check the live site game catalog, and do not invent games."},
 {id:"moon",label:"🌙 Moon",text:"What is the moon phase today?"},
 {id:"journal",label:"🔒 My Journal",text:"Read my recent private Die-ary journal entry previews and help me reflect on themes. Keep this account-private, avoid inventing missing details, and do not publish anything."},
 {id:"mission",label:"𓂀 Mission",privateOnly:true,text:"Review my shared handoff board and help organize a Knightfall development mission: goal, exact files or features to inspect, risks, free-first approach, tests, reviewer approvals, and deployment evidence. Do not claim work is done without evidence."},
 {id:"handoff",label:"🔥 Handoff",privateOnly:true,text:"Read our Between the Flames shared handoff board and help draft an update with what changed, what is verified, blockers, and next steps for both collaborators. Do not post or modify anything automatically."}
]);
export function promptsForMode(mode){
 return FIELD_KIT_PROMPTS.filter(prompt=>!prompt.privateOnly||mode==="owner"||mode==="partner");
}
export function mergePromptDraft(existing,prompt,max=4000){
 const original=String(existing||"");
 const addition=String(prompt||"").trim();
 const composed=original.trim()?original.trimEnd()+"\n\n"+addition:addition;
 return composed.length<=max?composed:null;
}
export function memoForReply(reply,now=new Date()){
 const text=String(reply||"").trim();
 if(!text||text.length>4000) return null;
 const date=now instanceof Date&&!Number.isNaN(now.getTime())?now.toISOString().slice(0,10):"";
 return {title:("Miss Chaos · "+date).slice(0,100),body:text};
}
export function mountMissChaosFieldKit({panel,messages,input,api,onOpenMemo,getMode}){
 if(!panel||!messages||!input||typeof api!=="function"||typeof onOpenMemo!=="function")
   throw Error("Miss Chaos field kit requires its existing chat and Memo Pad controls.");
 const doc=panel.ownerDocument;
 if(panel.querySelector("#mc-field-kit"))return null;
 const bar=doc.createElement("section");
 bar.id="mc-field-kit";bar.className="mc-field-kit";bar.setAttribute("aria-label","Miss Chaos quick tools");
 const heading=doc.createElement("div");heading.className="mc-field-kit-heading";
 const caption=doc.createElement("strong");caption.textContent="⚡ Chaos Console";
 const toggle=doc.createElement("button");toggle.type="button";toggle.className="mc-field-kit-toggle";
 toggle.setAttribute("aria-controls","mc-field-kit-tools");
 const list=doc.createElement("div");list.id="mc-field-kit-tools";list.className="mc-field-kit-tools";
 heading.append(caption,toggle);bar.append(heading,list);
 const mood=panel.querySelector("#mc-mood");
 if(mood) mood.after(bar); else messages.before(bar);
 const notice=doc.createElement("p");notice.id="mc-field-kit-status";
 notice.className="mc-field-kit-status";notice.setAttribute("role","status");notice.setAttribute("aria-live","polite");
 bar.append(notice);
 let expanded=true;
 try{expanded=sessionStorage.getItem("mc:field-kit:expanded")!=="false";}catch{}
 const announce=(message,failed=false)=>{notice.textContent=String(message);notice.dataset.error=failed?"true":"false";};
 function setExpanded(next){
   expanded=!!next;list.hidden=!expanded;
   toggle.textContent=expanded?"Hide tools −":"Show tools +";
   toggle.setAttribute("aria-expanded",String(expanded));
   try{sessionStorage.setItem("mc:field-kit:expanded",String(expanded));}catch{}
 }
 toggle.addEventListener("click",()=>setExpanded(!expanded));
 setExpanded(expanded);
 function refresh(){
   list.replaceChildren();
   for(const prompt of promptsForMode(getMode?.()||"standard")){
     const button=doc.createElement("button");button.type="button";
     button.className="mc-field-kit-chip";button.textContent=prompt.label;
     button.title="Draft a "+prompt.label.replace(/^[^A-Za-z]+/,"")+" request. Nothing is sent yet.";
     button.addEventListener("click",()=>{
       const draft=mergePromptDraft(input.value,prompt.text);
       if(draft===null){announce("Your current draft is too long to add that prompt. Nothing was replaced.",true);return;}
       input.value=draft;
       input.dispatchEvent(new Event("input",{bubbles:true}));
       input.focus({preventScroll:true});announce("Prompt added to your draft. Review it before sending.");
     });
     list.append(button);
   }
 }
 async function copyReply(text,button){
   if(!navigator.clipboard?.writeText){announce("Clipboard unavailable. You can still select the reply text.",true);return;}
   button.disabled=true;
   try{await navigator.clipboard.writeText(text);announce("Reply copied to clipboard.");}
   catch{announce("Copy failed. Select the reply text to copy it manually.",true);}
   finally{button.disabled=false;}
 }
 async function saveMemo(text,button){
   const payload=memoForReply(text);
   if(!payload){announce("This reply is too long for a memo (4,000 characters). Copy it and shorten it first.",true);return;}
   button.disabled=true;button.textContent="Saving…";
   try{
     const result=await api("/api/memos",{method:"POST",body:JSON.stringify(payload)});
     if(!result?.memo?.id)throw Error("Memo save was not confirmed.");
     announce("Saved privately to Memo Pad. Use the pad to publish a copy to your journal, task list, or Between the Flames.");
     button.textContent="✓ Saved memo";
     doc.dispatchEvent(new CustomEvent("kf:memos-updated",{detail:{source:panel}}));
   }catch(e){
     button.textContent="📝 Save memo";
     announce("Memo was not saved: "+String(e?.message||"Request failed"),true);
     button.disabled=false;
   }
 }
 function decorate(message,text){
   if(!message||message.dataset.mcFieldActions==="true")return;
   message.dataset.mcFieldActions="true";
   const value=String(text||message.textContent||"").trim();
   if(!value)return;
   const actions=doc.createElement("div");actions.className="mc-reply-actions";
   const copy=doc.createElement("button");copy.type="button";copy.textContent="Copy";
   copy.setAttribute("aria-label","Copy Miss Chaos reply");
   copy.addEventListener("click",()=>{void copyReply(value,copy);});
   const save=doc.createElement("button");save.type="button";save.textContent="📝 Save memo";
   save.setAttribute("aria-label","Save Miss Chaos reply as a private memo");
   save.addEventListener("click",()=>{void saveMemo(value,save);});
   const open=doc.createElement("button");open.type="button";open.textContent="Open pad";
   open.setAttribute("aria-label","Open Memo Pad to publish or edit saved notes");
   open.addEventListener("click",()=>{void onOpenMemo();});
   actions.append(copy,save,open);
   // Keep reply text itself untouched. Controls are peers, not appended into a text bubble.
   const wrap=doc.createElement("div");wrap.className="mc-assistant-message";
   message.before(wrap);wrap.append(message,actions);
 }
 function enhanceExisting(){
   for(const node of messages.querySelectorAll(".mc-bubble.assistant"))decorate(node,node.textContent);
 }
 refresh();enhanceExisting();
 return Object.freeze({refresh,decorate,enhanceExisting,announce});
}
