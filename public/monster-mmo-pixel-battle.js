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
 }
 let current=null;
 const refresh=()=>{if(current&&!panel.hidden)stage(current.enemy,current.lead);};
 document.addEventListener("hell-high-orbit:battle",event=>{
  current=event.detail?.enemy&&event.detail?.lead?event.detail:null;
  canvas.hidden=!current;if(current)refresh();
 });
 let lastFrame=-1;
 function animate(time){const frame=Math.floor(time/160);if(frame!==lastFrame&&current&&!panel.hidden){lastFrame=frame;refresh();}requestAnimationFrame(animate);}
 requestAnimationFrame(animate);
 canvas.hidden=true;
})();
