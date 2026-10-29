/* Hell & High Orbit: original 32px creature sprite atlas, four animation frames per creature.
   Drawn entirely from original vector-to-pixel primitives, no remote/copyrighted assets. */
(()=>{
"use strict";
const ids="embercub ashhorn mossbit mossreaper driftfin cryptfin zipfang voltmaw squibblex squibmarshal glorpbot glorpcannon gloamlet gloamshade thornspit thornmaw grubruckle gravruckle mournwing doomwing noodloid noodlarch blipmoth bliporacle hexpup hexhound starjelly astraljelly minionmouse minivillain minieddie".split(" ");
const colors={fire:["#ff8666","#a3335e"],grass:["#9fef6d","#3e8560"],water:["#67e2ef","#3569b7"],electric:["#f1f778","#8c55a6"],cosmic:["#88f9db","#5573b3"],ghost:["#c8a7ff","#654889"],air:["#c1e7ff","#688ab6"],thorn:["#f18fc2","#963f71"],stone:["#b9afc2","#5e6175"]};
const types="fire fire grass grass water water electric electric cosmic cosmic electric electric ghost ghost thorn thorn stone stone air air cosmic cosmic air air ghost ghost cosmic cosmic electric ghost fire".split(" ");
const atlas=document.createElement("canvas");atlas.width=32*4;atlas.height=32*ids.length;
const ctx=atlas.getContext("2d");if(!ctx)return;ctx.imageSmoothingEnabled=false;
const rect=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
function sprite(id,frame){
 const n=ids.indexOf(id);if(n<0)return;
 const x=frame*32,y=n*32,bob=frame===1?1:frame===3?-1:0;
 const [base,shade]=colors[types[n]]||colors.cosmic,ink="#242037",accent=n%2?"#ff6dbb":"#d9ff6c";
 const r=(a,b,w,h,c)=>rect(x+a,y+b+bob,w,h,c);
 const family=Math.floor(n/2),evolved=n%2===1&&n<28;
 const bodyW=evolved?22:18,bodyX=(32-bodyW)/2;
 // Distinct anatomy per evolutionary family, with stronger evolved silhouettes.
 if([2,7,10,11].includes(family)){r(3,12,8,9,shade);r(21,12,8,9,shade);}
 if([4,9,12].includes(family)){r(2,16,9,5,accent);r(21,16,9,5,accent);}
 if([1,6,8,13].includes(family)){r(8,3,5,11,accent);r(19,2,5,12,accent);}
 if([0,3,5].includes(family)){r(5,8,6,8,shade);r(21,8,6,8,shade);}
 if([2,9].includes(family)){r(3,18,7,4,base);r(22,18,7,4,base);}
 if([7,10,11].includes(family)){r(13,2,6,12,accent);}
 r(bodyX,11,bodyW,16,ink);r(bodyX+2,10,bodyW-4,16,shade);r(bodyX+3,12,bodyW-6,12,base);

 // Individually authored silhouette details for the 28 regular creatures.
 const features={
  embercub:()=>{r(6,5,5,9,accent);r(21,5,5,9,accent);r(13,7,6,4,"#ffe4a1");},
  ashhorn:()=>{r(5,0,6,13,shade);r(21,0,6,13,shade);r(11,4,10,5,accent);},
  mossbit:()=>{r(7,5,4,9,"#3b945c");r(20,4,4,9,accent);r(14,2,4,10,accent);},
  mossreaper:()=>{r(3,7,9,8,shade);r(21,6,8,8,shade);r(14,0,4,11,accent);},
  driftfin:()=>{r(2,12,8,9,shade);r(23,12,7,9,shade);r(12,3,8,9,accent);},
  cryptfin:()=>{r(1,13,10,8,accent);r(22,13,9,8,accent);r(13,0,6,13,shade);},
  zipfang:()=>{r(7,2,5,12,accent);r(20,2,5,12,accent);r(11,24,3,5,"#fff");},
  voltmaw:()=>{r(3,1,7,14,accent);r(23,1,7,14,accent);r(12,24,3,6,"#fff");r(20,24,3,6,"#fff");},
  squibblex:()=>{r(3,8,8,5,shade);r(22,8,8,5,shade);r(12,4,8,6,accent);},
  squibmarshal:()=>{r(2,5,9,7,shade);r(21,5,9,7,shade);r(9,1,14,5,accent);},
  glorpbot:()=>{r(4,10,5,15,"#6b829d");r(23,10,5,15,"#6b829d");r(13,2,6,9,accent);},
  glorpcannon:()=>{r(1,10,9,18,"#6b829d");r(22,10,9,18,"#6b829d");r(11,2,10,6,accent);},
  gloamlet:()=>{r(8,3,4,9,shade);r(20,3,4,9,shade);r(13,7,6,4,"#f3e9ff");},
  gloamshade:()=>{r(3,7,7,17,shade);r(22,7,7,17,shade);r(11,2,10,8,accent);},
  thornspit:()=>{r(3,11,8,4,accent);r(21,11,8,4,accent);r(14,3,4,9,shade);},
  thornmaw:()=>{r(1,9,11,5,accent);r(20,9,11,5,accent);r(12,1,8,10,shade);},
  grubruckle:()=>{r(4,21,7,6,shade);r(21,21,7,6,shade);r(14,5,4,6,accent);},
  gravruckle:()=>{r(1,18,10,10,shade);r(21,18,10,10,shade);r(11,1,10,9,accent);},
  mournwing:()=>{r(1,8,10,13,shade);r(21,8,10,13,shade);r(14,3,4,9,accent);},
  doomwing:()=>{r(0,5,12,17,shade);r(20,5,12,17,shade);r(12,1,8,8,accent);},
  noodloid:()=>{r(2,21,8,5,accent);r(22,21,8,5,accent);r(14,1,4,12,shade);},
  noodlarch:()=>{r(0,20,11,7,accent);r(21,20,11,7,accent);r(12,0,8,13,shade);},
  blipmoth:()=>{r(3,9,8,12,accent);r(21,9,8,12,accent);r(14,1,4,9,shade);},
  bliporacle:()=>{r(0,7,12,15,accent);r(20,7,12,15,accent);r(12,0,8,10,shade);},
  hexpup:()=>{r(5,4,6,10,shade);r(21,4,6,10,shade);r(13,7,6,4,accent);},
  hexhound:()=>{r(2,2,8,14,shade);r(22,2,8,14,shade);r(11,5,10,6,accent);},
  starjelly:()=>{r(4,18,5,10,accent);r(13,20,5,9,accent);r(23,18,5,10,accent);},
  astraljelly:()=>{r(1,16,6,13,accent);r(9,19,6,12,accent);r(18,19,6,12,accent);r(26,16,5,13,accent);}
 };
 features[id]?.();
 // Species-specific accessories and faces. Legendary creatures receive dedicated shapes.
 if(id==="minionmouse"){r(2,3,10,10,base);r(20,3,10,10,base);r(11,5,10,4,accent);r(14,1,4,4,accent);}
 if(id==="minivillain"){r(3,11,7,17,"#623a81");r(22,11,7,17,"#623a81");r(11,3,10,7,accent);r(15,0,3,4,accent);}
 if(id==="minieddie"){r(5,4,6,10,accent);r(21,4,6,10,accent);r(13,2,6,8,"#fff1ca");}
 if([3,6,8,12].includes(family)){r(12,14,8,7,shade);r(14,16,4,3,accent);}
 if([1,4,7,11].includes(family)){r(7,18,4,3,accent);r(21,18,4,3,accent);}
 r(9,17,5,5,ink);r(19,17,5,5,ink);r(11,18,2,2,"#fff");r(21,18,2,2,"#fff");
 r(14,23,5,2,ink);r(15,25,2,3,"#fff1dc");r(19,25,2,3,"#fff1dc");
 const leg=frame%2?2:0;r(9,27-leg,5,4,shade);r(19,27-(2-leg),5,4,shade);
 if(evolved){r(4,13,3,8,accent);r(25,13,3,8,accent);}
 // Every species has a unique, stable sigil pattern.
 const code=n+17;
 for(let j=0;j<3;j++)if((code>>j)&1)r(11+j*4,12,2,3,accent);
}
for(let n=0;n<ids.length;n++)for(let frame=0;frame<4;frame++)sprite(ids[n],frame);
function draw(ctx,id,x,y,size=64,frame=0,back=false){
 const n=ids.indexOf(id);if(n<0)return false;
 ctx.save();ctx.imageSmoothingEnabled=false;
 if(back){ctx.translate(x+size,0);ctx.scale(-1,1);x=0;}
 ctx.drawImage(atlas,(Math.floor(frame)%4)*32,n*32,32,32,x,y,size,size);
 ctx.restore();return true;
}
window.HellOrbitSprites=Object.freeze({ids:Object.freeze(ids),atlas,draw});
})();
