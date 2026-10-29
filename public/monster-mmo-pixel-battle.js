/* Original 2D pixel battle stage for Hell & High Orbit. Offline-safe. */
(() => {
 "use strict";
 const panel=document.getElementById("battle-panel"),battle=document.getElementById("battle");
 if(!panel||!battle)return;
 const canvas=document.createElement("canvas");canvas.id="pixel-battle";canvas.width=384;canvas.height=208;canvas.setAttribute("aria-hidden","true");
 battle.before(canvas);
 const c=canvas.getContext("2d",{alpha:false});if(!c){canvas.remove();return;}
 c.imageSmoothingEnabled=false;
 const fill=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
 const hash=str=>{let h=2166136261;for(const ch of str){h=Math.imul(h^ch.charCodeAt(0),16777619);}return h>>>0;};
 const palette={grass:["#89d65a","#296c4d"],fire:["#ff855d","#a83365"],water:["#61d7e8","#3265b6"],ghost:["#b99aff","#55488e"],thorn:["#e979ae","#7e355d"],electric:["#e9f766","#9b5da6"],stone:["#a8a6b9","#5c566c"],air:["#b5d8fc","#6a79b0"],cosmic:["#88ffd2","#5369b3"]};
 function creature(x,y,id,type,back=false){
  const seed=hash(id),colors=palette[type]||palette.cosmic,skin=colors[0],shade=colors[1],accent=seed%2?"#ff69c9":"#d5ff6b";
  const px=(dx,dy,w,h,col)=>fill(x+dx,y+dy,w,h,col);
  // Each species has a deterministic pixel silhouette, horn configuration, markings and eyes.
  px(5,51,61,7,"#233047");
  const wing=(seed>>>4)%3===0;
  if(wing){px(-9,13,19,27,shade);px(61,13,19,27,shade);px(-4,9,13,14,accent);px(62,9,13,14,accent);}
  const horn=(seed>>>2)%4;
  if(horn===0){px(12,-3,9,24,accent);px(48,-7,9,28,accent);}
  else if(horn===1){px(5,2,14,17,shade);px(51,2,14,17,shade);}
  else if(horn===2){px(27,-8,14,22,accent);}
  else{px(11,0,8,13,accent);px(53,0,8,13,accent);px(13,-6,4,8,shade);}
  px(8,19,57,34,shade);px(14,13,45,38,skin);px(17,48,12,13,shade);px(44,48,12,13,shade);
  for(let i=0;i<4;i++)if((seed>>>(i+8))&1)px(18+i*10,17+(i%2)*8,5,6,accent);
  if(back){px(25,20,24,18,shade);px(31,25,12,8,accent);}
  else{
   const eyes=(seed>>>6)%3===0?3:2;
   if(eyes===3){px(17,29,8,10,"#171728");px(32,24,9,12,"#171728");px(49,29,8,10,"#171728");}
   else{px(20,26,11,13,"#171728");px(45,26,11,13,"#171728");}
   px(24,29,4,4,"#fff");px(48,29,4,4,"#fff");
   px(32,42,15,4,"#1b1c30");px(35,42,3,7,"#f6e6f4");px(42,42,3,7,"#f6e6f4");
  }
 }
 function stage(enemy,lead){
  fill(0,0,384,208,"#1b3154");
  for(let i=0;i<15;i++){const x=(i*97)%384,y=(i*43)%92;fill(x,y,2,2,i%2?"#a6d9ef":"#ff8ee1");}
  fill(0,108,384,100,"#648b75");fill(0,131,384,77,"#86a883");
  for(let i=0;i<24;i++)fill((i*59)%384,138+(i*23)%68,7,2,i%2?"#759d79":"#b5bd91");
  fill(219,102,140,13,"#355f68");fill(230,93,119,16,"#acc2a2");fill(23,176,149,12,"#395b62");fill(34,164,127,15,"#a3b69b");
  if(!window.HellOrbitSprites?.draw(c,enemy.id,256,28,80,Math.floor(performance.now()/260)%4))creature(260,34,enemy.id,enemy.type);
  if(!window.HellOrbitSprites?.draw(c,lead.id,49,105,80,Math.floor(performance.now()/330)%4,true))creature(58,110,lead.id,lead.type,true);
  fill(8,8,153,40,"#172339");fill(11,11,147,34,"#f7efdc");
  fill(219,151,155,46,"#172339");fill(222,154,149,40,"#f7efdc");
  c.font="bold 10px monospace";c.fillStyle="#252238";
  c.fillText(enemy.name.slice(0,21)+"  Lv"+enemy.level,17,24);
  c.fillText(lead.name.slice(0,21)+"  Lv"+lead.level,228,167);
  const hp=(x,y,value,max)=>{fill(x,y,115,7,"#313448");fill(x+2,y+2,Math.max(0,Math.round(111*Math.min(1,value/Math.max(1,max)))),3,value/max<.25?"#e45a6a":value/max<.5?"#e6bc51":"#70c76d");};
  hp(19,31,enemy.hp,enemy.maxHp);hp(230,175,lead.hp,lead.maxHp);
  c.fillText("HP "+lead.hp+"/"+lead.maxHp,230,190);
  if(effect){
   const elapsed=performance.now()-effect.started;
   if(effect.damage!==null&&Number.isFinite(effect.damage)&&effect.damage>=0&&elapsed<1100){
    const lift=Math.min(24,elapsed/28),x=effect.target==="ally"?80:290,y=(effect.target==="ally"?132:57)-lift;
    c.font="bold 16px monospace";c.textAlign="center";
    c.fillStyle="#11162b";c.fillText("-"+effect.damage,x+2,y+2);
    c.fillStyle=effect.multiplier>1?"#fff46c":effect.multiplier<1?"#9bd5ff":"#ffffff";
    c.fillText("-"+effect.damage,x,y);c.textAlign="start";
   }
   if(effect.fainted&&elapsed<1100){
    const alpha=Math.max(0,1-elapsed/1100);
    c.fillStyle="rgba(12,14,30,"+(0.7*alpha)+")";c.fillRect(253,28,82,79);
    c.font="bold 13px monospace";c.fillStyle="#ff6bcb";c.fillText("FAINTED",260,71);
   }
   if(effect.status&&elapsed<1100){
    const names={burn:"BURN",shock:"SHOCK",poison:"CURSE"};
    const status=names[effect.status];
    if(status){c.font="bold 10px monospace";c.fillStyle="#ffe16b";c.fillText(status,258,40);}
   }
   if(elapsed>=1100){effect=null;if(panel.hidden){current=null;canvas.hidden=true;}}
   else{
    const p=elapsed/850,hit=effect.kind==="attack",special=effect.kind==="special",evolution=effect.kind==="evolution";
    if(hit||special){
     const tint={fire:["#ff7b52","#ffcf6a"],grass:["#a2f263","#438c5a"],water:["#61ddf6","#2b8cc9"],electric:["#eaff6b","#ff69d1"],cosmic:["#8affdd","#fc69ce"],ghost:["#c3a4ff","#604dba"],air:["#e5f9ff","#88a8ed"],thorn:["#f879b5","#caff65"],stone:["#c7c3d4","#74738e"]}[effect.type]||["#ff61d4","#d4ff68"];
     const variant=effect.type||"cosmic",cx=290,cy=70;
     const count=special?28:12;
     for(let i=0;i<count;i++){
      const a=i*2.399+elapsed/(special?180:260);
      const radius=p*(special?65:39),px=cx+Math.cos(a)*radius,py=cy+Math.sin(a)*radius;
      if(variant==="electric"){fill(px-3,py,9,2,tint[i%2]);fill(px+1,py-4,2,9,tint[i%2]);}
      else if(variant==="water"){fill(px,py,3,8,tint[i%2]);fill(px-2,py+6,7,2,tint[i%2]);}
      else if(variant==="fire"){fill(px,py,5,9,tint[i%2]);fill(px+1,py-4,3,5,tint[i%2]);}
      else if(variant==="grass"||variant==="thorn"){fill(px-3,py,9,3,tint[i%2]);fill(px,py-3,3,9,tint[i%2]);}
      else if(variant==="stone"){fill(px,py,8,8,tint[i%2]);fill(px+2,py-3,4,3,tint[i%2]);}
      else if(variant==="ghost"){fill(px,py,6,6,tint[i%2]);fill(px+2,py+6,3,4,tint[i%2]);}
      else if(variant==="air"){fill(px-5,py,13,2,tint[i%2]);fill(px+1,py+4,9,2,tint[i%2]);}
      else {fill(px,py,5,5,tint[i%2]);}
     }
     if(effect.species==="minionmouse"||effect.species==="minivillain"||effect.species==="minieddie"){
      const sign=effect.species==="minionmouse"?"M":effect.species==="minivillain"?"V":"E";
      c.font="bold 24px monospace";c.fillStyle=tint[0];c.fillText(sign,282,73);
     }
     if(p<.18){c.fillStyle="rgba(255,255,255,.4)";c.fillRect(253,26,85,83);}
    }
    if(evolution){
     for(let i=0;i<18;i++){
      const a=i*Math.PI/9+elapsed/310;
      const x=90+Math.cos(a)*(12+p*70),y=139+Math.sin(a)*(12+p*58);
      fill(x,y,5,5,i%2?"#ff70d0":"#caff61");
     }
    }
   }
  }
 }
 const evolutionCanvas=document.createElement("canvas");
 evolutionCanvas.width=256;evolutionCanvas.height=192;
 evolutionCanvas.id="pixel-evolution";
 evolutionCanvas.setAttribute("aria-label","Creature evolution animation");
 evolutionCanvas.setAttribute("role","img");
 evolutionCanvas.hidden=true;
 document.body.append(evolutionCanvas);
 const ec=evolutionCanvas.getContext("2d");
 if(ec)ec.imageSmoothingEnabled=false;
 let evolution=null;
 const reducedMotion=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches||false;
 document.addEventListener("hell-high-orbit:evolution",event=>{
  const detail=event.detail||{};
  if(!window.HellOrbitSprites?.ids.includes(detail.from)||!window.HellOrbitSprites?.ids.includes(detail.to)||!ec)return;
  evolution={...detail,started:performance.now()-(reducedMotion?1900:0)};
  evolutionCanvas.hidden=false;
 });
 function drawEvolution(time){
  if(!evolution||!ec)return;
  const elapsed=time-evolution.started,duration=2400,p=Math.min(1,elapsed/duration);
  if(p>=1){evolutionCanvas.hidden=true;evolution=null;return;}
  ec.fillStyle="#11162b";ec.fillRect(0,0,256,192);
  for(let i=0;i<36;i++){
   const angle=i*2.399+time/420,radius=20+p*95;
   ec.fillStyle=i%2?"#ff65cc":"#cbff6d";
   ec.fillRect(128+Math.cos(angle)*radius,88+Math.sin(angle)*radius,4,4);
  }
  const changing=p>.32&&p<.77,showNew=p>=.77||(changing&&Math.floor(elapsed/90)%2===0);
  const size=changing?80+Math.round(Math.sin(p*Math.PI)*20):88;
  window.HellOrbitSprites.draw(ec,showNew?evolution.to:evolution.from,128-size/2,37,size,Math.floor(time/150)%4);
  ec.font="bold 12px monospace";ec.textAlign="center";
  ec.fillStyle="#f8e9f5";
  ec.fillText(p<.77?"EVOLUTION IN PROGRESS":"EVOLUTION COMPLETE",128,152);
  ec.fillStyle="#caff61";ec.fillText((p<.77?evolution.previous:evolution.name).slice(0,25),128,171);
 }
 let current=null,effect=null;
 const refresh=()=>{if(current&&(!panel.hidden||effect))stage(current.enemy,current.lead);};
 document.addEventListener("hell-high-orbit:effect",event=>{
  const detail=event.detail||{};
  if(!["attack","special","evolution"].includes(detail.kind))return;
  effect={kind:detail.kind,type:detail.type,species:detail.species,damage:Number.isFinite(detail.damage)?detail.damage:null,multiplier:detail.multiplier||1,target:detail.target||"enemy",fainted:!!detail.fainted,status:detail.status||null,started:performance.now()};
  refresh();
 });
 document.addEventListener("hell-high-orbit:battle",event=>{
  const incoming=event.detail?.enemy&&event.detail?.lead?event.detail:null;
  if(incoming)current=incoming;else if(!effect)current=null;
  canvas.hidden=!current&&!effect;if(current)refresh();
 });
 let lastFrame=-1;
 function animate(time){if(!document.hidden){drawEvolution(time);const frame=Math.floor(time/(reducedMotion?1200:160));if(frame!==lastFrame&&current&&(!panel.hidden||effect)){lastFrame=frame;refresh();}}requestAnimationFrame(animate);}
 requestAnimationFrame(animate);
 canvas.hidden=true;
})();
