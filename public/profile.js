const API = "https://api.ash-fall.com";
const root = document.querySelector("#profile");
const username = new URLSearchParams(location.search).get("username");
const adminUserId = new URLSearchParams(location.search).get("admin_user_id");
const esc = (value="") => String(value).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const fmt = value => { const date=new Date(value);return Number.isNaN(date.getTime())?"Date unavailable":date.toLocaleDateString([], {year:"numeric",month:"short",day:"numeric"}); };
const safeExternalUrl = value => { try { const url=new URL(String(value||""),location.origin);return ["https:","http:"].includes(url.protocol)?url.href:""; } catch { return ""; } };

const api = async (path,opts={}) => { const r=await fetch(API+path,{credentials:"include",cache:"no-store",...opts,headers:{"content-type":"application/json",...(opts.headers||{})}}); const d=await r.json().catch(()=>({})); if(!r.ok){const error=new Error(d.error||"Request failed.");error.status=r.status;throw error;} return d; };

function render(d,adminView=false,ownProfile=false,signedIn=true){
  root.onclick=async event=>{const button=event.target.closest("#share-profile");if(!button)return;const link=new URL("/profile.html",location.origin);link.searchParams.set("username",d.user.username);try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(link.href);button.textContent="Link copied ✓";}else{window.prompt("Copy profile link:",link.href);}}catch{window.prompt("Copy profile link:",link.href);}};

  const u=d.user;
  const avatar=safeExternalUrl(u.avatar_url)?'<img class="avatar-img" src="'+esc(safeExternalUrl(u.avatar_url))+'" alt="Profile picture of '+esc(u.display_name||u.username)+'" loading="lazy" referrerpolicy="no-referrer">':'<div class="avatar" aria-hidden="true">'+esc((u.display_name||u.username).slice(0,1).toUpperCase())+'</div>';
  const safeWebsite = safeExternalUrl(u.website_url);const online=u.is_online?'<span class="presence online">● online</span>':'<span class="presence">● offline</span>';
  const actions=adminView?'<span class="admin-view">READ-ONLY ADMIN INSPECTION</span>':ownProfile?'<div class="profile-actions"><a class="action" href="/profile-edit.html">Edit profile</a><a class="action primary" href="/die-ary.html">Open my Die-ary</a><a class="action" href="/friends.html">Manage friends</a></div>':!signedIn?'<div class="profile-actions"><a class="action primary" href="/auth.html?next=%2Fprofile.html">Sign in to connect</a></div>':'<div class="profile-actions"><button id="friend" class="action primary">Add friend</button><button id="follow" class="action">'+(u.is_following?"Following":"Follow")+'</button><button id="block" class="action">'+(u.is_blocked?"Unblock":"Block")+'</button><button class="action" data-message-user="'+esc(u.username)+'">Message</button></div>';
  root.innerHTML='<div class="profile-top">'+avatar+'<div class="profile-heading"><p class="eyebrow">COMMUNITY MEMBER</p><h1>'+esc(u.display_name)+'</h1><p class="handle">@'+esc(u.username)+' · '+esc(u.role)+'</p>'+online+'</div></div>'+
    '<section class="wallet-card" id="profile-wallet"><div class="wallet-main"><span class="wallet-kicker">ASH-FALL ARCADE WALLET</span><strong class="wallet-balance">✦ '+Number(u.credits??500).toLocaleString()+' <small>CINDERS</small></strong><p>One shared, fictional currency for arcade perks and future game unlocks.</p></div>'+(ownProfile?'<div class="wallet-claims"><button class="action primary" id="claim-daily" type="button">Claim daily · +250</button><button class="action" id="claim-online" type="button">Online bonus · +50</button><button class="action" id="claim-quest" type="button">Daily arcade mission · +100</button><p id="wallet-status" role="status" aria-live="polite">Loading reward availability…</p></div>':'<p class="wallet-public-note">Member balance</p>')+'</section>'+'<div class="profile-stats"><div><b>'+(u.thread_count||0)+'</b><span>Threads</span></div><div><b>'+(u.post_count||0)+'</b><span>Replies</span></div><div><b>'+(u.followers||0)+'</b><span>Followers</span></div><div><b>'+(u.following_count||0)+'</b><span>Following</span></div><div><b id="profile-friend-stat">'+(u.friend_count||0)+'</b><span>Friends</span></div></div>'+
    '<div class="profile-actions-wrap">'+actions+'<button type="button" class="action" id="share-profile">Copy profile link</button></div>'+
    (u.bio?'<p class="bio">'+esc(u.bio)+'</p>':"")+
    '<dl><div><dt>Member since</dt><dd>'+fmt(u.created_at)+'</dd></div>'+
    (u.location?'<div><dt>Location</dt><dd>'+esc(u.location)+'</dd></div>':"")+
    (u.pronouns?'<div><dt>Pronouns</dt><dd>'+esc(u.pronouns)+'</dd></div>':"")+
    (u.website_url?'<div><dt>Website</dt><dd>'+(safeWebsite?'<a href="'+esc(safeWebsite)+'" rel="noopener noreferrer nofollow">'+esc(safeWebsite)+'</a>':esc(u.website_url))+'</dd></div>':"")+
    '</dl><div class="activity-grid"><section><h2>Recent threads</h2>'+((d.threads||[]).map(t=>'<a class="activity" href="/thread.html?id='+t.id+'"><strong>'+esc(t.title)+'</strong><small>'+esc(t.category_name)+' · '+fmt(t.created_at)+'</small></a>').join("")||'<p class="muted">No threads yet.</p>')+'</section><section><h2>Recent replies</h2>'+((d.posts||[]).map(p=>'<a class="activity" href="/thread.html?id='+p.thread_id+'"><strong>'+esc(p.thread_title)+'</strong><small>'+esc(p.body).slice(0,180)+' · '+fmt(p.created_at)+'</small></a>').join("")||'<p class="muted">No replies yet.</p>')+'</section></div>';
  // Keep connection controls immediately under the member header, above the wallet.
  // They were previously buried after the wallet and counters on mobile.
  const connectionActions=root.querySelector(".profile-actions-wrap");
  const profileHeader=root.querySelector(".profile-top");
  if(connectionActions&&profileHeader)profileHeader.after(connectionActions);
  const themeColors={ember:"#ff55d8",midnight:"#7894ff",toxic:"#9ce84b",bubblegum:"#ff62c7",mono:"#e4e4e4"};root.dataset.theme=Object.hasOwn(themeColors,u.profile_theme)?u.profile_theme:"ember";root.style.setProperty("--profile-accent",/^#[0-9a-fA-F]{6}$/.test(u.accent_color||"")&&u.accent_color.toLowerCase()!=="#ff55d8"?u.accent_color:themeColors[root.dataset.theme]);
  if (safeExternalUrl(u.cover_url)) { const c=document.createElement("div"),img=document.createElement("img"); c.className="profile-cover"; img.setAttribute("src",safeExternalUrl(u.cover_url)); img.setAttribute("alt",""); img.loading="lazy"; c.append(img); root.prepend(c); }
  if (u.show_activity === 0) root.querySelector(".activity-grid")?.remove();
  const heading=root.querySelector(".profile-heading");
  for (const [field,cls] of [["status_message","profile-status-message"],["tagline","profile-tagline"]]) if (heading && u[field]) { const p=document.createElement("p"); p.className=cls; p.textContent=u[field]; heading.append(p); }
  if (u.favorite_quote) { const q=document.createElement("blockquote"); q.className="profile-quote"; q.textContent="“"+u.favorite_quote+"”"; root.querySelector(".profile-actions-wrap")?.after(q); }
  if (u.interests || u.favorite_games || u.favorite_music) { const section=document.createElement("section"); section.className="profile-favorites"; const h=document.createElement("h2"); h.textContent="Things I’m into"; section.append(h); for (const [label,value] of [["Interests",u.interests],["Favorite games",u.favorite_games],["Favorite music",u.favorite_music]]) if(value) { const p=document.createElement("p"),b=document.createElement("strong"); b.textContent=label+" "; p.append(b,document.createTextNode(value)); section.append(p); } (root.querySelector(".bio")||root.querySelector(".profile-actions-wrap"))?.after(section); }

  if(d.birth_chart){
    const chart=d.birth_chart,section=document.createElement("section");
    section.className="profile-birth-chart";section.setAttribute("aria-label","Member birth chart");
    const heading=document.createElement("h2");heading.textContent="✦ Cosmic blueprint";
    const detail=document.createElement("p");detail.className="birth-chart-system";detail.textContent="Western tropical · "+(chart.house_system||"Equal houses")+" · Shared by this member";
    const bigThree=document.createElement("div");bigThree.className="birth-chart-big-three";
    for(const [name,sign] of [["Sun",chart.bodies?.Sun?.sign],["Moon",chart.bodies?.Moon?.sign],["Rising",chart.ascendant_sign]]){
      if(!sign)continue;
      const card=document.createElement("div"),label=document.createElement("span"),value=document.createElement("strong");
      label.textContent=name;value.textContent=sign;card.append(label,value);bigThree.append(card);
    }
    const details=document.createElement("details"),summary=document.createElement("summary"),grid=document.createElement("div");
    summary.textContent="View planetary placements";grid.className="birth-chart-placements";
    for(const [name,body] of Object.entries(chart.bodies||{})){
      const item=document.createElement("p"),strong=document.createElement("strong");
      strong.textContent=name;item.append(strong,document.createTextNode(" "+body.sign+" "+body.degree+"°"+(body.retrograde?" ℞":"")+(chart.house_placements?.[name]?" · House "+chart.house_placements[name]:"")));grid.append(item);
    }
    details.append(summary,grid);section.append(heading,detail,bigThree,details);
    const bio=root.querySelector(".bio");(bio||root.querySelector(".profile-actions-wrap"))?.after(section);
  }
  const walletPanel=document.querySelector("#profile-wallet");
  if(walletPanel&&ownProfile&&!adminView){
    const daily=walletPanel.querySelector("#claim-daily"),online=walletPanel.querySelector("#claim-online"),quest=walletPanel.querySelector("#claim-quest"),status=walletPanel.querySelector("#wallet-status"),balance=walletPanel.querySelector(".wallet-balance");
    const refreshWallet=async()=>{try{const w=await api("/api/economy");balance.innerHTML="✦ "+Number(w.balance).toLocaleString()+" <small>CINDERS</small>";daily.disabled=!w.daily_ready;daily.textContent=w.daily_ready?"Claim daily · +250":"Daily claimed ✓";online.disabled=!w.online_ready;online.textContent=w.online_ready?"Online bonus · +50":"Online bonus cooling down";quest.disabled=!w.quest_ready;quest.textContent=w.quest_ready?"Daily arcade mission · +100":w.quest_played?"Mission claimed ✓":"Play a game · +100";const left=w.online_next_at?Math.max(0,new Date(w.online_next_at).getTime()-Date.now()):0;const mins=Math.ceil(left/60000);status.textContent=(w.daily_ready?"Daily reward ready. ":"Daily reward claimed. ")+(w.online_ready?"Online bonus ready.":"Next online bonus in "+mins+" minute"+(mins===1?"":"s")+".")+(w.quest_ready?" Daily arcade mission ready.":w.quest_played?" Daily mission claimed.":" Play and submit a score to unlock today’s mission.");}catch(e){status.textContent=e.message;daily.disabled=true;online.disabled=true;quest.disabled=true;}};
    const claim=async(type,button)=>{button.disabled=true;status.textContent="Claiming credits…";try{const d=await api("/api/economy/claim",{method:"POST",body:JSON.stringify({type})});status.textContent="+"+Number(d.claimed).toLocaleString()+" Cinders added to your wallet.";u.credits=Number(d.balance);await refreshWallet();}catch(e){status.textContent=e.message;await refreshWallet();}};
    daily.addEventListener("click",()=>claim("daily",daily));online.addEventListener("click",()=>claim("online",online));quest.addEventListener("click",()=>claim("quest",quest));refreshWallet();
  }
  if(ownProfile&&!adminView)loadProfileFriends();
  if(!ownProfile&&!adminView){
    const friendButton=root.querySelector("#friend");
    if(friendButton)friendButton.onclick=async()=>{friendButton.disabled=true;const previous=friendButton.textContent;try{const result=await api("/api/friends/request",{method:"POST",body:JSON.stringify({username:u.username})});friendButton.textContent=result.status==="accepted"?"Friends ✓":"Request sent ✓";friendButton.classList.add("primary");friendButton.disabled=true;}catch(error){friendButton.textContent=error.message;setTimeout(()=>{friendButton.textContent=previous;friendButton.disabled=false;},2400);}};
  }
  if(adminView){const meta=document.createElement("div");meta.className="admin-meta";meta.innerHTML="<span>Account: "+esc(u.status||"unknown")+"</span><span>Email: "+esc(u.email||"not exposed")+"</span><span>Reports filed: "+((d.reports||[]).length)+"</span>";root.querySelector(".profile-actions-wrap").after(meta);}
  if(!adminView){
    const f=root.querySelector("#follow"),b=root.querySelector("#block");
    if(f){f.disabled=!!u.is_blocked;f.onclick=async()=>{if(f.disabled)return;f.disabled=true;try{const r=await api("/api/users/"+encodeURIComponent(u.username)+"/follow",{method:u.is_following?"DELETE":"POST"});const wasFollowing=!!u.is_following;u.is_following=!!r.following;f.textContent=u.is_following?"Following":"Follow";if(wasFollowing!==u.is_following){u.followers=Math.max(0,Number(u.followers||0)+(u.is_following?1:-1));const count=root.querySelector(".profile-stats div:nth-child(3) b");if(count)count.textContent=u.followers;}}catch(e){alert(e.message)}finally{f.disabled=!!u.is_blocked;}};}
    if(b)b.onclick=async()=>{if(b.disabled)return;b.disabled=true;try{const r=await api("/api/users/"+encodeURIComponent(u.username)+"/block",{method:u.is_blocked?"DELETE":"POST"});u.is_blocked=!!r.blocked;b.textContent=u.is_blocked?"Unblock":"Block";if(f){f.disabled=u.is_blocked;f.textContent=u.is_blocked?"Blocked":u.is_following?"Following":"Follow";}const message=root.querySelector("[data-message-user]");if(message)message.disabled=u.is_blocked;const friend=root.querySelector("#friend");if(friend)friend.disabled=u.is_blocked;}catch(e){alert(e.message)}finally{b.disabled=false}};
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
  const card=(person,buttons="")=>'<article class="friend-card"><a class="friend-person" href="/profile.html?username='+encodeURIComponent(person.username)+'">'+(safeExternalUrl(person.avatar_url)?'<img src="'+esc(safeExternalUrl(person.avatar_url))+'" alt="">':'<span class="friend-avatar">'+esc((person.display_name||person.username||"?").slice(0,1).toUpperCase())+'</span>')+'<span><strong>'+esc(person.display_name||person.username)+'</strong><small>@'+esc(person.username)+'</small></span></a><div class="friend-card-actions">'+buttons+'</div></article>';
  const refresh=async()=>{try{const d=await api("/api/friends");d.friends=Array.isArray(d.friends)?d.friends:[];d.incoming=Array.isArray(d.incoming)?d.incoming:[];d.outgoing=Array.isArray(d.outgoing)?d.outgoing:[];panel.querySelector("#profile-friend-list").innerHTML=d.friends.length?d.friends.map(p=>card(p,'<button class="action" data-message-user="'+esc(p.username)+'">Message</button>')).join(""):'<p class="muted">No friends yet. Every madhouse starts somewhere.</p>';panel.querySelector("#profile-incoming-list").innerHTML=d.incoming.length?d.incoming.map(p=>card(p,'<button class="action primary" data-friend-action="accept" data-id="'+p.id+'">Accept</button><button class="action" data-friend-action="decline" data-id="'+p.id+'">Decline</button>')).join(""):'<p class="muted">No incoming requests.</p>';panel.querySelector("#profile-outgoing-list").innerHTML=d.outgoing.length?d.outgoing.map(p=>card(p,'<button class="action" data-friend-action="cancel" data-id="'+p.id+'">Cancel</button>')).join(""):'<p class="muted">No sent requests.</p>';panel.querySelector("#incoming-count").textContent=d.incoming.length;const friendStat=root.querySelector("#profile-friend-stat");if(friendStat)friendStat.textContent=d.friends.length;panel.querySelectorAll("[data-friend-action]").forEach(button=>button.onclick=async()=>{button.disabled=true;try{if(button.dataset.friendAction==="cancel")await api("/api/friends/"+button.dataset.id,{method:"DELETE"});else await api("/api/friends/"+button.dataset.id,{method:"PATCH",body:JSON.stringify({action:button.dataset.friendAction})});await refresh();}catch(e){status.textContent=e.message;button.disabled=false;}});}catch(e){panel.querySelector("#profile-friend-list").textContent=e.message;}};
  panel.querySelector("#profile-send-friend").onclick=async()=>{const input=panel.querySelector("#profile-add-friend"),button=panel.querySelector("#profile-send-friend"),username=input.value.trim();if(!username){status.textContent="Enter a username first.";return;}button.disabled=true;try{const d=await api("/api/friends/request",{method:"POST",body:JSON.stringify({username})});status.textContent=d.status==="accepted"?"Friend request accepted.":"Friend request sent.";input.value="";await refresh();}catch(e){status.textContent=e.message;}button.disabled=false;};
  await refresh();
}
root.addEventListener("click",async event=>{const button=event.target.closest("[data-fallback-friend]");if(!button)return;event.preventDefault();button.disabled=true;try{const result=await api("/api/friends/request",{method:"POST",body:JSON.stringify({username:button.dataset.fallbackFriend})});button.textContent=result.status==="accepted"?"Friends ✓":"Request sent ✓";}catch(error){button.textContent=error.message;button.disabled=false;}});
root.addEventListener("click",async event=>{const button=event.target.closest("[data-message-user]");if(!button)return;event.preventDefault();const targetUsername=button.dataset.messageUser;if(!targetUsername)return;button.disabled=true;let line=root.querySelector("#profile-action-status");if(!line){line=document.createElement("p");line.id="profile-action-status";line.setAttribute("role","status");line.setAttribute("aria-live","polite");line.className="profile-action-status";const wrap=root.querySelector(".profile-actions-wrap");if(wrap)wrap.append(line);else root.append(line);}try{line.textContent="Opening private conversation…";const conversation=await api("/api/messages/conversations",{method:"POST",body:JSON.stringify({username:targetUsername})});location.href="/messages.html?conversation="+encodeURIComponent(conversation.id);}catch(error){line.textContent="Could not open conversation: "+error.message;button.disabled=false;}});

async function loadProfilePhotos(username,ownProfile){
  const panel=document.createElement("section");
  panel.className="photo-gallery-panel";
  panel.id="profile-photo-gallery";
  panel.innerHTML='<div class="photo-gallery-head"><div><p class="eyebrow">THE PHOTO WALL</p><h2>Photos</h2><p class="muted">Snapshots from the chaos. Images are stored with Ash-Fall, not left hanging off random links.</p></div><span class="photo-gallery-count" id="profile-photo-count">Loading…</span></div>'+
    (ownProfile?'<form id="profile-photo-upload" class="photo-upload-form"><label for="profile-photo-file">Add photos <small>JPG, PNG, GIF, or WebP · up to 8 MB each · 60 photos maximum</small></label><input id="profile-photo-file" name="file" type="file" accept="image/jpeg,image/png,image/gif,image/webp" required><label for="profile-photo-caption">Caption <small>Optional · 240 characters</small></label><input id="profile-photo-caption" name="caption" maxlength="240" placeholder="What is happening in this picture?"><button class="action primary" type="submit">Upload photo</button><p id="profile-photo-status" role="status" aria-live="polite"></p></form>':'')+
    '<div id="profile-photo-grid" class="profile-photo-grid"><p class="muted">Loading photos…</p></div>';
  if(ownProfile){
    const albumTools=document.createElement("div");albumTools.className="profile-album-tools";
    albumTools.innerHTML='<form data-create-album><label for="new-profile-album">New album</label><input id="new-profile-album" name="name" maxlength="80" required placeholder="Album name"><button type="submit" class="action">Create</button></form><label for="profile-album-select">Browse albums</label><select id="profile-album-select"><option value="">All photos</option><option value="favorites">★ Favorites</option></select><button type="button" class="action" data-delete-album hidden>Delete selected album</button><p data-album-status role="status" aria-live="polite"></p>';
    panel.append(albumTools);
  }
  root.append(panel);
  const grid=panel.querySelector("#profile-photo-grid"),count=panel.querySelector("#profile-photo-count"),status=panel.querySelector("#profile-photo-status");
  // Native gallery viewer: no third-party media service, no new public permissions.
  let galleryPhotos=[],galleryIndex=0,photoDialog=null,previousFocus=null,previousBodyOverflow="";
  function closePhotoDialog(){if(!photoDialog)return;photoDialog.remove();photoDialog=null;document.body.style.overflow=previousBodyOverflow;document.removeEventListener("keydown",photoKeys);previousFocus?.focus?.();}
  function showPhotoAt(index){
    if(!galleryPhotos.length)return;
    galleryIndex=(index+galleryPhotos.length)%galleryPhotos.length;
    const photo=galleryPhotos[galleryIndex];
    photoDialog.querySelector("img").src=photo.url;
    photoDialog.querySelector("img").alt=photo.caption||"Profile photo";
    photoDialog.querySelector("[data-photo-caption]").textContent=photo.caption||"";
    photoDialog.querySelector("[data-photo-position]").textContent=(galleryIndex+1)+" / "+galleryPhotos.length;photoDialog.querySelector("[data-prev]").disabled=galleryPhotos.length<2;photoDialog.querySelector("[data-next]").disabled=galleryPhotos.length<2;
  }
  function photoKeys(e){if(e.key==="Escape"){e.preventDefault();closePhotoDialog();}else if(e.key==="ArrowRight"){e.preventDefault();showPhotoAt(galleryIndex+1);}else if(e.key==="ArrowLeft"){e.preventDefault();showPhotoAt(galleryIndex-1);}else if(e.key==="Tab"&&photoDialog){const controls=[...photoDialog.querySelectorAll("button")];const i=controls.indexOf(document.activeElement);if(e.shiftKey&&i===0){e.preventDefault();controls[controls.length-1].focus();}else if(!e.shiftKey&&i===controls.length-1){e.preventDefault();controls[0].focus();}}}
  function openPhotoDialog(index){
    if(!galleryPhotos.length)return;closePhotoDialog();previousFocus=document.activeElement;
    photoDialog=document.createElement("div");photoDialog.className="ash-photo-lightbox";photoDialog.setAttribute("role","dialog");photoDialog.setAttribute("aria-modal","true");photoDialog.setAttribute("aria-label","Profile photo viewer");
    photoDialog.innerHTML='<div class="ash-photo-lightbox-bar"><span data-photo-position></span><button type="button" data-close aria-label="Close photo viewer">✕ Close</button></div><div class="ash-photo-lightbox-image"><img alt=""></div><div class="ash-photo-lightbox-footer"><button type="button" data-prev aria-label="Previous photo">← Previous</button><p data-photo-caption></p><button type="button" data-next aria-label="Next photo">Next →</button></div>';
    photoDialog.querySelector("[data-close]").addEventListener("click",closePhotoDialog);
    photoDialog.querySelector("[data-prev]").addEventListener("click",()=>showPhotoAt(galleryIndex-1));
    photoDialog.querySelector("[data-next]").addEventListener("click",()=>showPhotoAt(galleryIndex+1));
    photoDialog.addEventListener("click",e=>{if(e.target===photoDialog)closePhotoDialog();});
    previousBodyOverflow=document.body.style.overflow;document.body.style.overflow="hidden";document.body.append(photoDialog);document.addEventListener("keydown",photoKeys);showPhotoAt(index);photoDialog.querySelector("[data-close]").focus();
  }
  grid.addEventListener("click",event=>{const link=event.target.closest("[data-photo-index]");if(!link)return;event.preventDefault();openPhotoDialog(Number(link.dataset.photoIndex));});
  let albumSelection="",albumPhotos=null,albumIds=[],favoriteIds=new Set();
  const albumSelect=panel.querySelector("#profile-album-select"),albumStatus=panel.querySelector("[data-album-status]");
  async function loadAlbumOptions(){
    if(!ownProfile)return;
    const [albums,favorites]=await Promise.all([api("/api/media-library/albums"),api("/api/media-library/favorites")]);
    albumIds=albums.albums||[];favoriteIds=new Set((favorites.photos||[]).map(p=>Number(p.id)));
    albumSelect.innerHTML='<option value="">All photos</option><option value="favorites">★ Favorites</option>'+albumIds.map(a=>'<option value="'+Number(a.id)+'">'+esc(a.name)+' ('+Number(a.photo_count)+')</option>').join("");
    albumSelect.value=albumSelection;
    panel.querySelector("[data-delete-album]").hidden=!albumSelection||albumSelection==="favorites";
  }
  if(ownProfile){
    try{await loadAlbumOptions()}catch(error){albumStatus.textContent="Albums unavailable until the media migration is applied: "+error.message}
    panel.querySelector("[data-create-album]").addEventListener("submit",async e=>{
      e.preventDefault();const form=e.currentTarget,name=form.elements.name.value.trim();if(!name)return;
      try{await api("/api/media-library/albums",{method:"POST",body:JSON.stringify({name})});form.reset();albumStatus.textContent="Album created.";await loadAlbumOptions();}
      catch(error){albumStatus.textContent=error.message}
    });
    panel.querySelector("[data-delete-album]").addEventListener("click",async()=>{if(!albumSelection||albumSelection==="favorites")return;const selected=albumIds.find(a=>String(a.id)===albumSelection);if(!selected||!confirm("Delete album "+selected.name+"? Photos will remain in your gallery."))return;try{await api("/api/media-library/albums/"+Number(selected.id),{method:"DELETE"});albumSelection="";albumPhotos=null;await loadAlbumOptions();await refresh();albumStatus.textContent="Album deleted. Photos preserved.";}catch(error){albumStatus.textContent=error.message}});
    albumSelect.addEventListener("change",async()=>{albumSelection=albumSelect.value;try{if(albumSelection&&albumSelection!=="favorites"){const data=await api("/api/media-library/albums/"+encodeURIComponent(albumSelection));albumPhotos=new Set((data.photos||[]).map(p=>Number(p.id)));}else albumPhotos=null;await refresh();}catch(error){albumStatus.textContent=error.message}});
    grid.addEventListener("click",async e=>{
      const button=e.target.closest("[data-favorite-photo],[data-add-album],[data-remove-album]");if(!button)return;
      const id=Number(button.dataset.favoritePhoto||button.dataset.addAlbum||button.dataset.removeAlbum);
      try{
        if(button.dataset.removeAlbum){await api("/api/media-library/albums/"+Number(albumSelection)+"/photos/"+id,{method:"DELETE"});albumPhotos?.delete(id);albumStatus.textContent="Removed from album.";}else if(button.dataset.favoritePhoto){const isFav=favoriteIds.has(id);await api("/api/media-library/favorites/"+id,{method:isFav?"DELETE":"PUT"});if(isFav)favoriteIds.delete(id);else favoriteIds.add(id);}
        else {const selected=button.closest(".profile-photo-card")?.querySelector("[data-photo-album]")?.value;const album=albumIds.find(a=>String(a.id)===selected);if(!album)throw Error("Choose an existing album name.");await api("/api/media-library/albums/"+Number(album.id)+"/photos/"+id,{method:"PUT"});if(String(album.id)===albumSelection)albumPhotos?.add(id);albumStatus.textContent="Photo added to "+album.name+".";}
        await loadAlbumOptions();
        if(albumSelection&&albumSelection!=="favorites"){const updated=await api("/api/media-library/albums/"+Number(albumSelection));albumPhotos=new Set((updated.photos||[]).map(p=>Number(p.id)));}
        await refresh();
      }catch(error){albumStatus.textContent=error.message}
    });
  }
  const refresh=async()=>{
    const data=await api("/api/profile/photos?username="+encodeURIComponent(username));
    const allPhotos=data.photos||[];const photos=albumSelection==="favorites"?allPhotos.filter(p=>favoriteIds.has(Number(p.id))):albumPhotos?allPhotos.filter(p=>albumPhotos.has(Number(p.id))):allPhotos;galleryPhotos=photos;count.textContent=photos.length+" / 60";
    grid.innerHTML=photos.length?photos.map((photo,index)=>'<article class="profile-photo-card"><a class="profile-photo-image" href="'+esc(safeExternalUrl(photo.url)||"#")+'" data-photo-index="'+index+'" aria-label="Open photo in gallery viewer"><img src="'+esc(safeExternalUrl(photo.url))+'" alt="'+esc(photo.caption||"Photo shared by "+username)+'" loading="lazy"></a>'+(photo.caption?'<p class="profile-photo-caption">'+esc(photo.caption)+'</p>':'')+'<div class="profile-photo-meta"><time datetime="'+esc(photo.created_at)+'">'+fmt(photo.created_at)+'</time>'+(ownProfile?'<button class="action" type="button" data-favorite-photo="'+Number(photo.id)+'" aria-label="Toggle favorite">'+(favoriteIds.has(Number(photo.id))?'★':'☆')+'</button>'+(albumIds.length?'<label class="photo-album-choice"><span>Album</span><select data-photo-album aria-label="Choose album for photo">'+albumIds.map(a=>'<option value="'+Number(a.id)+'">'+esc(a.name)+'</option>').join("")+'</select></label><button class="action" type="button" data-add-album="'+Number(photo.id)+'">Add</button>':'')+(albumSelection&&albumSelection!=="favorites"?'<button class="action" type="button" data-remove-album="'+Number(photo.id)+'">Remove from album</button>':'')+'<button class="action photo-delete" type="button" data-photo-delete="'+Number(photo.id)+'">Delete</button>':'')+'</div></article>').join(""):'<p class="photo-empty">No photos here yet.</p>';
  };
  try{await refresh()}catch(error){grid.innerHTML='<p class="photo-empty">Photos could not load: '+esc(error.message)+'</p>';count.textContent="Unavailable"}
  if(ownProfile){
    panel.querySelector("#profile-photo-upload").addEventListener("submit",async event=>{
      event.preventDefault();const form=event.currentTarget,file=form.elements.file.files?.[0],button=form.querySelector('button[type="submit"]');
      if(!file)return;if(file.size>8*1024*1024){status.textContent="Choose a photo smaller than 8 MB.";return;}if(!["image/jpeg","image/png","image/gif","image/webp"].includes(file.type)){status.textContent="Choose a JPG, PNG, GIF, or WebP image.";return;}button.disabled=true;status.textContent="Uploading photo…";
      try{const data=new FormData();data.append("file",file);data.append("caption",form.elements.caption.value);data.append("kind","gallery");const response=await fetch(API+"/api/profile/photos",{method:"POST",credentials:"include",body:data});const result=await response.json().catch(()=>({}));if(!response.ok)throw Error(result.error||"Photo upload failed.");form.reset();status.textContent="Photo uploaded.";await refresh();}
      catch(error){status.textContent=error.message}
      finally{button.disabled=false;}
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

async function loadMemberActivity(member,own){
 const section=document.createElement("section");section.className="profile-social-panel";
 section.innerHTML='<h2>Member updates</h2><p class="muted">Regular social updates appear here. Adult content stays separate.</p>'+(own?'<form id="profile-update-form"><textarea maxlength="5000" rows="3" placeholder="Share an update" required></textarea><select aria-label="Update visibility"><option value="public">Public</option><option value="followers">Followers</option><option value="private">Private</option></select><button class="action primary">Publish</button><p role="status"></p></form>':'')+'<div id="member-update-list"></div>';
 root.append(section);
 const list=section.querySelector("#member-update-list");
 const refresh=async()=>{const d=await api("/api/social/activity?user_id="+encodeURIComponent(member.id)+"&limit=30");list.innerHTML=(d.activities||[]).map(a=>'<article class="activity"><small>'+esc(new Date(a.created_at).toLocaleString())+(own?' · '+esc(a.visibility):'')+'</small><p>'+esc(a.body)+'</p></article>').join("")||'<p class="muted">No updates yet.</p>'};
 try{await refresh()}catch(e){list.textContent=e.message}
 if(own)section.querySelector("form").addEventListener("submit",async e=>{e.preventDefault();const form=e.currentTarget,button=form.querySelector("button"),status=form.querySelector('[role="status"]');button.disabled=true;try{await api("/api/social/activity",{method:"POST",body:JSON.stringify({body:form.querySelector("textarea").value,visibility:form.querySelector("select").value})});form.querySelector("textarea").value="";status.textContent="Published.";await refresh()}catch(err){status.textContent=err.message}finally{button.disabled=false}});
}

function refreshProfileJump(){
  const old=root.querySelector(".profile-jump");
  const sections=[
    ["#profile-wallet","Wallet"],
    [".profile-favorites","Interests"],
    [".profile-birth-chart","Birth chart"],
    [".activity-grid","Activity"],
    [".profile-social-panel","Updates"],
    ["#profile-photo-gallery","Photos"]
  ];
  const jump=document.createElement("nav");jump.className="profile-jump";jump.setAttribute("aria-label","Profile sections");
  for(const [selector,label] of sections){
    const section=root.querySelector(selector);
    if(!section||section.hidden)continue;
    const id=section.id||"profile-section-"+label.toLowerCase();
    section.id=id;
    const link=document.createElement("a");link.href="#"+id;link.textContent=label;jump.append(link);
  }
  if(jump.children.length>1){
    if(old)old.replaceWith(jump);
    else root.querySelector(".profile-actions-wrap")?.after(jump);
  }else old?.remove();
}

function applyProfileLayout(layout){if(!Array.isArray(layout)){refreshProfileJump();return;}const selectors={favorites:".profile-favorites",activity:".activity-grid",updates:".profile-social-panel",photos:"#profile-photo-gallery"};for(const item of layout){if(!item||typeof item.id!=="string"||typeof item.visible!=="boolean"||!Object.hasOwn(selectors,item.id))continue;const section=root.querySelector(selectors[item.id]);if(!section)continue;section.hidden=item.visible===false;root.append(section);}refreshProfileJump();}

async function load(){
 try{
   if(adminUserId){
     const me=await api("/api/auth/me"); if(!["admin","god"].includes(me.user?.role)) throw Error("Administrator access required.");
     const d=await api("/api/admin/users/"+encodeURIComponent(adminUserId)+"/detail");
     d.user.is_online=d.user.last_seen_at?Date.now()-new Date(d.user.last_seen_at).getTime()<5*60*1000:false;
     render(d,true);refreshProfileJump(); return;
   }
   let targetUsername=username;
   if(!targetUsername){
     const session=await api("/api/auth/me").catch(()=>({user:null}));
     if(!session.user?.username){root.innerHTML='<h1>Sign in to view your profile</h1><p>Open a member profile from the directory, or sign in to view your own.</p><p><a class="action primary" href="/index.html">Sign in</a> <a class="action" href="/members.html">Browse members</a></p>';return;}
     targetUsername=session.user.username;
     const url=new URL(location.href);url.searchParams.set("username",targetUsername);history.replaceState(null,"",url);
   }
   let d;
   try { d=await api("/api/users/"+encodeURIComponent(targetUsername)); }
   catch(primaryError){
     // Never bypass a private, blocked, or otherwise restricted profile via directory data.
     if(primaryError.status===401||primaryError.status===403||primaryError.status===404)throw primaryError;
     // The public directory can still display a member when the detailed profile
     // endpoint is temporarily unavailable. Never claim private fields are public.
     const directory=await api("/api/discover?q="+encodeURIComponent(targetUsername)+"&limit=50&offset=0").catch(()=>null);
     const member=directory?.users?.find(u=>String(u.username||"").toLowerCase()===targetUsername.toLowerCase());
     if(!member)throw primaryError;
     const safeName=esc(member.display_name||member.username);
     const fallbackSession=await api("/api/auth/me").catch(()=>({user:null}));
     const fallbackOwn=String(fallbackSession.user?.username||"").toLowerCase()===String(member.username).toLowerCase();
     root.innerHTML='<div class="profile-top"><div class="avatar">'+esc(String(member.display_name||member.username).slice(0,1).toUpperCase())+'</div><div class="profile-heading"><h1>'+safeName+'</h1><p class="handle">@'+esc(member.username)+'</p></div></div><p class="bio">'+esc(member.bio||"This member has not added a public bio.")+'</p><p class="muted">Detailed profile information is temporarily unavailable.</p><div class="profile-actions">'+(fallbackOwn?'<a class="action primary" href="/profile-edit.html">Edit profile</a>':!fallbackSession.user?'<a class="action primary" href="/auth.html?next=%2Fprofile.html">Sign in to connect</a>':'<button class="action primary" type="button" data-fallback-friend="'+esc(member.username)+'">Add friend</button><button class="action" type="button" data-message-user="'+esc(member.username)+'">Message</button>')+'<a class="action" href="/members.html">Member directory</a><a class="action" href="/profile.html?username='+encodeURIComponent(member.username)+'">Retry full profile</a></div>';
     return;
   }
   if(!d?.user?.username)throw Error("Profile data was incomplete. Please retry.");
   const me=await api("/api/auth/me").catch(()=>({user:null}));
   const ownProfile=!!me.user&&String(me.user.id)===String(d.user.id);render(d,false,ownProfile,!!me.user);refreshProfileJump();applyProfileLayout(d.profile_layout);
   // Optional modules must not make an otherwise valid public profile disappear.
   try{await loadMemberActivity(d.user,ownProfile)}catch(error){console.warn("Profile activity unavailable",error)}
   applyProfileLayout(d.profile_layout);
   try{await loadProfilePhotos(d.user.username,ownProfile)}catch(error){console.warn("Profile photos unavailable",error)}
   applyProfileLayout(d.profile_layout);
   if(me.user&&String(me.user.id)!==String(d.user.id)){try{
     const relations=await api("/api/friends"),button=root.querySelector("#friend");
     if(button){
       const matches=person=>String(person.username||"").toLowerCase()===String(d.user.username).toLowerCase();
       const incoming=(relations.incoming||[]).find(matches);
       if((relations.friends||[]).some(matches)){button.textContent="Friends ✓";button.disabled=true;}
       else if((relations.outgoing||[]).some(matches)){button.textContent="Request sent ✓";button.disabled=true;}
       else if(incoming){
         button.textContent="Accept request";button.disabled=false;
         button.onclick=async()=>{button.disabled=true;try{await api("/api/friends/"+encodeURIComponent(incoming.id),{method:"PATCH",body:JSON.stringify({action:"accept"})});button.textContent="Friends ✓";const stat=root.querySelector("#profile-friend-stat");if(stat)stat.textContent=String(Number(stat.textContent||0)+1);}catch(error){button.textContent=error.message;button.disabled=false;}};
       }
     }
   }catch(error){console.warn("Friendship state unavailable",error);}}
   if(me.user?.role==="god"&&ownProfile)renderDeveloperControls();
 }catch(error){root.innerHTML="<h1>Profile temporarily unavailable</h1><p>"+esc(error.message)+"</p><p>Profile data could not be loaded. Your profile has not been deleted.</p><div class=\"profile-actions\"><button class=\"action primary\" type=\"button\" id=\"retry-profile\">Retry profile</button><a class=\"action\" href=\"/members.html\">Browse members</a><a class=\"action\" href=\"/account.html\">Account settings</a></div>";root.querySelector("#retry-profile")?.addEventListener("click",()=>{root.innerHTML="<p>Loading profile…</p>";load();},{once:true});}
}
load();
