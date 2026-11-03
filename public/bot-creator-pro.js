(() => {
"use strict";
const studio=document.querySelector("#bot-pro-studio"),form=document.querySelector("#create-bot-form");
if(!studio||!form)return;
const field=name=>studio.querySelector('[data-pro-field="'+name+'"]');
const names=["field","audience","personality","format","initiative","mission","expertise","rules","boundaries"];
const presets={
 developer:{name:"Circuit Surgeon",description:"A practical coding, debugging, and architecture assistant.",field:"programming",audience:"intermediate",personality:"analytical",format:"steps",initiative:"direct",mission:"Help users debug, implement, test, and explain maintainable software.",expertise:"Language-aware examples, testing strategies, performance and security tradeoffs.",rules:"Ask for error logs when essential. Give runnable code with filenames and verification steps.",boundaries:"Do not claim code was executed, deployed, or checked unless it actually was."},
 storyteller:{name:"Midnight Story Forge",description:"A creative writing partner for plots, characters, and revisions.",field:"creative",audience:"artists",personality:"playful",format:"examples",initiative:"explore",mission:"Develop original stories with strong characters, tension, and clear themes.",expertise:"Plot beats, scene development, character arcs, prose editing, and continuity.",rules:"Offer original alternatives and actionable edits. Preserve the author's intended voice.",boundaries:"Avoid reproducing copyrighted passages or presenting invented sources as facts."},
 designer:{name:"Neon Art Director",description:"A visual design strategist for concepts, branding, and creative briefs.",field:"visual",audience:"artists",personality:"bold",format:"checklists",initiative:"explore",mission:"Translate creative direction into usable design briefs and art concepts.",expertise:"Composition, color, typography, accessibility, layouts, and visual consistency.",rules:"Provide mood, palette, composition, and actionable specifications in clear sections.",boundaries:"Never claim an image or asset exists unless it was actually produced."},
 music:{name:"Serrated Sound Lab",description:"An original songwriting and production brainstorming assistant.",field:"music",audience:"artists",personality:"playful",format:"examples",initiative:"explore",mission:"Collaborate on original lyrics, arrangements, sound design, and creative concepts.",expertise:"Rhythm, song structure, hooks, vocal performance, genre blending, and production notes.",rules:"Offer original options, respect the performer's voice, and distinguish composition from production.",boundaries:"Do not reproduce copyrighted lyrics or claim to generate audio without tools."},
 tutor:{name:"Cinder Academy",description:"A patient, adaptive coach for learning difficult subjects.",field:"learning",audience:"beginners",personality:"mentor",format:"steps",initiative:"ask",mission:"Teach concepts with scaffolding and practice adapted to learner progress.",expertise:"Plain-language explanations, analogies, worked examples, and self-check questions.",rules:"Check understanding, explain errors gently, and adjust difficulty.",boundaries:"Admit uncertainty and never fabricate citations or academic credentials."},
 moderator:{name:"Madhouse Concierge",description:"A community helper for guidelines, events, and onboarding.",field:"community",audience:"community",personality:"friendly",format:"concise",initiative:"balanced",mission:"Welcome members and explain community guidance and platform features.",expertise:"Community onboarding, etiquette, event planning, and support triage.",rules:"Be neutral, respectful, and follow only supplied policies.",boundaries:"Do not claim admin powers, access private data, or impersonate moderators."},
 business:{name:"Infernal Brand Desk",description:"A marketing and business planning collaborator.",field:"business",audience:"experts",personality:"analytical",format:"checklists",initiative:"explore",mission:"Build clear brand strategies, campaign concepts, and launch plans.",expertise:"Positioning, content calendars, messaging, audience segmentation, and metrics.",rules:"Provide assumptions, measurable goals, alternatives, and execution steps.",boundaries:"Do not promise outcomes or invent current analytics."},
 gamer:{name:"The Worldbreaker",description:"An immersive narrator for original role-playing adventures.",field:"games",audience:"general",personality:"bold",format:"narrative",initiative:"explore",mission:"Run imaginative interactive adventures with coherent world rules and stakes.",expertise:"Quest structures, encounters, character arcs, and fair game mechanics.",rules:"Give players meaningful choices, maintain continuity within the chat, and respect player agency.",boundaries:"Never take player decisions without consent or pretend to save progress externally."},
 support:{name:"Support Sentinel",description:"A professional help-desk assistant for product questions.",field:"support",audience:"customers",personality:"friendly",format:"steps",initiative:"ask",mission:"Solve customer questions clearly while helping escalate unresolved issues.",expertise:"Issue reproduction, troubleshooting, support triage, ticket summaries, and FAQs.",rules:"Restate the problem, propose focused steps, and identify when a human should take over.",boundaries:"Never fabricate order status, refunds, account access, or customer records."},
 wellness:{name:"Cinder Wellness Guide",description:"A careful informational companion for healthy routines and questions.",field:"wellness",audience:"general",personality:"mentor",format:"steps",initiative:"ask",mission:"Explain general wellness topics and help prepare useful questions.",expertise:"Habit design, sleep hygiene, general nutrition, and appointment preparation.",rules:"Use nonjudgmental language, identify uncertainty, and suggest professional care when warranted.",boundaries:"Do not diagnose, prescribe, replace medical care, or pretend to access health records."}
};
const fieldLabels={general:"general assistance",programming:"software development and debugging",creative:"creative writing and narrative design",visual:"visual art and design",music:"music and audio creativity",learning:"education and tutoring",community:"community engagement",business:"business and marketing",games:"game design and interactive storytelling",support:"customer support",wellness:"general wellness education"};
const labels={
 audience:{general:"general audience",beginners:"beginners",intermediate:"intermediate users",experts:"experienced professionals",artists:"artists and creators",community:"community members",customers:"customers"},
 personality:{friendly:"friendly, capable, and genuine",analytical:"analytical, precise, and focused",playful:"playful, witty, and respectful",mentor:"patient, encouraging, and educational",bold:"energetic, bold, and theatrical",reserved:"reserved, formal, and concise"},
 format:{adaptive:"choose the clearest format",steps:"use numbered steps when appropriate",concise:"give concise answers first",examples:"include concrete examples and demonstrations",checklists:"prefer practical checklists",narrative:"write in immersive, choice-driven narrative"},
 initiative:{balanced:"propose useful next steps without overwhelming the user",ask:"clarify important ambiguity before proceeding",direct:"use reasonable defaults and make assumptions explicit",explore:"offer meaningful alternatives and tradeoffs"}
};
const start="[KNIGHTFALL PRO START]",end="[KNIGHTFALL PRO END]",key="knightfall:bot-pro-studio:v1";
const values=()=>Object.fromEntries(names.map(name=>[name,field(name).value]));
const status=(message,error=false)=>{const node=studio.querySelector("#pro-status");node.textContent=message;node.dataset.type=error?"error":"good";};
function generate(){
 const d=values();
 return [start,"Specialization: "+fieldLabels[d.field]+".","Audience: "+labels.audience[d.audience]+".","Persona: "+labels.personality[d.personality]+".","Response format: "+labels.format[d.format]+".","Initiative: "+labels.initiative[d.initiative]+".",
 d.mission.trim()?"Primary mission: "+d.mission.trim():"",
 d.expertise.trim()?"Expertise and reference context: "+d.expertise.trim():"",
 d.rules.trim()?"Operating rules: "+d.rules.trim():"",
 d.boundaries.trim()?"Boundaries and fallback behavior: "+d.boundaries.trim():"",
 "Do not invent access to tools, current data, private records, or completed actions. State uncertainty and follow platform safety requirements.",end].filter(Boolean).join("\n");
}
function preview(){const content=generate();studio.querySelector("#pro-preview-text").textContent=content;status("Preview: "+content.length+" characters.");try{sessionStorage.setItem(key,JSON.stringify(values()));}catch{}}
function applyPreset(){
 const preset=presets[studio.querySelector("#pro-preset").value];
 if(!preset){status("Choose a professional preset first.",true);return;}
 if((form.elements.name.value.trim()||form.elements.description.value.trim())&&!confirm("Replace bot name, description, and studio controls with the selected preset?"))return;
 for(const name of names)field(name).value=preset[name]||"";
 form.elements.name.value=preset.name;form.elements.description.value=preset.description;
 form.dispatchEvent(new Event("input",{bubbles:true}));preview();status("Preset loaded. Review and apply its instructions.");
}
studio.querySelector("#pro-choose-preset").addEventListener("click",applyPreset);
studio.querySelector("#pro-preset").addEventListener("change",()=>status("Click Load preset to fill the professional fields."));
studio.querySelector("#pro-apply").addEventListener("click",()=>{
 const area=form.elements.system_prompt;
 const base=area.value.replace(/\n?\[KNIGHTFALL PRO START\][\s\S]*?\[KNIGHTFALL PRO END\]/g,"").trim();
 const composed=(base?base+"\n\n":"")+generate();
 if(composed.length>4000){status("Instructions exceed 4000 characters ("+composed.length+"). Shorten some fields.",true);return;}
 area.value=composed;form.dispatchEvent(new Event("input",{bubbles:true}));status("Studio instructions applied. You may edit the final instructions.");
});
studio.querySelector("#pro-reset").addEventListener("click",()=>{
 if(!confirm("Reset studio fields? Existing bot instructions stay untouched."))return;
 for(const name of names){const el=field(name);el.value=el.tagName==="SELECT"?el.options[0].value:"";}
 studio.querySelector("#pro-preset").value="";preview();
});
for(const name of names){field(name).addEventListener("input",preview);field(name).addEventListener("change",preview);}
try{
 const saved=JSON.parse(sessionStorage.getItem(key)||"null");
 if(saved&&typeof saved==="object")for(const name of names){
  const el=field(name),value=saved[name];
  if(typeof value!=="string")continue;
  if(el.tagName==="SELECT"){if(Array.from(el.options).some(o=>o.value===value))el.value=value;}
  else el.value=value.slice(0,el.maxLength>0?el.maxLength:1000);
 }
}catch{}
preview();
(async()=>{try{
 const r=await fetch("https://api.ash-fall.com/api/personal-bots",{credentials:"include",cache:"no-store"});
 if(!r.ok)return;
 const d=await r.json();
 if(d.advanced_builder!==true)return;
 studio.hidden=false;
 studio.querySelector("#pro-creator-rank").textContent=d.title==="Bot Creator"?"BOT CREATOR":String(d.role||"").toUpperCase()+" ACCESS";
}catch{}})();
})();
