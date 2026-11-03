/* Memo Mail (an inbox for notes) and Live Chat (a separate direct message workspace).
   Uses the existing authenticated member messaging API. No HTML injection. */
(()=>{'use strict';
const API='https://api.ash-fall.com';
const node=(tag,cls,content)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(content!==undefined)el.textContent=String(content);return el};
const request=async(path,options={})=>{
 const response=await fetch(API+path,{credentials:'include',cache:'no-store',...options,headers:{'content-type':'application/json',...(options.headers||{})}});
 const data=await response.json().catch(()=>({}));
 if(!response.ok){const e=new Error(data.error||'Request failed ('+response.status+').');e.status=response.status;throw e}
 return data;
};
function mount(host){
 if(!host||host.dataset.commsReady)return;
 host.dataset.commsReady='true';
 const baseElements=[host.querySelector('.memo-toolbar'),host.querySelector('.memo-content'),host.querySelector('.memo-send-box')].filter(Boolean);
 const toolbar=node('nav','memo-tabs');toolbar.setAttribute('role','tablist');toolbar.setAttribute('aria-label','Memo Pad sections');
 const labels=[['notes','📝 My Notes'],['inbox','✉ Memo Mail'],['chat','💬 Live Chat']];
 const buttons={};
 const viewport=node('div','memo-communications');
 const mailPane=node('section','memo-mail-pane'),chatPane=node('section','memo-chat-pane');
 mailPane.hidden=true;chatPane.hidden=true;viewport.append(mailPane,chatPane);
 for(const [tab,label] of labels){
  const b=node('button','memo-tab',label);b.type='button';b.dataset.tab=tab;b.setAttribute('role','tab');b.setAttribute('aria-selected',String(tab==='notes'));
  b.addEventListener('click',()=>activate(tab));toolbar.append(b);buttons[tab]=b;
 }
 const heading=host.querySelector('.memo-heading');heading?.after(toolbar);
 host.append(viewport);
 let active='notes',accountId=null,accountName='',inboxType='inbox',mailCache=[],activeMail=null,mailSeq=0,chatSeq=0;
 let convs=[],selectedConv=null,messageItems=[],chatSearchToken=0,chatTimer=0,mailTimer=0,chatBusy=false;
 let sending=false,mailBusy=false;
 const mailHeader=node('div','memo-subhead'),mailButtons=node('div','memo-switch');
 const inboxButton=node('button','memo-button','Received'),sentButton=node('button','memo-button subtle','Sent'),mailRefresh=node('button','memo-button subtle','↻');
 for(const b of [inboxButton,sentButton,mailRefresh])b.type='button';
 mailButtons.append(inboxButton,sentButton,mailRefresh);
 mailHeader.append(node('strong','','✉ Private Memo Mail'),mailButtons);
 const mailHint=node('p','memo-hint','Sent notes live here, not in your chat history. Unread notes are marked until opened.');
 const mailStatus=node('p','memo-status','');mailStatus.setAttribute('role','status');mailStatus.setAttribute('aria-live','polite');
 const mailLayout=node('div','memo-mail-layout'),mailList=node('div','memo-mail-list'),mailDetail=node('article','memo-mail-detail');
 mailList.setAttribute('aria-label','Memo letters');mailDetail.append(node('p','memo-empty','Select a memo to read it.'));
 mailLayout.append(mailList,mailDetail);
 mailPane.append(mailHeader,mailHint,mailStatus,mailLayout);
 const chatHeader=node('div','memo-subhead');chatHeader.append(node('strong','','💬 Live Member Chat'));
 const chatRefresh=node('button','memo-button subtle','↻ Refresh');chatRefresh.type='button';chatHeader.append(chatRefresh);
 const chatHint=node('p','memo-hint','Conversations update every few seconds while this tab is open. Chat messages stay in member messaging, separate from Memo Mail.');
 const chatStatus=node('p','memo-status','');chatStatus.setAttribute('role','status');chatStatus.setAttribute('aria-live','polite');
 const chatFind=node('div','memo-chat-find'),chatSearch=node('input','memo-chat-search');
 chatSearch.type='search';chatSearch.placeholder='Start chatting: find a member…';chatSearch.maxLength=80;chatSearch.setAttribute('aria-label','Find a member to chat with');
 const chatMatches=node('div','memo-chat-results');chatMatches.setAttribute('aria-label','Matching members');
 chatFind.append(chatSearch,chatMatches);
 const chatLayout=node('div','memo-chat-layout'),conversationList=node('div','memo-chat-list'),chatThread=node('div','memo-chat-thread');
 conversationList.setAttribute('aria-label','Direct conversations');
 const chatTitle=node('div','memo-chat-title','Choose a conversation'),chatMessages=node('div','memo-chat-messages');
 chatMessages.setAttribute('role','log');chatMessages.setAttribute('aria-label','Messages');chatMessages.setAttribute('aria-live','polite');
 const chatForm=node('form','memo-chat-form'),chatText=node('textarea','memo-chat-text');
 chatText.rows=2;chatText.maxLength=4000;chatText.placeholder='Write a chat message…';chatText.setAttribute('aria-label','New chat message');
 const chatSend=node('button','memo-button primary','Send →');chatSend.type='submit';chatSend.disabled=true;
 chatForm.append(chatText,chatSend);
 chatThread.append(chatTitle,chatMessages,chatForm);chatLayout.append(conversationList,chatThread);
 chatPane.append(chatHeader,chatHint,chatStatus,chatFind,chatLayout);
 const status=(element,message,error=false)=>{element.textContent=message;element.dataset.error=error?'true':'false'};
 const link=(label,url)=>{const a=node('a','memo-link',label);a.href=url;return a};
 const alive=()=>active==='chat'&&!document.hidden&&!host.closest('[hidden]');
 async function auth(){
  if(accountId)return true;
  const result=await request('/api/auth/me');
  if(!result.user){status(chatStatus,'Sign in to open live chat.',true);status(mailStatus,'Sign in to use Memo Mail.',true);return false}
  accountId=result.user.id||result.user.user_id;accountName=String(result.user.username||'').toLowerCase();return !!accountId;
 }
 function activate(tab){
  if(!buttons[tab])return;active=tab;
  for(const [key,b] of Object.entries(buttons)){
   const on=key===tab;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;
  }
  for(const e of baseElements)e.hidden=tab!=='notes';
  mailPane.hidden=tab!=='inbox';chatPane.hidden=tab!=='chat';
  host.dataset.activeMemoTab=tab;
  if(tab==='inbox')void loadMail();
  if(tab==='chat')void loadConversations();
  if(tab==='notes'&&host.dataset.memoMounted!=='true')status(mailStatus,'Open the Memo Pad to compose.');
 }
 async function loadMail(){
  if(active!=='inbox')return;
  const token=++mailSeq,box=inboxType;mailBusy=true;
  status(mailStatus,'Loading '+(box==='inbox'?'received':'sent')+' notes…');
  try{
   if(!await auth())return;
   const result=await request('/api/memo-mail?box='+box);
   if(token!==mailSeq||box!==inboxType)return;
   mailCache=result.mail||[];
   if(!mailCache.some(x=>x.id===activeMail))activeMail=mailCache[0]?.id||null;
   drawMail();
   status(mailStatus,mailCache.length?mailCache.length+' '+(inboxType==='inbox'?'received':'sent')+' memo'+(mailCache.length===1?'':'s')+(inboxType==='inbox'?' · '+mailCache.filter(x=>!x.read_at).length+' unread':''):'Nothing in this folder yet.');
  }catch(e){status(mailStatus,e.message,true)}
  finally{if(token===mailSeq)mailBusy=false}
 }
 function drawMail(){
  mailList.replaceChildren();
  if(!mailCache.length)mailList.append(node('p','memo-empty',inboxType==='inbox'?'No received memos.':'You have not sent any memos yet.'));
  for(const item of mailCache){
   const b=node('button','memo-mail-item'+(activeMail===item.id?' active':'')+(!item.read_at&&inboxType==='inbox'?' unread':''));
   b.type='button';b.append(node('strong','',item.subject),node('small','',((inboxType==='inbox'?'From ':'To ')+'@'+item.other_username)),
    node('small','',new Date(item.created_at).toLocaleString()));
   b.addEventListener('click',()=>{activeMail=item.id;drawMail();if(inboxType==='inbox'&&!item.read_at)void markRead(item)});
   mailList.append(b);
  }
  mailDetail.replaceChildren();
  const item=mailCache.find(x=>x.id===activeMail);
  if(!item){mailDetail.append(node('p','memo-empty','Select a memo to read it.'));return}
  mailDetail.append(node('h3','',item.subject),node('p','memo-mail-meta',(inboxType==='inbox'?'From ':'To ')+'@'+item.other_username+' · '+new Date(item.created_at).toLocaleString()),
   node('div','memo-mail-body',item.body));
  const actions=node('div','memo-mail-actions');
  if(inboxType==='inbox'){
   const chatButton=node('button','memo-button primary','💬 Chat with sender');chatButton.type='button';
   chatButton.addEventListener('click',async()=>{activate('chat');await startChat(item.other_username)});
   actions.append(chatButton);
  }
  const deleteButton=node('button','memo-button danger','Archive');deleteButton.type='button';
  deleteButton.addEventListener('click',async()=>{
   if(!confirm('Archive this memo from your '+(inboxType==='inbox'?'inbox':'sent folder')+'?'))return;
   try{await request('/api/memo-mail/'+item.id,{method:'DELETE'});activeMail=null;mailCache=mailCache.filter(m=>m.id!==item.id);drawMail();status(mailStatus,'Memo archived from this folder.');}
   catch(e){status(mailStatus,e.message,true)}
  });actions.append(deleteButton);mailDetail.append(actions);
 }
 async function markRead(item){
  try{const response=await request('/api/memo-mail/'+item.id+'/read',{method:'POST',body:'{}'});
   item.read_at=response.read_at||new Date().toISOString();drawMail();}
  catch(e){status(mailStatus,e.message,true)}
 }
 inboxButton.addEventListener('click',()=>{inboxType='inbox';activeMail=null;inboxButton.classList.add('primary');sentButton.classList.remove('primary');void loadMail()});
 sentButton.addEventListener('click',()=>{inboxType='sent';activeMail=null;sentButton.classList.add('primary');inboxButton.classList.remove('primary');void loadMail()});
 mailRefresh.addEventListener('click',()=>void loadMail());
 inboxButton.classList.add('primary');
 function drawConversationList(){
  conversationList.replaceChildren();
  if(!convs.length){conversationList.append(node('p','memo-empty','No one-on-one chats yet. Search for a member above.'));return}
  for(const c of convs){
   const b=node('button','memo-chat-contact'+(selectedConv===c.id?' active':''));
   b.type='button';
   b.append(node('strong','','@'+c.other_username),node('small','',c.last_body||'Start the conversation'));
   if(Number(c.unread_count)>0)b.append(node('small','memo-unread',c.unread_count+' unread'));
   b.addEventListener('click',()=>{selectedConv=c.id;chatTitle.textContent='@'+c.other_username;drawConversationList();void loadChat({scroll:true})});
   conversationList.append(b);
  }
 }
 function drawMessages(scroll=false){
  const nearBottom=chatMessages.scrollHeight-chatMessages.scrollTop-chatMessages.clientHeight<75;
  chatMessages.replaceChildren();
  if(!messageItems.length)chatMessages.append(node('p','memo-empty','No messages yet. Say hello.'));
  for(const m of messageItems){
   const mine=Number(m.sender_id)===Number(accountId);
   const bubble=node('div','memo-chat-bubble'+(mine?' mine':' theirs'),m.body||'');
   if(m.deleted_at)bubble.textContent='Message removed';
   chatMessages.append(bubble);
  }
  if(scroll||nearBottom)chatMessages.scrollTop=chatMessages.scrollHeight;
 }
 async function loadConversations(){
  if(active!=='chat')return;
  const token=++chatSeq;
  try{
   if(!await auth())return;
   const result=await request('/api/messages/conversations');
   if(token!==chatSeq)return;
   convs=(result.conversations||[]).filter(c=>c.kind==='direct'&&c.other_username);
   if(!convs.some(c=>Number(c.id)===Number(selectedConv)))selectedConv=convs[0]?.id||null;
   const current=convs.find(c=>Number(c.id)===Number(selectedConv));
   chatTitle.textContent=current?'@'+current.other_username:'Choose a conversation';
   drawConversationList();if(selectedConv)await loadChat();
   else{messageItems=[];drawMessages()}
   status(chatStatus,convs.length+' active private chat'+(convs.length===1?'':'s')+'.');
  }catch(e){status(chatStatus,e.message,true)}
 }
 async function loadChat({scroll=false}={}){
  if(active!=='chat'||!selectedConv)return;
  const id=selectedConv;
  try{
   const result=await request('/api/messages/conversations/'+id+'?limit=80');
   if(id!==selectedConv)return;
   messageItems=result.messages||[];
   drawMessages(scroll);chatSend.disabled=chatBusy||!chatText.value.trim();
  }catch(e){status(chatStatus,e.message,true)}
 }
 chatRefresh.addEventListener('click',()=>void loadConversations());
 chatText.addEventListener('input',()=>{chatSend.disabled=chatBusy||!selectedConv||!chatText.value.trim()});
 chatText.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();chatForm.requestSubmit()}});
 chatForm.addEventListener('submit',async e=>{
  e.preventDefault();const message=chatText.value.trim(),id=selectedConv;
  if(chatBusy||!id||!message||message.length>4000)return;
  chatBusy=true;chatSend.disabled=true;
  try{await request('/api/messages/conversations/'+id,{method:'POST',body:JSON.stringify({body:message})});
   chatText.value='';await loadChat({scroll:true});await loadConversations();
   status(chatStatus,'Message sent to member chat.');
  }catch(error){status(chatStatus,error.message,true)}
  finally{chatBusy=false;chatSend.disabled=!chatText.value.trim()||!selectedConv}
 });
 async function startChat(username){
  if(!await auth())return;
  status(chatStatus,'Opening chat with @'+username+'…');
  try{
   const result=await request('/api/messages/conversations',{method:'POST',body:JSON.stringify({username})});
   selectedConv=Number(result.id);await loadConversations();await loadChat({scroll:true});chatText.focus();
  }catch(e){status(chatStatus,e.message,true)}
 }
 chatSearch.addEventListener('input',()=>{
  const query=chatSearch.value.trim().replace(/^@/,'').slice(0,80),token=++chatSearchToken;
  chatMatches.replaceChildren();
  if(query.length<2)return;
  window.setTimeout(async()=>{
   if(token!==chatSearchToken)return;
   try{
    const result=await request('/api/discover?q='+encodeURIComponent(query)+'&limit=15');
    if(token!==chatSearchToken)return;
    const users=(result.users||[]).filter(u=>u.username&&u.username.toLowerCase()!==accountName);
    if(!users.length)chatMatches.append(node('p','memo-empty','No members found.'));
    for(const u of users){
     const b=node('button','memo-chat-result','@'+u.username+' · '+(u.display_name||u.username));b.type='button';
     b.addEventListener('click',()=>{chatMatches.replaceChildren();chatSearch.value='';void startChat(u.username)});
     chatMatches.append(b);
    }
   }catch(e){if(token===chatSearchToken)status(chatStatus,e.message,true)}
  },280);
 });
 // Live means near-real-time polling, not a false claim of WebSockets.
 chatTimer=setInterval(()=>{if(alive()&&!chatBusy)void loadConversations()},5000);
 mailTimer=setInterval(()=>{if(active==='inbox'&&!document.hidden&&!host.closest('[hidden]')&&!mailBusy)void loadMail()},20000);
 document.addEventListener('kf:memo-sent',e=>{
  if(e.detail?.host!==host)return;inboxType='sent';activeMail=null;
  sentButton.classList.add('primary');inboxButton.classList.remove('primary');
  activate('inbox');
 });
 const initial=new URLSearchParams(location.search).get('tab');
 if(initial==='inbox'||initial==='chat')activate(initial);
 else activate('notes');
 host.__memoCommsDispose=()=>{clearInterval(chatTimer);clearInterval(mailTimer)};
}
window.KnightfallMemoCommunications={mount};
document.querySelectorAll('.kf-memo-app').forEach(mount);
document.addEventListener('kf:memo-mounted',e=>mount(e.detail.host));
})();