/* Chaosphere extras: local composer actions, no second message store or API. */
(()=>{
 "use strict";
 const shell=document.querySelector(".messages-shell");
 if(!shell)return;
 const body=document.getElementById("body");
 const composer=document.getElementById("composer");
 const transcript=document.getElementById("messages");
 const toggle=document.getElementById("cs-emoji-toggle");
 const tray=document.getElementById("cs-emoji-tray");
 if(!body||!composer||!transcript||!toggle||!tray)return;
 function announce(text){
  const status=document.getElementById("status");
  if(status){status.textContent=text;status.className="msg-status good";}
 }
 function closeTray(){
  tray.hidden=true;toggle.setAttribute("aria-expanded","false");
 }
 function insertAtCursor(text){
  if(composer.hidden||body.disabled)return false;
  const start=body.selectionStart??body.value.length;
  const end=body.selectionEnd??start;
  if(body.value.length+text.length-(end-start)>4000){
   announce("This message would exceed the 4,000-character limit. Shorten the draft first.");
   return false;
  }
  body.setRangeText(text,start,end,"end");
  body.dispatchEvent(new Event("input",{bubbles:true}));
  body.focus({preventScroll:true});
  return true;
 }
 const preview=document.getElementById("cs-compose-preview"),previewToggle=document.getElementById("cs-preview-toggle");
 const updatePreview=()=>{if(!preview||preview.hidden)return;const text=body.value;preview.innerHTML=text?window.ChaosphereFormat.render(text,value=>window.KnightfallEmojis?.render(value,undefined,{lineBreaks:true})??value.replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c])).replace(/\n/g,"<br>")):"<em>Nothing to preview yet.</em>";};
 previewToggle?.addEventListener("click",()=>{if(!preview||!window.ChaosphereFormat)return;preview.hidden=!preview.hidden;previewToggle.setAttribute("aria-expanded",String(!preview.hidden));updatePreview();});
 body.addEventListener("input",updatePreview);
 composer.addEventListener("submit",()=>{if(preview)preview.hidden=true;previewToggle?.setAttribute("aria-expanded","false");});
 composer.addEventListener("click",event=>{const button=event.target.closest("[data-cs-format]");if(!button||body.disabled||!window.ChaosphereFormat)return;const spec={bold:["**","bold text"],italic:["*","italic text"],code:["`","code"],spoiler:["||","spoiler"]}[button.dataset.csFormat];if(!spec)return;const next=window.ChaosphereFormat.wrap(body.value,body.selectionStart,body.selectionEnd,...spec);if(!next){announce("Formatting would exceed the message limit.");return;}body.value=next.value;body.focus({preventScroll:true});body.setSelectionRange(next.start,next.end);body.dispatchEvent(new Event("input",{bubbles:true}));});
 shell.addEventListener("click",event=>{const button=event.target.closest(".cs-spoiler-toggle");if(!button)return;const content=button.nextElementSibling;if(!content)return;content.hidden=!content.hidden;button.setAttribute("aria-expanded",String(!content.hidden));button.textContent=content.hidden?"Reveal spoiler":"Hide spoiler";});
 toggle.addEventListener("click",()=>{
  if(composer.hidden||body.disabled)return;
  tray.hidden=!tray.hidden;
  toggle.setAttribute("aria-expanded",String(!tray.hidden));
 });
 tray.addEventListener("click",event=>{
  const button=event.target.closest("button[data-insert-emoji]");
  if(!button)return;
  if(insertAtCursor(button.dataset.insertEmoji))closeTray();
 });
 transcript.addEventListener("click",event=>{
  const photo=event.target.closest("a.message-attachment.image-preview");
  if(photo&&typeof HTMLDialogElement!=="undefined"&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey){
   const href=photo.getAttribute("href"),thumbnail=photo.querySelector("img");
   if(href&&thumbnail){
    const url=new URL(href,location.origin),apiOrigin="https://api.ash-fall.com";
    if((url.origin===location.origin||url.origin===apiOrigin)&&url.protocol==="https:"){
     let lightbox=document.getElementById("cs-image-lightbox");
     if(!lightbox){
      lightbox=document.createElement("dialog");
      lightbox.id="cs-image-lightbox";lightbox.className="cs-image-lightbox";
      lightbox.setAttribute("aria-label","Message photo preview");
      lightbox.innerHTML='<div class="cs-image-stage"><button class="cs-image-close" type="button" aria-label="Close photo preview">×</button><img alt=""><div class="cs-image-caption"><strong></strong><a target="_blank" rel="noopener noreferrer">Open original</a></div></div>';
      document.body.append(lightbox);
      lightbox.querySelector(".cs-image-close").addEventListener("click",()=>lightbox.close());
      lightbox.addEventListener("click",click=>{if(click.target===lightbox)lightbox.close()});
      lightbox.addEventListener("close",()=>lightbox.querySelector("img").removeAttribute("src"));
     }
     const image=lightbox.querySelector("img");
     image.src=thumbnail.getAttribute("src")||href;
     image.alt=thumbnail.alt||"Message attachment";
     lightbox.querySelector(".cs-image-caption strong").textContent=photo.querySelector(".attachment-info strong")?.textContent||"Photo attachment";
     lightbox.querySelector(".cs-image-caption a").href=url.href;
     if(typeof lightbox.showModal==="function"){
      event.preventDefault();lightbox.showModal();return;
     }
    }
   }
  }
  const button=event.target.closest("[data-quote-message]");
  if(!button)return;
  const article=button.closest("article.message[data-message]");
  if(!article||article.classList.contains("deleted"))return;
  const sender=(article.querySelector(".message-meta strong")?.textContent||"Member").replace(/\s+/g," ").trim().slice(0,64);
  const original=(article.dataset.rawBody??article.querySelector("p")?.textContent??"").replace(/\s+/g," ").trim();
  if(!original)return;
  const snippet=Array.from(original).slice(0,165).join("")+(Array.from(original).length>165?"…":"");
  // A visible plain-text quote; the existing send queue, draft saving,
  // message permissions, and attachment workflow remain the only owners.
  const prefix="↳ "+sender+": “"+snippet+"”\n";
  if(insertAtCursor(prefix+(body.value.trim()?"":"\n"))){
   closeTray();announce("Quote inserted into your draft. Edit it or press Send.");
  }
 });
 body.addEventListener("paste",event=>{
  if(composer.hidden||body.disabled)return;
  const images=Array.from(event.clipboardData?.files||[]).filter(file=>
   /^image\/(?:png|jpeg|gif|webp)$/i.test(file.type));
  if(!images.length)return;
  const attachmentInput=document.getElementById("attachment-input");
  const attachButton=document.getElementById("attach-file");
  if(!attachmentInput||typeof DataTransfer!=="function")return;
  event.preventDefault();
  if(attachButton?.disabled){
   announce("Finish your current attachment upload before pasting another picture.");
   return;
  }
  if(images.length>10){
   announce("Attach up to 10 images at a time.");
   return;
  }
  try{
   const files=new DataTransfer();
   for(const image of images)files.items.add(image);
   attachmentInput.files=files.files;
   closeTray();
   announce("Preparing your pasted image attachment. The message won't send until you press Send.");
   attachmentInput.dispatchEvent(new Event("change",{bubbles:true}));
  }catch{
   announce("Your browser can't paste this image as a file. Use the + button to attach it.");
  }
 });
 document.addEventListener("keydown",event=>{
  if(event.key==="Escape"&&!tray.hidden)closeTray();
 });
 document.addEventListener("pointerdown",event=>{
  if(!tray.hidden&&!tray.contains(event.target)&&!toggle.contains(event.target))closeTray();
 });
 const watcher=new MutationObserver(()=>{
  if(composer.hidden&&!tray.hidden)closeTray();if(composer.hidden&&preview){preview.hidden=true;previewToggle?.setAttribute("aria-expanded","false");}
 });
 watcher.observe(composer,{attributes:true,attributeFilter:["hidden"]});
})();
