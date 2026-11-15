/* Ruinwire shares Knightfall messages and authentication, not a second message store. */
(()=>{"use strict";
if(!["/messages","/messages.html"].includes(location.pathname)||new URLSearchParams(location.search).get("app")!=="ruinwire")return;
document.documentElement.classList.add("ruinwire-mode");
document.title="Ruinwire | Knightfall Messenger";
const m=document.createElement("link");m.rel="manifest";m.href="/ruinwire.webmanifest";document.head.append(m);
const icon=document.createElement("link");icon.rel="icon";icon.type="image/svg+xml";icon.href="/icons/ruinwire.svg";document.head.append(icon);
const style=document.createElement("link");style.rel="stylesheet";style.href="/ruinwire.css?v=20261115-gothic5";document.head.append(style);
function init(){
const shell=document.querySelector(".messages-shell");if(!shell)return;
const bar=document.createElement("div");bar.className="rw-appbar";bar.setAttribute("role","banner");
bar.innerHTML='<img src="/icons/ruinwire.svg" alt=""><strong>RUIN<span>WIRE</span></strong><div class="rw-spacer"></div><a href="/auth?next=%2Fmessages%3Fapp%3Druinwire" id="rw-signin">Sign in</a><a href="/notifications.html" aria-label="Notification settings">Alerts</a><a href="/" aria-label="Open Knightfall">Knightfall</a>';
shell.prepend(bar);
const h=document.querySelector(".messages-hero h1");if(h)h.innerHTML="RUINWIRE<span>.</span>";
const subtitle=document.querySelector(".messages-hero>div>p:last-child");if(subtitle)subtitle.textContent="Your Knightfall conversations, now on their own frequency.";
const signIn=bar.querySelector("#rw-signin");
fetch("https://api.ash-fall.com/api/auth/me",{credentials:"include",cache:"no-store"})
.then(r=>r.ok?r.json():null).then(j=>{if(j?.user)signIn.hidden=true;})
.catch(()=>{});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
