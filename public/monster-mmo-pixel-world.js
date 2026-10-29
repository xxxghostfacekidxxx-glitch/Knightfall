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
  const inspect=document.createElement("button");
  inspect.type="button";inspect.textContent="✦ Inspect";
  const exit=document.createElement("button");
  exit.type="button";exit.textContent="↩ Exit";
  actions.append(heal,inspect,exit);
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
  const inspectNotes={
    station:"The recovery pods have stickers reading 'NO REFUNDS AFTER RESURRECTION.'",
    dish:"CUSTOMS NOTICE: Earth has been classified as a hazardous snack planet. Please declare all humans.",
    tax:"INFERNAL FORM 666-B: Your soul is not taxable unless sold in a bundled family plan.",
    border:"The treaty divides Earth into two territories and gives humanity a single complaint mailbox."
  };
  const visitKey="ashfall:hell-high-orbit:interior-stamps-v1";
  let interiorStamps=new Set();
  try{const saved=JSON.parse(localStorage.getItem(visitKey)||"[]");if(Array.isArray(saved))interiorStamps=new Set(saved.filter(id=>Object.hasOwn(interiors,id)))}catch{}
  function renderInteriorJournal(){
    const progress=document.getElementById("interior-journal-progress");
    const entries=document.getElementById("interior-journal-entries");
    if(progress)progress.textContent=interiorStamps.size+" / "+Object.keys(interiors).length+" locations inspected";
    if(!entries)return;
    entries.replaceChildren();
    for(const [kind,info] of Object.entries(interiors)){
      const item=document.createElement("div");
      item.className="interior-journal-entry"+(interiorStamps.has(kind)?" is-discovered":"");
      item.textContent=(interiorStamps.has(kind)?"✓ ":"◇ ")+(interiorStamps.has(kind)?info.title:"Unknown location");
      entries.append(item);
    }
  }
  renderInteriorJournal();
  document.addEventListener("hell-high-orbit:reset-exploration",()=>{
    interiorStamps.clear();
    try{localStorage.removeItem(visitKey)}catch{}
    renderInteriorJournal();
  });
  function recordVisit(kind){
    if(interiorStamps.has(kind))return false;
    interiorStamps.add(kind);
    renderInteriorJournal();
    try{localStorage.setItem(visitKey,JSON.stringify([...interiorStamps]))}catch{}
    document.dispatchEvent(new CustomEvent("hell-high-orbit:interior-discovered",{detail:{kind,visited:interiorStamps.size,total:Object.keys(interiors).length}}));
    return true;
  }

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
    inspect.textContent=interiorStamps.has(currentInterior)?"✦ Inspect again":"✦ Inspect";
    stationPreviousFocus=document.activeElement;station.hidden=false;
    document.body.classList.add("interior-open");drawStation();
    (heal.hidden?exit:heal).focus();
  });
  heal.addEventListener("click",()=>{
    if(heal.disabled)return;
    heal.disabled=true;heal.textContent="✚ Healing…";
    document.dispatchEvent(new CustomEvent("hell-high-orbit:station-heal"));
  });
  document.addEventListener("hell-high-orbit:station-heal-result",e=>{
    heal.disabled=false;
    heal.textContent=e.detail?.success?"✚ Party Restored":"✚ Retry Healing";
    if(!station.hidden&&currentInterior==="station"){
      roomCaption.textContent=e.detail?.success?"FIELD STATION · Your creatures have been restored.":"FIELD STATION · Healing failed. Check the game message and retry.";
    }
  });
  inspect.addEventListener("click",()=>{
    const first=recordVisit(currentInterior);
    roomCaption.textContent=inspectNotes[currentInterior]+(first?" · New field journal stamp!":"");
    inspect.textContent="✦ Inspect again";
  });
  exit.addEventListener("click",closeStation);
  document.addEventListener("keydown",e=>{
    if(station.hidden)return;
    if(e.key==="Escape"){e.preventDefault();e.stopImmediatePropagation();closeStation()}
    else if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","w","a","s","d"].includes(e.key)){e.preventDefault();e.stopImmediatePropagation()}
    else if(e.key==="Tab"){
      const controls=[heal,inspect,exit].filter(button=>!button.hidden);
      const index=controls.indexOf(document.activeElement);
      if(index>=0){e.preventDefault();controls[(index+(e.shiftKey?-1:1)+controls.length)%controls.length].focus()}
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
      // Interlocking cobbles and compact path borders make routes read as real terrain.
      fill(x,y,32,2,"#e3c79b");fill(x,y+30,32,2,"#8c755f");
      for(let row=0;row<4;row++){
        fill(x,y+row*8+4,32,1,"#9c8269");
        for(let col=(row%2)*8;col<32;col+=16)fill(x+col,y+row*8+4,1,5,"#ad9171");
      }
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
    // Original layered micro-biomes: little details make routes feel hand-authored.
    // Deterministic per tile: no flickering when the DOM redraws after movement.
    if(!path&&!wall&&!stone&&!t.classList.contains("camp")&&!t.classList.contains("landmark")){
      const seed=hash(x/32,y/32,71);
      if(seed%7===0){
        // Grass tufts with highlights and a darker footprint.
        fill(x+7,y+25,18,2,alien?"#1c5667":demon?"#4b2c52":"#365e41");
        for(let k=0;k<3;k++){
          const ox=x+7+k*6,oy=y+19-(k%2)*4;
          fill(ox,oy,2,8,alien?"#74f2e7":demon?"#f87eb7":"#b1e877");
          fill(ox+2,oy+3,2,5,alien?"#3199b1":demon?"#a64d86":"#6ca75a");
        }
      }
      if(seed%11===0){
        // Faction-specific mushrooms, crystal clusters and ember flowers.
        const px=x+17,py=y+14;
        if(alien){
          fill(px,py+8,3,9,"#225a73");
          fill(px-5,py+3,13,7,"#82f5e6");
          fill(px-2,py,7,4,"#f2a3ed");
          fill(px+1,py+4,3,3,"#f9f8d6");
        }else if(demon){
          fill(px,py+7,3,10,"#49334c");
          fill(px-4,py+3,11,6,"#f58ab6");
          fill(px-1,py-1,5,6,"#ffbf82");
          fill(px+1,py+5,2,3,"#fff1c0");
        }else{
          fill(px,py+7,2,11,"#3c7351");
          for(let k=0;k<4;k++)fill(px+(k%2?3:-3),py+(k>1?7:2),4,4,k%2?"#ffb1e1":"#fff0a4");
          fill(px,py+4,3,3,"#ff6ac2");
        }
      }
      if(seed%17===0){
        // A few tiny critter tracks and world-story clues.
        for(let k=0;k<3;k++){
          const ox=x+5+k*7,oy=y+7+(k%2)*4;
          fill(ox,oy,3,2,alien?"#8ad3e3":demon?"#a87393":"#b3b48c");
          fill(ox+1,oy-2,1,2,alien?"#8ad3e3":demon?"#a87393":"#b3b48c");
        }
      }
    }
    if(t.classList.contains("route-gate")){
      fill(x+4,y+25,24,5,"#273c48");
      fill(x+14,y+9,4,19,"#c8dba1");
      fill(x+7,y+7,18,9,"#fff1b5");
      fill(x+10,y+10,12,3,"#b65c94");
    }
    /* Original faction terrain props: readable silhouettes on a 32px tile grid. */
    const prop=hash(x/32,y/32,17)%19;
    if(!path&&!stone&&!wall&&!t.classList.contains("camp")&&!t.classList.contains("landmark")){
      if(prop===0||prop===1){
        // Layered canopy, shadow, and distinct regional vegetation.
        fill(x+6,y+26,22,4,"#233b39");
        fill(x+11,y+19,14,6,alien?"#306c74":demon?"#5a3852":"#3f6940");
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
      // Regional architectural identity: saucer clinic, demon infirmary or frontier shelter.
      if(alien){
        fill(x+2,y+10,28,4,"#66c7d2");fill(x+7,y+6,18,5,"#b0fff1");
        fill(x+11,y+3,10,4,"#294d67");fill(x+14,y+1,4,4,"#ff78c6");
        fill(x+6,y+16,7,5,"#173f57");fill(x+20,y+16,6,5,"#173f57");
      }else if(demon){
        fill(x+2,y+9,28,5,"#552e52");fill(x+4,y+4,7,7,"#e46d99");
        fill(x+21,y+4,7,7,"#e46d99");fill(x+13,y+3,6,7,"#ffb0c9");
        fill(x+15,y+20,3,6,"#ffde9e");
      }else{
        fill(x+2,y+9,28,4,"#61435e");fill(x+5,y+6,22,4,"#ff88bc");
        fill(x+10,y+14,12,3,"#fffae2");
        fill(x+12,y+16,8,2,"#caff45");
      }
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
    if(variant===0){
      // Trainer silhouette: directional backpack, side-facing profile and walking arms.
      const moving=walkFrame>0,arm=moving?(step%2?2:-2):0;
      if(facing==="up"){
        fill(x+10,y+13,14,12,"#202d45");fill(x+12,y+15,10,8,"#d0d85c");
        fill(x+15,y+17,4,4,"#ff65c4");
      }else if(facing==="left"||facing==="right"){
        const bx=facing==="left"?x+20:x+5;
        fill(bx,y+14,7,12,"#223047");fill(bx+1,y+16,5,7,"#caff45");
        const fx=facing==="left"?x+8:x+23;
        fill(fx,y+16+arm,4,7,"#f2b69c");
      }else{
        fill(x+9,y+15+arm,4,8,"#f2b69c");
        fill(x+22,y+15-arm,4,8,"#f2b69c");
        fill(x+12,y+12,10,3,"#ffb5df");
      }
      fill(x+10,y+2,14,2,"#caff45");
    }
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
  let regionId="meadow";
  document.addEventListener("hell-high-orbit:region-changed",e=>{
    const next=e.detail?.region;
    if(typeof next!=="string"||!/^(meadow|orbit|inferno|border)$/.test(next))return;
    regionId=next;previousCell=-1;walkFrame=0;loadExplored();schedule();
  });
  const discoveryKey="ashfall:hell-high-orbit:explored-v2";
  const regionDiscoveryKey=()=>discoveryKey+":"+regionId;
  let explored=new Set();
  let lastDiscovered=-1;
  function loadExplored(){
    explored=new Set();
    try{
      const stored=JSON.parse(localStorage.getItem(regionDiscoveryKey())||"[]");
      if(Array.isArray(stored))explored=new Set(stored.filter(i=>Number.isInteger(i)&&i>=0&&i<W*H));
    }catch{}
    lastDiscovered=-1;
  }
  loadExplored();
  document.addEventListener("hell-high-orbit:reset-exploration",()=>{
    explored.clear();lastDiscovered=-1;regionId="meadow";
    try{for(const id of ["meadow","orbit","inferno","border"])localStorage.removeItem(discoveryKey+":"+id)}catch{}
  });
  function discover(index){
    if(index<0||index===lastDiscovered)return;
    lastDiscovered=index;
    const x=index%W,y=Math.floor(index/W);
    for(let oy=-2;oy<=2;oy++)for(let ox=-2;ox<=2;ox++){
      if(Math.abs(ox)+Math.abs(oy)>3)continue;
      const px=x+ox,py=y+oy;
      if(px>=0&&px<W&&py>=0&&py<H)explored.add(py*W+px);
    }
    try{localStorage.setItem(regionDiscoveryKey(),JSON.stringify([...explored]))}catch{}
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
      if(t.classList.contains("route-gate")){
        mapCtx.fillStyle="#f6df8d";mapCtx.fillRect(x+8,y+8,8,8);
      }
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
      const regionNames={meadow:"Cinder Meadow",orbit:"Orbitfall Approach",inferno:"Ashen Toll Road",border:"Treaty Crossing"};
      label.textContent=(regionNames[regionId]||"Cinder Meadow")+" · Trainer: "+String(x).padStart(2,"0")+", "+String(y).padStart(2,"0")+" · Map discovered: "+Math.round(explored.size/(W*H)*100)+"%";
    }
  }
  // Presentation-only tween. The DOM remains authoritative for collisions and networking.
  // Short moves interpolate visually; teleports and region transitions snap immediately.
  const reducedMotion=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches||false;
  let motion=null;
  function render() {
    const now=performance.now();
    const current=world.dataset.region||"meadow";
    if(current!==regionId&&/^(meadow|orbit|inferno|border)$/.test(current)){
      regionId=current;previousCell=-1;walkFrame=0;motion=null;loadExplored();
    }
    const cells=world.children;
    if(cells.length!==W*H)return;
    for(let i=0;i<cells.length;i++)ground((i%W)*TILE,Math.floor(i/W)*TILE,cells[i]);
    const playerIndex=Array.from(cells).findIndex(t=>t.classList.contains("player"));
    if(playerIndex>=0&&previousCell>=0&&playerIndex!==previousCell){
      const dx=playerIndex%W-previousCell%W,dy=Math.floor(playerIndex/W)-Math.floor(previousCell/W);
      if(dx===1)facing="right";else if(dx===-1)facing="left";else if(dy===1)facing="down";else if(dy===-1)facing="up";
      step++;walkFrame=3;
      const distance=Math.abs(dx)+Math.abs(dy);
      motion=!reducedMotion&&distance===1?{from:previousCell,to:playerIndex,start:now,duration:145}:null;
    }
    if(playerIndex>=0){previousCell=playerIndex;discover(playerIndex);}
    renderRegionMap(cells,playerIndex);
    for(let i=0;i<cells.length;i++){
      const t=cells[i],x=(i%W)*TILE,y=Math.floor(i/W)*TILE;
      if(t.classList.contains("npc"))npc(x,y,t.classList.contains("zone-demon")?1:t.classList.contains("zone-alien")?2:0);
      if(t.classList.contains("other"))character(x,y,1);
      if(t.classList.contains("player")){
        let px=x,py=y;
        if(motion&&motion.to===i){
          const p=Math.min(1,(now-motion.start)/motion.duration);
          const smooth=p*p*(3-2*p);
          px=((motion.from%W)*(1-smooth)+(i%W)*smooth)*TILE;
          py=((Math.floor(motion.from/W))*(1-smooth)+Math.floor(i/W)*smooth)*TILE;
          if(p>=1)motion=null;
        }
        // A soft grounded shadow and a warm rim highlight, drawn below the trainer.
        fill(px+7,py+28,20,4,"#192a36");
        fill(px+10,py+29,14,2,"#334c55");
        character(px,py,0);
      }
    }
    if(motion||walkFrame>0){if(walkFrame>0)walkFrame--;requestAnimationFrame(schedule);}
  }
  let pending=false;
  const schedule=()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;render();});};
  const observer=new MutationObserver(schedule);
  observer.observe(world,{childList:true});
  schedule();
})();
