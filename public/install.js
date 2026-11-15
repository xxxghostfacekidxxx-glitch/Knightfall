/* PWA install first; do not pretend an APK exists before a verified signed release. */
(()=>{
 "use strict";
 const button=document.getElementById("kf-pwa-install");
 const status=document.getElementById("kf-install-status");
 if(!button||!status)return;
 let prompt=null;
 const announce=message=>{status.textContent=message};
 const standalone=window.matchMedia?.("(display-mode: standalone)").matches||navigator.standalone===true;
 if(standalone){
   button.disabled=true;button.textContent="Already installed";
   announce("Knightfall is running as an installed web app.");
 }else{
   announce("Use your browser’s Install app or Add to Home Screen option. The button activates when a direct install prompt is available.");
 }
 window.addEventListener("beforeinstallprompt",event=>{
   event.preventDefault();prompt=event;
   button.disabled=false;button.textContent="Install Knightfall";
   announce("Your browser is ready to install the Knightfall web app.");
 });
 button.addEventListener("click",async()=>{
   if(!prompt){
     announce("Open your browser menu and choose Install app or Add to Home Screen. A direct installation prompt is not available here.");
     return;
   }
   const pending=prompt;prompt=null;
   try{
     await pending.prompt();
     const result=await pending.userChoice;
     announce(result?.outcome==="accepted"?"Installation accepted. Follow any remaining browser prompts.":"Installation was dismissed. You can use the browser menu later.");
   }catch(error){announce("The browser could not open the installer. Try the browser menu instead.");}
 });
 window.addEventListener("appinstalled",()=>{
   button.disabled=true;button.textContent="Installed";
   announce("Knightfall has been installed on this device.");
 });
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
      apk.href=url.href;apk.hidden=false;
      releaseStatus.textContent="Signed APK "+String(data.versionName||"")+" available. Check SHA-256: "+data.apkSha256;
    }).catch(()=>{/* No verified APK is a legitimate release state. */});
  }
})();
