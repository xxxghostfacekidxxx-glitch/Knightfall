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
  panel.innerHTML='<div class="developer-head"><div><p class="eyebrow">PRIVATE / ROOT ACCESS</p><h2>Miss Chaos · Developer Controls</h2><p>Global personality settings for future replies.</p></div><a class="action primary" href="/admin.html">Open Admin Dashboard ↗</a></div>'+
    '<form id="developer-form" class="developer-form">'+
    '<label for="dial-wit">Wit <output id="dial-wit-value">75</output></label><input id="dial-wit" name="chaos_wit" type="range" min="0" max="100" value="75">'+
    '<label for="dial-sarcasm">Sarcasm <output id="dial-sarcasm-value">60</output></label><input id="dial-sarcasm" name="chaos_sarcasm" type="range" min="0" max="100" value="60">'+
    '<label for="dial-darkness">Dark humor <output id="dial-darkness-value">55</output></label><input id="dial-darkness" name="chaos_darkness" type="range" min="0" max="100" value="55">'+
    '<label for="dial-warmth">Warmth <output id="dial-warmth-value">70</output></label><input id="dial-warmth" name="chaos_warmth" type="range" min="0" max="100" value="70">'+
    '<label for="dial-philosophy">Philosophical depth <output id="dial-philosophy-value">65</output></label><input id="dial-philosophy" name="chaos_philosophy" type="range" min="0" max="100" value="65">'+
    '<label for="chaos-custom-instructions">Extra developer guidance <small>Max 1,200 characters</small></label><textarea id="chaos-custom-instructions" name="chaos_custom_instructions" rows="4" maxlength="1200" placeholder="Optional instructions for Miss Chaos…"></textarea>'+
    '<div class="developer-actions"><button type="submit" class="action primary">Save personality</button><p id="developer-status" role="status" hidden></p></div></form>';
  root.append(panel);
  const form=panel.querySelector("#developer-form"),status=panel.querySelector("#developer-status");
  const dials=["chaos_wit","chaos_sarcasm","chaos_darkness","chaos_warmth","chaos_philosophy"];
  const outputId=key=>"dial-"+key.replace("chaos_","")+"-value";
  const updateOutput=key=>{const out=panel.querySelector("#"+outputId(key));if(out)out.value=form.elements[key].value;};
  for(const key of dials)form.elements[key].addEventListener("input",()=>updateOutput(key));
  const showStatus=(message,error=false)=>{status.textContent=message;status.hidden=false;status.classList.toggle("error",error);};
  (async()=>{
    try{
      const data=await api("/api/admin/chaos-personality");
      for(const key of dials){form.elements[key].value=Number(data.settings?.[key]??form.elements[key].value);updateOutput(key);}
      form.elements.chaos_custom_instructions.value=data.settings?.chaos_custom_instructions||"";
    }catch(error){showStatus(error.message,true);}
  })();
  form.addEventListener("submit",async event=>{
    event.preventDefault();const button=form.querySelector('button[type="submit"]');button.disabled=true;status.hidden=true;
    const settings={};for(const key of dials)settings[key]=Number(form.elements[key].value);
    settings.chaos_custom_instructions=form.elements.chaos_custom_instructions.value;
    try{await api("/api/admin/chaos-personality",{method:"PATCH",body:JSON.stringify(settings)});showStatus("Saved. New replies will use these settings.");}
    catch(error){showStatus(error.message,true);}
    button.disabled=false;
  });
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
   if(me.user?.role==="admin"&&me.user.username===d.user.username)renderDeveloperControls();
 }catch(error){root.innerHTML="<h1>Profile unavailable</h1><p>"+esc(error.message)+"</p>";}
}
load();
