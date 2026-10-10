(() => {
  const API="https://api.ash-fall.com";
  const form=document.querySelector("#diary-form");
  const titleInput=document.querySelector("#entry-title");
  const bodyInput=document.querySelector("#entry-body");
  const entriesRoot=document.querySelector("#diary-entries");
  const status=document.querySelector("#diary-status");
  const count=document.querySelector("#entry-count");
  const charCount=document.querySelector("#char-count");
  const saveButton=document.querySelector("#save-entry");
  const cancelButton=document.querySelector("#cancel-edit");
  let editingId=null;
  let entries=[];
  const api=async(path,options={})=>{
    const response=await fetch(API+path,{credentials:"include",cache:"no-store",...options,headers:{"content-type":"application/json",...(options.headers||{})}});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw Error(data.error||"The request could not be completed.");
    return data;
  };
  const showStatus=(message,error=false)=>{status.textContent=message;status.classList.toggle("error",error);};
  const dateText=value=>{const date=new Date(value);return Number.isNaN(date.getTime())?"Date unavailable":date.toLocaleString([], {dateStyle:"medium",timeStyle:"short"});};
  const updateCharCount=()=>{charCount.textContent=bodyInput.value.length.toLocaleString()+" / 20,000";};
  function resetForm(){editingId=null;form.reset();saveButton.textContent="Save privately";cancelButton.hidden=true;updateCharCount();}
  function renderEntries(){
    count.textContent=entries.length+" / 300 entries";
    entriesRoot.replaceChildren();
    if(!entries.length){
      const empty=document.createElement("div");empty.className="diary-empty";
      empty.textContent="Nothing written here yet. That's okay. This space isn't going anywhere. Start with one sentence, or don't. It's yours.";
      entriesRoot.append(empty);return;
    }
    for(const entry of entries){
      const card=document.createElement("article");card.className="diary-entry";
      const head=document.createElement("div");head.className="diary-entry-head";
      const heading=document.createElement("div");const h=document.createElement("h3");h.textContent=entry.title||"Untitled entry";
      const time=document.createElement("time");time.dateTime=entry.updated_at||entry.created_at;time.textContent=(entry.updated_at!==entry.created_at?"Edited ":"")+dateText(entry.updated_at||entry.created_at);
      heading.append(h,time);head.append(heading);card.append(head);
      const body=document.createElement("p");body.className="diary-entry-body";body.textContent=entry.body;card.append(body);
      const actions=document.createElement("div");actions.className="diary-entry-actions";
      const edit=document.createElement("button");edit.type="button";edit.textContent="Edit entry";
      edit.addEventListener("click",()=>{editingId=entry.id;titleInput.value=entry.title==="Untitled entry"?"":entry.title;bodyInput.value=entry.body;saveButton.textContent="Save changes";cancelButton.hidden=false;showStatus("Editing entry. Your original remains saved until you save changes.");updateCharCount();form.scrollIntoView({behavior:"smooth",block:"start"});bodyInput.focus();});
      const remove=document.createElement("button");remove.type="button";remove.className="delete-entry";remove.textContent="Delete";
      remove.addEventListener("click",async()=>{
        if(!confirm("Permanently delete this journal entry? This cannot be undone."))return;
        remove.disabled=true;
        try{await api("/api/die-ary/entries/"+encodeURIComponent(entry.id),{method:"DELETE"});entries=entries.filter(item=>item.id!==entry.id);if(editingId===entry.id)resetForm();renderEntries();showStatus("Entry permanently deleted.");}
        catch(error){showStatus(error.message,true);remove.disabled=false;}
      });
      actions.append(edit,remove);card.append(actions);entriesRoot.append(card);
    }
  }
  async function loadEntries(){const data=await api("/api/die-ary/entries");entries=data.entries||[];renderEntries();}
  async function init(){
    try{
      const me=await api("/api/auth/me");
      if(!me.user){
        document.querySelector(".diary-shell").innerHTML='<section class="diary-card"><h1>Sign in to open your Die-ary</h1><p class="diary-intro">Your private journal is available to signed-in members.</p><p><a class="button" href="/auth.html">Sign in or create an account</a></p></section>';
        return;
      }
      await loadEntries();
    }catch(error){
      count.textContent="Unavailable";
      entriesRoot.innerHTML='<div class="diary-empty">Your journal could not be loaded. <a href="/auth.html">Sign in</a> if your session has expired, then try again.</div>';
      showStatus(error.message,true);
    }
  }
  bodyInput.addEventListener("input",updateCharCount);
  cancelButton.addEventListener("click",()=>{resetForm();showStatus("Edit cancelled. Your saved entry was not changed.");titleInput.focus();});
  form.addEventListener("submit",async event=>{
    event.preventDefault();
    const title=titleInput.value.trim(),body=bodyInput.value.trim();
    if(!body){showStatus("Write something in the entry before saving.",true);bodyInput.focus();return;}
    if(body.length>20000||title.length>120){showStatus("The entry exceeds the allowed length.",true);return;}
    const wasEditing=editingId!==null;
    saveButton.disabled=true;cancelButton.disabled=true;showStatus(wasEditing?"Saving your changes…":"Saving privately…");
    try{
      const data=await api(wasEditing?"/api/die-ary/entries/"+encodeURIComponent(editingId):"/api/die-ary/entries",{method:wasEditing?"PATCH":"POST",body:JSON.stringify({title,body})});
      if(wasEditing)entries=entries.map(entry=>entry.id===editingId?data.entry:entry);else entries.unshift(data.entry);
      resetForm();renderEntries();showStatus(wasEditing?"Entry updated privately.":"Entry saved privately.");
    }catch(error){showStatus(error.message,true);}
    finally{saveButton.disabled=false;cancelButton.disabled=false;}
  });
  updateCharCount();init();
})();