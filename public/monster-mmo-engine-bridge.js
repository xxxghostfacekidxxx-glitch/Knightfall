/* Optional Phaser-powered ambient world layer.
   Runtime is vendored by .github/workflows/install-monster-visual-engine.yml.
   World state, collisions and multiplayer remain owned by monster-mmo.js.
   If Phaser is unavailable, the original Canvas renderer remains fully playable. */
(()=>{"use strict";
 const world=document.getElementById("pixel-overworld");
 if(!world)return;
 const host=world.parentElement;
 if(!host)return;
 const script=document.createElement("script");
 script.src="/vendor/phaser/phaser.min.js";
 script.async=true;
 script.onload=()=>{
  if(!window.Phaser||!world.isConnected)return;
  const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(reduced)return;
  const width=world.width||512,height=world.height||384;
  const layer=document.createElement("div");
  layer.id="hell-orbit-ambient-layer";
  layer.setAttribute("aria-hidden","true");
  layer.style.cssText="position:absolute;pointer-events:none;z-index:2;overflow:hidden";
  host.append(layer);
  host.style.position="relative";
  const sync=()=>{
   const a=world.getBoundingClientRect(),b=host.getBoundingClientRect();
   layer.style.left=a.left-b.left+"px";layer.style.top=a.top-b.top+"px";
   layer.style.width=a.width+"px";layer.style.height=a.height+"px";
  };
  const observer=new ResizeObserver(sync);
  observer.observe(world);sync();
  const P=window.Phaser;
  const game=new P.Game({
   type:P.CANVAS,parent:layer,width,height,transparent:true,
   render:{pixelArt:true,antialias:false},
   scale:{mode:P.Scale.RESIZE,width,height},
   audio:{noAudio:true},
   scene:{create(){
    const graphics=this.add.graphics();
    let last=0;
    this.events.on("update",time=>{
     if(time-last<75)return;last=time;
     graphics.clear();
     const region=document.getElementById("world")?.dataset.region||"meadow";
     const colors={meadow:0xf6f1a0,orbit:0x8dfbea,inferno:0xffa47c,border:0xf7a4e8};
     const color=colors[region]||colors.meadow;
     for(let i=0;i<16;i++){
      const seed=i*79.31,px=(seed*7+time*(i%3+1)*0.008)%width;
      const py=(seed*11-time*(i%4+1)*0.012+height*100)%height;
      graphics.fillStyle(color,i%4===0?.55:.24);
      graphics.fillRect(Math.floor(px),Math.floor(py),i%3===0?3:2,2);
     }
    });
   }}
  });
  document.addEventListener("visibilitychange",()=>{if(document.hidden)game.scene.pause();else game.scene.resume();});
 };
 script.onerror=()=>{}; // Offline builds without the optional vendor binary stay playable.
 document.head.append(script);
})();
