(()=>{"use strict";
const b=document.getElementById("rw-install"),s=document.getElementById("rw-install-status");
if(!b||!s)return;
let pending=null;
const installKey="kf:chaosphere-pwa-installed";
const remembered=()=>{try{return localStorage.getItem(installKey)==="1"}catch{return false}};
const remember=()=>{try{localStorage.setItem(installKey,"1")}catch{}};
const forget=()=>{try{localStorage.removeItem(installKey)}catch{}};
const standalone=window.matchMedia?.("(display-mode: standalone)")?.matches||navigator.standalone===true;
const markInstalled=()=>{
  pending=null;remember();b.disabled=true;b.hidden=true;
  s.textContent="Chaosphere is installed. Open it from your device's apps.";
};
const help=()=>{s.textContent="Use your browser menu to choose Install app or Add to Home screen. On iPhone, use Safari's Share menu.";document.getElementById("rw-help")?.scrollIntoView({behavior:"smooth",block:"center"});};
if(standalone||remembered())markInstalled();
else{s.textContent="Tap Install Chaosphere to install it separately from Knightfall.";}
window.addEventListener("beforeinstallprompt",e=>{
  if(standalone)return;
  e.preventDefault();forget();pending=e;b.hidden=false;b.disabled=false;
  s.textContent="Your browser is ready to install Chaosphere.";
});
window.addEventListener("appinstalled",markInstalled);
b.addEventListener("click",async()=>{if(!pending){help();return;}const prompt=pending;pending=null;
try{await prompt.prompt();const decision=await prompt.userChoice;
if(decision?.outcome==="accepted")markInstalled();
else s.textContent="Installation dismissed. You can retry from the browser menu.";
}catch{help();}
});
if("serviceWorker" in navigator){navigator.serviceWorker.register("/sw.js",{scope:"/"}).catch(()=>{});}
})();
