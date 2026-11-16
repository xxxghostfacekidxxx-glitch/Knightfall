/* Original Knightfall kaiju art. Side-view, animated Canvas vector sprites.
   Character motifs carried over from the site's Minion Mouse, Mini Villain and Eddie. */
(function(root){'use strict';
const designs=Object.freeze({
 'minion-mouse':{name:'Minion Mouse',fur:'#e8d3bf',shade:'#ad898d',jacket:'#783b56',accent:'#ff55d8',eyes:'#c6ff45'},
 'mini-villain':{name:'Mini Villain',fur:'#bd809e',shade:'#6e426b',jacket:'#341a50',accent:'#f0b66d',eyes:'#c6ff45'},
 'the-eddie':{name:'The Eddie',fur:'#93a29b',shade:'#4c5663',jacket:'#22232d',accent:'#c6ff45',eyes:'#ff55d8'}
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
function mouse(c,p){
 // Heavy electro-mechanical tail and giant stitched ears.
 ink(c,black,19,q=>{q.moveTo(49,139);q.bezierCurveTo(-25,140,1,64,31,76);q.bezierCurveTo(45,83,3,111,12,100);});
 ink(c,'#f5afc2',11,q=>{q.moveTo(49,139);q.bezierCurveTo(-25,140,1,64,31,76);q.bezierCurveTo(45,83,3,111,12,100);});
 for(const [x,y,angle] of [[46,42,-.21],[116,38,.19]]){
  oval(c,x,y,33,44,p.shade,black,6,angle);oval(c,x,y,23,34,'#ffacbb','#a65381',3,angle);
  ink(c,'#ffdde3',3,q=>{q.moveTo(x-8,y+10);q.quadraticCurveTo(x-14,y-7,x+2,y-19);});
 }
 plate(c,36,111,25,38);oval(c,48,130,8,10,p.eyes,black,2);
 oval(c,82,116,47,50,p.fur,black,7);
 shape(c,p.jacket,q=>{q.moveTo(47,97);q.quadraticCurveTo(70,78,105,91);q.lineTo(126,150);q.lineTo(57,161);q.closePath();});
 oval(c,80,124,27,29,'#eddbc3','#9f8388',3);
 ink(c,'#d3a3aa',3,q=>{q.moveTo(55,109);q.lineTo(60,119);q.lineTo(53,134);});
 ink(c,'#eec88d',3,q=>{q.moveTo(82,109);q.quadraticCurveTo(98,119,93,143);});
 oval(c,93,147,11,11,'#e7c78b','#755963',2);
 const g=c.createLinearGradient(49,44,135,126);g.addColorStop(0,'#fff3da');g.addColorStop(.6,p.fur);g.addColorStop(1,p.shade);
 oval(c,87,81,50,46,g,black,7,.08);oval(c,122,97,26,20,'#f8e0d1',black,4);
 oval(c,143,88,7,6,'#744058',black,2);
 // Scavenger goggles and exposed lenses.
 shape(c,'#4b3a50',q=>{q.moveTo(50,65);q.quadraticCurveTo(84,43,122,61);q.lineTo(125,73);q.quadraticCurveTo(79,57,48,78);q.closePath();},black,3);
 for(const x of [69,101]){oval(c,x,66,15,13,'#353b4b','#d3ad88',5);oval(c,x+1,64,9,8,'#80d8df',null);oval(c,x-3,60,3,2,'#fff7e6',null);}
 for(const [x,y] of [[78,89],[109,88]]){oval(c,x,y,10,10,black,null);oval(c,x+2,y,5,6,p.eyes,null);}
 ink(c,'#673e55',4,q=>{q.moveTo(105,106);q.quadraticCurveTo(125,123,138,106);});
 tooth(c,113,109);tooth(c,124,109);
 for(let i=0;i<3;i++){ink(c,'#f9d4c6',2,q=>{q.moveTo(115,94+i*7);q.lineTo(150,86+i*12);});}
}
function villain(c,p){
 // Oversized velvet cape, bat wings and barbed tail.
 shape(c,'#3d1e52',q=>{q.moveTo(66,81);q.lineTo(26,101);q.lineTo(10,166);q.lineTo(39,151);q.lineTo(70,172);q.lineTo(117,149);q.lineTo(140,170);q.lineTo(127,97);q.closePath();});
 shape(c,'#9c577e',q=>{q.moveTo(55,87);q.lineTo(13,73);q.lineTo(2,107);q.lineTo(28,125);q.lineTo(45,112);q.lineTo(55,145);q.closePath();},black,4);
 shape(c,'#b9668d',q=>{q.moveTo(105,84);q.lineTo(143,66);q.lineTo(156,102);q.lineTo(137,122);q.lineTo(117,111);q.closePath();},black,4);
 ink(c,black,16,q=>{q.moveTo(58,141);q.bezierCurveTo(6,172,-6,128,21,98);});
 ink(c,'#d88ba6',9,q=>{q.moveTo(58,141);q.bezierCurveTo(6,172,-6,128,21,98);});
 shape(c,'#f4bd80',q=>{q.moveTo(19,89);q.lineTo(2,85);q.lineTo(14,111);q.lineTo(30,98);q.closePath();},black,3);
 oval(c,87,120,42,48,p.fur,black,7);
 shape(c,p.jacket,q=>{q.moveTo(56,95);q.lineTo(85,113);q.lineTo(122,91);q.lineTo(111,118);q.lineTo(89,132);q.lineTo(56,114);q.closePath();},black,4);
 plate(c,70,126,35,19);oval(c,89,134,8,8,'#f3cb8b',black,2);
 for(const [x,dir] of [[56,-1],[110,1]])shape(c,'#eed2af',q=>{q.moveTo(x-12,62);q.lineTo(x+dir*18,7);q.lineTo(x+14,52);q.closePath();},black,5);
 // Crooked crown.
 shape(c,'#e6bd76',q=>{q.moveTo(60,51);q.lineTo(58,23);q.lineTo(76,34);q.lineTo(87,10);q.lineTo(98,32);q.lineTo(115,22);q.lineTo(111,52);q.closePath();},black,4);
 c.fillStyle='#a53d65';c.fillRect(82,35,12,10);
 const g=c.createLinearGradient(49,47,139,112);g.addColorStop(0,'#edb3ab');g.addColorStop(.64,p.fur);g.addColorStop(1,p.shade);
 oval(c,86,82,47,43,g,black,7,-.1);
 shape(c,'#c27d9a',q=>{q.moveTo(98,83);q.quadraticCurveTo(141,68,146,99);q.lineTo(113,111);q.closePath();},black,4);
 oval(c,137,95,6,5,'#411e37',null);
 for(const x of [66,106]){oval(c,x,81,12,11,black,null);oval(c,x+2,81,6,7,p.eyes,null);}
 ink(c,'#4b2348',5,q=>{q.moveTo(54,68);q.lineTo(76,72);q.moveTo(95,75);q.lineTo(118,65);});
 ink(c,'#2b1931',5,q=>{q.moveTo(96,107);q.quadraticCurveTo(117,122,136,105);});
 for(let i=0;i<3;i++)tooth(c,104+i*10,108);
}
function eddie(c,p){
 // Torn black leather and glow-in-the-dark bones, heavyweight boots.
 oval(c,86,120,56,51,'#3d444a',black,8);
 shape(c,p.jacket,q=>{q.moveTo(43,87);q.lineTo(81,110);q.lineTo(122,87);q.lineTo(139,163);q.lineTo(107,166);q.lineTo(84,127);q.lineTo(55,166);q.lineTo(40,149);q.closePath();},black,6);
 for(let i=0;i<4;i++)ink(c,'#c2d4bd',3,q=>{let y=115+i*10;q.moveTo(68,y);q.quadraticCurveTo(86,y+9,104,y);});
 shape(c,'#b14e67',q=>{q.moveTo(78,113);q.lineTo(91,120);q.lineTo(100,114);q.lineTo(88,147);q.closePath();},black,2);
 for(let i=0;i<4;i++)shape(c,'#d2c7b8',q=>{let x=43+i*25;q.moveTo(x,106);q.lineTo(x+6,91);q.lineTo(x+12,105);q.closePath();},black,2);
 plate(c,46,129,13,23);plate(c,114,130,13,21);
 const g=c.createLinearGradient(44,50,140,114);g.addColorStop(0,'#c5c9bb');g.addColorStop(.65,p.fur);g.addColorStop(1,p.shade);
 oval(c,88,80,53,49,g,black,8);
 for(const [x,s] of [[46,-1],[124,1]])shape(c,p.shade,q=>{q.moveTo(x-11,64);q.lineTo(x+s*22,14);q.lineTo(x+17,52);q.closePath();},black,6);
 // Acid-green mosh-pit mohawk.
 shape(c,'#c6ff45',q=>{q.moveTo(57,46);q.lineTo(61,22);q.lineTo(74,32);q.lineTo(84,5);q.lineTo(96,30);q.lineTo(109,15);q.lineTo(114,45);q.closePath();},black,5);
 ink(c,'#f1ffb0',3,q=>{q.moveTo(73,27);q.lineTo(83,12);q.lineTo(92,29);});
 oval(c,114,104,31,24,'#a7aaa0',black,5,-.1);oval(c,140,97,9,8,'#333036',black,2);
 oval(c,67,83,12,13,black,null);oval(c,68,83,7,8,'#ff55d8',null);
 oval(c,106,82,12,13,black,null);oval(c,106,82,7,8,'#c6ff45',null);
 ink(c,'#3c3840',5,q=>{q.moveTo(53,69);q.lineTo(75,75);q.moveTo(97,74);q.lineTo(116,68);});
 ink(c,'#241c29',6,q=>{q.moveTo(97,114);q.quadraticCurveTo(120,132,140,111);});
 for(let i=0;i<3;i++)tooth(c,108+i*10,116);
 ink(c,'#5d4657',3,q=>{q.moveTo(48,111);q.lineTo(72,99);});
 for(let i=0;i<3;i++)ink(c,'#f4ded5',2,q=>{q.moveTo(55+i*8,104);q.lineTo(60+i*8,113);});
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
 const frontAngle=attack?-1.25-Math.sin(phase*2)*.25:climb?-1.3-gait*.65:roar?-1.8:moving?-gait*.42:-.25;
 c.save();c.translate(x+w*.5,y+h);c.scale((opts.face===-1?-1:1)*w/110*1.37,h/145*1.17);c.translate(-82,-180);
 if(opts.hurt&&frame%6<3)c.globalAlpha=.6;
 if(roar){c.save();c.globalAlpha=.45;c.strokeStyle=p.eyes;c.lineWidth=6;c.beginPath();c.arc(83,108,65+Math.sin(phase)*5,0,Math.PI*2);c.stroke();c.restore();}
 c.translate(0,-bounce);
 leg(c,57,137,climb?gait*.5:gait*.22,p,id);
 leg(c,103,137,climb?-gait*.5:-gait*.22,p,id);
 arm(c,41,92,backAngle,p,id==='the-eddie'?1.2:1);
 if(id==='minion-mouse')mouse(c,p);
 else if(id==='mini-villain')villain(c,p);
 else eddie(c,p);
 arm(c,id==='the-eddie'?126:115,96,frontAngle,p,id==='the-eddie'?1.32:id==='mini-villain'?.88:1.03);
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
 draw(c,id,w*.30,h*.30,w*.40,h*.56,{state:opts.state||'idle',frame:opts.frame||0,mutation:opts.mutation});
 c.fillStyle=hue;c.fillRect(w*.14,h-7,w*.72,3);
 return true;
}
root.CityCindersMonsters=Object.freeze({draw,portrait,designs,ids:Object.freeze(Object.keys(designs))});
if(typeof module!=='undefined'&&module.exports)module.exports=root.CityCindersMonsters;
})(typeof window!=='undefined'?window:globalThis);