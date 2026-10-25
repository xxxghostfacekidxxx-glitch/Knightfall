const API = "https://api.ash-fall.com";
const root = document.querySelector("#profile");
const username = new URLSearchParams(location.search).get("username");
const adminUserId = new URLSearchParams(location.search).get("admin_user_id");
const esc = (value="") => String(value).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const fmt = value => new Date(value).toLocaleDateString([], {year:"numeric",month:"short",day:"numeric"});
const api = async (path,opts={}) => { const r=await fetch(API+path,{credentials:"include",cache:"no-store",...opts,headers:{"content-type":"application/json",...(opts.headers||{})}}); const d=await r.json().catch(()=>({})); if(!r.ok) throw Error(d.error||"Request failed."); return d; };

function render(d,adminView=false,ownProfile=false){
  const u=d.user;
  const avatar=u.avatar_url?'<img class="avatar-img" src="'+esc(u.avatar_url)+'" alt="">':'<div class="avatar">'+esc((u.display_name||u.username).slice(0,1).toUpperCase())+'</div>';
  const online=u.is_online?'<span class="presence online">● online</span>':'<span class="presence">● offline</span>';
  const actions=adminView?'<span class="admin-view">READ-ONLY ADMIN INSPECTION</span>':ownProfile?'<div class="profile-actions"><a class="action" href="/profile-edit.html">Edit profile</a><a class="action primary" href="/die-ary.html">Open my Die-ary</a><a class="action" href="/friends.html">Manage friends</a></div>':'<div class="profile-actions"><button id="friend" class="action primary">Add friend</button><button id="follow" class="action">'+(u.is_following?"Following":"Follow")+'</button><button id="block" class="action">'+(u.is_blocked?"Unblock":"Block")+'</button><button class="action" data-message-user="'+esc(u.username)+'">Message</button></div>';
  root.innerHTML='<div class="profile-top">'+avatar+'<div class="profile-heading"><p class="eyebrow">COMMUNITY MEMBER</p><h1>'+esc(u.display_name)+'</h1><p class="handle">@'+esc(u.username)+' · '+esc(u.role)+'</p>'+online+'</div></div>'+
    '<section class="wallet-card" id="profile-wallet"><div class="wallet-main"><span class="wallet-kicker">ASH-FALL ARCADE WALLET</span><strong class="wallet-balance">✦ '+Number(u.credits??500).toLocaleString()+' <small>CINDERS</small></strong><p>One shared, fictional currency for arcade perks and future game unlocks.</p></div>'+(ownProfile?'<div class="wallet-claims"><button class="action primary" id="claim-daily" type="button">Claim daily · +250</button><button class="action" id="claim-online" type="button">Online bonus · +50</button><button class="action" id="claim-quest" type="button">Daily arcade mission · +100</button><p id="wallet-status" role="status" aria-live="polite">Loading reward availability…</p></div>':'<p class="wallet-public-note">Member balance</p>')+'</section>'+'<div class="profile-stats"><div><b>'+(u.thread_count||0)+'</b><span>Threads</span></div><div><b>'+(u.post_count||0)+'</b><span>Replies</span></div><div><b>'+(u.followers||0)+'</b><span>Followers</span></div><div><b>'+(u.following_count||0)+'</b><span>Following</span></div><div><b id="profile-friend-stat">'+(u.friend_count||0)+'</b><span>Friends</span></div></div>'+
    '<div class="profile-actions-wrap">'+actions+'</div>'+
    (u.bio?'<p class="bio">'+esc(u.bio)+'</p>':"")+
    '<dl><div><dt>Member since</dt><dd>'+fmt(u.created_at)+'</dd></div>'+
    (u.location?'<div><dt>Location</dt><dd>'+esc(u.location)+'</dd></div>':"")+
    (u.pronouns?'<div><dt>Pronouns</dt><dd>'+esc(u.pronouns)+'</dd></div>':"")+
    (u.website_url?'<div><dt>Website</dt><dd><a href="'+esc(u.website_url)+'" rel="noopener noreferrer nofollow">'+esc(u.website_url)+'</a></dd></div>':"")+
    '</dl><div class="activity-grid"><section><h2>Recent threads</h2>'+((d.threads||[]).map(t=>'<a class="activity" href="/thread.html?id='+t.id+'"><strong>'+esc(t.title)+'</strong><small>'+esc(t.category_name)+' · '+fmt(t.created_at)+'</small></a>').join("")||'<p class="muted">No threads yet.</p>')+'</section><section><h2>Recent replies</h2>'+((d.posts||[]).map(p=>'<a class="activity" href="/thread.html?id='+p.thread_id+'"><strong>'+esc(p.thread_title)+'</strong><small>'+esc(p.body).slice(0,180)+' · '+fmt(p.created_at)+'</small></a>').join("")||'<p class="muted">No replies yet.</p>')+'</section></div>';
  root.style.setProperty("--profile-accent", /^#[0-9a-fA-F]{6}$/.test(u.accent_color||"") ? u.accent_color : "#e66a2c");
  root.dataset.theme = ["ember","midnight","toxic","bubblegum","mono"].includes(u.profile_theme) ? u.profile_theme : "ember";
  if (u.cover_url) { const c=document.createElement("div"); c.className="profile-cover"; c.style.backgroundImage="url("+JSON.stringify(u.cover_url)+")"; root.prepend(c); }
  if (u.show_activity === 0) root.querySelector(".activity-grid")?.remove();
  const heading=root.querySelector(".profile-heading");
  for (const [field,cls] of [["status_message","profile-status-message"],["tagline","profile-tagline"]]) if (heading && u[field]) { const p=document.createElement("p"); p.className=cls; p.textContent=u[field]; heading.append(p); }
  if (u.favorite_quote) { const q=document.createElement("blockquote"); q.className="profile-quote"; q.textContent="“"+u.favorite_quote+"”"; root.querySelector(".profile-actions-wrap")?.after(q); }
  if (u.interests || u.favorite_games || u.favorite_music) { const section=document.createElement("section"); section.className="profile-favorites"; const h=document.createElement("h2"); h.textContent="Things I’m into"; section.append(h); for (const [label,value] of [["Interests",u.interests],["Favorite games",u.favorite_games],["Favorite music",u.favorite_music]]) if(value) { const p=document.createElement("p"),b=document.createElement("strong"); b.textContent=label+" "; p.append(b,document.createTextNode(value)); section.append(p); } root.querySelector(".bio")?.after(section); }

  const walletPanel=document.querySelector("#profile-wallet");
  if(walletPanel&&ownProfile&&!adminView){
    const daily=walletPanel.querySelector("#claim-daily"),online=walletPanel.querySelector("#claim-online"),quest=walletPanel.querySelector("#claim-quest"),status=walletPanel.querySelector("#wallet-status"),balance=walletPanel.querySelector(".wallet-balance");
    const refreshWallet=async()=>{try{const w=await api("/api/economy");balance.innerHTML="✦ "+Number(w.balance).toLocaleString()+" <small>CINDERS</small>";daily.disabled=!w.daily_ready;daily.textContent=w.daily_ready?"Claim daily · +250":"Daily claimed ✓";online.disabled=!w.online_ready;online.textContent=w.online_ready?"Online bonus · +50":"Online bonus cooling down";quest.disabled=!w.quest_ready;quest.textContent=w.quest_ready?"Daily arcade mission · +100":w.quest_played?"Mission claimed ✓":"Play a game · +100";const left=w.online_next_at?Math.max(0,new Date(w.online_next_at).getTime()-Date.now()):0;const mins=Math.ceil(left/60000);status.textContent=(w.daily_ready?"Daily reward ready. ":"Daily reward claimed. ")+(w.online_ready?"Online bonus ready.":"Next online bonus in "+mins+" minute"+(mins===1?"":"s")+".")+(w.quest_ready?" Daily arcade mission ready.":w.quest_played?" Daily mission claimed.":" Play and submit a score to unlock today’s mission.");}catch(e){status.textContent=e.message;daily.disabled=true;online.disabled=true;quest.disabled=true;}};
    const claim=async(type,button)=>{button.disabled=true;status.textContent="Claiming credits…";try{const d=await api("/api/economy/claim",{method:"POST",body:JSON.stringify({type})});status.textContent="+"+Number(d.claimed).toLocaleString()+" Cinders added to your wallet.";u.credits=Number(d.balance);await refreshWallet();}catch(e){status.textContent=e.message;await refreshWallet();}};
    daily.addEventListener("click",()=>claim("daily",daily));online.addEventListener("click",()=>claim("online",online));quest.addEventListener("click",()=>claim("quest",quest));refreshWallet();
  }
  if(ownProfile&&!adminView)loadProfileFriends();
  if(!ownProfile&&!adminView){
    const friendButton=document.querySelector("#friend");
    if(friendButton)friendButton.onclick=async()=>{friendButton.disabled=true;try{const result=await api("/api/friends/request",{method:"POST",body:JSON.stringify({username:u.username})});friendButton.textContent=result.status==="accepted"?"Friends ✓":"Request sent ✓";friendButton.classList.add("primary");}catch(error){friendButton.textContent=error.message;setTimeout(()=>{friendButton.textContent="Add friend";friendButton.disabled=false;},2400);return;}friendButton.disabled=false;};
  }
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
  '<label for="lab-assistant-identity">Private assistant identity <small>Max 1,200 characters</small></label><input id="lab-assistant-identity" name="assistant_identity" maxlength="1200" value="Miss Chaos, your private admin companion and development partner.">'+
  '<label for="lab-owner-context">Owner and project context <small>Max 2,000 characters. This is persistent private-assistant context.</small></label><textarea id="lab-owner-context" name="owner_context" rows="3" maxlength="2000" placeholder="Your role, project goals, preferred workflow, important project details…"></textarea>'+
  '<label for="lab-instructions">Private instructions <small>Max 4,000 characters</small></label><textarea id="lab-instructions" name="custom_instructions" rows="4" maxlength="4000" placeholder="Private behavior, preferences, and working rules…"></textarea>'+
  '<div class="developer-actions"><button type="submit" class="action primary">Save private settings</button><p id="lab-config-status" role="status" hidden></p></div></form>'+
  '<div class="lab-chat"><p class="config-label">Private Admin Assistant</p><p class="muted">Your private assistant knows the current public Developer Options, can explain them, design rule changes, and prepare a reviewable proposal. It never changes public settings without your explicit approval. Chat messages stay in this page session and are not saved to conversation history or memory.</p><div class="lab-assistant-capabilities"><span>Explain settings</span><span>Design rules</span><span>Review public config</span><span>Propose changes for approval</span></div><div id="lab-chat-messages" class="lab-chat-messages" aria-live="polite"></div><form id="lab-chat-form" class="lab-chat-form"><textarea id="lab-chat-input" rows="2" maxlength="4000" placeholder="Test a behavioral rule…"></textarea><button type="submit" class="action primary">Test reply</button></form><p id="lab-chat-status" role="status" hidden></p></div>';
  root.append(panel);
  const form=panel.querySelector("#lab-config-form"),status=panel.querySelector("#lab-config-status"),chatForm=panel.querySelector("#lab-chat-form"),chatInput=panel.querySelector("#lab-chat-input"),chatMessages=panel.querySelector("#lab-chat-messages"),chatStatus=panel.querySelector("#lab-chat-status");
  const dials=["chaos_wit","chaos_sarcasm","chaos_darkness","chaos_warmth","chaos_philosophy"],outputId=key=>"lab-"+key.replace("chaos_","")+"-value";
  for(const key of dials)form.elements[key].addEventListener("input",()=>{const out=panel.querySelector("#"+outputId(key));if(out)out.value=form.elements[key].value;});
  const show=(el,msg,error=false)=>{el.textContent=msg;el.hidden=false;el.classList.toggle("error",error);};
  let history=[];
  (async()=>{try{const d=await api("/api/admin/chaos-lab/config"),c=d.config||{};for(const key of dials){form.elements[key].value=Number(c[key]??form.elements[key].value);const out=panel.querySelector("#"+outputId(key));if(out)out.value=form.elements[key].value;}for(const key of ["autonomy","challenge","defaultMode"])form.elements[key].value=c[key]||form.elements[key].value;form.elements.custom_instructions.value=c.custom_instructions||"";form.elements.assistant_identity.value=c.assistant_identity||"Miss Chaos, your private admin companion and development partner.";form.elements.owner_context.value=c.owner_context||"You are assisting the owner of Knightfall and Ash-Fall, including its community website, public Miss Chaos AI, Cloudflare Worker API, behavioral architecture, and developer options.";}catch(e){show(status,e.message,true);}})();
  form.addEventListener("submit",async event=>{event.preventDefault();const button=form.querySelector('button[type="submit"]');button.disabled=true;status.hidden=true;const config={};for(const key of dials)config[key]=Number(form.elements[key].value);config.autonomy=form.elements.autonomy.value;config.challenge=form.elements.challenge.value;config.defaultMode=form.elements.defaultMode.value;config.custom_instructions=form.elements.custom_instructions.value;config.assistant_identity=form.elements.assistant_identity.value;config.owner_context=form.elements.owner_context.value;try{await api("/api/admin/chaos-lab/config",{method:"PATCH",body:JSON.stringify({config})});show(status,"Private configuration saved. Public Miss Chaos is unchanged.");}catch(e){show(status,e.message,true);}button.disabled=false;});
  function addLabMessage(role,text){const item=document.createElement("article");item.className="lab-message "+role;const label=document.createElement("strong");label.textContent=role==="user"?"You":"Miss Chaos · Private";const content=document.createElement("p");content.textContent=text;item.append(label,content);chatMessages.append(item);chatMessages.scrollTop=chatMessages.scrollHeight;}
  function addProposalCard(proposal){
    const card=document.createElement("article");card.className="lab-proposal";
    const title=document.createElement("strong");title.textContent="Public Developer Options proposal";
    const description=document.createElement("p");const changes=[];if(proposal.behavior)changes.push("behavioral architecture");if(proposal.personality)changes.push("personality settings: "+Object.keys(proposal.personality).join(", "));
    description.textContent="Prepared changes for "+changes.join(" and ")+". Nothing has been changed yet.";
    const details=document.createElement("details"),summary=document.createElement("summary");summary.textContent="Review proposed values";details.append(summary);
    const pre=document.createElement("pre");pre.textContent=JSON.stringify(proposal,null,2);details.append(pre);
    const button=document.createElement("button");button.type="button";button.className="action primary";button.textContent="Approve and apply public changes";
    const statusLine=document.createElement("p");statusLine.hidden=true;statusLine.setAttribute("role","status");
    button.addEventListener("click",async()=>{
      if(!confirm("Apply these proposed changes to PUBLIC Miss Chaos? The private lab settings will remain separate. Review the proposal first."))return;
      button.disabled=true;statusLine.hidden=true;
      try{
        if(proposal.behavior)await api("/api/admin/chaos-behavior",{method:"PATCH",body:JSON.stringify({config:proposal.behavior})});
        if(proposal.personality)await api("/api/admin/chaos-personality",{method:"PATCH",body:JSON.stringify(proposal.personality)});
        statusLine.textContent="Approved changes applied to public Miss Chaos. The private configuration remains unchanged.";statusLine.hidden=false;button.textContent="Applied";
      }catch(error){statusLine.textContent="Apply failed: "+error.message+" If multiple settings were proposed, check the public controls for any change that may already have saved.";statusLine.hidden=false;statusLine.classList.add("error");button.disabled=false;}
    });
    card.append(title,description,details,button,statusLine);chatMessages.append(card);chatMessages.scrollTop=chatMessages.scrollHeight;
  }
  chatForm.addEventListener("submit",async event=>{event.preventDefault();const message=chatInput.value.trim();if(!message)return;const button=chatForm.querySelector("button");button.disabled=true;chatInput.disabled=true;chatStatus.hidden=true;addLabMessage("user",message);chatInput.value="";try{const d=await api("/api/admin/chaos-lab/chat",{method:"POST",body:JSON.stringify({message,history})});addLabMessage("assistant",d.reply);if(d.proposal)addProposalCard(d.proposal);history=[...history,{role:"user",content:message},{role:"assistant",content:d.reply}].slice(-10);}catch(e){show(chatStatus,e.message,true);}button.disabled=false;chatInput.disabled=false;chatInput.focus();});
}
async function loadProfileFriends(){
  const panel=document.createElement("section");panel.className="friends-panel";panel.id="profile-friends";
  panel.innerHTML='<div class="friends-panel-head"><div><p class="eyebrow">YOUR PEOPLE</p><h2>Friends & requests</h2><p class="muted">Real connections, not just a follower counter.</p></div><a class="action" href="/friends.html">Full friends page ↗</a></div><div class="friend-request-form"><label for="profile-add-friend">Add a friend by username</label><div class="friend-request-row"><input id="profile-add-friend" maxlength="24" autocomplete="off" placeholder="their_username"><button id="profile-send-friend" class="action primary">Send request</button></div><p id="profile-friend-status" role="status" aria-live="polite"></p></div><div class="friends-columns"><section><h3>Friends</h3><div id="profile-friend-list" class="friend-list"><p class="muted">Loading friends…</p></div></section><section><h3>Incoming requests <span id="incoming-count" class="friend-count">0</span></h3><div id="profile-incoming-list" class="friend-list"></div><h3 class="outgoing-title">Sent requests</h3><div id="profile-outgoing-list" class="friend-list"></div></section></div>';
  root.append(panel);
  const status=panel.querySelector("#profile-friend-status");
  const card=(person,buttons="")=>'<article class="friend-card"><a class="friend-person" href="/profile.html?username='+encodeURIComponent(person.username)+'">'+(person.avatar_url?'<img src="'+esc(person.avatar_url)+'" alt="">':'<span class="friend-avatar">'+esc((person.display_name||person.username||"?").slice(0,1).toUpperCase())+'</span>')+'<span><strong>'+esc(person.display_name||person.username)+'</strong><small>@'+esc(person.username)+'</small></span></a><div class="friend-card-actions">'+buttons+'</div></article>';
  const refresh=async()=>{try{const d=await api("/api/friends");panel.querySelector("#profile-friend-list").innerHTML=d.friends.length?d.friends.map(p=>card(p,'<button class="action" data-message-user="'+esc(p.username)+'">Message</button>')).join(""):'<p class="muted">No friends yet. Every madhouse starts somewhere.</p>';panel.querySelector("#profile-incoming-list").innerHTML=d.incoming.length?d.incoming.map(p=>card(p,'<button class="action primary" data-friend-action="accept" data-id="'+p.id+'">Accept</button><button class="action" data-friend-action="decline" data-id="'+p.id+'">Decline</button>')).join(""):'<p class="muted">No incoming requests.</p>';panel.querySelector("#profile-outgoing-list").innerHTML=d.outgoing.length?d.outgoing.map(p=>card(p,'<button class="action" data-friend-action="cancel" data-id="'+p.id+'">Cancel</button>')).join(""):'<p class="muted">No sent requests.</p>';panel.querySelector("#incoming-count").textContent=d.incoming.length;const friendStat=root.querySelector("#profile-friend-stat");if(friendStat)friendStat.textContent=d.friends.length;panel.querySelectorAll("[data-friend-action]").forEach(button=>button.onclick=async()=>{button.disabled=true;try{if(button.dataset.friendAction==="cancel")await api("/api/friends/"+button.dataset.id,{method:"DELETE"});else await api("/api/friends/"+button.dataset.id,{method:"PATCH",body:JSON.stringify({action:button.dataset.friendAction})});await refresh();}catch(e){status.textContent=e.message;button.disabled=false;}});}catch(e){panel.querySelector("#profile-friend-list").textContent=e.message;}};
  panel.querySelector("#profile-send-friend").onclick=async()=>{const input=panel.querySelector("#profile-add-friend"),button=panel.querySelector("#profile-send-friend"),username=input.value.trim();if(!username){status.textContent="Enter a username first.";return;}button.disabled=true;try{const d=await api("/api/friends/request",{method:"POST",body:JSON.stringify({username})});status.textContent=d.status==="accepted"?"Friend request accepted.":"Friend request sent.";input.value="";await refresh();}catch(e){status.textContent=e.message;}button.disabled=false;};
  await refresh();
}
root.addEventListener("click",async event=>{const button=event.target.closest("[data-message-user]");if(!button)return;event.preventDefault();const targetUsername=button.dataset.messageUser;if(!targetUsername)return;button.disabled=true;let line=root.querySelector("#profile-action-status");if(!line){line=document.createElement("p");line.id="profile-action-status";line.setAttribute("role","status");line.setAttribute("aria-live","polite");line.className="profile-action-status";const wrap=root.querySelector(".profile-actions-wrap");if(wrap)wrap.append(line);else root.append(line);}try{line.textContent="Opening private conversation…";const conversation=await api("/api/messages/conversations",{method:"POST",body:JSON.stringify({username:targetUsername})});location.href="/messages.html?conversation="+encodeURIComponent(conversation.id);}catch(error){line.textContent="Could not open conversation: "+error.message;button.disabled=false;}});

async function loadProfilePhotos(username,ownProfile){
  const panel=document.createElement("section");
  panel.className="photo-gallery-panel";
  panel.id="profile-photo-gallery";
  panel.innerHTML='<div class="photo-gallery-head"><div><p class="eyebrow">THE PHOTO WALL</p><h2>Photos</h2><p class="muted">Snapshots from the chaos. Images are stored with Ash-Fall, not left hanging off random links.</p></div><span class="photo-gallery-count" id="profile-photo-count">Loading…</span></div>'+
    (ownProfile?'<form id="profile-photo-upload" class="photo-upload-form"><label for="profile-photo-file">Add photos <small>JPG, PNG, GIF, or WebP · up to 8 MB each · 60 photos maximum</small></label><input id="profile-photo-file" name="file" type="file" accept="image/jpeg,image/png,image/gif,image/webp" required><label for="profile-photo-caption">Caption <small>Optional · 240 characters</small></label><input id="profile-photo-caption" name="caption" maxlength="240" placeholder="What is happening in this picture?"><button class="action primary" type="submit">Upload photo</button><p id="profile-photo-status" role="status" aria-live="polite"></p></form>':'')+
    '<div id="profile-photo-grid" class="profile-photo-grid"><p class="muted">Loading photos…</p></div>';
  root.append(panel);
  const grid=panel.querySelector("#profile-photo-grid"),count=panel.querySelector("#profile-photo-count"),status=panel.querySelector("#profile-photo-status");
  const refresh=async()=>{
    const data=await api("/api/profile/photos?username="+encodeURIComponent(username));
    const photos=data.photos||[];count.textContent=photos.length+" / 60";
    grid.innerHTML=photos.length?photos.map(photo=>'<article class="profile-photo-card"><a class="profile-photo-image" href="'+esc(photo.url)+'" target="_blank" rel="noopener noreferrer" aria-label="Open full-size photo"><img src="'+esc(photo.url)+'" alt="'+esc(photo.caption||"Photo shared by "+username)+'" loading="lazy"></a>'+(photo.caption?'<p class="profile-photo-caption">'+esc(photo.caption)+'</p>':'')+'<div class="profile-photo-meta"><time datetime="'+esc(photo.created_at)+'">'+fmt(photo.created_at)+'</time>'+(ownProfile?'<button class="action photo-delete" type="button" data-photo-delete="'+Number(photo.id)+'">Delete</button>':'')+'</div></article>').join(""):'<p class="photo-empty">No photos here yet.</p>';
  };
  try{await refresh()}catch(error){grid.innerHTML='<p class="photo-empty">Photos could not load: '+esc(error.message)+'</p>';count.textContent="Unavailable"}
  if(ownProfile){
    panel.querySelector("#profile-photo-upload").addEventListener("submit",async event=>{
      event.preventDefault();const form=event.currentTarget,file=form.elements.file.files?.[0],button=form.querySelector('button[type="submit"]');
      if(!file)return;button.disabled=true;status.textContent="Uploading photo…";
      try{const data=new FormData();data.append("file",file);data.append("caption",form.elements.caption.value);data.append("kind","gallery");const response=await fetch(API+"/api/profile/photos",{method:"POST",credentials:"include",body:data});const result=await response.json().catch(()=>({}));if(!response.ok)throw Error(result.error||"Photo upload failed.");form.reset();status.textContent="Photo uploaded.";await refresh();}
      catch(error){status.textContent=error.message}
      button.disabled=false;
    });
    grid.addEventListener("click",async event=>{
      const button=event.target.closest("[data-photo-delete]");if(!button)return;
      if(!confirm("Delete this photo from your profile?"))return;
      button.disabled=true;
      try{await api("/api/profile/photos/"+encodeURIComponent(button.dataset.photoDelete),{method:"DELETE"});await refresh();status.textContent="Photo deleted."}
      catch(error){status.textContent=error.message;button.disabled=false}
    });
  }
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
   const d=await api("/api/users/"+encodeURIComponent(username));
   const me=await api("/api/auth/me").catch(()=>({user:null}));
   const ownProfile=!!me.user&&String(me.user.id)===String(d.user.id);render(d,false,ownProfile);await loadProfilePhotos(d.user.username,ownProfile);
   if(me.user&&String(me.user.id)!==String(d.user.id)){try{const relations=await api("/api/friends"),button=document.querySelector("#friend");if(button){if(relations.friends.some(person=>person.username===d.user.username)){button.textContent="Friends ✓";button.disabled=true;}else if(relations.outgoing.some(person=>person.username===d.user.username)){button.textContent="Request sent";button.disabled=true;}else if(relations.incoming.some(person=>person.username===d.user.username)){button.textContent="Accept request";}}}catch{}}
   if(me.user?.role==="admin"&&me.user.username==="knightfall"&&me.user.username===d.user.username)renderDeveloperControls();
 }catch(error){root.innerHTML="<h1>Profile unavailable</h1><p>"+esc(error.message)+"</p>";}
}
load();
