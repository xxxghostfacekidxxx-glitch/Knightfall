/* Owner-only Link Hub editor. All profile links are explicitly saved to D1, never HTML. */
(()=>{'use strict';
const box=document.getElementById("link-studio");
if(!box||box.dataset.linksInitialized)return;box.dataset.linksInitialized="true";
const API="https://api.ash-fall.com",rowsBox=document.getElementById("studio-link-rows"),status=document.getElementById("studio-link-status"),count=document.getElementById("studio-link-count"),add=document.getElementById("studio-link-add"),form=document.getElementById("form");
const max=8,field=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e};
let loaded=false,loading=false,saving=false,rows=[],lastSaved=[],touched=false,run=0;
function snapshot(){return rows.map(r=>({label:r.label,url:r.url}))}
function hasChanges(){return touched&&JSON.stringify(snapshot())!==JSON.stringify(lastSaved)}
function msg(text,problem=false){status.textContent=text;status.dataset.error=problem?"true":"false"}
function update(){
 count.textContent=rows.length+" / "+max+" links";
 add.disabled=!loaded||saving||rows.length>=max;
 box.dataset.unsaved=hasChanges()?"true":"false";
 document.dispatchEvent(new CustomEvent("kf:profile-links-changed",{detail:{dirty:hasChanges()}}));
}
function validate(){
 if(rows.length>max)return "No more than eight links are allowed.";
 for(const item of rows){
  if(!item.label.trim()||item.label.trim().length>50)return "Every link needs a title (50 characters maximum).";
  if(!item.url.trim()||item.url.length>500)return "Each link needs a valid HTTPS address (500 characters maximum).";
  try{
   const u=new URL(item.url.trim());
   if(u.protocol!=="https:"||!u.hostname||u.username||u.password)return "Only secure HTTPS URLs without embedded credentials are supported.";
  }catch{return "Enter complete web addresses beginning with https://."}
 }
 return null;
}
function changed(){
 touched=true;update();
 const invalid=validate();
 msg(invalid||"Unpublished Link Hub edits. Save profile to publish.",!!invalid);
}
function render(){
 rowsBox.replaceChildren();
 if(!rows.length)rowsBox.append(field("p","studio-link-empty","No links yet. Add your portfolio, music, shop or social page."));
 rows.forEach((item,index)=>{
  const article=field("div","studio-link-row"),legend=field("span","studio-link-number",String(index+1).padStart(2,"0"));
  const labelWrap=field("label","studio-link-field"),addressWrap=field("label","studio-link-field");
  labelWrap.append(field("span","","Title"));
  const title=field("input","studio-link-name");title.type="text";title.maxLength=50;title.required=true;title.placeholder="Portfolio, Music, Shop…";title.value=item.label;
  title.setAttribute("aria-label","Link "+(index+1)+" title");title.addEventListener("input",()=>{rows[index].label=title.value;changed()});
  labelWrap.append(title);
  addressWrap.append(field("span","","HTTPS URL"));
  const input=field("input","studio-link-url");input.type="url";input.maxLength=500;input.required=true;input.inputMode="url";input.placeholder="https://yourwebsite.com";input.value=item.url;
  input.setAttribute("aria-label","Link "+(index+1)+" address");input.addEventListener("input",()=>{rows[index].url=input.value;changed()});
  addressWrap.append(input);
  const toolbar=field("div","studio-link-tools");
  const up=field("button","studio-link-tool","↑"),down=field("button","studio-link-tool","↓"),remove=field("button","studio-link-tool danger","×");
  for(const b of [up,down,remove])b.type="button";
  up.title="Move link up";down.title="Move link down";remove.title="Remove link";
  up.setAttribute("aria-label","Move link "+(index+1)+" up");down.setAttribute("aria-label","Move link "+(index+1)+" down");remove.setAttribute("aria-label","Remove link "+(index+1));
  up.disabled=index===0;down.disabled=index===rows.length-1;
  up.addEventListener("click",()=>{[rows[index-1],rows[index]]=[rows[index],rows[index-1]];render();changed()});
  down.addEventListener("click",()=>{[rows[index+1],rows[index]]=[rows[index],rows[index+1]];render();changed()});
  remove.addEventListener("click",()=>{rows.splice(index,1);render();changed()});
  toolbar.append(up,down,remove);article.append(legend,labelWrap,addressWrap,toolbar);rowsBox.append(article);
 });
 update();
}
function addRow(label=""){
 if(!loaded||saving)return false;
 if(rows.length>=max){msg("Your Link Hub has eight links already.",true);return false}
 rows.push({label,url:""});render();changed();
 const inputs=rowsBox.querySelectorAll("input");
 const focus=inputs[inputs.length-1]||null;if(focus)focus.focus({preventScroll:true});
 return true;
}
add.addEventListener("click",()=>addRow());
document.getElementById("studio-link-save")?.addEventListener("click",()=>{
 const submit=form?.querySelector('button[type="submit"]');
 if(!loaded||saving||!form||submit?.disabled){msg("Finish loading or preparing your profile before saving.",true);return}
 form.requestSubmit();
});
document.querySelectorAll("[data-studio-link-template]").forEach(b=>b.addEventListener("click",()=>addRow(b.dataset.studioLinkTemplate||"")));
async function load(){
 if(loading)return;loading=true;const version=++run;msg("Loading saved links…");
 try{
  const response=await fetch(API+"/api/profile/links",{credentials:"include",cache:"no-store"});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(data.error||"Unable to load your links.");
  if(version!==run)return;
  const fetched=Array.isArray(data.links)?data.links.slice(0,max).map(x=>({label:String(x.label||""),url:String(x.url||"")})):[];
  lastSaved=fetched.map(x=>({...x}));
  if(!touched)rows=fetched.map(x=>({...x}));
  loaded=true;render();msg(rows.length?"Links loaded. Edit and save to publish.":"Add a link to create your Link Hub.");
 }catch(error){msg(error.message||"Link Hub could not load. Reload the page to try again.",true)}
 finally{loading=false}
}
async function save(){
 if(!loaded)throw Error("Link Hub is not ready. Reload the page before saving.");
 if(!hasChanges())return {ok:true,links:lastSaved};
 const error=validate();if(error){msg(error,true);throw Error(error)}
 if(saving)throw Error("Links are already being saved.");
 const submitted=snapshot(),serialized=JSON.stringify(submitted);
 saving=true;update();msg("Publishing your Link Hub…");
 try{
  const response=await fetch(API+"/api/profile/links",{method:"PUT",credentials:"include",cache:"no-store",headers:{"content-type":"application/json"},body:JSON.stringify({links:submitted})});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(data.error||"Could not publish your links.");
  lastSaved=(data.links||submitted).map(x=>({...x}));
  touched=JSON.stringify(snapshot())!==serialized;
  msg(touched?"Links saved. Your newer edits still need saving.":"Link Hub published ✓");
  document.dispatchEvent(new CustomEvent("kf:profile-links-saved",{detail:{pending:hasChanges()}}));
  return data;
 }catch(error){msg(error.message,true);throw error}
 finally{saving=false;update()}
}
function discard(){
 if(!loaded||saving)return;
 rows=lastSaved.map(x=>({...x}));touched=false;render();msg("Link Hub restored to its last published version.");
 document.dispatchEvent(new CustomEvent("kf:profile-links-reset"));
}
form?.addEventListener("submit",event=>{
 if(!hasChanges())return;
 const error=validate()||(!loaded?"Link Hub is not ready. Please retry.":null);
 if(error){event.preventDefault();event.stopImmediatePropagation();msg(error,true);box.scrollIntoView({behavior:"smooth",block:"center"})}
},true);
window.KnightfallProfileLinks={hasChanges,save,discard,validate};
document.addEventListener("kf:profile-discard-links",discard);
document.addEventListener("kf:profile-loaded",()=>{void load()},{once:true});
if(window.__kfProfileStudioUser)void load();
update();
})();