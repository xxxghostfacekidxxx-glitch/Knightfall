/* Original Knightfall Pet Room Furniture editor.
 * Own-once catalog; freely re-place across owned pet rooms.
 * Every wallet debit and placement is verified by the API and D1.
 */
(()=>{'use strict';
const API='https://api.ash-fall.com',pick=document.getElementById('room-pet'),
 stage=document.getElementById('room-stage'),workspace=document.querySelector('.room-workspace');
if(!pick||!stage||!workspace)return;
const visitor=new URLSearchParams(location.search).has('user');
if(visitor)return; // Public room spectators cannot purchase or reposition owner items.
const safe=url=>/^\/assets\/devil-tools\/neon-nuisances\/furniture\/[a-z_]+\.svg$/.test(url||'')?url:'';
const make=(tag,cls,content)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(content!==undefined)e.textContent=String(content);return e};
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
let collection=[],owned=new Set(),pets=[],placements=[],petId=0,busy=false,drag=null,rank=1,refreshToken=0;
const panel=make('section','room-furniture-shop');
const heading=make('div','room-furniture-heading'),title=make('h2','','✦ The Curio Cabinet'),
 subtitle=make('p','','Unlock furnishings once, then decorate any of your rescued companions’ rooms. Drag items to place them. Up to eight pieces per room.');
heading.append(title,subtitle);
const notes=make('p','room-furniture-status','Loading furniture…');notes.setAttribute('role','status');notes.setAttribute('aria-live','polite');
const gallery=make('div','room-furniture-gallery');
panel.append(heading,notes,gallery);
workspace.append(panel);
const layer=make('div','room-furniture-overlay');layer.setAttribute('aria-label','Moveable room furniture');stage.append(layer);
function tell(message){notes.textContent=String(message)}
async function api(path,opt={}){
 const r=await fetch(API+path,{credentials:'include',cache:'no-store',...opt,
  headers:{'content-type':'application/json',...(opt.headers||{})}});
 const data=await r.json().catch(()=>({}));
 if(!r.ok){const e=new Error(data.error||'Furniture service unavailable');e.status=r.status;throw e}
 return data;
}
function activePet(){return pets.find(p=>Number(p.id)===petId)||null}
function renderObjects(){
 layer.replaceChildren();
 for(const placed of placements){
  const item=collection.find(x=>x.key===placed.item_key);if(!item)continue;
  const b=make('button','room-furniture-object');b.type='button';
  b.dataset.furnitureKey=placed.item_key;
  b.setAttribute('aria-label','Drag '+item.name+' to move it');
  b.style.left=placed.x_pct+'%';b.style.top=placed.y_pct+'%';
  const art=safe(item.art);
  if(art){const image=make('img');image.alt='';image.src=art+'?v=20261102-room-furniture1';image.draggable=false;b.append(image)}
  if(placed.flipped)b.classList.add('flipped');
  const name=make('span','room-furniture-label',item.name);b.append(name);
  b.addEventListener('pointerdown',e=>{
   if(busy)return;
   e.preventDefault();e.stopPropagation();
   drag={id:e.pointerId,element:b,item:placed};b.setPointerCapture?.(e.pointerId);
  });
  b.addEventListener('pointermove',e=>{
   if(!drag||drag.id!==e.pointerId||drag.element!==b)return;
   e.preventDefault();e.stopPropagation();
   const bounds=stage.getBoundingClientRect();
   const x=clamp(Math.round(100*(e.clientX-bounds.left)/bounds.width),8,92);
   const y=clamp(Math.round(100*(e.clientY-bounds.top)/bounds.height),16,85);
   b.style.left=x+'%';b.style.top=y+'%';
  });
  const release=e=>{
   if(!drag||drag.id!==e.pointerId||drag.element!==b)return;
   e.stopPropagation();const target=drag.item;drag=null;
   if(e.type==='pointercancel'){renderObjects();return}
   const bounds=stage.getBoundingClientRect();
   const x=clamp(Math.round(100*(e.clientX-bounds.left)/bounds.width),8,92);
   const y=clamp(Math.round(100*(e.clientY-bounds.top)/bounds.height),16,85);
   void place(target.item_key,x,y,Boolean(target.flipped));
  };
  b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);
  b.addEventListener('keydown',e=>{
   const delta={ArrowLeft:[-2,0],ArrowRight:[2,0],ArrowUp:[0,-2],ArrowDown:[0,2]}[e.key];
   if(!delta)return;e.preventDefault();e.stopPropagation();
   const x=clamp(Number(placed.x_pct)+delta[0],8,92),y=clamp(Number(placed.y_pct)+delta[1],16,85);
   void place(placed.item_key,x,y,Boolean(placed.flipped));
  });
  layer.append(b);
 }
}
function button(label,action,key,disabled){
 const b=make('button','room-furniture-button',label);b.type='button';b.dataset.action=action;b.dataset.key=key;b.disabled=!!disabled;return b;
}
function renderCatalog(){
 gallery.replaceChildren();
 const placed=new Set(placements.map(x=>x.item_key));
 for(const item of collection){
  const unlocked=Number(activePet()?.level||1)>=item.unlock_level,have=item.cost_cinders===0||owned.has(item.key);
  const card=make('article','room-furniture-card');
  if(!unlocked)card.classList.add('locked');
  const art=make('div','room-furniture-preview');
  const src=safe(item.art);
  if(src){const image=make('img');image.src=src+'?v=20261102-room-furniture1';image.alt=item.name;image.loading='lazy';art.append(image)}
  const name=make('h3','',item.name),price=make('p','',item.cost_cinders?'✦ '+item.cost_cinders.toLocaleString()+' Cinders':'Free unlock');
  const status=make('small','',unlocked?(have?'Owned for your account':'Buy once; keep forever'):'Unlocks at pet level '+item.unlock_level);
  card.append(art,name,price,status);
  const actions=make('div','room-furniture-actions');
  if(!have)actions.append(button('Unlock','buy',item.key,busy));
  else if(placed.has(item.key)){
   actions.append(button('Remove','remove',item.key,busy));
   actions.append(button('Flip ↔','flip',item.key,busy));
  }else actions.append(button('Place in room','place',item.key,busy||!unlocked||placements.length>=8));
  card.append(actions);gallery.append(card);
 }
}
function render(){renderObjects();renderCatalog()}
async function reload(){
 const serial=++refreshToken;
 const id=Number(pick.value);
 if(!Number.isSafeInteger(id)||id<1)return;
 const [mine,catalog,room]=await Promise.all([
  api('/api/mascot-pets/me'),
  api('/api/mascot-pets/furniture/catalog'),
  api('/api/mascot-pets/'+id+'/furniture')
 ]);
 if(serial!==refreshToken)return;
 pets=mine.pets||[];petId=id;collection=catalog.furniture||[];
 owned=new Set(catalog.owned||[]);placements=room.placements||[];
 rank=Number(activePet()?.level||1);
 render();
 tell('Level '+rank+' companion · '+placements.length+' / '+(catalog.room_limit||8)+' furniture pieces placed.');
}
async function request(action){
 if(busy)return;const key=action.dataset.key,type=action.dataset.action,item=collection.find(x=>x.key===key);
 if(!item)return;
 if(type==='place'){await place(key,18+Math.min(placements.length,5)*12,64,false);return}
 busy=true;renderCatalog();tell(type==='buy'?'Unlocking '+item.name+'…':'Updating the room…');
 try{
  if(type==='buy'){
   const result=await api('/api/mascot-pets/furniture/buy',{method:'POST',body:JSON.stringify({key})});
   tell(result.message);owned.add(key);
  }else{
   const placement=placements.find(x=>x.item_key===key);
   if(type==='remove'){
    const result=await api('/api/mascot-pets/'+petId+'/furniture',{method:'DELETE',body:JSON.stringify({key})});
    placements=result.placements||[];
   }else if(type==='flip'&&placement){
    const result=await api('/api/mascot-pets/'+petId+'/furniture',{method:'PUT',
     body:JSON.stringify({key,x:placement.x_pct,y:placement.y_pct,flipped:!placement.flipped})});
    placements=result.placements||[];
   }
  }
 }catch(e){tell(e.message)}
 finally{busy=false;render()}
}
async function place(key,x,y,flipped){
 if(busy||!petId)return;
 busy=true;renderCatalog();tell('Saving furniture position…');
 try{
  const response=await api('/api/mascot-pets/'+petId+'/furniture',{method:'PUT',
   body:JSON.stringify({key,x,y,flipped})});
  placements=response.placements||[];tell(response.message||'Your room has been saved.');
 }catch(e){tell(e.message)}
 finally{busy=false;render()}
}
gallery.addEventListener('click',event=>{
 const b=event.target.closest('button[data-action]');
 if(b&&gallery.contains(b))void request(b);
});
document.addEventListener('sanctuary-room-selected',event=>{
 if(event.detail?.visitor)return;
 void reload().catch(error=>tell('Furniture unavailable: '+error.message));
});
// Initial load is announced by the room controller after its authenticated fetch.
if(Number(pick.value)>0)void reload().catch(e=>tell('Furniture unavailable: '+e.message));
})();