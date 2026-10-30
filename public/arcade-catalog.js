(() => {
 'use strict';
 const boot=()=>{
  const shelf=document.querySelector('#game-shelf .cartridge-shelf');
  if(!shelf)return;
  const cards=[...shelf.children],search=document.querySelector('#arcade-game-search'),genre=document.querySelector('#arcade-genre'),device=document.querySelector('#arcade-device'),sort=document.querySelector('#arcade-sort');
  const buttons=[...document.querySelectorAll('[data-collection-filter]')];
  let collection='games';
  const notes={games:'Full games and longer sessions. Choose a genre or controls to narrow the shelf.',mini:'Short, lightweight arcade challenges and puzzles.',experiments:'Development editions and legacy prototypes. Expect rough edges; these are kept separate from the main games.',external:'These titles use another service and require a connection. They are not hosted offline games.',all:'The complete collection, including quick mini games, development builds and external titles.',unavailable:'These builds are not currently available to launch.'};
  const params=new URLSearchParams(location.search);
  search.value=params.get('q')||'';
  if(buttons.some(b=>b.dataset.collectionFilter===params.get('collection')))collection=params.get('collection');
  for(const [node,key] of [[genre,'genre'],[device,'device'],[sort,'sort']])if([...node.options].some(o=>o.value===params.get(key)))node.value=params.get(key);
  function render(){
   const q=search.value.trim().toLocaleLowerCase(),tokens=q.split(/\s+/).filter(Boolean);
   // Searching across collections makes an exact title discoverable without guessing its shelf.
   const across=Boolean(q);
   const ordered=[...cards].sort((a,b)=>{
    if(sort.value==='featured'&&a.dataset.featured!==b.dataset.featured)return a.dataset.featured==='true'?-1:1;
    if(sort.value==='genre'){const d=a.dataset.category.localeCompare(b.dataset.category);if(d)return d;}
    return a.querySelector('h2,h3').textContent.localeCompare(b.querySelector('h2,h3').textContent);
   });
   let visible=0;
   for(const card of ordered){
    const text=card.textContent.toLocaleLowerCase();
    card.hidden=!((across||collection==='all'||card.dataset.collection===collection)&&(!genre.value||card.dataset.category===genre.value)&&(!device.value||card.dataset.device===device.value)&&tokens.every(t=>text.includes(t)));
    if(!card.hidden)visible++;
    shelf.append(card);
   }
   buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.collectionFilter===collection)));
   document.querySelector('#arcade-results').textContent=visible+' '+(visible===1?'game':'games')+(across?' found across all collections':' in this collection');
   document.querySelector('#arcade-total-count').textContent=visible+' / '+cards.length+' titles';
   document.querySelector('#arcade-empty').hidden=visible>0;
   document.querySelector('#arcade-collection-note').textContent=across?'Search includes every collection. Each card shows its collection and controls.':notes[collection];
   const url=new URL(location.href);
   for(const [key,value] of Object.entries({q:search.value,collection:collection==='games'?'':collection,genre:genre.value,device:device.value,sort:sort.value==='featured'?'':sort.value}))value?url.searchParams.set(key,value):url.searchParams.delete(key);
   history.replaceState(null,'',url.pathname+url.search+url.hash);
  }
  document.querySelector('.arcade-catalog-toolbar').addEventListener('submit',e=>e.preventDefault());
  for(const node of [search,genre,device,sort])node.addEventListener(node===search?'input':'change',render);
  buttons.forEach(b=>b.addEventListener('click',()=>{collection=b.dataset.collectionFilter;render()}));
  document.querySelector('#arcade-clear').addEventListener('click',()=>{search.value='';genre.value='';device.value='';sort.value='featured';collection='games';render();search.focus()});
  render();
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
