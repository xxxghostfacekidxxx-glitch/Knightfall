// Independent image generation: seeded geometric scene composition, not neural inference.
// Only authored SVG primitives are emitted. No user markup, scripts, URLs or remote assets.
const palettes={inferno:["#100913","#3b1422","#e34b35","#ffb653","#fff0c7"],eclipse:["#090b18","#202a46","#8d72c7","#e2ad67","#fff1c9"],neon:["#090e1a","#251745","#ed42bc","#33e6bc","#e5f9ff"],obsidian:["#0b0b10","#24252e","#696778","#b7a8be","#ece6ed"],celestial:["#070d1e","#192948","#4375b2","#9cd8ee","#fff3d9"]};
const motifs=["eclipse","mountains","sigil","waves","stars"];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c]));
function rng(seed){let s=seed>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
export function imageSpec(input){
 if(!input||typeof input!=="object"||Array.isArray(input))throw Error("Provide an image specification.");
 const motif=input.motif??"eclipse",palette=input.palette??"eclipse",width=input.width??768,height=input.height??768,seed=input.seed??66,title=input.title??"Miss Chaos";
 if(!motifs.includes(motif)||!Object.hasOwn(palettes,palette))throw Error("Unknown motif or palette.");
 if(![256,512,768,1024].includes(width)||![256,512,768,1024].includes(height))throw Error("Dimensions must be 256, 512, 768 or 1024.");
 if(!Number.isInteger(seed)||seed<0||seed>4294967295||typeof title!=="string"||title.length>80)throw Error("Invalid seed or title.");
 return {motif,palette,width,height,seed,title};
}
export function generateVector(input){
 const spec=imageSpec(input),{width:w,height:h,seed,motif,palette,title}=spec,[bg,shade,accent,light,white]=palettes[palette],random=rng(seed),r=(min,max)=>min+(max-min)*random(),n=v=>Math.round(v*100)/100,cx=w/2,cy=h*.46,m=Math.min(w,h);
 const circle=(x,y,rad,fill,opacity=1)=>'<circle cx="'+n(x)+'" cy="'+n(y)+'" r="'+n(rad)+'" fill="'+fill+'" opacity="'+n(opacity)+'"/>';
 const path=(d,fill,stroke="none",sw=1,opacity=1)=>'<path d="'+d+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+n(sw)+'" opacity="'+n(opacity)+'"/>';
 let body='<defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="'+bg+'"/><stop offset="1" stop-color="'+shade+'"/></linearGradient><radialGradient id="halo"><stop stop-color="'+light+'" stop-opacity=".65"/><stop offset="1" stop-color="'+accent+'" stop-opacity="0"/></radialGradient></defs><rect width="'+w+'" height="'+h+'" fill="url(#sky)"/>';
 for(let i=0;i<85;i++)body+=circle(r(0,w),r(0,h),r(.4,2.2)*m/768,i%5?white:light,r(.18,.8));
 if(motif==="eclipse"||motif==="mountains"){
  body+=circle(cx,cy,m*.38,"url(#halo)")+circle(cx,cy,m*.19,light)+circle(cx+m*.012,cy-m*.009,m*.174,bg);
  for(let layer=0;layer<4;layer++){const base=h*(.65+layer*.095);let d="M 0 "+h+" L 0 "+n(base);
   for(let j=0;j<=12;j++)d+=" L "+n(j*w/12)+" "+n(base-r(0,m*(.08+layer*.028)));
   body+=path(d+" L "+w+" "+h+" Z",[shade,accent,shade,bg][layer],"none",1,layer===1?.37:1);
  }
 }else if(motif==="sigil"){
  body+=circle(cx,cy,m*.43,"url(#halo)");
  for(let i=0;i<5;i++)body+='<circle cx="'+n(cx)+'" cy="'+n(cy)+'" r="'+n(m*(.12+i*.064))+'" fill="none" stroke="'+(i%2?light:accent)+'" stroke-width="'+n(m*.002)+'" opacity=".75"/>';
  const points=Array.from({length:12},(_,i)=>{const a=i*Math.PI/6-Math.PI/2;return [n(cx+Math.cos(a)*m*.32),n(cy+Math.sin(a)*m*.32)];});
  for(let i=0;i<12;i++){const a=points[i],b=points[(i+5)%12];body+=path("M "+a.join(" ")+" L "+b.join(" "),"none",light,m*.002,.6);}
  body+=circle(cx,cy,m*.045,white);
 }else if(motif==="waves"){
  for(let i=0;i<18;i++){let d="M 0 "+n(h*(.25+i*.04));const phase=r(0,Math.PI*2);
   for(let j=1;j<=48;j++){const x=j*w/48,y=h*(.25+i*.04)+Math.sin(j/48*Math.PI*4+phase)*m*.09;d+=" L "+n(x)+" "+n(y);}
   body+=path(d,"none",i%3===0?light:accent,m*.003,.35+i/45);
  }
 }else{
  for(let i=0;i<9;i++){const x=r(w*.15,w*.85),y=r(h*.12,h*.8),rad=r(m*.035,m*.12);body+=circle(x,y,rad*2,"url(#halo)")+circle(x,y,rad,i%2?shade:accent,.85);body+=circle(x-rad*.27,y-rad*.27,rad*.28,light,.5);}
 }
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'" role="img"><title>'+esc(title)+'</title>'+body+'</svg>';
 return {filename:"miss-chaos-"+motif+"-"+seed+".svg",content:svg,report:{...spec,engine:"procedural-vector-v1",externalInference:false,description:"Seeded original geometric artwork. Not a general text-to-image neural model."}};
}
export function imageCatalog(){return {motifs:motifs.slice(),palettes:Object.keys(palettes),dimensions:[256,512,768,1024],engine:"procedural-vector-v1"};}
