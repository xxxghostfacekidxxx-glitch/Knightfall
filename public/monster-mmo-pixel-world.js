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
  /* A genuine, self-contained explorable building interior, not another HUD panel. */
  const station=document.createElement("section");
  station.className="rpg-station";
  station.hidden=true;
  station.setAttribute("role","dialog");
  station.setAttribute("aria-modal","true");
  station.setAttribute("aria-label","Field station interior");
  const room=document.createElement("canvas");
  room.width=256;room.height=192;
  room.setAttribute("aria-hidden","true");
  const actions=document.createElement("div");
  actions.className="rpg-station-actions";
  const heal=document.createElement("button");
  heal.type="button";heal.textContent="✚ Heal Party";
  const exit=document.createElement("button");
  exit.type="button";exit.textContent="↩ Exit";
  actions.append(heal,exit);
  station.append(room,actions);
  canvas.parentNode.append(station);
  const roomCaption=document.createElement("p");
  roomCaption.className="rpg-station-caption";
  station.insertBefore(roomCaption,actions);
  const interiors={
    station:{title:"FIELD STATION",description:"Recovery pods are humming. Rest your creatures before heading out.",accent:"#caff45"},
    dish:{title:"GALACTIC SAUCER PARKING",description:"An alien customs checkpoint. The parking meters accept moon dust and threats.",accent:"#73e8e7"},
    tax:{title:"INFERNAL TAX CATHEDRAL",description:"A demonic filing office. Every form has seventeen signatures and one curse.",accent:"#ff74b6"},
    border:{title:"FUTURE TREATY OFFICE",description:"The proposed division of Earth is still being negotiated on a pizza box.",accent:"#f6df8d"}
  };
  let currentInterior="station";
  let stationPreviousFocus=null;
  function drawStation(){
    const c=room.getContext("2d");if(!c)return;
    c.imageSmoothingEnabled=false;
    const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h)};
    rect(0,0,256,192,"#283e4c");
    for(let x=0;x<256;x+=32)for(let y=0;y<192;y+=32){
      rect(x+1,y+1,30,30,(x/32+y/32)%2===0?"#7a8c88":"#849994");
    }
    rect(0,0,256,39,"#38465d");rect(0,36,256,5,"#182b3a");
    rect(12,9,232,21,"#f3e7c6");rect(24,15,208,9,"#3a5662");
    rect(94,13,68,13,"#ff73c3");rect(98,16,60,7,"#282b42");
    if(currentInterior!=="station"){
      const accent=interiors[currentInterior].accent;
      rect(18,50,220,99,"#2b3c4b");
      rect(23,55,210,89,"#4b5864");
      rect(28,60,200,79,"#d2c9b7");
      if(currentInterior==="dish"){
        // Alien customs terminal, hovering specimen and oversized inspection eye.
        rect(36,69,54,49,"#2a5968");rect(42,74,42,32,"#8ce9dc");
        rect(49,80,28,19,"#223c55");rect(58,84,10,10,"#ff78cf");
        rect(112,67,104,10,accent);rect(121,81,86,47,"#264e61");
        rect(130,89,68,27,"#8ce9dc");rect(147,95,34,15,"#243b55");
      }else if(currentInterior==="tax"){
        // Two columns of cursed paperwork and a fiery reception window.
        for(let i=0;i<4;i++){rect(34+i*47,70,32,54,"#513b54");rect(38+i*47,74,24,44,"#f4d8bb");}
        rect(72,61,112,12,accent);rect(106,86,44,36,"#392e4b");
        rect(112,90,32,24,"#ff9a60");rect(119,95,18,15,"#ffe59a");
      }else{
        // A treaty table and the notorious pizza-box map.
        rect(39,70,178,15,"#3c5263");rect(47,85,162,44,"#8d665a");
        rect(67,89,120,30,"#e8d5a1");rect(79,94,97,20,"#ffbd74");
        rect(123,94,6,20,"#ff6cae");rect(129,98,39,4,"#7be4df");
      }
      rect(105,172,46,20,"#35414b");rect(113,176,30,16,"#e7d7b8");
      return;
    }
    // Healing counter and monitor.
    rect(24,55,208,44,"#30465a");rect(28,59,200,35,"#e4d9c5");
    rect(97,45,62,32,"#23394c");rect(105,50,46,20,"#8ee6d8");
    rect(124,52,8,16,"#ff77c4");rect(120,56,16,8,"#ff77c4");
    rect(28,94,200,9,"#583e59");
    // Creature recovery pods.
    for(let i=0;i<3;i++){const x=45+i*70;rect(x,111,35,38,"#263e52");rect(x+4,114,27,25,"#93dfe1");rect(x+9,118,17,13,"#d2ff7c");rect(x+11,139,13,6,"#ff7ac8");}
    // Doorway and floor shadow.
    rect(105,172,46,20,"#35414b");rect(113,176,30,16,"#e7d7b8");
    rect(116,157,24,14,"#2d2b43");rect(121,149,14,12,"#ff7ac8");
    rect(125,154,5,5,"#f6c3a5");
  }
  function closeStation(){
    if(station.hidden)return;
    station.hidden=true;document.body.classList.remove("interior-open");
    (stationPreviousFocus?.isConnected?stationPreviousFocus:document.getElementById("world-interact"))?.focus();
    stationPreviousFocus=null;
  }
  document.addEventListener("hell-high-orbit:enter-station",e=>{
    if(document.body.classList.contains("pause-open")||document.body.classList.contains("dialogue-open")||!document.getElementById("battle-panel")?.hidden)return;
    currentInterior=Object.hasOwn(interiors,e.detail?.kind)?e.detail.kind:"station";
    station.setAttribute("aria-label",interiors[currentInterior].title);
    roomCaption.textContent=interiors[currentInterior].title+" · "+interiors[currentInterior].description;
    heal.hidden=currentInterior!=="station";
    stationPreviousFocus=document.activeElement;station.hidden=false;
    document.body.classList.add("interior-open");drawStation();
    (heal.hidden?exit:heal).focus();
  });
  heal.addEventListener("click",()=>{
    document.dispatchEvent(new CustomEvent("hell-high-orbit:station-heal"));
    heal.textContent="✚ Healing requested";
    setTimeout(()=>{heal.textContent="✚ Heal Party"},1300);
  });
  exit.addEventListener("click",closeStation);
  document.addEventListener("keydown",e=>{
    if(station.hidden)return;
    if(e.key==="Escape"){e.preventDefault();e.stopImmediatePropagation();closeStation()}
    else if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","w","a","s","d"].includes(e.key)){e.preventDefault();e.stopImmediatePropagation()}
    else if(e.key==="Tab"){
      if(!heal.hidden&&e.shiftKey&&document.activeElement===heal){e.preventDefault();exit.focus()}
      else if(!heal.hidden&&!e.shiftKey&&document.activeElement===exit){e.preventDefault();heal.focus()}
    }
  },true);
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
    /* Original faction terrain props: readable silhouettes on a 32px tile grid. */
    const prop=hash(x/32,y/32,17)%19;
    if(!path&&!stone&&!wall&&!t.classList.contains("camp")&&!t.classList.contains("landmark")){
      if(prop===0||prop===1){
        const trunk=alien?"#255963":demon?"#493048":"#5b4b38";
        const leaf=alien?"#7ae7d9":demon?"#e87bab":"#9cce6b";
        fill(x+14,y+17,5,12,trunk);fill(x+8,y+10,17,11,leaf);
        fill(x+11,y+5,12,8,alien?"#b2ffde":demon?"#ffadd8":"#c8e98c");
        fill(x+8,y+15,4,6,alien?"#3b8c91":demon?"#8b456f":"#568754");
      }else if(prop===2){
        fill(x+7,y+22,18,5,"#2c3b43");fill(x+10,y+14,12,9,alien?"#79dfeb":demon?"#c69cdd":"#a6b3ad");
        fill(x+12,y+11,8,5,alien?"#c4fff6":demon?"#ffcae5":"#e6e4c8");
      }else if(prop===3){
        const blossom=alien?"#7cf5ee":demon?"#ff7bc9":"#ffdf83";
        for(let i=0;i<3;i++){const px=x+6+i*8;fill(px,y+19,2,9,"#477c55");fill(px-2,y+17,6,4,blossom);}
      }else if(prop===4&&alien){
        fill(x+12,y+14,9,14,"#304f65");fill(x+9,y+8,15,9,"#8af0d6");fill(x+13,y+3,7,6,"#ff7fda");
        dot(x+15,y+11,"#16374a",3);
      }else if(prop===5&&demon){
        fill(x+12,y+16,9,12,"#423449");fill(x+8,y+8,17,11,"#f48cb2");
        fill(x+9,y+4,5,8,"#e45a91");fill(x+20,y+4,5,8,"#e45a91");
        fill(x+15,y+12,3,3,"#22273a");
      }
    }
    /* Distinct roadside scenery and settlement silhouettes, drawn from original pixels. */
    if(path&&!t.classList.contains("camp")&&!t.classList.contains("landmark")){
      const h=hash(x/32,y/32,29);
      if(h%13===0){ // route signpost
        fill(x+13,y+10,4,19,"#513d38");
        fill(x+7,y+8,18,9,"#eee1a9");
        fill(x+9,y+10,13,2,"#694b4a");
        fill(x+10,y+13,9,2,"#92705a");
      }else if(h%17===0){ // trail lamp
        fill(x+14,y+12,4,17,"#354a50");
        fill(x+10,y+8,12,7,"#d4ef9e");
        fill(x+12,y+6,8,3,"#263d48");
      }
    }
    if(t.classList.contains("camp")) {
      // Field station: roof, lit door, sign and a healing beacon.
      fill(x+2,y+25,28,5,"#374653");
      fill(x+4,y+12,24,15,"#e7d7b8");
      fill(x+2,y+9,28,6,"#9d4c81");
      fill(x+6,y+15,7,7,"#75c5d0");
      fill(x+19,y+15,6,7,"#75c5d0");
      fill(x+13,y+19,6,8,"#51394e");
      fill(x+13,y+5,6,7,"#caff45");
      fill(x+15,y+3,2,11,"#ff74bf");
      fill(x+11,y+7,10,3,"#caff45");
    }
    if(t.classList.contains("landmark")) {
      if(alien){ // grounded satellite dish
        fill(x+8,y+25,18,5,"#27384c");fill(x+14,y+13,4,13,"#8adce0");
        fill(x+7,y+6,18,10,"#9df2e5");fill(x+10,y+9,13,5,"#305a70");
        fill(x+16,y+4,3,8,"#ff80d4");
      }else if(demon){ // infernal courthouse
        fill(x+4,y+22,24,8,"#302a42");fill(x+6,y+11,20,13,"#bc688f");
        fill(x+4,y+8,24,5,"#3e304c");fill(x+8,y+4,5,8,"#e87aab");
        fill(x+20,y+4,5,8,"#e87aab");fill(x+14,y+15,5,9,"#ffe4a8");
      }else{ // disputed treaty monument
        fill(x+6,y+23,20,7,"#303d4b");fill(x+11,y+10,11,15,"#e3e8c0");
        fill(x+14,y+5,5,8,"#ff7cc8");fill(x+12,y+13,7,4,"#caff45");
      }
    }
  }
  let facing="down", step=0, previousCell=-1, walkFrame=0;
  document.addEventListener("keydown",e=>{const d={ArrowUp:"up",ArrowDown:"down",ArrowLeft:"left",ArrowRight:"right",w:"up",a:"left",s:"down",d:"right"}[e.key];if(d&&!document.body.classList.contains("pause-open")&&!document.body.classList.contains("dialogue-open"))facing=d;});
  document.querySelectorAll("[data-move]").forEach(button=>button.addEventListener("click",()=>{facing=button.dataset.move;}));
  function character(x,y,variant=0) {
    const coat=variant===1?"#65e8f5":variant===2?"#caff45":"#ff58c8";
    const stride=variant===0&&walkFrame>0?(step%2?2:0):0;
    fill(x+8,y+27-stride,7,4,"#131522");fill(x+18,y+27-(2-stride),7,4,"#131522");
    fill(x+9,y+20,6,8,"#30365a");fill(x+18,y+20,6,8,"#30365a");
    fill(x+7,y+12,19,12,"#131525");fill(x+9,y+13,15,10,coat);
    fill(x+4,y+15,5,8,"#f2b69c");fill(x+25,y+15,4,8,"#f2b69c");
    fill(x+9,y+4,16,11,"#f2b69c");fill(x+8,y+3,18,5,"#1b1b30");
    fill(x+6,y+6,5,5,"#1b1b30");fill(x+23,y+6,4,5,"#1b1b30");
    if(variant!==0||facing!=="up"){
      if(facing==="left"&&variant===0){fill(x+10,y+10,3,2,"#22243a");}
      else if(facing==="right"&&variant===0){fill(x+21,y+10,3,2,"#22243a");}
      else{fill(x+12,y+10,3,2,"#22243a");fill(x+20,y+10,3,2,"#22243a");}
    }else{fill(x+12,y+7,11,5,"#252039");}
    fill(x+10,y+1,14,3,coat);
  }
  function npc(x,y,variant=0) {
    const coat=variant===1?"#b25b87":variant===2?"#6cd7c8":"#a6ee59";
    const face=variant===1?"#e89db8":variant===2?"#8ce5df":"#c77ba8";
    fill(x+8,y+25,17,5,"#252238");fill(x+7,y+13,19,13,coat);
    fill(x+10,y+5,13,11,face);fill(x+7,y+2,5,9,variant===2?"#83f9e6":"#ff62c9");
    fill(x+22,y+1,5,10,variant===2?"#83f9e6":"#ff62c9");
    fill(x+12,y+10,3,3,"#1b2031");fill(x+20,y+10,3,3,"#1b2031");
    if(variant===1){fill(x+13,y+16,8,6,"#352a4e");fill(x+16,y+18,2,5,"#e8e3b3");}
    if(variant===2){fill(x+10,y+3,13,3,"#2b6675");fill(x+13,y+1,7,3,"#ff81ce");}
  }
  /* Keep exploration discovery independent of the server's battle/save schema. */
  const discoveryKey="ashfall:hell-high-orbit:explored-v1";
  let explored=new Set();
  try{
    const stored=JSON.parse(localStorage.getItem(discoveryKey)||"[]");
    if(Array.isArray(stored))explored=new Set(stored.filter(i=>Number.isInteger(i)&&i>=0&&i<W*H));
  }catch{}
  let lastDiscovered=-1;
  function discover(index){
    if(index<0||index===lastDiscovered)return;
    lastDiscovered=index;
    const x=index%W,y=Math.floor(index/W);
    for(let oy=-2;oy<=2;oy++)for(let ox=-2;ox<=2;ox++){
      if(Math.abs(ox)+Math.abs(oy)>3)continue;
      const px=x+ox,py=y+oy;
      if(px>=0&&px<W&&py>=0&&py<H)explored.add(py*W+px);
    }
    try{localStorage.setItem(discoveryKey,JSON.stringify([...explored]))}catch{}
  }
  const regionMap=document.getElementById("game-region-map");
  const mapCtx=regionMap?.getContext("2d");
  if(mapCtx)mapCtx.imageSmoothingEnabled=false;
  function renderRegionMap(cells,playerIndex){
    if(!mapCtx)return;
    const unit=24;
    mapCtx.clearRect(0,0,384,288);
    for(let i=0;i<cells.length;i++){
      const t=cells[i],x=(i%W)*unit,y=Math.floor(i/W)*unit;
      if(!explored.has(i)){
        mapCtx.fillStyle="#172530";mapCtx.fillRect(x,y,unit,unit);
        mapCtx.fillStyle="#253542";mapCtx.fillRect(x+9,y+9,6,6);
        continue;
      }
      const zone=t.classList.contains("zone-alien")?"#397d84":t.classList.contains("zone-demon")?"#9b537d":"#719b66";
      const color=t.classList.contains("wall")?"#263b50":t.classList.contains("rock")?"#70778a":t.classList.contains("path")?"#d6ba8c":zone;
      mapCtx.fillStyle=color;mapCtx.fillRect(x,y,unit,unit);
      mapCtx.strokeStyle="#182b3150";mapCtx.strokeRect(x+.5,y+.5,unit-1,unit-1);
      if(t.classList.contains("camp")){mapCtx.fillStyle="#fff0b4";mapCtx.fillRect(x+7,y+7,10,10);}
      if(t.classList.contains("landmark")){
        mapCtx.fillStyle="#1e273b";mapCtx.fillRect(x+6,y+5,12,14);
        mapCtx.fillStyle="#f5ff84";mapCtx.fillRect(x+9,y+8,6,8);
      }
    }
    if(playerIndex>=0){
      const x=(playerIndex%W)*unit+12,y=Math.floor(playerIndex/W)*unit+12;
      mapCtx.fillStyle="#101f29";mapCtx.fillRect(x-8,y-8,16,16);
      mapCtx.fillStyle="#ff7bc8";mapCtx.fillRect(x-5,y-5,10,10);
      mapCtx.fillStyle="#ffffff";mapCtx.fillRect(x-2,y-2,4,4);
    }
    const label=document.getElementById("game-map-location");
    if(label&&playerIndex>=0){
      const tile=cells[playerIndex],x=playerIndex%W+1,y=Math.floor(playerIndex/W)+1;
      label.textContent="Trainer: "+String(x).padStart(2,"0")+", "+String(y).padStart(2,"0")+" · "+(tile.classList.contains("zone-alien")?"Alien territory":tile.classList.contains("zone-demon")?"Infernal territory":"Contested territory")+" · Map discovered: "+Math.round(explored.size/(W*H)*100)+"%";
    }
  }
  function render() {
    const cells=world.children;
    if(cells.length!==W*H)return;
    for(let i=0;i<cells.length;i++)ground((i%W)*TILE,Math.floor(i/W)*TILE,cells[i]);
    const playerIndex=Array.from(cells).findIndex(t=>t.classList.contains("player"));
    if(playerIndex>=0&&previousCell>=0&&playerIndex!==previousCell){
      const dx=playerIndex%W-previousCell%W,dy=Math.floor(playerIndex/W)-Math.floor(previousCell/W);
      if(dx===1)facing="right";else if(dx===-1)facing="left";else if(dy===1)facing="down";else if(dy===-1)facing="up";
      step++;walkFrame=3;
    }
    if(playerIndex>=0){previousCell=playerIndex;discover(playerIndex);}
    renderRegionMap(cells,playerIndex);
    for(let i=0;i<cells.length;i++){
      const t=cells[i],x=(i%W)*TILE,y=Math.floor(i/W)*TILE;
      if(t.classList.contains("npc"))npc(x,y,t.classList.contains("zone-demon")?1:t.classList.contains("zone-alien")?2:0);
      if(t.classList.contains("other"))character(x,y,1);
      if(t.classList.contains("player")){fill(x+8,y+29,18,2,"#192b2b");character(x,y,0);}
    }
    if(walkFrame>0){walkFrame--;if(walkFrame>0)requestAnimationFrame(schedule);}
  }
  let pending=false;
  const schedule=()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;render();});};
  const observer=new MutationObserver(schedule);
  observer.observe(world,{childList:true});
  schedule();
})();
