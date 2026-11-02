/* First-party Devil Tools SVG library. All previews are local and download raw editable vectors. */
(()=>{'use strict';
const root=document.getElementById('dt-vector-library');if(!root)return;
const list=root.querySelector('[data-dt-gallery]'),search=root.querySelector('[data-dt-search]'),
 filter=root.querySelector('[data-dt-category]'),status=root.querySelector('[data-dt-status]');
if(!list||!search||!filter||!status)return;
const icon='/assets/devil-tools/art-gallery.json';
let all=[];
const safeSource=src=>typeof src==='string'&&/^\/assets\/[a-z0-9/_-]+\.svg$/.test(src);
function render(){
 const needle=search.value.trim().toLowerCase(),cat=filter.value;
 const shown=all.filter(x=>(cat==='all'||x.category===cat)&&(!needle||(x.title+' '+x.category).toLowerCase().includes(needle)));
 list.replaceChildren();
 const fragment=document.createDocumentFragment();
 for(const asset of shown){
  const card=document.createElement('article');card.className='dt-svg-card';
  const img=document.createElement('img');img.src=asset.src+'?v=20261102-overhaul1';img.alt=asset.title;img.loading='lazy';img.decoding='async';img.width=128;img.height=128;
  const title=document.createElement('strong');title.textContent=asset.title;
  const category=document.createElement('small');category.textContent=asset.category;
  const link=document.createElement('a');link.href=asset.src;link.download=asset.src.split('/').at(-1);link.textContent='Download SVG';link.className='dt-svg-download';link.setAttribute('aria-label','Download '+asset.title+' as SVG');
  card.append(img,title,category,link);fragment.append(card);
 }
 list.append(fragment);
 status.textContent=shown.length+' of '+all.length+' original vector assets shown.';
 if(!shown.length){const empty=document.createElement('p');empty.textContent='No matching artwork. Try a different search or category.';list.append(empty);}
}
fetch(icon,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()}).then(data=>{
 if(!Array.isArray(data.assets))throw Error('Invalid art index');
 all=data.assets.filter(x=>safeSource(x.src)&&x.title&&x.category);
 const cats=[...new Set(all.map(x=>x.category))].sort();
 for(const category of cats){const opt=document.createElement('option');opt.value=category;opt.textContent=category;filter.append(opt);}
 render();
}).catch(err=>{status.textContent='Vector library unavailable: '+err.message});
search.addEventListener('input',render);
filter.addEventListener('change',render);
})();
