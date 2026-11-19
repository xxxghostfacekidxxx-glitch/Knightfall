/**
 * Shared, local-only image picker for Miss Chaos full chat and floating dock.
 * A selected image remains on the member's device until they press Send.
 */
const MAX=8*1024*1024,MAX_PIXELS=50_000_000;
const allowedTypes=new Set(["image/jpeg","image/png","image/webp","image/gif","image/avif","image/heic","image/heif"]);
const humanError=err=>String(err?.message||err||"Unable to prepare the image.").slice(0,185);
export function checkChaosLocalPhoto(file){
 if(!file||!allowedTypes.has(String(file.type||"").toLowerCase())||file.size===0||file.size>MAX)
  throw Error("Choose a JPG, PNG, WebP, GIF or browser-supported AVIF/HEIC image under 8 MB.");
 return file;
}
export async function compressChaosChatPhoto(file){
 checkChaosLocalPhoto(file);
 let bitmap;
 try{bitmap=await createImageBitmap(file);}
 catch{throw Error("This browser cannot open the selected photo. In Google Photos, download or export a JPG/PNG to your device, then choose it.");}
 try{
  if(!bitmap.width||!bitmap.height||bitmap.width>10000||bitmap.height>10000||
    bitmap.width*bitmap.height>MAX_PIXELS)
   throw Error("This photo has too many pixels. Crop or resize it before attaching.");
  const scale=Math.min(1,768/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement("canvas");
  canvas.width=Math.max(1,Math.round(bitmap.width*scale));
  canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  const context=canvas.getContext("2d",{alpha:false});
  if(!context)throw Error("Image processing is unavailable.");
  context.fillStyle="#fff";context.fillRect(0,0,canvas.width,canvas.height);
  context.imageSmoothingEnabled=true;context.imageSmoothingQuality="high";
  context.drawImage(bitmap,0,0,canvas.width,canvas.height);
  for(const quality of [.76,.6,.45,.3]){
   const encoded=canvas.toDataURL("image/jpeg",quality);
   if(/^data:image\/jpeg;base64,/.test(encoded)&&encoded.length<860000)return encoded;
  }
  throw Error("The photo is too detailed for the free vision limit. Crop it in Photos and select it again.");
 }finally{bitmap.close();}
}
export function mountChaosChatImage({form,composer,status,onChange}){
 if(!form||!composer||!form.parentElement)throw Error("Image chat form unavailable.");
 let file=null,photoUrl=null,serial=0;
 const button=document.createElement("button");button.type="button";button.className="mc-attach-button";
 button.textContent="＋ Image";button.title="Attach one picture from Photos or Files";
 button.setAttribute("aria-label","Add image to Miss Chaos chat from Photos or Files");
 const field=document.createElement("input");field.type="file";field.accept="image/*";field.className="mc-attach-input";
 field.setAttribute("aria-label","Choose one photo for Miss Chaos");field.tabIndex=-1;
 const display=document.createElement("div");display.className="mc-attachment-preview";display.hidden=true;
 const thumbnail=document.createElement("img");thumbnail.alt="Selected photo ready to send";thumbnail.className="mc-attachment-thumb";
 const info=document.createElement("span");info.className="mc-attachment-info";
 const remove=document.createElement("button");remove.type="button";remove.className="mc-attachment-remove";
 remove.textContent="× Remove";remove.setAttribute("aria-label","Remove selected image");
 display.append(thumbnail,info,remove);
 composer.prepend(button,field);
 form.parentElement.insertBefore(display,form);
 function report(text){if(status){status.textContent=text;status.hidden=!text;}}
 function clear(){
  serial++;file=null;field.value="";display.hidden=true;thumbnail.removeAttribute("src");
  if(photoUrl){URL.revokeObjectURL(photoUrl);photoUrl=null;}
  report("");
  onChange?.(false);
 }
 function choose(next){
  try{
   checkChaosLocalPhoto(next);
   clear();file=next;photoUrl=URL.createObjectURL(next);thumbnail.src=photoUrl;
   info.textContent=next.name+" · "+Math.ceil(next.size/1024)+" KB · private until Send";
   display.hidden=false;
   report("Image selected. Type what you want Miss Chaos to examine, then press Send. Original image is not saved; a text description stays in your chat.");
   onChange?.(true);
  }catch(error){report(humanError(error));}
 }
 button.addEventListener("click",()=>field.click());
 field.addEventListener("change",()=>{if(field.files?.[0])choose(field.files[0]);field.value="";});
 remove.addEventListener("click",()=>{clear();report("Image removed. Nothing was uploaded.");});
 form.addEventListener("paste",event=>{
  const from=Array.from(event.clipboardData?.files||[]).find(f=>allowedTypes.has(f.type));
  if(from){event.preventDefault();choose(from);}
 });
 window.addEventListener("pagehide",clear,{once:true});
 return {
  hasImage:()=>!!file,
  async prepare(){const selected=file;if(!selected)return null;
   const id=serial;
   report("Preparing the selected image on this device…");
   const image=await compressChaosChatPhoto(selected);
   if(id!==serial||file!==selected)throw Error("Image selection changed. Press Send again.");
   return image;
  },
  clear,
  setBusy(disabled){button.disabled=!!disabled;field.disabled=!!disabled;remove.disabled=!!disabled;},
  report
 };
}
