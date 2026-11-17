(()=>{"use strict";
const b=document.getElementById("rw-install"),s=document.getElementById("rw-install-status");
if(!b||!s)return;
let pending=null;
const standalone=window.matchMedia?.("(display-mode: standalone)")?.matches||navigator.standalone===true;
const help=()=>{s.textContent="Use your browser menu to choose Install app or Add to Home screen. On iPhone, use Safari's Share menu.";document.getElementById("rw-help")?.scrollIntoView({behavior:"smooth",block:"center"});};
if(standalone){s.textContent="You're already inside an installed web app. Open this page in Chrome or Safari to install Chaosphere as its own app.";}
else{s.textContent="Tap Install Chaosphere to install it separately from Knightfall.";}
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();pending=e;s.textContent="Your browser is ready to install Chaosphere.";});
window.addEventListener("appinstalled",()=>{pending=null;s.textContent="Chaosphere installation completed.";b.textContent="Installed";b.disabled=true;});
b.addEventListener("click",async()=>{if(!pending){help();return;}const prompt=pending;pending=null;
try{await prompt.prompt();const decision=await prompt.userChoice;s.textContent=decision?.outcome==="accepted"?"Install accepted. Check your apps for Chaosphere.":"Installation dismissed. You can retry from the browser menu.";}catch{help();}
});
if("serviceWorker" in navigator){navigator.serviceWorker.register("/sw.js",{scope:"/"}).catch(()=>{});}
})();
