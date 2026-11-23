/* Knightfall Chaos Cartridge: preserve the complete game HUD in native fullscreen and mobile theater. */
(() => {
  "use strict";
  const page=location.pathname.split("/").pop();
  const selectors={
    "arcade-games.html":".game-panel",
    "arcade-after-dark.html":".game",
    "arcade-originals.html":".cabinet",
    "arcade-fresh-meat.html":".cabinet",
    "city-of-cinders.html":"main",
    "not-dead-yet.html":"main",
    "last-drop-lemonade.html":"main",
    "wagonbound.html":"main"
  };
  const selector=selectors[page];
  if(!selector)return;
  const sheet=document.createElement("style");
  sheet.id="kf-arcade-lossless-fullscreen";
  sheet.textContent=`
    .af-game-root:fullscreen,.af-game-root:-webkit-full-screen,.af-game-root.af-game-theater{
      box-sizing:border-box!important;display:block!important;width:100vw!important;
      height:100dvh!important;max-width:none!important;max-height:none!important;
      margin:0!important;padding:clamp(8px,2vw,22px)!important;
      overflow:auto!important;overscroll-behavior:contain;background:#080917!important;
      color:#f5e7dc;border-radius:0!important
    }
    .af-game-root.af-game-theater{position:fixed!important;inset:0!important;z-index:2147483000!important}
    body.af-game-theater-open{overflow:hidden!important}
    .af-game-root:is(:fullscreen,:-webkit-full-screen,.af-game-theater) .af-game-tools{
      position:sticky!important;top:0;z-index:20;background:#151321f4!important
    }
    .af-game-root:is(:fullscreen,:-webkit-full-screen,.af-game-theater) :is(canvas,video){
      display:block;max-width:100%!important;max-height:calc(100dvh - 110px)!important;
      height:auto;object-fit:contain;box-sizing:border-box
    }
    .af-game-root:is(:fullscreen,:-webkit-full-screen,.af-game-theater) :is(.play-area,.shoot-wrap,.board,.game-area){
      max-width:100%;min-width:0
    }
    .af-game-tools{display:flex;align-items:center;justify-content:space-between;gap:.6rem;
      padding:.55rem .85rem;margin-bottom:.75rem;border:1px solid #b68a8e80;
      border-radius:10px;background:linear-gradient(110deg,#211825e8,#10131bdf)}
    .af-fullscreen-toggle{min-height:44px;padding:.55rem 1rem;cursor:pointer;
      border:1px solid #e0b58e;border-radius:9px;
      background:linear-gradient(135deg,#663747,#292639);color:#fff0dc;
      font:800 .88rem/1.25 system-ui,sans-serif}
    .af-fullscreen-toggle:focus-visible{outline:3px solid #f0c38c;outline-offset:2px}
    @media(max-width:600px){
      .af-game-tools{padding:.45rem;gap:.3rem}
      .af-game-kicker{font-size:.68rem;letter-spacing:.09em}
    }
    @media(prefers-reduced-motion:reduce){.af-game-root{scroll-behavior:auto}}
  `;
  document.head.append(sheet);
  const nativeActive=()=>document.fullscreenElement||document.webkitFullscreenElement;
  let lastTrigger=null;
  const closeTheater=()=>{
    const open=document.querySelector(".af-game-root.af-game-theater");
    if(!open)return false;
    open.classList.remove("af-game-theater");
    sync();notifyResize();
    if(lastTrigger?.isConnected)lastTrigger.focus({preventScroll:true});
    return true;
  };
  const notifyResize=()=>window.dispatchEvent(new Event("resize"));
  function sync(){
    let theaterOpen=false;
    for(const root of document.querySelectorAll(".af-game-root")){
      const theater=root.classList.contains("af-game-theater");
      theaterOpen ||= theater;
      const on=nativeActive()===root||theater;
      const button=root.querySelector(".af-fullscreen-toggle");
      if(!button)continue;
      button.textContent=on?"⤢ Exit fullscreen":"⛶ Fullscreen";
      button.setAttribute("aria-label",on?"Exit fullscreen game view":"Open game in fullscreen");
      button.setAttribute("aria-pressed",String(on));
    }
    document.body.classList.toggle("af-game-theater-open",theaterOpen);
  }
  async function toggle(root){
    lastTrigger=root.querySelector(".af-fullscreen-toggle");
    if(root.classList.contains("af-game-theater")){
      closeTheater();return;
    }
    if(nativeActive()===root){
      try{
        if(document.exitFullscreen)await document.exitFullscreen();
        else if(document.webkitExitFullscreen)await document.webkitExitFullscreen();
      }catch{/* Some embedded mobile browsers deny native exit; state will resync. */}
      sync();return;
    }
    try{
      if(root.requestFullscreen){
        try{await root.requestFullscreen({navigationUI:"hide"});}
        catch{await root.requestFullscreen();}
      }else if(root.webkitRequestFullscreen){await root.webkitRequestFullscreen();}
      else throw Error("Native fullscreen unavailable");
    }catch{
      // Embedded Android webviews may prohibit the Fullscreen API.
      // Theater mode retains actual scores, game controls, and canvas content.
      root.classList.add("af-game-theater");
    }
    sync();notifyResize();
    if(root.classList.contains("af-game-theater"))lastTrigger?.focus({preventScroll:true});
  }
  function init(){
    document.querySelectorAll(selector).forEach(root=>{
      if(root.dataset.afFullscreenReady==="true")return;
      root.dataset.afFullscreenReady="true";
      root.classList.add("af-game-root");
      const tools=document.createElement("div");tools.className="af-game-tools";
      const label=document.createElement("span");label.className="af-game-kicker";label.textContent="CHAOS CARTRIDGE";
      const button=document.createElement("button");button.className="af-fullscreen-toggle";button.type="button";
      button.addEventListener("click",()=>toggle(root));
      tools.append(label,button);root.prepend(tools);
    });
    sync();
  }
  document.addEventListener("fullscreenchange",()=>{sync();notifyResize();});
  document.addEventListener("webkitfullscreenchange",()=>{sync();notifyResize();});
  document.addEventListener("keydown",event=>{
    if(event.key!=="Escape")return;
    if(closeTheater())event.preventDefault();
  });
  window.addEventListener("pagehide",closeTheater);
  document.addEventListener("visibilitychange",()=>{if(document.hidden)closeTheater();});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
