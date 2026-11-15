/* Knightfall web app installer: a working browser prompt where supported, useful steps everywhere else.
 * A PWA prompt cannot be forced in a browser that does not offer beforeinstallprompt.
 * No public APK is advertised without the verified release metadata gate below.
 */
(()=>{
 "use strict";
 const button=document.getElementById("kf-pwa-install");
 const status=document.getElementById("kf-install-status");
 if(!button||!status)return;
 const guide=document.getElementById("kf-install-guide");
 const guideTitle=document.getElementById("kf-install-guide-title");
 const guideContext=document.getElementById("kf-install-guide-context");
 const guideSteps=document.getElementById("kf-install-guide-steps");
 const guideToggle=document.getElementById("kf-install-help-button");
 const copyButton=document.getElementById("kf-install-copy-link");
 const copyStatus=document.getElementById("kf-install-copy-status");
 let prompt=null;
 let installed=false;
 const announce=message=>{status.textContent=message;};
 const standalone=()=>Boolean(window.matchMedia?.("(display-mode: standalone)")?.matches||
   window.matchMedia?.("(display-mode: fullscreen)")?.matches||navigator.standalone===true);
 const detectDevice=()=>{
   const ua=navigator.userAgent||"";
   const ios=/iPad|iPhone|iPod/.test(ua)||navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1;
   const android=/Android/i.test(ua);
   const inApp=/FBAN|FBAV|Instagram|TikTok|Snapchat|Line\/|;\s*wv\)|\bwv\b|GSA\//i.test(ua);
   const safari=/Safari/i.test(ua)&&!/CriOS|FxiOS|EdgiOS|OPiOS|Chrome|Chromium|Firefox|Edg\//i.test(ua);
   return {ios,android,inApp,safari};
 };
 const guideForDevice=()=>{
   const {ios,android,inApp,safari}=detectDevice();
   if(inApp)return {
     title:"Open Knightfall in a regular browser",
     context:"In-app browsers often block web app installation. Open this page in Chrome (Android) or Safari (iPhone/iPad) first.",
     steps:["Open the menu in the app you are viewing this page from.","Choose Open in browser, Open in Chrome, or Open in Safari. If there is no option, copy the page link below and paste it into Chrome or Safari.","In the browser menu, select Install app or Add to Home Screen (Android), or Share → Add to Home Screen (Safari)."]};
   if(ios)return {
     title:"Install Knightfall on iPhone or iPad",
     context:safari?"Safari uses Add to Home Screen instead of a separate in-page install dialog.":"Open the page in Safari to use the standard Add to Home Screen option.",
     steps:["Open this Knightfall page in Safari.","Tap Share (the square with an upward arrow).","Scroll to Add to Home Screen, tap it, then choose Add. Open Knightfall using the new home-screen icon."]};
   if(android)return {
     title:"Install Knightfall on Android",
     context:"Chrome and compatible browsers can install Knightfall even if they do not show a direct pop-up from this page.",
     steps:["Open this page in Chrome or another browser that supports installing web apps.","Tap the browser's ⋮ menu (usually at the top right).","Choose Install app or Add to Home screen, then confirm. The Knightfall icon will appear on your device."]};
   return {
     title:"Install Knightfall on your computer",
     context:"The browser decides whether to show a one-click installation prompt.",
     steps:["Open Knightfall in Chrome, Edge or another browser that supports installed web apps.","Find the Install icon in the address bar, or open the browser menu and choose Install page as app / Install Knightfall.","Confirm Install, then launch Knightfall from your computer's apps list."]};
 };
 function showGuide(){
   if(!guide||!guideTitle||!guideContext||!guideSteps)return;
   const instructions=guideForDevice();
   guideTitle.textContent=instructions.title;
   guideContext.textContent=instructions.context;
   guideSteps.replaceChildren();
   for(const text of instructions.steps){
     const li=document.createElement("li");li.textContent=text;guideSteps.append(li);
   }
   guide.hidden=false;
   guideToggle?.setAttribute("aria-expanded","true");
   announce("Installation steps for this device are shown below. Use your browser menu if a one-tap prompt is unavailable.");
   guide.scrollIntoView?.({block:"nearest",behavior:window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches?"auto":"smooth"});
   guideTitle.focus?.({preventScroll:true});
 }
 function markInstalled(){
   installed=true;prompt=null;
   button.disabled=true;
   button.textContent="Already installed";
   announce("Knightfall is installed and running as a web app on this device.");
   if(guide)guide.hidden=true;
   guideToggle?.setAttribute("aria-expanded","false");
 }
 if(standalone())markInstalled();
 else announce("Tap Install web app. If your browser does not support a direct prompt, clear installation steps will open.");
 window.addEventListener("beforeinstallprompt",event=>{
   if(installed||standalone())return;
   event.preventDefault();prompt=event;
   button.disabled=false;
   button.textContent="Install Knightfall";
   announce("Your browser is ready to install the Knightfall web app. Tap Install Knightfall.");
 });
 button.addEventListener("click",async()=>{
   if(installed||standalone()){markInstalled();return;}
   if(!prompt){showGuide();return;}
   const pending=prompt;prompt=null;
   button.disabled=true;button.textContent="Opening installer…";
   try{
     await pending.prompt();
     const result=await pending.userChoice;
     if(result?.outcome==="accepted"){
       announce("Installation accepted. Finish any remaining steps in your browser.");
     }else{
       showGuide();
       announce("Installation was dismissed. You can also use your browser's Install app or Add to Home Screen menu.");
     }
   }catch{
     showGuide();
     announce("The browser blocked the direct installer. Follow the steps below to add Knightfall to your device.");
   }finally{
     if(!installed&&!standalone()){
       button.disabled=false;button.textContent="Install web app";
     }
   }
 });
 guideToggle?.addEventListener("click",()=>{
   if(!guide)return;
   if(guide.hidden){showGuide();return;}
   guide.hidden=true;guideToggle.setAttribute("aria-expanded","false");
   announce(prompt?"Tap Install Knightfall for the browser's install prompt.":"Use Install web app to reopen the device instructions.");
 });
 copyButton?.addEventListener("click",async()=>{
   const url=new URL("/install.html",location.origin).href;
   try{
     await navigator.clipboard.writeText(url);
     if(copyStatus)copyStatus.textContent="Install page link copied. Paste it into Chrome or Safari.";
   }catch{
     // Clipboard APIs may be blocked in embedded browsers. Make the link selectable.
     if(copyStatus){copyStatus.textContent="Copy this link: "+url;}
   }
 });
 window.addEventListener("appinstalled",markInstalled);
  // Only activate an APK download for a signed release on the official GitHub repository.
  const apk=document.getElementById("kf-apk-download");
  const releaseStatus=document.getElementById("kf-apk-release-status");
  if(apk&&releaseStatus){
    fetch("/android-release.json",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(data=>{
      if(!data||data.status!=="released"||data.signedReleaseVerified!==true)return;
      if(data.applicationId!=="com.ashfall.knightfall"||typeof data.apkSha256!=="string"||!/^[a-f0-9]{64}$/i.test(data.apkSha256))return;
      const url=new URL(String(data.apkUrl||""),location.origin);
      if(url.protocol!=="https:"||url.hostname!=="github.com"||
         !url.pathname.startsWith("/xxxghostfacekidxxx-glitch/Knightfall/releases/download/")||
         !url.pathname.toLowerCase().endsWith(".apk"))return;
      // Swap the preparing-only copy after metadata passes every release gate.
      const label=document.getElementById("kf-apk-release-label");
      const description=document.getElementById("kf-apk-description");
      if(label){label.textContent="SIGNED APK RELEASE AVAILABLE";label.classList.remove("kf-install-pending");}
      if(description)description.textContent="Knightfall has an official release-signed Android APK. Download from the verified GitHub release link and compare its SHA-256 checksum before installing.";
      apk.href=url.href;apk.hidden=false;
      releaseStatus.textContent="Signed APK "+String(data.versionName||"")+" available. Check SHA-256: "+data.apkSha256;
    }).catch(()=>{/* No verified APK is a legitimate release state. */});
  }
})();
