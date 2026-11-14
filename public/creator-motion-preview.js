/* Knightfall Creator Motion Studio: pose-preview animation from original static character art. */
import {loadKnightfallArt} from '/knightfall-art-runtime.js';
const root=document.getElementById('kf-pose-lab');
if(root){
  const $=id=>document.getElementById(id);
  const canvas=$('kf-pose-canvas'),ctx=canvas.getContext('2d');
  const sprite=$('kf-pose-sprite'),state=$('kf-pose-state'),speed=$('kf-pose-speed');
  const flip=$('kf-pose-flip'),play=$('kf-pose-play'),exportButton=$('kf-pose-export');
  const status=$('kf-pose-status');
  const prefersReduced=!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  let art=null,visible=false,playing=!prefersReduced,clock=0,lastFrame=0,requested=0;
  function note(text){status.textContent=text;}
  function render(){
    if(!art||!ctx)return;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const def=art.list().find(x=>x.id===sprite.value);
    if(!def)return;
    const r=def.atlasRect;
    if(!r||!r.width||!r.height)return;
    const scale=Math.min(274/r.width,260/r.height);
    const w=r.width*scale,h=r.height*scale;
    // Keep the baseline stable while breathing, walking, attacking and exporting.
    art.drawMotion(ctx,def.id,(400-w)/2,305-h,w,h,{
      time:clock,state:state.value,flipX:flip.checked,
      reducedMotion:prefersReduced,flash:state.value==='hurt'
    });
  }
  function frame(now){
    requested=0;
    if(!visible||document.hidden||!art)return;
    if(playing){
      if(lastFrame)clock+=Math.min(.08,(now-lastFrame)/1000)*(Number(speed.value)/100);
      lastFrame=now;
    }
    render();
    if(playing)request();
  }
  function request(){
    if(requested||!visible||document.hidden||!art)return;
    requested=requestAnimationFrame(frame);
  }
  function stop(){
    if(requested){cancelAnimationFrame(requested);requested=0;}
    lastFrame=0;
  }
  const observer=new IntersectionObserver(entries=>{
    visible=entries.some(x=>x.target===canvas&&x.isIntersecting);
    if(visible){render();if(playing)request();}
    else stop();
  },{threshold:.1});
  observer.observe(canvas);
  function updateButton(){
    play.textContent=playing?'Pause motion':'Play motion';
    play.setAttribute('aria-pressed',String(playing));
  }
  updateButton();
  play.addEventListener('click',()=>{
    playing=!playing;stop();updateButton();
    if(playing)request();
    else render();
  });
  for(const el of [sprite,state,speed,flip])el.addEventListener('change',()=>{render();if(playing)request()});
  flip.addEventListener('input',render);
  speed.addEventListener('input',()=>{note('Speed: '+speed.value+'%. Export saves the current PNG pose.');render()});
  exportButton.addEventListener('click',()=>{
    if(!art)return note('Wait for the artwork to finish loading.');
    render();
    canvas.toBlob(blob=>{
      if(!blob)return note('PNG export failed.');
      const url=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=url;a.download='knightfall-'+sprite.value+'-'+state.value+'-pose.png';
      document.body.append(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1200);
      note('Transparent pose PNG exported. Animated motion still requires the site renderer.');
    },'image/png');
  });
  // A transparent 8-frame pose strip can be imported by engines that use PNG atlases.
  // Frames are procedural transforms of still art, not new hand-drawn animation cels.
  const sheetButton=$('kf-pose-sheet'),jsonButton=$('kf-pose-json');
  function sheetSpec(){
    if(!art)return null;
    const def=art.list().find(x=>x.id===sprite.value);if(!def)return null;
    const frameW=200,frameH=260,count=8;
    const frequency={idle:2.5,walk:9,run:13,jump:2.5,attack:11,hurt:2.5}[state.value]||2.5;
    const durationMs=Math.round((Math.PI*2/frequency)*1000/count);
    const name='knightfall-'+def.id+'-'+state.value;
    return {def,frameW,frameH,count,frequency,durationMs,name};
  }
  function downloadFile(blob,name){
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1800);
  }
  sheetButton.addEventListener('click',()=>{
    const cfg=sheetSpec();if(!cfg)return note('No character is loaded yet.');
    const sheet=document.createElement('canvas');sheet.width=cfg.frameW*cfg.count;sheet.height=cfg.frameH;
    const context=sheet.getContext('2d');if(!context)return note('Canvas sprite export is unavailable.');
    context.clearRect(0,0,sheet.width,sheet.height);
    const {width,height}=cfg.def.atlasRect;
    const scale=Math.min(170/width,218/height),w=width*scale,h=height*scale;
    for(let i=0;i<cfg.count;i++){
      const time=(i/cfg.count)*Math.PI*2/cfg.frequency;
      art.drawMotion(context,cfg.def.id,i*cfg.frameW+(cfg.frameW-w)/2,cfg.frameH-14-h,w,h,{
        time,state:state.value,flipX:flip.checked,reducedMotion:false
      });
    }
    sheet.toBlob(blob=>{
      if(!blob)return note('Could not create the sprite strip PNG.');
      downloadFile(blob,cfg.name+'-8frames.png');
      note('Exported 8-frame PNG sprite strip. Export Frame JSON for timing and coordinates.');
    },'image/png');
  });
  jsonButton.addEventListener('click',()=>{
    const cfg=sheetSpec();if(!cfg)return note('No character is loaded yet.');
    const frames=Array.from({length:cfg.count},(_,i)=>({
      filename:cfg.name+'-'+String(i+1).padStart(2,'0'),
      frame:{x:i*cfg.frameW,y:0,w:cfg.frameW,h:cfg.frameH},
      rotated:false,trimmed:false,
      duration:cfg.durationMs
    }));
    const payload={
      frames,
      meta:{
        app:'Knightfall Creator Foundry',version:'1',
        image:cfg.name+'-8frames.png',size:{w:cfg.frameW*cfg.count,h:cfg.frameH},
        format:'RGBA8888',scale:'1',
        originalArt:'Knightfall character concept; frames are pose transforms of a static illustration',
        character:cfg.def.id,motion:state.value,flipX:flip.checked,
        loopDurationMs:cfg.durationMs*cfg.count
      }
    };
    downloadFile(new Blob([JSON.stringify(payload,null,2)+'\n'],{type:'application/json'}),cfg.name+'-8frames.json');
    note('Frame JSON exported with coordinates and '+cfg.durationMs+' ms frame timing.');
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else if(playing)request();else render()});
  window.addEventListener('pagehide',()=>{stop();observer.disconnect()},{once:true});
  void (async()=>{
  try{
    art=await loadKnightfallArt();
    sprite.replaceChildren();
    for(const def of art.list()){
      const option=document.createElement('option');option.value=def.id;option.textContent=def.name;
      sprite.append(option);
    }
    sprite.value=art.has('bone-raccoon')?'bone-raccoon':art.list()[0]?.id||'';
    note('Ready: '+art.list().length+' original characters. Choose a pose or export a PNG.');
    render();if(playing)request();
  }catch(error){
    note('Motion preview unavailable: '+error.message);
    play.disabled=true;exportButton.disabled=true;
  }
  })();
}
