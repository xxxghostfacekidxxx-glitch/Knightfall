/* Chaos Forge: local maker tools, explicit opt-in vision analysis, and Three.js 3D.
 * Photo/model/pattern files are kept client-side unless Analyze is clicked.
 */
import {draftPattern,patternSvg} from "./chaos-forge-core.mjs";
const API="https://api.ash-fall.com";
const $=id=>document.getElementById(id);
const status=(id,text)=>{$(id).textContent=String(text||"")};
const download=(filename,blob)=>{
 const url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1500);
};
const safeName=text=>String(text||"chaos-forge").replace(/[^a-z0-9-]/gi,"-").slice(0,60);
const asBlob=(text,type)=>new Blob([text],{type});
let photo=null,photoFrame=null,outline=[],current=null,currentSvg="",drawing=null,modelKind="",view=null;
const ref=$("forge-reference"),ctx=ref.getContext("2d");
const select=$("forge-template");
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function dimensions(){return {width:$("forge-width").value,height:$("forge-height").value,depth:$("forge-depth").value,seam:$("forge-seam").value};}
function drawPhoto(){
 const w=ref.width,h=ref.height;
 ctx.clearRect(0,0,w,h);
 ctx.fillStyle="#171321";ctx.fillRect(0,0,w,h);
 if(photo){
  const scale=Math.min(w/photo.naturalWidth,h/photo.naturalHeight);
  const dw=photo.naturalWidth*scale,dh=photo.naturalHeight*scale;
  const x=(w-dw)/2,y=(h-dh)/2;photoFrame={x,y,w:dw,h:dh};
  ctx.drawImage(photo,x,y,dw,dh);
  ctx.strokeStyle="rgba(255,255,255,.2)";ctx.strokeRect(x,y,dw,dh);
 }else{
  photoFrame=null;
  ctx.fillStyle="#fba6de";ctx.font="bold 23px system-ui";ctx.textAlign="center";
  ctx.fillText("DROP A PHOTO INTO CHAOS",w/2,h/2-13);
  ctx.font="14px system-ui";ctx.fillStyle="#aab2c0";
  ctx.fillText("Then tap points around the outline",w/2,h/2+20);
 }
 if(outline.length&&photoFrame){
  ctx.beginPath();
  outline.forEach((p,i)=>{const x=photoFrame.x+p[0]*photoFrame.w,y=photoFrame.y+p[1]*photoFrame.h;
   i?ctx.lineTo(x,y):ctx.moveTo(x,y);
  });
  ctx.strokeStyle="#73ffbd";ctx.lineWidth=2.5;ctx.stroke();
  outline.forEach((p,i)=>{const x=photoFrame.x+p[0]*photoFrame.w,y=photoFrame.y+p[1]*photoFrame.h;
   ctx.beginPath();ctx.arc(x,y,4.5,0,Math.PI*2);ctx.fillStyle=i===0?"#ff54a3":"#a4ffd9";ctx.fill();
  });
  if(outline.length>2){
    ctx.setLineDash([6,5]);ctx.beginPath();
    const a=outline[0],b=outline.at(-1);
    ctx.moveTo(photoFrame.x+a[0]*photoFrame.w,photoFrame.y+a[1]*photoFrame.h);
    ctx.lineTo(photoFrame.x+b[0]*photoFrame.w,photoFrame.y+b[1]*photoFrame.h);
    ctx.stroke();ctx.setLineDash([]);
  }
 }
}
drawPhoto();
ref.addEventListener("click",event=>{
 if(!photoFrame)return;
 const rect=ref.getBoundingClientRect(),x=(event.clientX-rect.left)*ref.width/rect.width,
  y=(event.clientY-rect.top)*ref.height/rect.height;
 if(x<photoFrame.x||x>photoFrame.x+photoFrame.w||y<photoFrame.y||y>photoFrame.y+photoFrame.h)return;
 if(outline.length>=100){status("forge-vision-status","Maximum of 100 trace points reached.");return;}
 outline.push([clamp((x-photoFrame.x)/photoFrame.w,0,1),clamp((y-photoFrame.y)/photoFrame.h,0,1)]);
 drawPhoto();
 status("forge-photo-caption",outline.length+" outline points. Continue around the edge; at least 3 are needed.");
});
$("forge-trace-undo").addEventListener("click",()=>{outline.pop();drawPhoto();status("forge-photo-caption",outline.length+" points left.");});
$("forge-trace-clear").addEventListener("click",()=>{outline=[];drawPhoto();status("forge-photo-caption","Outline cleared.");});
$("forge-image").addEventListener("change",async event=>{
 const file=event.target.files?.[0];
 if(!file)return;
 if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>8*1024*1024){status("forge-vision-status","Upload JPEG, PNG or WebP under 8 MB.");event.target.value="";return;}
 const url=URL.createObjectURL(file);
 try{
   const image=new Image();
   await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error("Image couldn't be decoded."));image.src=url;});
   if(!image.naturalWidth||!image.naturalHeight||image.naturalWidth>12000||image.naturalHeight>12000)throw Error("Image dimensions are too large.");
   photo=image;outline=[];drawPhoto();
   status("forge-photo-caption",file.name+" · "+image.naturalWidth+"×"+image.naturalHeight+" · tap to trace outline");
   status("forge-vision-status","Image loaded locally. Only Analyze will send a compressed version to the AI service.");
   $("forge-analysis").hidden=true;
 }catch(error){status("forge-vision-status",error.message);}
 finally{URL.revokeObjectURL(url);}
});
function compactImage(img){
 const can=document.createElement("canvas"),scale=Math.min(1,768/Math.max(img.naturalWidth,img.naturalHeight));
 can.width=Math.max(1,Math.round(img.naturalWidth*scale));
 can.height=Math.max(1,Math.round(img.naturalHeight*scale));
 const c=can.getContext("2d");c.fillStyle="#fff";c.fillRect(0,0,can.width,can.height);c.drawImage(img,0,0,can.width,can.height);
 for(const quality of [.78,.65,.48]){
  const data=can.toDataURL("image/jpeg",quality);
  if(data.length<860000)return data;
 }
 throw Error("Photo too complex. Crop it or use a smaller photo.");
}
$("forge-analyze").addEventListener("click",async()=>{
 if(!photo){status("forge-vision-status","Upload a reference photo first.");return;}
 const button=$("forge-analyze");button.disabled=true;
 status("forge-vision-status","Miss Chaos is inspecting visible parts, joins, materials and likely assembly…");
 try{
  const r=await fetch(API+"/api/chaos/forge/analyze",{
    method:"POST",credentials:"include",cache:"no-store",headers:{"content-type":"application/json"},
    body:JSON.stringify({image:compactImage(photo),kind:$("forge-kind").value,notes:$("forge-notes").value})
  });
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw Error(data.error||"Vision analysis unavailable.");
  $("forge-analysis").hidden=false;$("forge-analysis").textContent=data.analysis;
  status("forge-vision-status","AI analysis received. This is a construction hypothesis; confirm measurements before cutting.");
 }catch(error){
  status("forge-vision-status",error.message);
 }finally{button.disabled=false;}
});
const hints={
 tote:["Finished bag width (in)","Finished bag height (in)","Gusset depth (in)","Two panels, two side strips, one base and straps. Adjust strap length for wearer."],
 pouch:["Pouch width (in)","Pouch height (in)","Pouch depth (in)","Outer shell and optional gusset. Add a closure or zipper matching your final opening."],
 apron:["Apron bottom width (in)","Apron length (in)","Strap / trim depth (in)","Simple apron trapezoid, neck tie and waist ties. Paper-fit before fabric."],
 skirt:["Waist circumference (in)","Skirt length (in)","Hip depth (in, ref.)","Gathered skirt rough draft, not a graded fitted pattern. Verify hips, waistband and drape."],
 box:["Bottom width (in)","Side height (in)","Bottom depth (in)","Open-top box folding net without tabs. Tape or glue corners."],
 trace:["Known reference width (in)","Reference height (not used)","Extrusion thickness (in)","Tap at least three outline points on the photo. The known width sets approximate scale."]
};
function syncTemplate(){
 const labels=hints[select.value];
 $("forge-width-label").textContent=labels[0];
 $("forge-height-label").textContent=labels[1];
 $("forge-depth-label").textContent=labels[2];
 status("forge-dimension-hint",labels[3]);
}
select.addEventListener("change",syncTemplate);syncTemplate();
function renderDraftList(draft){
 const root=$("forge-cut-list");root.replaceChildren();
 const heading=document.createElement("h3");heading.textContent="Cut list";root.append(heading);
 const list=document.createElement("ul");
 draft.pieces.forEach(p=>{const li=document.createElement("li");li.textContent=p.count+" × "+p.name+" • "+p.notes;list.append(li)});
 root.append(list);
 const sub=document.createElement("h3");sub.textContent="Assembly plan";root.append(sub);
 const ol=document.createElement("ol");draft.assembly.forEach(step=>{const li=document.createElement("li");li.textContent=step;ol.append(li)});root.append(ol);
 const warning=document.createElement("p");warning.textContent=draft.caution;root.append(warning);
}
function drawPattern(){
 try{
  const trace=select.value==="trace"?{points:outline,aspect:photo?.naturalHeight/photo?.naturalWidth}:null;
  current=draftPattern(select.value,dimensions(),trace);
  currentSvg=patternSvg(current);
  $("forge-pattern-preview").innerHTML=currentSvg;
  renderDraftList(current);
  $("forge-export-svg").disabled=false;$("forge-export-json").disabled=false;
  status("forge-pattern-status","Draft generated. Download SVG at 100% scale and measure the 1-inch test rectangle.");
  if(view)view.showTemplate(select.value,current);
 }catch(error){
  current=null;currentSvg="";
  $("forge-export-svg").disabled=true;$("forge-export-json").disabled=true;
  status("forge-pattern-status",error.message);
 }
}
$("forge-build").addEventListener("click",drawPattern);
$("forge-export-svg").addEventListener("click",()=>{
 if(!currentSvg)return;
 download("chaos-forge-"+safeName(current.type)+"-pattern.svg",asBlob(currentSvg,"image/svg+xml;charset=utf-8"));
});
$("forge-export-json").addEventListener("click",()=>{
 if(!current)return;
 download("chaos-forge-"+safeName(current.type)+"-cut-list.json",asBlob(JSON.stringify(current,null,2),"application/json;charset=utf-8"));
});
function buildViewer(){
 const TH=window.THREE,canvas=$("forge-3d"),fallback=$("forge-viewer-fallback"),holder=$("forge-viewer");
 if(!TH){fallback.hidden=false;fallback.textContent="3D engine unavailable. Pattern downloads still work.";return null;}
 let renderer,scene,camera,display=new TH.Group(),wire=false,radius=1,theta=.55,phi=.38;
 try{renderer=new TH.WebGLRenderer({canvas,alpha:true,antialias:true,preserveDrawingBuffer:false,powerPreference:"low-power"});}
 catch{fallback.hidden=false;fallback.textContent="WebGL is unavailable on this device. OBJ and SVG downloads remain available.";return null;}
 renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
 scene=new TH.Scene();
 scene.add(new TH.HemisphereLight(0xd5ecff,0x302437,2));
 const light=new TH.DirectionalLight(0xffffff,2.5);light.position.set(20,36,30);scene.add(light);
 const fill=new TH.DirectionalLight(0xff6eb5,1.1);fill.position.set(-22,-10,-18);scene.add(fill);
 scene.add(display);
 camera=new TH.PerspectiveCamera(44,1,.01,4000);
 const grid=new TH.GridHelper(130,40,0x724169,0x433d4e);grid.position.y=-28;scene.add(grid);
 const material=(color=0xc34f8c)=>new TH.MeshStandardMaterial({color,roughness:.83,metalness:.12,side:TH.DoubleSide,wireframe:wire});
 const addBox=(group,w,h,d,x,y,z,color)=>{
  const mesh=new TH.Mesh(new TH.BoxGeometry(Math.max(.05,w),Math.max(.05,h),Math.max(.05,d)),material(color));
  mesh.position.set(x,y,z);group.add(mesh);return mesh;
 };
 function refresh(){
  const width=Math.max(100,holder.clientWidth),height=Math.max(100,holder.clientHeight);
  renderer.setSize(width,height,false);
  camera.aspect=width/height;camera.updateProjectionMatrix();
  camera.position.set(radius*Math.sin(theta)*Math.cos(phi),radius*Math.sin(phi),radius*Math.cos(theta)*Math.cos(phi));
  camera.lookAt(0,0,0);
  renderer.render(scene,camera);
 }
 const observer=new ResizeObserver(refresh);observer.observe(holder);
 function updateMesh(next,kind){
  scene.remove(display);
  display.traverse(obj=>{if(obj.isMesh){obj.geometry?.dispose();obj.material?.dispose();}});
  display=next;
  const bounds=new TH.Box3().setFromObject(display);
  if(bounds.isEmpty())throw Error("No renderable triangles found.");
  const center=bounds.getCenter(new TH.Vector3());display.position.sub(center);
  scene.add(display);
  const size=bounds.getSize(new TH.Vector3()),max=Math.max(size.x,size.y,size.z,1);
  radius=clamp(max*2.4,4,1800);theta=.6;phi=.31;
  modelKind=kind;
  $("forge-export-obj").disabled=false;
  status("forge-model-status",kind+" • interactive preview. Drag to rotate, scroll/pinch to zoom. OBJ export contains illustrative triangle geometry.");
  refresh();
 }
 function showTemplate(type,draft){
  const g=new TH.Group(),m=draft.measurements,w=m.width,h=m.height,d=m.depth;
  if(type==="tote"||type==="box"){
   const t=Math.max(.15,Math.min(.55,d*.07));
   addBox(g,w,t,d,0,-h/2,0,0x4c4256);
   addBox(g,w,h,t,0,0,d/2,0xbc4286);
   addBox(g,w,h,t,0,0,-d/2,0x812a68);
   addBox(g,t,h,d,-w/2,0,0,0x9e477c);
   addBox(g,t,h,d,w/2,0,0,0x9e477c);
   if(type==="tote"){
    for(const z of [-d/2,d/2]){
     const pts=[new TH.Vector3(-w*.29,h*.43,z),new TH.Vector3(-w*.28,h*.78,z),
      new TH.Vector3(w*.28,h*.78,z),new TH.Vector3(w*.29,h*.43,z)];
     const curve=new TH.CatmullRomCurve3(pts);
     const handle=new TH.Mesh(new TH.TubeGeometry(curve,32,Math.max(.12,d*.06),8,false),material(0x62fabc));
     g.add(handle);
    }
   }
  }else if(type==="pouch"){
   addBox(g,w,h,d,0,0,0,0xa33a79);
   addBox(g,w,.12,d+.15,0,h/2+.05,0,0x57f9c3);
  }else if(type==="apron"){
   const top=w*.55,bottom=w;
   const shape=new TH.Shape();
   shape.moveTo(-top/2,h/2);shape.lineTo(top/2,h/2);shape.lineTo(bottom/2,-h/2);
   shape.lineTo(-bottom/2,-h/2);shape.closePath();
   const cloth=new TH.Mesh(new TH.ExtrudeGeometry(shape,{depth:.07,bevelEnabled:false}),material(0xba398b));g.add(cloth);
   addBox(g,top*.1,h*.47,.13,-top*.38,h*.73,0,0x6fffc6);
   addBox(g,top*.1,h*.47,.13,top*.38,h*.73,0,0x6fffc6);
   addBox(g,bottom*.33,.3,.2,-bottom*.65,-h*.07,0,0x6fffc6);
   addBox(g,bottom*.33,.3,.2,bottom*.65,-h*.07,0,0x6fffc6);
  }else if(type==="skirt"){
   const top=Math.max(1,w/(2*Math.PI)*.78),bottom=top*1.65;
   const skirt=new TH.Mesh(new TH.CylinderGeometry(top,bottom,h,36,1,true),material(0xc04a96));g.add(skirt);
   const waist=new TH.Mesh(new TH.CylinderGeometry(top,top,1.2,36,1,true),material(0x6af2b5));waist.position.y=h/2;g.add(waist);
  }else if(type==="trace"){
   const p=draft.pieces[0].points;
   const shape=new TH.Shape();
   p.forEach(([x,y],i)=>i?shape.lineTo(x,-y):shape.moveTo(x,-y));shape.closePath();
   const geometry=new TH.ExtrudeGeometry(shape,{depth:Math.max(.25,d),bevelEnabled:false,curveSegments:2,steps:1});
   g.add(new TH.Mesh(geometry,material(0x56e7ae)));
  }
  updateMesh(g,"Template: "+type);
 }
 const pointers=new Map();
 let oldDistance=0,drag=null;
 canvas.addEventListener("pointerdown",e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});drag={x:e.clientX,y:e.clientY};});
 canvas.addEventListener("pointermove",e=>{
  if(!pointers.has(e.pointerId))return;
  const prev=pointers.get(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pointers.size===2){
   const pts=[...pointers.values()];const dist=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
   if(oldDistance)radius=clamp(radius*oldDistance/Math.max(1,dist),.7,2000);
   oldDistance=dist;
  }else{
   theta+=(e.clientX-prev.x)*.012;phi=clamp(phi+(e.clientY-prev.y)*.008,-1.35,1.35);
  }
  refresh();
 });
 for(const ev of ["pointerup","pointercancel","lostpointercapture"])canvas.addEventListener(ev,e=>{pointers.delete(e.pointerId);oldDistance=0;drag=null;});
 canvas.addEventListener("wheel",e=>{e.preventDefault();radius=clamp(radius*Math.exp(e.deltaY*.001),.7,2000);refresh();},{passive:false});
 $("forge-reset-camera").addEventListener("click",()=>{theta=.55;phi=.3;refresh();});
 $("forge-wireframe").addEventListener("change",e=>{wire=e.target.checked;display.traverse(obj=>{if(obj.isMesh){obj.material.wireframe=wire;obj.material.needsUpdate=true;}});refresh();});
 function loadObj(content){
  const vertex=[],triangles=[];
  const lines=content.split(/\r?\n/);
  if(lines.length>400000)throw Error("OBJ contains too many lines.");
  for(const line of lines){
   const s=line.trim();if(s.startsWith("v ")){const p=s.slice(2).trim().split(/\s+/).slice(0,3).map(Number);
      if(p.length===3&&p.every(Number.isFinite)&&p.every(n=>Math.abs(n)<1e7))vertex.push(p);
      if(vertex.length>180000)throw Error("OBJ vertex limit reached.");
   }else if(s.startsWith("f ")){
    const fields=s.slice(2).trim().split(/\s+/);
    if(fields.length<3||fields.length>40)continue;
    const faces=fields.map(token=>{
      const n=Number(token.split("/")[0]);return Number.isInteger(n)?n>0?n-1:vertex.length+n:-1;
    });
    if(faces.some(i=>i<0||i>=vertex.length))continue;
    for(let j=1;j<faces.length-1;j++){
      for(const k of [faces[0],faces[j],faces[j+1]])triangles.push(...vertex[k]);
      if(triangles.length>360000)throw Error("OBJ triangle limit reached.");
    }
   }
  }
  if(!triangles.length)throw Error("OBJ does not contain faces.");
  return triangles;
 }
 function loadStl(buffer){
  const view=new DataView(buffer),text=new TextDecoder().decode(buffer.slice(0,Math.min(80,buffer.byteLength))).trim();
  if(buffer.byteLength>=84){
    const count=view.getUint32(80,true);
    if(count>0&&count<=50000&&84+count*50===buffer.byteLength){
      const triangles=[];
      for(let i=0;i<count;i++){
       const at=84+i*50;
       for(let v=0;v<3;v++)for(let c=0;c<3;c++)triangles.push(view.getFloat32(at+12+v*12+c*4,true));
      }
      if(!triangles.every(Number.isFinite))throw Error("Invalid STL coordinates.");
      return triangles;
    }
  }
  if(!/^solid\b/i.test(text))throw Error("Unrecognized STL format.");
  const txt=new TextDecoder().decode(buffer);
  const reg=/vertex\s+([-\d.+eE]+)\s+([-\d.+eE]+)\s+([-\d.+eE]+)/g;
  const triangles=[];let match;
  while((match=reg.exec(txt))!==null){triangles.push(...match.slice(1,4).map(Number));if(triangles.length>360000)throw Error("STL triangle limit reached.");}
  if(triangles.length<9||triangles.length%9!==0||!triangles.every(Number.isFinite))throw Error("Invalid STL triangles.");
  return triangles;
 }
 async function importModel(file){
   if(!file||file.size>8*1024*1024)throw Error("Use an OBJ or STL file under 8 MB.");
   let positions;
   if(/\.obj$/i.test(file.name))positions=loadObj(await file.text());
   else if(/\.stl$/i.test(file.name))positions=loadStl(await file.arrayBuffer());
   else throw Error("Only OBJ or STL is supported.");
   const geometry=new TH.BufferGeometry();
   geometry.setAttribute("position",new TH.Float32BufferAttribute(positions,3));
   geometry.computeVertexNormals();
   const group=new TH.Group();group.add(new TH.Mesh(geometry,material(0x6aefbc)));
   updateMesh(group,"Imported "+file.name.slice(0,80));
 }
 function exportObj(){
  const lines=["# Knightfall Chaos Forge • triangulated prototype model"];
  let vertexIndex=1;
  display.updateMatrixWorld(true);
  display.traverse(node=>{
   if(!node.isMesh||!node.geometry?.getAttribute("position"))return;
   const positions=node.geometry.getAttribute("position"),indices=node.geometry.index;
   const count=indices?indices.count:positions.count;
   if(count>400000)throw Error("Model too complex for OBJ export.");
   const temp=new TH.Vector3();
   for(let i=0;i<count;i++){
    const id=indices?indices.getX(i):i;
    temp.fromBufferAttribute(positions,id).applyMatrix4(node.matrixWorld);
    lines.push("v "+temp.x.toFixed(5)+" "+temp.y.toFixed(5)+" "+temp.z.toFixed(5));
   }
   for(let i=0;i+2<count;i+=3){lines.push("f "+vertexIndex+" "+(vertexIndex+1)+" "+(vertexIndex+2));vertexIndex+=3;}
  });
  return lines.join("\n")+"\n";
 }
 $("forge-model-file").addEventListener("change",async e=>{
  try{const f=e.target.files?.[0];if(f)await importModel(f);}catch(error){status("forge-model-status",error.message);}
 });
 $("forge-export-obj").addEventListener("click",()=>{
  try{download("chaos-forge-"+safeName(modelKind)+".obj",asBlob(exportObj(),"text/plain;charset=utf-8"));}
  catch(error){status("forge-model-status",error.message);}
 });
 return{showTemplate};
}
view=buildViewer();
drawPattern();
$("forge-resource-type").addEventListener("change",()=>{});
function showResources(data){
 const root=$("forge-resource-results");root.replaceChildren();
 const items=Array.isArray(data.results)?data.results:[];
 if(!items.length){const p=document.createElement("p");p.textContent="No matching assets in this source. Try a shorter or broader search.";root.append(p);return;}
 for(const item of items){
  if(!/^https:\/\//.test(item.url||""))continue;
  const card=document.createElement("article");card.className="forge-resource-result";
  if(/^https:\/\/(?:cdn\.polyhaven\.com|images\.metmuseum\.org)\//.test(item.image||"")){
   const img=document.createElement("img");img.src=item.image;img.loading="lazy";img.alt=item.title||"Resource preview";card.append(img);
  }
  const content=document.createElement("div"),link=document.createElement("a");
  link.textContent=item.title||"Untitled resource";link.href=item.url;link.target="_blank";link.rel="noopener noreferrer";
  const p=document.createElement("p");p.textContent=[item.description||item.medium||"",item.dimensions||"",item.license||""].filter(Boolean).join(" · ").slice(0,440);
  content.append(link,p);card.append(content);root.append(card);
 }
}
$("forge-resource-form").addEventListener("submit",async event=>{
 event.preventDefault();const source=$("forge-source").value,q=$("forge-query").value.trim(),type=$("forge-resource-type").value;
 if(!q)return;
 status("forge-resource-status","Searching "+source+" for public resources…");
 try{
  const url=new URL(API+"/api/chaos/resources");url.searchParams.set("source",source);url.searchParams.set("q",q);if(source==="polyhaven")url.searchParams.set("type",type);
  const r=await fetch(url.toString(),{credentials:"include",cache:"no-store"});
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw Error(data.error||"Library is temporarily unavailable.");
  showResources(data);
  status("forge-resource-status",data.source+" · "+(data.results?.length||0)+" results. "+(data.attribution||"Free open collection; respect the linked asset's license."));
 }catch(error){status("forge-resource-status",error.message);}
});
