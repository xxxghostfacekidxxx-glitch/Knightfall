/* Knightfall Arcade playability bridge.
 * Opt-in on individual first-party hosted game pages, without replacing their game engines.
 * Provides fullscreen/theater controls and a visible recovery route for fatal load failures.
 */
(() => {
  'use strict';
  const loader = document.currentScript;
  const targetSelector = loader?.dataset.target || 'body';
  const existingFullscreen = loader?.dataset.fullscreen === 'existing';
  const theaterOnly = loader?.dataset.theaterOnly === 'true';
  const readyGlobal = loader?.dataset.ready || '';
  const rootId = 'kf-arcade-view-toggle';
  let root, button, theater = false, errorShown = false;
  const queuedErrors = [];
  const prefix = 'kf-arcade-playback';

  function current() { return !!document.fullscreenElement || !!document.webkitFullscreenElement; }
  function nativeFullscreen() { return document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen; }
  function setState(active) {
    if (!root || !button) return;
    root.classList.toggle(prefix+'-surface',active);
    document.body.classList.toggle(prefix+'-active',active);
    button.setAttribute('aria-pressed',String(active));
    button.textContent=active ? '⤢ Exit fullscreen' : '⛶ Fullscreen';
    button.title=theater?'Theater mode: browser fullscreen was blocked':'Toggle the game fullscreen';
    window.dispatchEvent(new Event('resize'));
  }
  function sync() {
    if (!theater) setState(current());
  }
  function closeTheater() {
    theater=false;
    setState(current());
  }

  function css() {
    if (document.getElementById(prefix+'-style')) return;
    const style=document.createElement('style');
    style.id=prefix+'-style';
    style.textContent=[
      '#'+rootId+'{position:fixed;top:calc(8px + env(safe-area-inset-top,0px));right:calc(8px + env(safe-area-inset-right,0px));z-index:2147483647;pointer-events:auto!important;isolation:isolate;min-height:42px;max-width:48vw;border:1px solid #c6ff45;border-radius:11px;background:rgba(14,12,24,.94);box-shadow:0 4px 24px #000a;color:#f6eff7;padding:9px 12px;font:700 13px/1.2 system-ui,sans-serif;cursor:pointer;touch-action:manipulation}',
      '#'+rootId+':focus-visible{outline:3px solid #ff55d8;outline-offset:3px}',
      '.kf-arcade-playback-active{overflow:hidden!important}',
      '.kf-arcade-playback-surface{position:fixed!important;inset:0!important;z-index:2147483500!important;width:100vw!important;height:100dvh!important;max-width:none!important;max-height:none!important;min-height:100dvh!important;margin:0!important;overflow:auto!important;box-sizing:border-box!important;background:#080b16!important;transform:none!important}',
      '#kf-arcade-recovery{position:fixed;left:max(10px,env(safe-area-inset-left,0px));right:max(10px,env(safe-area-inset-right,0px));bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:2147483641;padding:14px 16px;border:1px solid #ff55d8;border-radius:12px;background:#14101df5;color:#fff;font:14px/1.5 system-ui,sans-serif;box-shadow:0 8px 30px #000b;max-width:480px;margin-inline:auto}',
      '#kf-arcade-recovery[hidden]{display:none!important}',
      '#kf-arcade-recovery strong{display:block;margin-bottom:4px}',
      '#kf-arcade-recovery a,#kf-arcade-recovery button{display:inline-block;margin:8px 10px 0 0;border:1px solid #c6ff45;background:#1e2430;border-radius:8px;color:#c6ff45;padding:7px 10px;font:700 13px system-ui,sans-serif;text-decoration:none;cursor:pointer}',
      '@media(prefers-reduced-motion:reduce){#'+rootId+'{transition:none!important}}'
    ].join('\n');
    document.head.append(style);
  }
  function showError() {
    if (errorShown || !document.body) return;
    errorShown=true;
    const note=document.createElement('aside');
    note.id='kf-arcade-recovery';
    note.setAttribute('role','alert');
    const title=document.createElement('strong');
    title.textContent='This game had trouble loading';
    const explanation=document.createElement('span');
    explanation.textContent='A game script or graphics context failed. You can retry without changing your saved progress.';
    const reload=document.createElement('button');
    reload.type='button';
    reload.textContent='↻ Reload game';
    reload.addEventListener('click',()=>location.reload());
    const home=document.createElement('a');
    home.href='/chaos-cartridge.html';
    home.textContent='Back to arcade';
    const dismiss=document.createElement('button');
    dismiss.type='button';
    dismiss.textContent='Dismiss';
    dismiss.addEventListener('click',()=>note.remove());
    note.append(title,explanation,document.createElement('div'),reload,home,dismiss);
    document.body.append(note);
  }
  function notice(reason) {
    queuedErrors.push(reason);
    if (document.readyState==='loading') {
      document.addEventListener('DOMContentLoaded',showError,{once:true});
    } else showError();
  }
  window.addEventListener('error',event=>{
    const el=event.target;
    if(el && el!==window && el.tagName==='SCRIPT') {
      const url=el.src||'';
      if((url && new URL(url,location.href).origin===location.origin) || (!url && el.type==='module')) notice('missing-script');
    } else if(event instanceof ErrorEvent && event.error) notice('runtime-error');
  },true);
  window.addEventListener('unhandledrejection',()=>notice('unhandled-rejection'));
  document.addEventListener('webglcontextlost',()=>notice('webgl-context-lost'),true);

  function init() {
    css();
    root=(targetSelector==='body'?document.body:document.querySelector(targetSelector))||document.body;
    // Keep a game's own fullscreen button, except when browser fullscreen is disabled.
    if(!existingFullscreen || !(document.fullscreenEnabled || document.webkitFullscreenEnabled)){
    button=document.createElement('button');
    button.id=rootId;
    button.type='button';
    button.setAttribute('aria-label','Toggle game fullscreen');
    button.setAttribute('aria-pressed','false');
    button.textContent='⛶ Fullscreen';
    document.body.append(button);
    button.addEventListener('click',async()=>{
      if(theater){closeTheater();return;}
      if(current()){
        try {
          if(document.exitFullscreen) await document.exitFullscreen();
          else if(document.webkitExitFullscreen) document.webkitExitFullscreen();
        } catch { theater=true; setState(true); }
        return;
      }
      // For legacy graphics-heavy games, keep the canvas alive without native fullscreen transitions.
      if(theaterOnly){theater=true;setState(true);return;}
      const request=nativeFullscreen();
      if(request) {
        try {
          await request.call(document.documentElement);
          theater=false;
          setState(true);
          return;
        } catch { /* Android in-app browsers may reject the Fullscreen API. */ }
      }
      theater=true;
      setState(true);
    });
    }
    document.addEventListener('fullscreenchange',sync);
    document.addEventListener('webkitfullscreenchange',sync);
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape' && theater) closeTheater();
    });
    if(queuedErrors.length)showError();
    if(readyGlobal) window.setTimeout(()=>{
      if(!document.hidden && !window[readyGlobal] && !errorShown) notice('game-boot-timeout');
    },15000);
    if(root!==document.body) window.setTimeout(()=>{
      if(document.hidden || errorShown) return;
      const box=root.getBoundingClientRect();
      if(box.width<35 || box.height<35) notice('invisible-root');
    },10000);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
