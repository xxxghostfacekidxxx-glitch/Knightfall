/* Knightfall portfolio + milestone gallery. The server verifies all earned badges. */
(()=>{
"use strict";
const API="https://api.ash-fall.com";
const node=(type,cls,content)=>{const e=document.createElement(type);if(cls)e.className=cls;if(content!==undefined)e.textContent=String(content);return e};
const button=(text,fn)=>{const b=node("button","profile-showcase-button",text);b.type="button";if(fn)b.addEventListener("click",fn);return b};
async function api(path,opts={}){
 const response=await fetch(API+path,{credentials:"include",cache:"no-store",...opts,headers:{"content-type":"application/json",...(opts.headers||{})}});
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(data.error||"Unable to load profile showcase.");
 return data;
}
let refresh=null;
async function mount(root,member,own){
 if(!root||!member?.username)return;
 root.querySelector("#profile-featured")?.remove();
 root.querySelector("#profile-achievements")?.remove();
 const showcase=node("section","profile-showcase");
 showcase.id="profile-featured";
 const head=node("div","profile-showcase-header");
 const info=node("div");
 info.append(node("p","eyebrow","THE CREATOR SPOTLIGHT"),node("h2","","Featured creations"),
  node("p","profile-showcase-description","A handpicked showcase from this member's actual photo gallery."));
 head.append(info);showcase.append(head);
 const grid=node("div","profile-showcase-grid");showcase.append(grid);
 const status=node("p","profile-showcase-status");status.setAttribute("role","status");showcase.append(status);
 const achievements=node("section","profile-achievements");achievements.id="profile-achievements";
 const title=node("div","profile-showcase-header");
 const heading=node("div");
 heading.append(node("p","eyebrow","EARNED, NOT CLAIMED"),node("h2","","Milestones & achievements"));
 const count=node("span","profile-achievements-count","Loading…");
 title.append(heading,count);achievements.append(title);
 const badges=node("div","profile-achievement-grid");achievements.append(badges);
 root.append(showcase,achievements);
 const update=async()=>{
  const data=await api("/api/profile-showcase?username="+encodeURIComponent(member.username));
  count.textContent=data.earned_total+" / "+data.achievement_total+" earned";
  grid.replaceChildren();
  if(!data.featured.length)grid.append(node("p","profile-showcase-empty",own?"No featured creations yet. Choose up to three from your gallery.":"No featured creations yet."));
  for(const featured of data.featured){
   const card=node("article","profile-showcase-card");
   const img=document.createElement("img");img.src=featured.url;img.alt=featured.caption||"Featured gallery creation";img.loading="lazy";img.decoding="async";
   const caption=node("p","",featured.caption||"Featured creation");
   const tag=node("span","profile-showcase-tag","FEATURED · "+featured.slot);
   card.append(img,tag,caption);
   grid.append(card);
  }
  badges.replaceChildren();
  if(!data.achievements.length)badges.append(node("p","profile-showcase-empty",own?"Your first milestone is ready to earn.":"No public achievements earned yet."));
  for(const badge of data.achievements){
   const tile=node("article","profile-achievement"+(badge.earned?" is-earned":" is-locked"));
   const symbol=node("span","profile-achievement-icon",badge.icon);symbol.setAttribute("aria-hidden","true");
   const body=node("div","profile-achievement-copy");
   body.append(node("strong","",badge.label),node("small","",badge.description));
   const mark=node("span","profile-achievement-state",badge.earned?"Unlocked":"In progress · "+badge.progress+"/"+badge.goal);
   tile.append(symbol,body,mark);badges.append(tile);
  }
  return data;
 };
 let picker=null;
 if(own){
  const toggle=button("✦ Curate your showcase",async()=>{
   if(picker){picker.remove();picker=null;return;}
   const editor=node("div","profile-showcase-editor");
   const instruction=node("p","","Select up to three creations. Your selection order determines the display order.");
   const list=node("div","profile-showcase-picker");
   const actions=node("div","profile-showcase-actions");
   const save=button("Save featured creations",async()=>{
    save.disabled=true;feedback.textContent="Saving showcase…";
    try{
     await api("/api/profile-showcase",{method:"PUT",body:JSON.stringify({photo_ids:selected})});
     feedback.textContent="Showcase updated.";await update();
     picker.remove();picker=null;
    }catch(e){feedback.textContent=e.message;}finally{save.disabled=false}
   });
   const cancel=button("Cancel",()=>{editor.remove();picker=null;});
   const feedback=node("p","profile-showcase-status");feedback.setAttribute("role","status");
   actions.append(save,cancel);editor.append(instruction,list,actions,feedback);
   picker=editor;showcase.append(editor);feedback.textContent="Loading gallery…";
   let photos=[];
   try{const d=await api("/api/profile/photos?username="+encodeURIComponent(member.username));photos=(d.photos||[]).slice(0,60)}catch(e){feedback.textContent=e.message;return}
   const current=await api("/api/profile-showcase?username="+encodeURIComponent(member.username));
   let selected=current.featured.map(p=>p.photo_id);
   const redraw=()=>{
    list.replaceChildren();
    if(!photos.length)list.append(node("p","profile-showcase-empty","Upload a gallery photo first, then feature it here."));
    for(const photo of photos){
     const isSelected=selected.includes(photo.id),position=selected.indexOf(photo.id)+1;
     const option=button((isSelected?"✓ Featured "+position:"＋ Feature")+" · "+(photo.caption||"Photo "+photo.id),()=>{
      if(selected.includes(photo.id))selected=selected.filter(id=>id!==photo.id);
      else if(selected.length<3)selected.push(photo.id);
      else{feedback.textContent="You can feature up to three creations.";return}
      feedback.textContent="";redraw();
     });
     option.setAttribute("aria-pressed",String(isSelected));
     const image=document.createElement("img");image.src=photo.url;image.loading="lazy";image.alt="";
     option.prepend(image);list.append(option);
    }
   };
   redraw();feedback.textContent="";
  });
  head.append(toggle);
 }
 refresh=async()=>{try{await update()}catch(e){status.textContent=e.message}};
 await refresh();
 window.dispatchEvent(new CustomEvent("kf:profile-section-mounted"));
}
window.KnightfallProfileHighlights={mount,refresh:()=>refresh?.()};
})();
