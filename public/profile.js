const API = "https://api.ash-fall.com";
const root = document.querySelector("#profile");
const username = new URLSearchParams(location.search).get("username");
const adminUserId = new URLSearchParams(location.search).get("admin_user_id");
const esc = (value="") => String(value).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const fmt = value => new Date(value).toLocaleDateString([], {year:"numeric",month:"short",day:"numeric"});
const api = async (path,opts={}) => { const r=await fetch(API+path,{credentials:"include",cache:"no-store",...opts,headers:{"content-type":"application/json",...(opts.headers||{})}}); const d=await r.json().catch(()=>({})); if(!r.ok) throw Error(d.error||"Request failed."); return d; };

function render(d,adminView=false){
  const u=d.user;
  const avatar=u.avatar_url?'<img class="avatar-img" src="'+esc(u.avatar_url)+'" alt="">':'<div class="avatar">'+esc((u.display_name||u.username).slice(0,1).toUpperCase())+'</div>';
  const online=u.is_online?'<span class="presence online">● online</span>':'<span class="presence">● offline</span>';
  const actions=adminView?'<span class="admin-view">READ-ONLY ADMIN INSPECTION</span>':'<div class="profile-actions"><button id="follow" class="action primary">'+(u.is_following?"Following":"Follow")+'</button><button id="block" class="action">'+(u.is_blocked?"Unblock":"Block")+'</button><a class="action" href="/messages.html">Message</a></div>';
  root.innerHTML='<div class="profile-top">'+avatar+'<div class="profile-heading"><p class="eyebrow">COMMUNITY MEMBER</p><h1>'+esc(u.display_name)+'</h1><p class="handle">@'+esc(u.username)+' · '+esc(u.role)+'</p>'+online+'</div></div>'+
    '<div class="profile-stats"><div><b>'+(u.thread_count||0)+'</b><span>Threads</span></div><div><b>'+(u.post_count||0)+'</b><span>Replies</span></div><div><b>'+(u.followers||0)+'</b><span>Followers</span></div><div><b>'+(u.following_count||0)+'</b><span>Following</span></div></div>'+
    '<div class="profile-actions-wrap">'+actions+'</div>'+
    (u.bio?'<p class="bio">'+esc(u.bio)+'</p>':"")+
    '<dl><div><dt>Member since</dt><dd>'+fmt(u.created_at)+'</dd></div>'+
    (u.location?'<div><dt>Location</dt><dd>'+esc(u.location)+'</dd></div>':"")+
    (u.pronouns?'<div><dt>Pronouns</dt><dd>'+esc(u.pronouns)+'</dd></div>':"")+
    (u.website_url?'<div><dt>Website</dt><dd><a href="'+esc(u.website_url)+'" rel="noopener noreferrer nofollow">'+esc(u.website_url)+'</a></dd></div>':"")+
    '</dl><div class="activity-grid"><section><h2>Recent threads</h2>'+((d.threads||[]).map(t=>'<a class="activity" href="/thread.html?id='+t.id+'"><strong>'+esc(t.title)+'</strong><small>'+esc(t.category_name)+' · '+fmt(t.created_at)+'</small></a>').join("")||'<p class="muted">No threads yet.</p>')+'</section><section><h2>Recent replies</h2>'+((d.posts||[]).map(p=>'<a class="activity" href="/thread.html?id='+p.thread_id+'"><strong>'+esc(p.thread_title)+'</strong><small>'+esc(p.body).slice(0,180)+' · '+fmt(p.created_at)+'</small></a>').join("")||'<p class="muted">No replies yet.</p>')+'</section></div>';
  if(adminView){const meta=document.createElement("div");meta.className="admin-meta";meta.innerHTML="<span>Account: "+esc(u.status||"unknown")+"</span><span>Email: "+esc(u.email||"not exposed")+"</span><span>Reports filed: "+((d.reports||[]).length)+"</span>";root.querySelector(".profile-actions-wrap").after(meta);}
  if(!adminView){
    const f=document.querySelector("#follow"),b=document.querySelector("#block");
    if(f)f.onclick=async()=>{try{const r=await api("/api/users/"+encodeURIComponent(u.username)+"/follow",{method:u.is_following?"DELETE":"POST"});u.is_following=r.following;f.textContent=r.following?"Following":"Follow";u.followers+=r.following?1:-1;root.querySelector(".profile-stats div:nth-child(3) b").textContent=u.followers}catch(e){alert(e.message)}};
    if(b)b.onclick=async()=>{try{const r=await api("/api/users/"+encodeURIComponent(u.username)+"/block",{method:u.is_blocked?"DELETE":"POST"});u.is_blocked=r.blocked;b.textContent=r.blocked?"Unblock":"Block";if(r.blocked){f.disabled=true;f.textContent="Blocked";}else f.disabled=false}catch(e){alert(e.message)}};
  }
}
function renderDeveloperControls(){
  const panel=document.createElement("section");
  panel.className="developer-card";
  panel.id="profile-developer-controls";
  panel.innerHTML='<div class="developer-head"><div><p class="eyebrow">PRIVATE / ROOT ACCESS</p><h2>Miss Chaos · Developer Options</h2><p>Configure the public character architecture. Changes apply to future replies.</p></div><a class="action primary" href="/admin.html">Admin Dashboard ↗</a></div>'+
  '<details open class="chaos-config-section"><summary>Core personality</summary><form id="developer-form" class="developer-form">'+
  '<label for="dial-wit">Wit <output id="dial-wit-value">75</output></label><input id="dial-wit" name="chaos_wit" type="range" min="0" max="100" value="75">'+
  '<label for="dial-sarcasm">Sarcasm <output id="dial-sarcasm-value">60</output></label><input id="dial-sarcasm" name="chaos_sarcasm" type="range" min="0" max="100" value="60">'+
  '<label for="dial-darkness">Dark humor <output id="dial-darkness-value">55</output></label><input id="dial-darkness" name="chaos_darkness" type="range" min="0" max="100" value="55">'+
  '<label for="dial-warmth">Warmth <output id="dial-warmth-value">70</output></label><input id="dial-warmth" name="chaos_warmth" type="range" min="0" max="100" value="70">'+
  '<label for="dial-philosophy">Philosophical depth <output id="dial-philosophy-value">65</output></label><input id="dial-philosophy" name="chaos_philosophy" type="range" min="0" max="100" value="65">'+
  '<label for="chaos-custom-instructions">Extra developer guidance <small>Max 1,200 characters</small></label><textarea id="chaos-custom-instructions" name="chaos_custom_instructions" rows="4" maxlength="1200" placeholder="Optional instructions for public Miss Chaos…"></textarea>'+
  '<div class="developer-actions"><button type="submit" class="action primary">Save personality</button><p id="developer-status" role="status" hidden></p></div></form></details>'+
  '<details open class="chaos-config-section"><summary>Behavioral architecture</summary><form id="behavior-form" class="developer-form">'+
  '<label for="behavior-core-identity">Core identity <small>Max 2,000 characters</small></label><textarea id="behavior-core-identity" name="coreIdentity" rows="4" maxlength="2000"></textarea>'+
  '<label for="behavior-autonomy">Autonomy</label><select id="behavior-autonomy" name="autonomy"><option value="strict">Strict rule-driven</option><option value="guided">Rule-guided autonomy</option><option value="autonomous">High autonomy</option></select>'+
  '<label for="behavior-challenge">How she challenges you</label><select id="behavior-challenge" name="challenge"><option value="asked">Only when asked</option><option value="warranted">When warranted</option><option value="adversarial">Adversarial debate</option></select>'+
  '<label for="behavior-evolution">Personality evolution</label><select id="behavior-evolution" name="evolution"><option value="fixed">Fixed configuration</option><option value="controlled">Suggest changes, require approval</option><option value="adaptive">Propose contextual adaptations, never silently change identity</option></select>'+
  '<label for="behavior-memory-policy">Memory policy</label><select id="behavior-memory-policy" name="memoryPolicy"><option value="explicit_only">Only explicitly saved memories</option><option value="explicit_relevance">Explicit memories ranked by relevance</option><option value="context_and_explicit">Conversation context plus explicitly saved memories</option></select>'+
  '<label for="behavior-conflict-priority">Rule conflict priority <small>One priority per line</small></label><textarea id="behavior-conflict-priority" name="conflictPriority" rows="5" maxlength="1500"></textarea>'+
  '<label for="behavior-default-mode">Default mode</label><select id="behavior-default-mode" name="defaultMode"><option value="automatic">Automatic situational judgment</option><option value="standard">Standard</option><option value="analytical">Analytical</option><option value="philosophical">Philosophical</option><option value="chaos">Chaos</option><option value="supportive">Supportive</option><option value="confrontational">Confrontational</option><option value="creative">Creative</option></select>'+
  '<p class="config-label">Available behavioral modes</p><div class="chaos-check-grid">'+
  [['standard','Standard'],['analytical','Analytical'],['philosophical','Philosophical'],['chaos','Chaos'],['supportive','Supportive'],['confrontational','Confrontational'],['creative','Creative']].map(([k,l])=>'<label class="chaos-check"><input type="checkbox" name="mode_'+k+'" checked><span>'+l+'</span></label>').join('')+'</div>'+
  '<p class="config-label">Behavioral rules</p><div class="chaos-check-grid">'+
  [['honestOpposition','Honest opposition'],['contextualHumor','Contextual humor'],['challengeWithoutContempt','Challenge without contempt'],['evidenceBeforeConfidence','Evidence before confidence'],['emotionalRecognition','Recognize emotional context'],['intellectualIndependence','Intellectual independence'],['practicalCompletion','Practical completion']].map(([k,l])=>'<label class="chaos-check"><input type="checkbox" name="rule_'+k+'" checked><span>'+l+'</span></label>').join('')+'</div>'+
  '<label for="behavior-custom-rules">Additional rules <small>One rule per line, up to 20 rules / 5,000 characters</small></label><textarea id="behavior-custom-rules" name="customRules" rows="5" maxlength="5000" placeholder="Add your own precise behavioral rules, one per line…"></textarea>'+
  '<label for="behavior-evaluation-scenarios">Testing scenarios <small>One scenario per line, max 5,000 characters</small></label><textarea id="behavior-evaluation-scenarios" name="evaluationScenarios" rows="4" maxlength="5000" placeholder="Describe situations you want to test before changing behavior…"></textarea>'+
  '<div class="behavior-version-row"><label for="behavior-versions">Saved versions</label><select id="behavior-versions"><option value="">No previous versions yet</option></select><button type="button" id="behavior-rollback" class="action">Restore selected version</button></div>'+
  '<div class="developer-actions"><button type="submit" class="action primary">Save behavioral architecture</button><p id="behavior-status" role="status" hidden></p></div></form></details>';
  root.append(panel);
  const form=panel.querySelector("#developer-form"),status=panel.querySelector("#developer-status"),behaviorForm=panel.querySelector("#behavior-form"),behaviorStatus=panel.querySelector("#behavior-status");
  const dials=["chaos_wit","chaos_sarcasm","chaos_darkness","chaos_warmth","chaos_philosophy"];
  const outputId=key=>"dial-"+key.replace("chaos_","")+"-value";
  const updateOutput=key=>{const out=panel.querySelector("#"+outputId(key));if(out)out.value=form.elements[key].value;};
  for(const key of dials)form.elements[key].addEventListener("input",()=>updateOutput(key));
  const showStatus=(el,message,error=false)=>{el.textContent=message;el.hidden=false;el.classList.toggle("error",error);};
  (async()=>{
    try{
      const data=await api("/api/admin/chaos-personality");
      for(const key of dials){form.elements[key].value=Number(data.settings?.[key]??form.elements[key].value);updateOutput(key);}
      form.elements.chaos_custom_instructions.value=data.settings?.chaos_custom_instructions||"";
      const behavior=await api("/api/admin/chaos-behavior"),c=behavior.config||{};
      for(const key of ["autonomy","challenge","evolution","defaultMode","memoryPolicy"])behaviorForm.elements[key].value=c[key]||behaviorForm.elements[key].value;
      behaviorForm.elements.coreIdentity.value=c.coreIdentity||"";behaviorForm.elements.conflictPriority.value=c.conflictPriority||"";behaviorForm.elements.evaluationScenarios.value=c.evaluationScenarios||"";
      for(const [key,value] of Object.entries(c.modes||{})){const el=behaviorForm.elements["mode_"+key];if(el)el.checked=!!value;}
      for(const [key,value] of Object.entries(c.rules||{})){const el=behaviorForm.elements["rule_"+key];if(el)el.checked=!!value;}
      behaviorForm.elements.customRules.value=c.customRules||"";
      const versionsSelect=behaviorForm.querySelector("#behavior-versions");versionsSelect.replaceChildren();
      if(!(behavior.versions||[]).length){const option=document.createElement("option");option.value="";option.textContent="No previous versions yet";versionsSelect.append(option);}
      else for(const version of behavior.versions){const option=document.createElement("option");option.value=version.id;option.textContent=new Date(version.saved_at).toLocaleString();versionsSelect.append(option);}
    }catch(error){showStatus(status,error.message,true);}
  })();
  form.addEventListener("submit",async event=>{
    event.preventDefault();const button=form.querySelector('button[type="submit"]');button.disabled=true;status.hidden=true;
    const settings={};for(const key of dials)settings[key]=Number(form.elements[key].value);settings.chaos_custom_instructions=form.elements.chaos_custom_instructions.value;
    try{await api("/api/admin/chaos-personality",{method:"PATCH",body:JSON.stringify(settings)});showStatus(status,"Saved. Future public replies will use these settings.");}
    catch(error){showStatus(status,error.message,true);}button.disabled=false;
  });
  behaviorForm.addEventListener("submit",async event=>{
    event.preventDefault();const button=behaviorForm.querySelector('button[type="submit"]');button.disabled=true;behaviorStatus.hidden=true;
    const config={coreIdentity:behaviorForm.elements.coreIdentity.value,autonomy:behaviorForm.elements.autonomy.value,challenge:behaviorForm.elements.challenge.value,evolution:behaviorForm.elements.evolution.value,defaultMode:behaviorForm.elements.defaultMode.value,memoryPolicy:behaviorForm.elements.memoryPolicy.value,conflictPriority:behaviorForm.elements.conflictPriority.value,evaluationScenarios:behaviorForm.elements.evaluationScenarios.value,modes:{},rules:{},customRules:behaviorForm.elements.customRules.value};
    for(const key of ["standard","analytical","philosophical","chaos","supportive","confrontational","creative"])config.modes[key]=behaviorForm.elements["mode_"+key].checked;
    for(const key of ["honestOpposition","contextualHumor","challengeWithoutContempt","evidenceBeforeConfidence","emotionalRecognition","intellectualIndependence","practicalCompletion"])config.rules[key]=behaviorForm.elements["rule_"+key].checked;
    try{await api("/api/admin/chaos-behavior",{method:"PATCH",body:JSON.stringify({config})});const latest=await api("/api/admin/chaos-behavior"),sel=behaviorForm.querySelector("#behavior-versions");sel.replaceChildren();for(const v of latest.versions||[]){const o=document.createElement("option");o.value=v.id;o.textContent=new Date(v.saved_at).toLocaleString();sel.append(o);}showStatus(behaviorStatus,"Behavioral architecture saved and versioned.");}
    catch(error){showStatus(behaviorStatus,error.message,true);}button.disabled=false;
  });
  behaviorForm.querySelector("#behavior-rollback").addEventListener("click",async()=>{
    const versionId=behaviorForm.querySelector("#behavior-versions").value;if(!versionId){showStatus(behaviorStatus,"Choose a saved version first.",true);return;}
    if(!confirm("Restore this saved configuration? The current one will also be preserved."))return;
    const button=behaviorForm.querySelector("#behavior-rollback");button.disabled=true;
    try{const d=await api("/api/admin/chaos-behavior/rollback",{method:"POST",body:JSON.stringify({version_id:versionId})}),c=d.config||{};
      for(const key of ["autonomy","challenge","evolution","defaultMode","memoryPolicy"])behaviorForm.elements[key].value=c[key]||behaviorForm.elements[key].value;
      for(const key of ["coreIdentity","conflictPriority","evaluationScenarios","customRules"])behaviorForm.elements[key].value=c[key]||"";
      for(const [key,value] of Object.entries(c.modes||{}))behaviorForm.elements["mode_"+key].checked=!!value;
      for(const [key,value] of Object.entries(c.rules||{}))behaviorForm.elements["rule_"+key].checked=!!value;
      const latest=await api("/api/admin/chaos-behavior"),sel=behaviorForm.querySelector("#behavior-versions");sel.replaceChildren();for(const v of latest.versions||[]){const o=document.createElement("option");o.value=v.id;o.textContent=new Date(v.saved_at).toLocaleString();sel.append(o);}
      showStatus(behaviorStatus,"Previous behavior configuration restored.");
    }catch(error){showStatus(behaviorStatus,error.message,true);}button.disabled=false;
  });
  renderPrivateChaosLab();
}
function renderPrivateChaosLab(){
  const panel=document.createElement("section");panel.className="developer-card admin-chaos-lab";panel.id="private-chaos-lab";
  panel.innerHTML='<div class="developer-head"><div><p class="eyebrow">OWNER ONLY / ISOLATED INSTANCE</p><h2>Miss Chaos · Private Lab</h2><p>Independent personality settings and an ephemeral test chat. These controls do not change the public character.</p></div><span class="private-badge">PRIVATE INSTANCE</span></div>'+
  '<form id="lab-config-form" class="developer-form"><label for="lab-wit">Wit <output id="lab-wit-value">75</output></label><input id="lab-wit" name="chaos_wit" type="range" min="0" max="100" value="75">'+
  '<label for="lab-sarcasm">Sarcasm <output id="lab-sarcasm-value">60</output></label><input id="lab-sarcasm" name="chaos_sarcasm" type="range" min="0" max="100" value="60">'+
  '<label for="lab-darkness">Dark humor <output id="lab-darkness-value">55</output></label><input id="lab-darkness" name="chaos_darkness" type="range" min="0" max="100" value="55">'+
  '<label for="lab-warmth">Warmth <output id="lab-warmth-value">70</output></label><input id="lab-warmth" name="chaos_warmth" type="range" min="0" max="100" value="70">'+
  '<label for="lab-philosophy">Philosophical depth <output id="lab-philosophy-value">65</output></label><input id="lab-philosophy" name="chaos_philosophy" type="range" min="0" max="100" value="65">'+
  '<label for="lab-autonomy">Autonomy</label><select id="lab-autonomy" name="autonomy"><option value="strict">Strict rule-driven</option><option value="guided">Rule-guided autonomy</option><option value="autonomous">High autonomy</option></select>'+
  '<label for="lab-challenge">Challenge style</label><select id="lab-challenge" name="challenge"><option value="asked">Only when asked</option><option value="warranted">When warranted</option><option value="adversarial">Adversarial debate</option></select>'+
  '<label for="lab-mode">Default mode</label><select id="lab-mode" name="defaultMode"><option value="automatic">Automatic</option><option value="standard">Standard</option><option value="analytical">Analytical</option><option value="philosophical">Philosophical</option><option value="chaos">Chaos</option><option value="supportive">Supportive</option><option value="confrontational">Confrontational</option><option value="creative">Creative</option></select>'+
  '<label for="lab-instructions">Private instructions <small>Max 4,000 characters</small></label><textarea id="lab-instructions" name="custom_instructions" rows="4" maxlength="4000" placeholder="Experimental instructions only for this private instance…"></textarea>'+
  '<div class="developer-actions"><button type="submit" class="action primary">Save private settings</button><p id="lab-config-status" role="status" hidden></p></div></form>'+
  '<div class="lab-chat"><p class="config-label">Private test conversation</p><p class="muted">Test your changes here. Messages stay in this page session and are not saved to conversation history or memory.</p><div id="lab-chat-messages" class="lab-chat-messages" aria-live="polite"></div><form id="lab-chat-form" class="lab-chat-form"><textarea id="lab-chat-input" rows="2" maxlength="4000" placeholder="Test a behavioral rule…"></textarea><button type="submit" class="action primary">Test reply</button></form><p id="lab-chat-status" role="status" hidden></p></div>';
  root.append(panel);
  const form=panel.querySelector("#lab-config-form"),status=panel.querySelector("#lab-config-status"),chatForm=panel.querySelector("#lab-chat-form"),chatInput=panel.querySelector("#lab-chat-input"),chatMessages=panel.querySelector("#lab-chat-messages"),chatStatus=panel.querySelector("#lab-chat-status");
  const dials=["chaos_wit","chaos_sarcasm","chaos_darkness","chaos_warmth","chaos_philosophy"],outputId=key=>"lab-"+key.replace("chaos_","")+"-value";
  for(const key of dials)form.elements[key].addEventListener("input",()=>{const out=panel.querySelector("#"+outputId(key));if(out)out.value=form.elements[key].value;});
  const show=(el,msg,error=false)=>{el.textContent=msg;el.hidden=false;el.classList.toggle("error",error);};
  let history=[];
  (async()=>{try{const d=await api("/api/admin/chaos-lab/config"),c=d.config||{};for(const key of dials){form.elements[key].value=Number(c[key]??form.elements[key].value);const out=panel.querySelector("#"+outputId(key));if(out)out.value=form.elements[key].value;}for(const key of ["autonomy","challenge","defaultMode"])form.elements[key].value=c[key]||form.elements[key].value;form.elements.custom_instructions.value=c.custom_instructions||"";}catch(e){show(status,e.message,true);}})();
  form.addEventListener("submit",async event=>{event.preventDefault();const button=form.querySelector('button[type="submit"]');button.disabled=true;status.hidden=true;const config={};for(const key of dials)config[key]=Number(form.elements[key].value);config.autonomy=form.elements.autonomy.value;config.challenge=form.elements.challenge.value;config.defaultMode=form.elements.defaultMode.value;config.custom_instructions=form.elements.custom_instructions.value;try{await api("/api/admin/chaos-lab/config",{method:"PATCH",body:JSON.stringify({config})});show(status,"Private configuration saved. Public Miss Chaos is unchanged.");}catch(e){show(status,e.message,true);}button.disabled=false;});
  function addLabMessage(role,text){const item=document.createElement("article");item.className="lab-message "+role;const label=document.createElement("strong");label.textContent=role==="user"?"You":"Miss Chaos · Private";const content=document.createElement("p");content.textContent=text;item.append(label,content);chatMessages.append(item);chatMessages.scrollTop=chatMessages.scrollHeight;}
  chatForm.addEventListener("submit",async event=>{event.preventDefault();const message=chatInput.value.trim();if(!message)return;const button=chatForm.querySelector("button");button.disabled=true;chatInput.disabled=true;chatStatus.hidden=true;addLabMessage("user",message);chatInput.value="";try{const d=await api("/api/admin/chaos-lab/chat",{method:"POST",body:JSON.stringify({message,history})});addLabMessage("assistant",d.reply);history=[...history,{role:"user",content:message},{role:"assistant",content:d.reply}].slice(-10);}catch(e){show(chatStatus,e.message,true);}button.disabled=false;chatInput.disabled=false;chatInput.focus();});
}
async function load(){
 try{
   if(adminUserId){
     const me=await api("/api/auth/me"); if(me.user?.role!=="admin") throw Error("Administrator access required.");
     const d=await api("/api/admin/users/"+encodeURIComponent(adminUserId)+"/detail");
     d.user.is_online=d.user.last_seen_at?Date.now()-new Date(d.user.last_seen_at).getTime()<5*60*1000:false;
     render(d,true); return;
   }
   if(!username){root.innerHTML="<h1>Profile not found</h1><p>No username was supplied.</p>";return;}
   const d=await api("/api/users/"+encodeURIComponent(username)); render(d,false);
   const me=await api("/api/auth/me").catch(()=>({user:null}));
   if(me.user?.role==="admin"&&me.user.username==="knightfall"&&me.user.username===d.user.username)renderDeveloperControls();
 }catch(error){root.innerHTML="<h1>Profile unavailable</h1><p>"+esc(error.message)+"</p>";}
}
load();
