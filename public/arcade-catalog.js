/* Load the shared NextGen arcade visuals for the large Chaos Cartridge directory without rewriting generated catalog HTML. */
(()=>{'use strict';
const css='/arcade/nextgen.css?v=20261102-1',js='/arcade/nextgen.js?v=20261102-1';
if(!document.querySelector('link[href*="/arcade/nextgen.css"]')){const l=document.createElement('link');l.rel='stylesheet';l.href=css;document.head.appendChild(l)}
if(!document.querySelector('script[src*="/arcade/nextgen.js"]')){const s=document.createElement('script');s.src=js;s.defer=true;document.head.appendChild(s)}
})();
(() => {
 'use strict';
 const boot=()=>{
  const shelf=document.querySelector('#game-shelf .cartridge-shelf');
  if(!shelf)return;
  const cards=[...shelf.children],search=document.querySelector('#arcade-game-search'),genre=document.querySelector('#arcade-genre'),device=document.querySelector('#arcade-device'),sort=document.querySelector('#arcade-sort');
  const buttons=[...document.querySelectorAll('[data-collection-filter]')];
  const index=new Map(cards.map(card=>{
   const title=card.querySelector('h2,h3').textContent.trim();
   const description=card.querySelector('p')?.textContent||'';
   return [card,{title,normalized:title.toLocaleLowerCase(),text:[title,description,card.dataset.category].join(' ').toLocaleLowerCase()}];
  }));
  // The canonical arcade hero already links to #game-shelf. Keep that single
  // Browse games action instead of inserting a duplicate next to nested links.
  let collection='games';
  let explicitCollection=false;
  const notes={games:'Full games and longer sessions. Choose a genre or controls to narrow the shelf.',mini:'Short, lightweight arcade challenges and puzzles.',experiments:'Development editions and legacy prototypes. Expect rough edges; these are kept separate from the main games.',external:'These titles use another service and require a connection. They are not hosted offline games.',all:'The complete collection, including quick mini games, development builds and external titles.',unavailable:'These builds are not currently available to launch.'};
  const params=new URLSearchParams(location.search);
  const initialCollection=params.get('collection');
  search.value=params.get('q')||'';
  if(buttons.some(b=>b.dataset.collectionFilter===initialCollection)){collection=initialCollection;explicitCollection=true;}
  for(const [node,key] of [[genre,'genre'],[device,'device'],[sort,'sort']])if([...node.options].some(o=>o.value===params.get(key)))node.value=params.get(key);
  function restoreFromUrl(){
   const query=new URLSearchParams(location.search);
   const requested=query.get('collection');
   explicitCollection=buttons.some(b=>b.dataset.collectionFilter===requested);
   collection=explicitCollection?requested:'games';
   search.value=query.get('q')||'';
   for(const [node,key] of [[genre,'genre'],[device,'device'],[sort,'sort']])node.value=[...node.options].some(o=>o.value===query.get(key))?query.get(key):node.options[0].value;
  }
  function render(){
   const q=search.value.trim().toLocaleLowerCase(),tokens=q.split(/\s+/).filter(Boolean);
   // Searching across collections makes an exact title discoverable without guessing its shelf.
   const across=Boolean(q) && !explicitCollection && collection==='games';
   const relevance=card=>{
    const title=index.get(card).normalized;
    if(title===q)return 0;
    if(title.startsWith(q))return 1;
    if(title.includes(q))return 2;
    return 3;
   };
   const ordered=[...cards].sort((a,b)=>{
    if(q&&sort.value==='featured'){
     const diff=relevance(a)-relevance(b);
     if(diff)return diff;
    }
    if(sort.value==='featured'&&a.dataset.featured!==b.dataset.featured)return a.dataset.featured==='true'?-1:1;
    if(sort.value==='genre'){const d=a.dataset.category.localeCompare(b.dataset.category);if(d)return d;}
    return index.get(a).title.localeCompare(index.get(b).title);
   });
   let visible=0;
   for(const [position,card] of ordered.entries()){
    const text=index.get(card).text;
    card.hidden=!((across||collection==='all'||card.dataset.collection===collection)&&(!genre.value||card.dataset.category===genre.value)&&(!device.value||card.dataset.device===device.value)&&tokens.every(t=>text.includes(t)));
    if(!card.hidden)visible++;
    if(shelf.children[position]!==card)shelf.insertBefore(card,shelf.children[position]);
   }
   buttons.forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.collectionFilter===(across?'all':collection)));b.setAttribute('aria-label',b.textContent.trim()+' collection');});
   document.querySelector('#arcade-results').textContent=visible+' '+(visible===1?'game':'games')+(across?' found across all collections':' in this collection');
   document.querySelector('#arcade-total-count').textContent=visible+' / '+cards.length+' titles';
   document.querySelector('#arcade-empty').hidden=visible>0;
   document.querySelector('#arcade-collection-note').textContent=across?'Search includes every collection. Choose a collection to limit your search.':notes[collection];
   const url=new URL(location.href);
   for(const [key,value] of Object.entries({q:search.value,collection:collection==='games'&&!explicitCollection?'':collection,genre:genre.value,device:device.value,sort:sort.value==='featured'?'':sort.value}))value?url.searchParams.set(key,value):url.searchParams.delete(key);
   history.replaceState(null,'',url.pathname+url.search+url.hash);
  }
  document.querySelector('.arcade-catalog-toolbar').addEventListener('submit',e=>e.preventDefault());
  for(const node of [search,genre,device,sort])node.addEventListener(node===search?'input':'change',render);
  buttons.forEach(b=>b.addEventListener('click',()=>{collection=b.dataset.collectionFilter;explicitCollection=true;render()}));
  document.querySelector('#arcade-clear').addEventListener('click',()=>{search.value='';genre.value='';device.value='';sort.value='featured';collection='games';explicitCollection=false;render();search.focus()});
  window.addEventListener('popstate',()=>{restoreFromUrl();render()});
  render();
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
