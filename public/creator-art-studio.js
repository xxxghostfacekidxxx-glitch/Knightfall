/* Creator Foundry photo/art preparation. Real publication uses the existing admin-only API. */
(() => {
  'use strict';
  const root=document.getElementById('knightfall-art-collection');
  if(!root)return;
  const API='https://api.ash-fall.com',MAX=2*1024*1024,INCOMING=8*1024*1024;
  const drop=document.getElementById('kf-art-drop'),fileInput=document.getElementById('kf-art-input');
  const staged=document.getElementById('kf-art-staged'),published=document.getElementById('kf-art-published');
  const status=document.getElementById('kf-art-upload-status'),items=new Set();
  const report=text=>{status.textContent=text};
  const button=(label,onClick,cls='')=>{const el=document.createElement('button');el.type='button';el.className=cls;el.textContent=label;el.addEventListener('click',onClick);return el};
  const label=(tag,text)=>{const el=document.createElement(tag);el.textContent=text;return el};
  const allowed=new Set(['image/png','image/jpeg','image/webp']);
  const nameOf=file=>(file.name.replace(/\.[^.]+$/,'').normalize('NFKC').toLowerCase().replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,64)||'knightfall-art');
  function download(blob,name){
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;
    document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2500);
  }
  async function optimize(file){
    if(!allowed.has(file.type))throw Error('Only PNG, JPEG, and WebP images are accepted.');
    if(file.size<8||file.size>INCOMING)throw Error('Image must be between 8 bytes and 8 MB.');
    const bitmap=await createImageBitmap(file);
    try{
      if(bitmap.width<8||bitmap.height<8||bitmap.width>8000||bitmap.height>8000)throw Error('Image dimensions must be between 8 and 8000 pixels.');
      const canvas=document.createElement('canvas');
      for(let edge=Math.min(2048,Math.max(bitmap.width,bitmap.height));edge>=192;edge=Math.floor(edge*.78)){
        const ratio=Math.min(1,edge/Math.max(bitmap.width,bitmap.height));
        canvas.width=Math.max(1,Math.round(bitmap.width*ratio));
        canvas.height=Math.max(1,Math.round(bitmap.height*ratio));
        const ctx=canvas.getContext('2d');
        if(!ctx)throw Error('Image rendering is unavailable.');
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
        ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
        const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
        if(blob&&blob.size>=8&&blob.size<=MAX)return {blob,width:canvas.width,height:canvas.height};
      }
      throw Error('This image is too complex for the 2 MB publication limit. Reduce its dimensions or use another image.');
    }finally{bitmap.close()}
  }
  async function publish(item){
    const action=item.node.querySelector('.kf-art-publish');if(!action)return;
    action.disabled=true;report('Publishing '+item.name+'…');
    try{
      const form=new FormData();
      form.append('name',item.name);
      form.append('file',item.blob,item.name+'.png');
      const res=await fetch(API+'/api/devil-tools/assets',{method:'POST',credentials:'include',body:form,cache:'no-store'});
      const data=await res.json().catch(()=>({}));
      if(!res.ok)throw Error(data.error||'Publishing failed.');
      report('Published '+item.name+' to the Knightfall site asset library.');
      item.node.querySelector('small').textContent='Published · '+API+data.asset.url;
      action.replaceWith(label('span','✓ Published'));
      await loadPublished();
    }catch(error){report(item.name+': '+error.message)}
    finally{action.disabled=false}
  }
  async function addFiles(list){
    const files=Array.from(list||[]).slice(0,12);
    if(!files.length)return;
    report('Preparing '+files.length+' image'+(files.length===1?'':'s')+'…');
    for(const file of files){
      if(items.size>=12){report('Maximum 12 previews. Clear some before adding more.');break}
      try{
        const processed=await optimize(file),name=nameOf(file),url=URL.createObjectURL(processed.blob);
        const node=document.createElement('article');node.className='kf-art-item';
        const img=document.createElement('img');img.src=url;img.alt='Prepared image: '+file.name;img.loading='lazy';
        const heading=label('strong',file.name);heading.title=file.name;
        const meta=label('small',processed.width+' × '+processed.height+' · '+Math.ceil(processed.blob.size/1024)+' KB · optimized PNG');
        const actions=document.createElement('div');actions.className='kf-art-item-actions';
        const item={name,blob:processed.blob,url,node};
        actions.append(button('Save PNG',()=>download(item.blob,item.name+'.png')));
        const remove=button('Remove',()=>{items.delete(item);URL.revokeObjectURL(url);node.remove();});
        actions.append(remove);
        const publishBtn=button('Publish to site',()=>publish(item),'kf-art-publish');
        // Editors without publishing rights may prepare and download their images.
        if(root.dataset.canPublish==='true')actions.append(publishBtn);
        node.append(img,heading,meta,actions);staged.append(node);items.add(item);
      }catch(error){report(file.name+': '+error.message)}
    }
    if(items.size)report(items.size+' artwork file(s) prepared. Publishing is a separate, deliberate action.');
  }
  function openPicker(){fileInput.click()}
  document.getElementById('kf-art-choose').addEventListener('click',openPicker);
  drop.addEventListener('click',openPicker);
  drop.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openPicker()}});
  fileInput.addEventListener('change',()=>{void addFiles(fileInput.files);fileInput.value=''});
  drop.addEventListener('dragover',event=>{event.preventDefault();drop.classList.add('is-over')});
  drop.addEventListener('dragleave',()=>drop.classList.remove('is-over'));
  drop.addEventListener('drop',event=>{event.preventDefault();drop.classList.remove('is-over');void addFiles(event.dataTransfer?.files)});
  document.getElementById('kf-art-clear').addEventListener('click',()=>{
    for(const item of items)URL.revokeObjectURL(item.url);
    items.clear();staged.replaceChildren();report('Local previews cleared. Published assets were not deleted.');
  });
  async function loadPublished(){
    published.replaceChildren(label('p','Checking approved assets…'));
    try{
      const res=await fetch(API+'/api/devil-tools/assets',{credentials:'include',cache:'no-store'});
      const data=await res.json().catch(()=>({}));
      if(!res.ok)throw Error(data.error||'Cannot read the published assets.');
      published.replaceChildren();
      if(!data.assets?.length){published.append(label('p','No approved artwork published yet.'));return}
      for(const asset of data.assets.slice(0,30)){
        if(!/^\/public-assets\/[a-f0-9]{32}$/.test(asset.url||''))continue;
        const card=document.createElement('article');card.className='kf-art-item';
        const img=document.createElement('img');img.src=API+asset.url;img.alt=asset.asset_name||'Published artwork';img.loading='lazy';
        const title=label('strong',asset.asset_name||'Site asset');
        const meta=label('small',Math.ceil(Number(asset.size_bytes)/1024)+' KB · approved PNG');
        const actions=document.createElement('div');actions.className='kf-art-item-actions';
        const link=document.createElement('a');link.href=API+asset.url;link.target='_blank';link.rel='noopener';link.textContent='Open';
        actions.append(link,button('Copy URL',async()=>{
          try{await navigator.clipboard.writeText(API+asset.url);report('Asset URL copied.')}
          catch{report('Copy blocked: '+API+asset.url)}
        }));
        card.append(img,title,meta,actions);published.append(card);
      }
    }catch(error){published.replaceChildren(label('p',error.message))}
  }
  document.getElementById('kf-art-refresh').addEventListener('click',()=>{void loadPublished()});
  // Access remains authoritative in the Worker; the DOM flag only controls UI.
  const activate=()=>{
    const statusText=document.getElementById('status')?.textContent||'';
    if(statusText.includes('Signed in as @')){
      const isAdmin=!document.getElementById('release-simulator') ? false : true;
      root.dataset.canPublish=String(isAdmin);void loadPublished();
      if(!isAdmin)report('Digital Creator workspace: prepare and save your artwork for administrator review.');
    }
  };
  document.getElementById('workshop')?.addEventListener('foundry:ready',activate);
  window.addEventListener('pagehide',()=>{for(const item of items)URL.revokeObjectURL(item.url)});
})();
