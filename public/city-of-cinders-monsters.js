/* Original Knightfall kaiju art. Side-view, animated Canvas vector sprites.
   Character motifs carried over from the site's Minion Mouse, Mini Villain and Eddie. */
(function(root){'use strict';
const designs=Object.freeze({
 'minion-mouse':{name:'Minion Mouse',fur:'#ffe2ce',shade:'#c07a7a',jacket:'#963b54',accent:'#ef6b9b',eyes:'#bc365a',archetype:'chibi fox-eared animal girl',tails:3},
 'mini-villain':{name:'Mini Villain',fur:'#f1bca2',shade:'#a194aa',jacket:'#352442',accent:'#b58ee4',eyes:'#25192f',archetype:'kid villain in a homemade foil crown',tails:0},
 'the-eddie':{name:'The Eddie',fur:'#f0bd9e',shade:'#a87770',jacket:'#292434',accent:'#fa965b',eyes:'#75312c',archetype:'feral baby with goggles and flat-bill hat',tails:0}
});
const black='#130f1c';
function shape(c,fill,draw,stroke=black,width=5){c.beginPath();draw(c);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.stroke();}}
function oval(c,x,y,rx,ry,fill,stroke=black,width=5,tilt=0){shape(c,fill,p=>p.ellipse(x,y,rx,ry,tilt,0,Math.PI*2),stroke,width);}
function ink(c,color,width,draw){shape(c,null,draw,color,width);}
function tooth(c,x,y){shape(c,'#f8eed8',p=>{p.moveTo(x,y);p.lineTo(x+7,y+11);p.lineTo(x+12,y);p.closePath();},black,1.5);}
function plate(c,x,y,w,h){shape(c,'#4c4c60',p=>{p.moveTo(x,y+4);p.lineTo(x+w-4,y);p.lineTo(x+w,y+h-4);p.lineTo(x+4,y+h);p.closePath();},black,3);c.fillStyle='#d7c0b7';c.fillRect(x+4,y+4,w-10,2);}
function leg(c,x,y,angle,p,id){c.save();c.translate(x,y);c.rotate(angle);
 shape(c,p.shade,q=>{q.moveTo(-14,0);q.lineTo(15,0);q.lineTo(15,32);q.lineTo(6,46);q.lineTo(-15,38);q.closePath();});
 oval(c,8,42,id==='the-eddie'?24:18,11,id==='the-eddie'?'#1c1c27':'#34242e',black,4);
 ink(c,'#a6a0a2',2,q=>{q.moveTo(5,45);q.lineTo(25,45);});c.restore();}
function arm(c,x,y,angle,p,size=1){c.save();c.translate(x,y);c.rotate(angle);c.scale(size,size);
 const g=c.createLinearGradient(-12,4,24,68);g.addColorStop(0,p.fur);g.addColorStop(.65,p.shade);g.addColorStop(1,p.jacket);
 shape(c,g,q=>{q.moveTo(-14,-3);q.quadraticCurveTo(24,-12,24,18);q.lineTo(22,45);q.quadraticCurveTo(30,66,9,70);q.quadraticCurveTo(-15,67,-17,47);q.closePath();});
 oval(c,12,61,20,16,p.fur,black,4,-.2);
 for(let i=0;i<3;i++)tooth(c,1+i*11,66);c.restore();}
function foxTail(c,x,y,angle,scale){
 c.save();c.translate(x,y);c.rotate(angle);c.scale(scale,scale);
 shape(c,'#e68b5d',q=>{q.moveTo(0,0);q.bezierCurveTo(-24,-34,-52,-62,-29,-83);q.bezierCurveTo(0,-111,40,-77,28,-46);q.quadraticCurveTo(20,-18,0,0);q.closePath();},black,5);
 shape(c,'#fff1de',q=>{q.moveTo(-28,-69);q.bezierCurveTo(-43,-95,2,-104,26,-75);q.lineTo(13,-75);q.lineTo(5,-67);q.lineTo(-8,-79);q.closePath();},black,2);
 c.restore();
}
function foxEar(c,x,tilt){
 c.save();c.translate(x,43);c.rotate(tilt);
 shape(c,'#cc765b',q=>{q.moveTo(-22,7);q.lineTo(-13,-53);q.lineTo(10,-44);q.lineTo(23,11);q.closePath();},black,5);
 shape(c,'#ffb5a8',q=>{q.moveTo(-11,3);q.lineTo(-7,-34);q.lineTo(9,-28);q.lineTo(15,5);q.closePath();},black,2);
 c.restore();
}
function mouse(c,p){
 // Clearly three separate fox tails, chibi girl, fox ears, mouse-logo patch.
 foxTail(c,50,142,-.85,.88);foxTail(c,92,150,.1,1.06);foxTail(c,122,143,.83,.86);
 oval(c,83,121,42,43,p.jacket,black,6);
 shape(c,'#e4ad78',q=>{q.moveTo(67,103);q.lineTo(84,117);q.lineTo(103,101);q.lineTo(95,151);q.lineTo(75,153);q.closePath();},black,3);
 ink(c,'#f6c3a4',4,q=>{q.moveTo(48,151);q.lineTo(117,152);});
 oval(c,103,125,12,11,'#392536',black,2);
 oval(c,96,119,4,4,'#e69da9',null);oval(c,111,118,4,4,'#e69da9',null);
 foxEar(c,46,-.18);foxEar(c,123,.17);
 // Short fluffy ivory hair frames the giant animated face.
 oval(c,83,76,57,47,'#f4d8ce',black,6);
 oval(c,83,91,48,36,p.fur,black,5);
 for(let i=0;i<5;i++){
  const x=34+i*21;
  shape(c,'#f5d8ce',q=>{q.moveTo(x,54);q.lineTo(x+9,35+(i%2)*8);q.lineTo(x+21,61);q.closePath();},black,2);
 }
 for(const x of [65,101]){oval(c,x,93,12,14,'#fff7ed',black,3);oval(c,x+3,94,6,9,p.eyes,null);oval(c,x+3,90,2,3,'#fff2e0',null);}
 oval(c,48,110,10,5,'#f5a1a9',null);oval(c,121,110,10,5,'#f5a1a9',null);
 ink(c,'#6c344b',4,q=>{q.moveTo(77,113);q.quadraticCurveTo(93,125,108,112);});tooth(c,95,117);
 // Copper-lensed scavenger goggles above eyes, not in place of ears.
 ink(c,'#45313c',7,q=>{q.moveTo(47,63);q.quadraticCurveTo(83,44,122,63);});
 for(const x of [64,101]){oval(c,x,60,16,13,'#392c3b','#c99d70',5);oval(c,x,59,10,8,'#df934a',null);oval(c,x-4,56,3,2,'#fff8e0',null);}
 oval(c,39,48,7,7,'#493043',null);oval(c,33,43,4,4,'#493043',null);oval(c,45,43,4,4,'#493043',null);
}
function villain(c,p){
 // A cocky child in a homemade tinfoil crown and dramatic purple cape.
 shape(c,'#2a2038',q=>{q.moveTo(63,88);q.lineTo(21,103);q.lineTo(6,171);q.lineTo(42,147);q.lineTo(80,172);q.lineTo(121,148);q.lineTo(148,171);q.lineTo(125,94);q.closePath();},black,5);
 shape(c,'#854a9b',q=>{q.moveTo(51,105);q.lineTo(16,127);q.lineTo(13,159);q.lineTo(48,136);q.closePath();},black,3);
 oval(c,85,125,41,43,'#c8c0cb',black,6);
 shape(c,'#eee3d6',q=>{q.moveTo(54,105);q.lineTo(83,115);q.lineTo(113,101);q.lineTo(117,150);q.lineTo(53,150);q.closePath();},black,4);
 // Spiral insignia: a homemade crest rather than borrowed artwork.
 oval(c,86,129,20,18,'#252032',black,2);oval(c,86,129,10,9,'#f1dfd0',null);oval(c,88,130,5,5,'#282033',null);
 for(let i=0;i<4;i++)plate(c,46+i*21,149,19,13);
 oval(c,84,79,53,45,p.fur,black,7);
 // Spiky black hair sticking under bent metallic foil crown.
 for(let i=0;i<6;i++)shape(c,'#231c2d',q=>{const x=34+i*18;q.moveTo(x,63);q.lineTo(x+3,35+(i%2)*5);q.lineTo(x+19,64);q.closePath();},black,2);
 shape(c,'#d9d3dc',q=>{q.moveTo(34,56);q.lineTo(27,22);q.lineTo(54,30);q.lineTo(72,10);q.lineTo(94,29);q.lineTo(119,13);q.lineTo(125,54);q.closePath();},black,5);
 shape(c,'#f7ece0',q=>{q.moveTo(41,45);q.lineTo(54,36);q.lineTo(74,18);q.lineTo(94,41);q.lineTo(113,26);q.lineTo(115,50);q.closePath();},null);
 ink(c,'#747483',2,q=>{q.moveTo(58,28);q.lineTo(64,53);q.moveTo(94,37);q.lineTo(99,52);});
 ink(c,black,4,q=>{q.moveTo(74,13);q.lineTo(78,-5);});oval(c,78,-7,5,5,'#fff3e8',black,2);
 for(const x of [61,105]){oval(c,x,85,17,10,'#fff7ea',black,3);oval(c,x+4,85,5,6,p.eyes,null);}
 ink(c,'#231929',4,q=>{q.moveTo(47,73);q.lineTo(77,79);q.moveTo(91,79);q.lineTo(121,72);});
 shape(c,'#482337',q=>{q.moveTo(63,111);q.quadraticCurveTo(86,124,111,109);q.quadraticCurveTo(91,133,74,123);q.closePath();},black,2);
 for(let i=0;i<4;i++)tooth(c,74+i*8,115);
}
function eddie(c,p){
 // Wild baby in goggles and a massive flat-bill cap, never a horned beast.
 oval(c,83,123,48,40,p.fur,black,6);
 shape(c,'#f2e3d9',q=>{q.moveTo(45,128);q.lineTo(125,126);q.lineTo(130,162);q.lineTo(46,162);q.closePath();},black,5);
 ink(c,'#bb5366',4,q=>{q.moveTo(72,152);q.lineTo(75,143);q.lineTo(85,150);q.lineTo(94,142);q.lineTo(100,152);});
 plate(c,49,132,16,13);plate(c,106,132,16,13);
 oval(c,84,86,56,53,p.fur,black,7);
 // Feral grin and oversized cheeks.
 for(const x of [47,121])oval(c,x,112,11,6,'#e68a79',null);
 shape(c,'#5d2839',q=>{q.moveTo(63,120);q.quadraticCurveTo(88,134,114,118);q.quadraticCurveTo(105,148,88,146);q.quadraticCurveTo(70,143,63,120);q.closePath();},black,3);
 oval(c,91,141,11,5,'#e66c7a',null);tooth(c,73,120);tooth(c,99,119);
 ink(c,'#8b5360',3,q=>{q.moveTo(54,108);q.lineTo(60,114);q.moveTo(116,106);q.lineTo(111,114);});
 // Chunky punk goggles with warm amber lenses.
 ink(c,'#3c2c35',8,q=>{q.moveTo(37,81);q.quadraticCurveTo(87,72,135,82);});
 for(const x of [64,108]){oval(c,x,84,24,22,'#3a3441',black,5);oval(c,x,84,18,16,'#ffb05d','#bd915e',3);oval(c,x+3,88,9,10,'#794235',null);oval(c,x-6,77,6,3,'#fff4d8',null);}
 // Spiked flat-bill hat: horizontal brim and red underside.
 shape(c,'#292635',q=>{q.moveTo(25,58);q.lineTo(28,27);q.quadraticCurveTo(85,4,143,28);q.lineTo(140,59);q.closePath();},black,6);
 shape(c,'#c04762',q=>{q.moveTo(12,59);q.quadraticCurveTo(82,44,165,59);q.lineTo(165,70);q.quadraticCurveTo(88,64,16,70);q.closePath();},black,5);
 oval(c,83,38,15,12,'#e2afa7',black,2);
 ink(c,'#372235',3,q=>{q.moveTo(72,37);q.lineTo(80,43);q.lineTo(88,37);q.moveTo(91,37);q.lineTo(98,42);});
}

// Three readable, character-specific special attacks.
function signature(c,id,state,phase,reducedMotion){
 if(state!=='roar'&&state!=='attack')return;
 c.save();c.globalAlpha=state==='roar'?.85:.55;
 if(id==='minion-mouse'){
  // Three fox-tail lightning trails, even at mobile sprite scale.
  for(let i=0;i<3;i++){
   const x=30+i*40,y=153-i%2*9;
   ink(c,i%2?'#ffd183':'#ff63a6',4,q=>{
    q.moveTo(x,y);q.lineTo(x+13,y-19);q.lineTo(x+3,y-30);
    q.lineTo(x+22,y-44);q.lineTo(x+14,y-53);
   });
  }
 }else if(id==='mini-villain'){
  // Comedy supervillain crown burst with its own six-point seal.
  for(let i=0;i<6;i++){
   const a=i*Math.PI/3+(reducedMotion?0:Math.sin(phase)*.08);
   ink(c,'#c7a2fd',3,q=>{
    q.moveTo(86+Math.cos(a)*49,97+Math.sin(a)*49);
    q.lineTo(86+Math.cos(a)*65,97+Math.sin(a)*65);
    q.lineTo(86+Math.cos(a)*83,97+Math.sin(a)*83);
   });
  }
 }else{
  // Eddie slams the street: angular dusty shockwaves on either side.
  for(const side of [-1,1]){
   ink(c,'#ffb363',5,q=>{
    q.moveTo(86,173);q.lineTo(86+side*24,163);q.lineTo(86+side*39,173);
    q.lineTo(86+side*61,156);q.lineTo(86+side*80,169);
   });
  }
 }
 c.restore();
}
function draw(c,id,x,y,w,h,opts={}){
 const p=designs[id];if(!p||!c||!(w>0)||!(h>0))return false;
 const frame=Number(opts.frame)||0,state=opts.state||'idle';
 const phase=opts.reducedMotion?0:frame*.17;
 const moving=['walk','run','climb'].includes(state);
 const gait=moving?Math.sin(phase*(state==='run'?1.8:1.2)):0;
 const climb=state==='climb',attack=state==='attack',roar=state==='roar';
 const bounce=opts.reducedMotion?0:climb?Math.sin(phase*1.7)*2:moving?Math.abs(gait)*2:Math.sin(phase*.7)*2;
 const backAngle=climb?-1.3+gait*.65:moving?gait*.35:-.12;
 const frontAngle=attack?-1.45-Math.sin(phase*2)*.20:climb?-1.38-gait*.65:roar?-1.8:moving?-gait*.35:.15;
 c.save();c.translate(x+w*.5,y+h);c.scale((opts.face===-1?-1:1)*w/110*1.37,h/145*1.17);c.translate(-82,-180);
 if(opts.hurt&&frame%6<3)c.globalAlpha=.6;
 if(roar){c.save();c.globalAlpha=.45;c.strokeStyle=p.eyes;c.lineWidth=6;c.beginPath();c.arc(83,108,65+Math.sin(phase)*5,0,Math.PI*2);c.stroke();c.restore();}
 c.translate(0,-bounce);
 leg(c,57,137,climb?gait*.5:gait*.22,p,id);
 leg(c,103,137,climb?-gait*.5:-gait*.22,p,id);
 arm(c,41,92,backAngle,p,id==='the-eddie'?1.13:id==='mini-villain'?.79:.86);
 if(id==='minion-mouse')mouse(c,p);
 else if(id==='mini-villain')villain(c,p);
 else eddie(c,p);
 signature(c,id,state,phase,opts.reducedMotion);
 arm(c,id==='the-eddie'?126:115,111,frontAngle,p,id==='the-eddie'?1.18:id==='mini-villain'?.81:.9);
 if(roar){
  c.save();c.globalAlpha=.85;c.strokeStyle=p.eyes;c.lineWidth=3;
  for(let i=0;i<6;i++){
    const x=44+i*17,yy=75+Math.sin(phase+i)*24;
    c.beginPath();c.moveTo(x,yy);c.lineTo(x+6,yy-11);c.lineTo(x+1,yy-16);c.lineTo(x+12,yy-29);c.stroke();
  }
  c.restore();
}
if(opts.mutation==='armored'){plate(c,43,96,23,17);plate(c,107,97,24,17);}
 if(opts.mutation==='feral'){c.strokeStyle='#ff55d8';c.lineWidth=3;for(let i=0;i<3;i++){c.beginPath();c.moveTo(46+i*19,139);c.lineTo(39+i*19,150);c.stroke();}}
 c.restore();return true;
}
function portrait(canvas,id,opts={}){
 if(!canvas||!canvas.getContext||!designs[id])return false;
 const c=canvas.getContext('2d');if(!c)return false;
 const w=canvas.width,h=canvas.height;c.clearRect(0,0,w,h);
 const g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,'#26162b');g.addColorStop(.6,'#171622');g.addColorStop(1,'#080b13');c.fillStyle=g;c.fillRect(0,0,w,h);
 const hue=designs[id].accent;
 const glow=c.createRadialGradient(w*.55,h*.53,5,w*.55,h*.53,w*.68);glow.addColorStop(0,hue+'55');glow.addColorStop(1,hue+'00');c.fillStyle=glow;c.fillRect(0,0,w,h);
 c.strokeStyle=hue;c.globalAlpha=.3;c.lineWidth=2;
 for(let i=0;i<5;i++){c.beginPath();c.moveTo(0,h*.18+i*28);c.lineTo(w,h*.08+i*28);c.stroke();}
 c.globalAlpha=1;
 // The cast is skyscraper-sized: silhouettes of destroyed rooftops frame them.
 for(let i=0;i<7;i++){
  const bw=18+(i%3)*7,bx=(i*47)%w,by=h*(.63+(i%4)*.045);
  c.fillStyle=i%2?'#131320':'#1c1424';c.fillRect(bx,by,bw,h-by);
  c.fillStyle=i%2?'#855f82':'#50816c';
  for(let row=0;row<3;row++)for(let col=0;col<2;col++)
   c.fillRect(bx+4+col*9,by+5+row*12,3,5);
 }
 draw(c,id,w*.30,h*.30,w*.40,h*.56,{state:opts.state||'idle',frame:opts.frame||0,mutation:opts.mutation});
 c.fillStyle=hue;c.fillRect(w*.14,h-7,w*.72,3);
 return true;
}
root.CityCindersMonsters=Object.freeze({draw,portrait,designs,ids:Object.freeze(Object.keys(designs))});
if(typeof module!=='undefined'&&module.exports)module.exports=root.CityCindersMonsters;
})(typeof window!=='undefined'?window:globalThis);