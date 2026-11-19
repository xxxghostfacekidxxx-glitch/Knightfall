/* Creator Foundry photo/art preparation. Real publication uses the existing admin-only API. */
(() => {
  'use strict';
  const root=document.getElementById('site-image-library');
  if(!root)return;
  const API='https://api.ash-fall.com',MAX=2*1024*1024,INCOMING=8*1024*1024;
  const drop=document.getElementById('kf-art-drop'),fileInput=document.getElementById('kf-art-input'),photoInput=document.getElementById('kf-art-photo-input');
  const staged=document.getElementById('kf-art-staged'),published=document.getElementById('kf-art-published'),review=document.getElementById('kf-art-review');
  const status=document.getElementById('kf-art-upload-status'),items=new Set();
  const report=text=>{status.textContent=text};
  const button=(label,onClick,cls='')=>{const el=document.createElement('button');el.type='button';el.className=cls;el.textContent=label;el.addEventListener('click',onClick);return el};
  const label=(tag,text)=>{const el=document.createElement(tag);el.textContent=text;return el};
  const allowed=new Set(['image/png','image/jpeg','image/webp','image/avif','image/gif','image/heic','image/heif']);
  const accepted=file=>file&&allowed.has(String(file.type||'').toLowerCase());
  const nameOf=file=>(file.name.replace(/\.[^.]+$/,'').normalize('NFKC').toLowerCase().replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,64)||'knightfall-art');
  function download(blob,name){
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;
    document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2500);
  }
  async function optimize(file){
    if(!accepted(file))throw Error('Choose an image from Photos or Files. JPG, PNG, WebP, GIF, AVIF and browser-supported HEIC are accepted.');
    if(file.size<8||file.size>INCOMING)throw Error('Image must be between 8 bytes and 8 MB.');
    let bitmap;
    try{bitmap=await createImageBitmap(file)}
    catch{throw Error('This device could not decode the picture. For cloud-only Google Photos or HEIC, download or export a JPG/PNG first.');}
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

  async function submit(item){
    const action=item.node.querySelector('.kf-art-submit');if(!action)return;
    action.disabled=true;report('Submitting '+item.name+' for review…');
    try{
      const form=new FormData();form.append('name',item.name);form.append('file',item.blob,item.name+'.png');
      const res=await fetch(API+'/api/devil-tools/asset-submissions',{method:'POST',credentials:'include',cache:'no-store',body:form});
      const data=await res.json().catch(()=>({}));
      if(!res.ok)throw Error(data.error||'Submission failed.');
      action.replaceWith(label('span','✓ Pending review'));
      report('Submitted '+item.name+'. It is private until an administrator approves it.');
      await loadReview();
    }catch(error){report('Submission failed: '+error.message)}
    finally{action.disabled=false}
  }
  async function reviewDecision(entry,verb){
    if(!root.dataset.canPublish||root.dataset.canPublish!=='true')return;
    if(verb==='reject'&&!confirm('Reject '+entry.asset_name+' and remove its pending artwork?'))return;
    const res=await fetch(API+'/api/devil-tools/asset-submissions/'+entry.id+'/'+verb,{
      method:'POST',credentials:'include',cache:'no-store'});
    const data=await res.json().catch(()=>({}));
    if(!res.ok)throw Error(data.error||'Review failed.');
    report(entry.asset_name+' '+(verb==='approve'?'approved and published.':'rejected.'));
    await Promise.all([loadReview(),loadPublished()]);
  }
  async function loadReview(){
    if(!review)return;
    review.replaceChildren(label('p','Checking private submissions…'));
    try{
      const res=await fetch(API+'/api/devil-tools/asset-submissions',{credentials:'include',cache:'no-store'});
      const data=await res.json().catch(()=>({}));
      if(!res.ok)throw Error(data.error||'Could not load submissions.');
      review.replaceChildren();
      if(!data.assets?.length){review.append(label('p','No artwork waiting for review.'));return}
      for(const entry of data.assets){
        if(!/^[a-f0-9]{32}$/.test(entry.id))continue;
        const card=document.createElement('article');card.className='kf-art-item';
        const img=document.createElement('img');img.src=API+entry.preview_url;img.alt=entry.asset_name+' pending preview';img.loading='lazy';
        const title=label('strong',entry.asset_name),meta=label('small',Math.ceil(Number(entry.size_bytes)/1024)+' KB · pending · '+new Date(entry.created_at).toLocaleDateString());
        const actions=document.createElement('div');actions.className='kf-art-item-actions';
        if(data.can_approve){
          for(const [verb,text] of [['approve','Approve & publish'],['reject','Reject']]){
            const b=button(text,async()=>{
              b.disabled=true;
              try{await reviewDecision(entry,verb)}catch(error){report('Review failed: '+error.message)}
              finally{b.disabled=false}
            },verb==='approve'?'kf-art-publish':'');
            actions.append(b);
          }
        }else actions.append(label('small','Awaiting staff review'));
        card.append(img,title,meta,actions);review.append(card);
      }
    }catch(error){review.replaceChildren(label('p',error.message))}
  }
  async function loadArtSprites(){
    const area=document.getElementById('kf-art-sprite-gallery');if(!area)return;
    try{
      const response=await fetch('/assets/knightfall/manifest.json?v=20261114-relics2');
      if(!response.ok)throw Error('Art manifest is unavailable.');
      const manifest=await response.json();
      const sheet=new Image();sheet.decoding='async';
      sheet.src='/assets/knightfall/horror-space-characters.png';
      await new Promise((ok,bad)=>{sheet.onload=ok;sheet.onerror=()=>bad(Error('Character atlas could not load'))});
      area.replaceChildren();
      for(const art of manifest.sprites||[]){
        const r=art.atlasRect;if(!r)continue;
        const card=document.createElement('article');card.className='kf-art-sprite-card';card.setAttribute('role','listitem');
        const canvas=document.createElement('canvas');canvas.width=144;canvas.height=164;
        canvas.setAttribute('aria-label',art.name+' concept art');
        const ctx=canvas.getContext('2d');if(!ctx)continue;
        ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
        const scale=Math.min(126/r.width,146/r.height),w=r.width*scale,h=r.height*scale;
        ctx.drawImage(sheet,r.x,r.y,r.width,r.height,(144-w)/2,(164-h)/2,w,h);
        card.append(canvas,label('strong',art.name),label('small',art.category.replaceAll('-',' ')));
        area.append(card);
      }
    }catch(error){area.replaceChildren(label('p','Sprite previews unavailable: '+error.message))}
  }
  async function loadRelicIcons(){
    const area=document.getElementById('kf-art-relic-gallery');if(!area)return;
    try{
      const response=await fetch('/assets/knightfall/manifest.json?v=20261114-relics2');
      if(!response.ok)throw Error('Artwork manifest did not load.');
      const manifest=await response.json();
      const sheet=new Image();sheet.decoding='async';
      sheet.src='/assets/knightfall/relics-and-icons.png';
      await new Promise((ok,bad)=>{sheet.onload=ok;sheet.onerror=()=>bad(Error('Relic art sheet did not load.'))});
      area.replaceChildren();
      for(const relic of manifest.relics||[]){
        const r=relic.atlasRect;
        if(!r||r.width<=0||r.height<=0||r.x<0||r.y<0||
          r.x+r.width>sheet.naturalWidth||r.y+r.height>sheet.naturalHeight)continue;
        const card=document.createElement('article');
        card.className='kf-art-sprite-card kf-relic-card';card.setAttribute('role','listitem');
        const preview=document.createElement('canvas');preview.width=144;preview.height=144;
        preview.setAttribute('aria-label',relic.name+' image preview');
        const ctx=preview.getContext('2d');if(!ctx)continue;
        ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
        const scale=Math.min(128/r.width,128/r.height),w=r.width*scale,h=r.height*scale;
        ctx.drawImage(sheet,r.x,r.y,r.width,r.height,(144-w)/2,(144-h)/2,w,h);
        const exportButton=button('Export PNG',()=>{
          const pad=8,output=document.createElement('canvas');output.width=r.width+pad*2;output.height=r.height+pad*2;
          const out=output.getContext('2d');if(!out)return report('Canvas export is unavailable.');
          out.clearRect(0,0,output.width,output.height);
          out.drawImage(sheet,r.x,r.y,r.width,r.height,pad,pad,r.width,r.height);
          output.toBlob(blob=>blob?download(blob,relic.id+'.png'):report('Relic export failed.'),'image/png');
        },'kf-relic-export');
        card.append(preview,label('strong',relic.name),label('small',relic.category),exportButton);
        area.append(card);
      }
      if(!area.children.length)area.append(label('p','No relic icon crops are available yet.'));
    }catch(error){area.replaceChildren(label('p','Relic previews unavailable: '+error.message))}
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
        actions.append(button('Submit for review',()=>submit(item),'kf-art-submit'));
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
  photoInput?.addEventListener('change',()=>{void addFiles(photoInput.files);photoInput.value=''});
  document.querySelector('label[for="kf-art-photo-input"]')?.addEventListener('keydown',event=>{
    if(event.key==='Enter'||event.key===' '){event.preventDefault();photoInput?.click();}
  });
  root.addEventListener('paste',event=>{
    const file=Array.from(event.clipboardData?.files||[]).find(accepted);
    if(file){event.preventDefault();void addFiles([file]);}
  });
  document.getElementById('kf-art-paste')?.addEventListener('click',async()=>{
    if(!navigator.clipboard?.read){
      report('Clipboard image access is unavailable in this browser. Use Choose from Photos or Browse files.');
      return;
    }
    try{
      const entries=await navigator.clipboard.read();
      for(const item of entries){
        const mime=item.types.find(type=>allowed.has(type));
        if(!mime)continue;
        const blob=await item.getType(mime);
        await addFiles([new File([blob],'pasted-image.'+(mime.split('/')[1]||'png'),{type:mime})]);
        return;
      }
      report('Clipboard has no supported image. Copy the picture first or select it through Photos.');
    }catch{report('Clipboard access denied or unavailable. Choose from Photos, or download the Google Photos item to Files.');}
  });
  drop.addEventListener('dragover',event=>{event.preventDefault();drop.classList.add('is-over')});
  drop.addEventListener('dragleave',()=>drop.classList.remove('is-over'));
  drop.addEventListener('drop',event=>{event.preventDefault();drop.classList.remove('is-over');void addFiles(event.dataTransfer?.files)});
  document.getElementById('kf-art-clear').addEventListener('click',()=>{
    for(const item of items)URL.revokeObjectURL(item.url);
    items.clear();staged.replaceChildren();report('Local previews cleared. Published assets were not deleted.');
  });
  const imageSearch=document.getElementById('kf-art-search'), imageMore=document.getElementById('kf-art-more');
  let searchTimer, nextOffset, inventoryRequest=0;
  async function loadPublished(append=false){
    const requestId=++inventoryRequest;
    imageMore.disabled=true;
    if(!append)published.replaceChildren(label('p','Checking approved assets…'));
    try{
      const query=new URLSearchParams({q:imageSearch.value.trim(),limit:'24',offset:String(append?nextOffset:0)});
      const res=await fetch(API+'/api/devil-tools/assets?'+query,{credentials:'include',cache:'no-store'});
      const data=await res.json().catch(()=>({}));
      if(!res.ok)throw Error(data.error||'Cannot read the published assets.');
      if(requestId!==inventoryRequest)return;
      if(!append)published.replaceChildren();
      nextOffset=data.next_offset;
      imageMore.hidden=!Number.isSafeInteger(nextOffset);
      if(!append&&!data.assets?.length){published.append(label('p',query.get('q')?'No images match this search.':'No approved images yet.'));return}
      for(const asset of data.assets||[]){
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
    }catch(error){
      if(requestId===inventoryRequest){
        if(append)report(error.message);
        else { published.replaceChildren(label('p',error.message)); imageMore.hidden=true; }
      }
    }finally{if(requestId===inventoryRequest)imageMore.disabled=false;}
  }
  imageSearch.addEventListener('input',()=>{
    clearTimeout(searchTimer);
    imageMore.hidden=true;
    searchTimer=setTimeout(()=>void loadPublished(),220);
  });
  imageMore.addEventListener('click',()=>void loadPublished(true));
  document.getElementById('kf-art-refresh').addEventListener('click',()=>{void Promise.all([loadPublished(),loadReview()])});
  const workshop=document.getElementById('workshop');
  const openLibrary=()=>{
    root.dataset.canPublish=workshop.dataset.canPublish;
    void Promise.all([loadPublished(),loadReview()]);
  };
  root.addEventListener('foundry:open',openLibrary);
  if(!workshop.classList.contains('hidden')&&!root.hidden)openLibrary();
  const gallery=document.getElementById('creation-gallery');
  let galleryLoaded=false;
  function loadGalleries(){
    if(galleryLoaded)return;
    galleryLoaded=true;
    void Promise.all([loadArtSprites(),loadRelicIcons()]);
  }
  gallery.addEventListener('foundry:open',loadGalleries);
  if(!workshop.classList.contains('hidden')&&!gallery.hidden)loadGalleries();
  window.addEventListener('pagehide',()=>{for(const item of items)URL.revokeObjectURL(item.url)});
})();
