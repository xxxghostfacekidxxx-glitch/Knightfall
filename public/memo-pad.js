/* Knightfall Memo Pad. Private cloud notes and explicit member-to-member sharing.
   All user text is written with textContent/value, never interpolated into HTML. */
(()=>{'use strict';
const API='https://api.ash-fall.com',LIMIT=4000,DELAY=900;
const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=String(text);return el};
const api=async(path,options={})=>{
 const result=await fetch(API+path,{credentials:'include',cache:'no-store',...options,
  headers:{'content-type':'application/json',...(options.headers||{})}});
 const data=await result.json().catch(()=>({}));
 if(!result.ok){const err=new Error(data.error||'Request failed ('+result.status+').');err.status=result.status;throw err}
 return data;
};
function mount(host,{compact=false}={}){
 if(!host||host.dataset.memoMounted)return null;host.dataset.memoMounted='true';host.classList.add('kf-memo-app');if(compact)host.classList.add('compact');
 host.replaceChildren();
 let notes=[],selected=null,dirty=false,saving=false,savePromise=null,saveTimer=0,lookupTimer=0,lookupToken=0,recipient='',recipientName='',isSignedIn=false,account='',myUsername='',rev=0,disposed=false;
 const h=make('div','memo-heading'),title=make('h2','',compact?'📝 Memo Pad':'THE MEMO PAD'),subtitle=make('p','',compact?'Scratch it down. Send it when you mean it.':'Private notes for your Knightfall account. Quick-send any memo to another member.');
 h.append(title,subtitle);
 const bar=make('div','memo-toolbar'),newButton=make('button','memo-button primary','+ New'),saveButton=make('button','memo-button','Save memo'),refreshButton=make('button','memo-button subtle','↻ Refresh');
 for(const b of [newButton,saveButton,refreshButton])b.type='button';bar.append(newButton,saveButton,refreshButton);
 const status=make('p','memo-status','Loading your memos…');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const content=make('div','memo-content'),listbox=make('div','memo-list'),editor=make('div','memo-editor');
 listbox.setAttribute('aria-label','Saved memos');
 const noteTitle=make('input','memo-title'),body=make('textarea','memo-body');
 noteTitle.placeholder='Memo title';noteTitle.maxLength=100;noteTitle.setAttribute('aria-label','Memo title');
 body.placeholder='Write anything you need to remember…';body.maxLength=LIMIT;body.rows=compact?7:12;body.setAttribute('aria-label','Memo text');
 const counter=make('small','memo-counter','0 / 4,000 characters');
 const deleteButton=make('button','memo-button danger','Delete memo');deleteButton.type='button';
 const editorFoot=make('div','memo-editor-footer');editorFoot.append(counter,deleteButton);
 editor.append(noteTitle,body,editorFoot);content.append(listbox,editor);
 const sendBox=make('section','memo-send-box'),sendHeading=make('h3','','↗ Quick Send to a Member');
 const info=make('p','','Sends a copy as a private message. Your original memo stays private. Only send to someone you select.');
 const recipientLabel=make('label','','Find a member');
 const search=make('input','memo-member-search');search.type='search';search.autocomplete='off';search.placeholder='Search username or display name…';search.maxLength=80;
 recipientLabel.append(search);
 const results=make('div','memo-member-results');results.setAttribute('aria-label','Member search results');
 const chosen=make('div','memo-chosen');const sendButton=make('button','memo-button primary','Send memo →');sendButton.type='button';sendButton.disabled=true;
 const sendFoot=make('div','memo-send-foot'),inboxLink=make('a','memo-inbox-link','Open inbox ↗');
 inboxLink.href='/messages.html';sendFoot.append(sendButton,inboxLink);
 sendBox.append(sendHeading,info,recipientLabel,results,chosen,sendFoot);
 const auth=make('div','memo-auth');auth.hidden=true;
 const signLink=make('a','memo-button primary','Sign in to use Memo Pad');signLink.href='/auth.html?next='+encodeURIComponent(location.pathname+location.search);
 auth.append(make('p','','Memo Pad saves private notes to your account and sends through the member inbox.'),signLink);
 host.append(h,bar,status,content,sendBox,auth);
 const say=(msg,err=false)=>{status.textContent=msg;status.dataset.error=err?'true':'false'};
 function updateSend(){const text=body.value.trim(),headline=noteTitle.value.trim()||'Untitled memo',full='📝 '+headline+'\n\n'+text;
  sendButton.disabled=!isSignedIn||!recipient||!text||full.length>LIMIT||saving;
  counter.textContent=body.value.length.toLocaleString()+' / 4,000 characters';
  if(text&&full.length>LIMIT)chosen.textContent='Shorten your memo: its title and body must total 4,000 characters to send.';
 }
 function clearRecipient(){recipient='';recipientName='';chosen.textContent='';results.replaceChildren();updateSend()}
 function drawList(){
  listbox.replaceChildren();
  const heading=make('div','memo-list-heading','MY NOTES · '+notes.length+'/100');listbox.append(heading);
  if(!notes.length){listbox.append(make('p','memo-empty','No memos yet. Write one and hit Save.'));return}
  for(const memo of notes){
   const button=make('button','memo-list-item'+(selected===memo.id?' active':''));
   button.type='button';button.dataset.memoId=String(memo.id);
   button.append(make('strong','',memo.title||'Untitled memo'),make('small','',(memo.body||'').slice(0,72)||'Empty memo'));
   button.addEventListener('click',async()=>{
    if(selected===memo.id)return;
    if(dirty&&!await commit())return;
    selected=memo.id;choose(memo);drawList();
   });listbox.append(button);
  }
 }
 function choose(memo){
  noteTitle.value=memo?.title||'';body.value=memo?.body||'';dirty=false;rev++;clearRecipient();
  deleteButton.disabled=!memo;updateSend();
 }
 function disable(disabled){
  for(const node of [newButton,saveButton,refreshButton,noteTitle,body,deleteButton,search])node.disabled=disabled;
  if(disabled)sendButton.disabled=true;else updateSend();
 }
 async function refresh({initial=false}={}){
  try{
   const me=await api('/api/auth/me');isSignedIn=!!me.user;
   if(!isSignedIn){
    auth.hidden=false;content.hidden=true;bar.hidden=true;sendBox.hidden=true;say('Sign in to save or share private memos.');
    return;
   }
   const uid=String(me.user.id||me.user.user_id||me.user.username||'member');
   if(account&&account!==uid){notes=[];selected=null;choose(null)}
   account=uid;myUsername=String(me.user.username||'').toLowerCase();auth.hidden=true;content.hidden=false;bar.hidden=false;sendBox.hidden=false;
   const data=await api('/api/memos');
   notes=Array.isArray(data.memos)?data.memos:[];
   const current=notes.find(m=>m.id===selected);
   selected=current?.id??notes[0]?.id??null;
   choose(current||notes[0]||null);drawList();say(notes.length?'Memos synced to your account.':'Start writing your first memo.');
  }catch(e){say(e.message||'Could not load memos.',true);if(e.status===401){auth.hidden=false;content.hidden=true;sendBox.hidden=true;bar.hidden=true}}
 }
 async function commit(){
  clearTimeout(saveTimer);saveTimer=0;
  if(!isSignedIn)return false;
  if(savePromise){const wasSaved=await savePromise;if(!wasSaved)return false;if(dirty)return commit();return true;}
  if(!dirty){say(selected?'All changes saved.':'Write a memo to save.');return true}
  const titleText=(noteTitle.value.trim()||'Untitled memo'),bodyText=body.value.trimEnd(),localRev=rev,id=selected;
  if(!bodyText.trim()&&!noteTitle.value.trim()){say('Write something before saving.',true);return false}
  if(notes.length>=100&&!id){say('Memo limit is 100. Delete one before adding another.',true);return false}
  saving=true;saveButton.disabled=true;updateSend();say('Saving…');
  savePromise=(async()=>{
   try{
    const data=await api(id?'/api/memos/'+id:'/api/memos',{method:id?'PATCH':'POST',body:JSON.stringify({title:titleText,body:bodyText})});
    const saved=data.memo;if(!saved)throw Error('Memo save did not return an entry.');
    const ix=notes.findIndex(m=>m.id===saved.id);
    if(ix>=0)notes[ix]=saved;else notes.unshift(saved);
    notes.sort((a,b)=>String(b.updated_at).localeCompare(String(a.updated_at)));
    if(selected===id){selected=saved.id;dirty=localRev!==rev;}
    drawList();say(dirty?'Saved. More edits pending…':'Saved privately ✓');
    document.dispatchEvent(new CustomEvent('kf:memos-updated',{detail:{source:host}}));
    if(dirty)scheduleSave();
    return true;
   }catch(error){say(error.message||'Memo could not be saved.',true);return false}
   finally{saving=false;savePromise=null;saveButton.disabled=false;updateSend()}
  })();
  const completed=await savePromise;
  if(completed&&dirty)return commit();
  return completed;
 }
 function scheduleSave(){clearTimeout(saveTimer);if(isSignedIn&&dirty)saveTimer=setTimeout(()=>{void commit()},DELAY)}
 const edit=()=>{dirty=true;rev++;counter.textContent=body.value.length.toLocaleString()+' / 4,000 characters';updateSend();scheduleSave()};
 noteTitle.addEventListener('input',edit);body.addEventListener('input',edit);
 saveButton.addEventListener('click',()=>{dirty=true;void commit()});
 newButton.addEventListener('click',async()=>{
  if(dirty&&!await commit())return;
  selected=null;choose(null);drawList();noteTitle.focus();say('New memo. Type to save.');
 });
 refreshButton.addEventListener('click',async()=>{if(dirty&&!await commit())return;await refresh()});
 deleteButton.addEventListener('click',async()=>{
  if(!selected||!isSignedIn)return;
  if(!confirm('Delete this memo? This cannot be undone.'))return;
  const id=selected;clearTimeout(saveTimer);
  try{await api('/api/memos/'+id,{method:'DELETE'});notes=notes.filter(m=>m.id!==id);selected=notes[0]?.id??null;choose(notes[0]||null);drawList();say('Memo deleted.');document.dispatchEvent(new CustomEvent('kf:memos-updated',{detail:{source:host}}))}
  catch(e){say(e.message,true)}
 });
 function renderMembers(users){
  results.replaceChildren();
  if(!users.length){results.append(make('p','memo-empty','No matching active members.'));return}
  for(const u of users){
   if(!/^[a-z0-9_]{3,24}$/.test(String(u.username||'')))continue;
   const b=make('button','memo-member-result');b.type='button';
   b.append(make('strong','','@'+u.username),make('small','',u.display_name||'Knightfall member'));
   b.addEventListener('click',()=>{
    recipient=u.username;recipientName=u.display_name||u.username;
    chosen.textContent='Sending to @'+recipient+' ('+recipientName+')';
    results.replaceChildren();search.value='@'+recipient;updateSend();
   });results.append(b);
  }
 }
 search.addEventListener('input',()=>{
  clearTimeout(lookupTimer);lookupToken++;clearRecipient();
  const q=search.value.trim().replace(/^@/,'').slice(0,80);if(q.length<2)return;
  const token=lookupToken;
  lookupTimer=setTimeout(async()=>{
   try{const data=await api('/api/discover?q='+encodeURIComponent(q)+'&limit=16');
    if(token!==lookupToken)return;
    renderMembers((data.users||[]).filter(u=>String(u.username||'').toLowerCase()!==myUsername));
   }catch(e){if(token===lookupToken)results.replaceChildren(make('p','memo-empty',e.message||'Search unavailable'))}
  },300);
 });
 sendButton.addEventListener('click',async()=>{
  if(!recipient||!isSignedIn||saving)return;
  const name=recipient,titleText=noteTitle.value.trim()||'Untitled memo',text=body.value.trim();
  const outgoing='📝 '+titleText+'\n\n'+text;
  if(!text||outgoing.length>LIMIT){say('Memo and title must fit within 4,000 characters.',true);return}
  if(dirty&&!await commit())return;
  if(dirty&&!await commit())return; // Flush edits made during the first in-flight autosave.
  sendButton.disabled=true;say('Sending to @'+name+'…');
  try{
   const convo=await api('/api/messages/conversations',{method:'POST',body:JSON.stringify({username:name})});
   if(!Number.isSafeInteger(Number(convo.id))||Number(convo.id)<1)throw Error('Conversation not available.');
   await api('/api/messages/conversations/'+convo.id,{method:'POST',body:JSON.stringify({body:outgoing})});
   inboxLink.href='/messages.html?conversation='+encodeURIComponent(String(convo.id));
   inboxLink.textContent='View sent message ↗';
   say('Memo sent to @'+name+'. Your original is still saved privately. ✓');
   clearRecipient();search.value='';
  }catch(error){say(error.message||'Could not send. The memo was not deleted.',true);updateSend()}
 });
 document.addEventListener('kf:memos-updated',e=>{if(disposed||e.detail?.source===host||dirty||saving)return;void refresh()});
 const controller={refresh:()=>refresh(),dispose:()=>{disposed=true;clearTimeout(saveTimer);clearTimeout(lookupTimer)}};
 void refresh({initial:true});return controller;
}
window.KnightfallMemoPad={mount};
const full=document.getElementById('memo-pad-app');if(full)mount(full);
})();
