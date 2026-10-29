/* Hell & High Orbit original pixel overworld renderer.
   Uses the authoritative DOM tile state so offline and staging stay identical.
   No external assets, remote engine, or copyrighted sprite sheets. */
(() => {
  "use strict";
  const world = document.getElementById("world");
  if (!world) return;
  const canvas = document.createElement("canvas");
  canvas.id = "pixel-overworld";
  canvas.setAttribute("aria-hidden", "true");
  world.parentNode.insertBefore(canvas, world);
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) { canvas.remove(); return; }
  const TILE = 32, W = 16, H = 12;
  canvas.width = TILE * W; canvas.height = TILE * H;
  ctx.imageSmoothingEnabled = false;
  const fill = (x,y,w,h,c) => { ctx.fillStyle=c;ctx.fillRect(x,y,w,h); };
  const dot = (x,y,c,s=2) => fill(x,y,s,s,c);
  const hash = (x,y,k=0) => { let n=(x*374761393+y*668265263+k*1442695041)|0; n=Math.imul(n^(n>>>13),1274126177);return (n^(n>>>16))>>>0; };
  function ground(x,y,t) {
    const alien=t.classList.contains("zone-alien"), demon=t.classList.contains("zone-demon");
    const path=t.classList.contains("path"), stone=t.classList.contains("rock"), wall=t.classList.contains("wall");
    const base=path?"#bba078":stone?"#646879":wall?"#3a4055":alien?"#276779":demon?"#70405c":"#457c54";
    fill(x,y,32,32,base);
    if(path) {
      for(let i=0;i<7;i++){let h=hash(x,y,i),px=h%29,py=(h>>>9)%29;dot(x+px,y+py,i%2?"#d8b88b":"#957d65",2);}
    } else if(wall) {
      for(let row=0;row<4;row++){fill(x,y+row*8,32,1,"#202536");for(let col=(row%2)*8;col<32;col+=16)fill(x+col,y+row*8,1,8,"#242a3b");}
    } else if(stone) {
      fill(x+4,y+12,25,16,"#333b4c");fill(x+7,y+6,19,17,"#a0a3b2");fill(x+7,y+6,8,5,"#cbd0d8");fill(x+18,y+16,8,7,"#707789");
    } else {
      for(let i=0;i<9;i++){let h=hash(x,y,i),px=h%29,py=(h>>>10)%29;dot(x+px,y+py,alien?"#3e92a0":demon?"#965576":"#659760",i%3===0?3:2);}
      if(t.classList.contains("grass")) for(let i=0;i<4;i++){
        let px=x+3+i*8,py=y+14+(hash(x,y,i)%8);
        fill(px,py,2,9,alien?"#5ad6d8":demon?"#ee72b2":"#95d96a");
        fill(px-3,py+3,3,3,alien?"#42b8b9":demon?"#ca569b":"#76b95a");
        fill(px+2,py+1,3,3,alien?"#83f4e1":demon?"#ff9ecf":"#b0ed79");
      }
    }
    if(t.classList.contains("camp")) {
      fill(x+4,y+23,25,5,"#453a47");fill(x+6,y+15,20,10,"#a83f75");
      fill(x+9,y+10,14,15,"#ffd987");fill(x+14,y+16,5,9,"#5a3449");
      fill(x+11,y+8,10,4,"#ff79b5");
    }
    if(t.classList.contains("landmark")) {
      fill(x+9,y+22,15,7,"#1a1a2d");fill(x+12,y+9,9,15,"#d9ff72");
      fill(x+14,y+5,5,6,"#ff58ce");fill(x+14,y+12,4,8,"#427766");
    }
  }
  function character(x,y,variant=0) {
    const coat=variant===1?"#65e8f5":variant===2?"#caff45":"#ff58c8";
    fill(x+8,y+27,7,4,"#131522");fill(x+18,y+27,7,4,"#131522");
    fill(x+9,y+20,6,8,"#30365a");fill(x+18,y+20,6,8,"#30365a");
    fill(x+7,y+12,19,12,"#131525");fill(x+9,y+13,15,10,coat);
    fill(x+4,y+15,5,8,"#f2b69c");fill(x+25,y+15,4,8,"#f2b69c");
    fill(x+9,y+4,16,11,"#f2b69c");fill(x+8,y+3,18,5,"#1b1b30");
    fill(x+6,y+6,5,5,"#1b1b30");fill(x+23,y+6,4,5,"#1b1b30");
    fill(x+12,y+10,3,2,"#22243a");fill(x+20,y+10,3,2,"#22243a");
    fill(x+10,y+1,14,3,coat);
  }
  function npc(x,y) {
    fill(x+8,y+25,17,5,"#252238");fill(x+7,y+13,19,13,"#a6ee59");
    fill(x+10,y+5,13,11,"#c77ba8");fill(x+7,y+2,5,9,"#ff62c9");
    fill(x+22,y+1,5,10,"#ff62c9");fill(x+12,y+10,3,3,"#1b2031");fill(x+20,y+10,3,3,"#1b2031");
  }
  function render() {
    const cells=world.children;
    if(cells.length!==W*H)return;
    for(let i=0;i<cells.length;i++)ground((i%W)*TILE,Math.floor(i/W)*TILE,cells[i]);
    for(let i=0;i<cells.length;i++){
      const t=cells[i],x=(i%W)*TILE,y=Math.floor(i/W)*TILE;
      if(t.classList.contains("npc"))npc(x,y);
      if(t.classList.contains("other"))character(x,y,1);
      if(t.classList.contains("player"))character(x,y,0);
    }
  }
  let pending=false;
  const schedule=()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;render();});};
  const observer=new MutationObserver(schedule);
  observer.observe(world,{childList:true});
  schedule();
})();
