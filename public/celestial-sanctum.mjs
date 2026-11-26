import {loadAstronomy} from "./moon-widget.mjs";
import {parseDay,lifePath,numberThemes,arcana,drawCards,skySnapshot,skyAspects,studies,deck,signs,parseUtcMinute,transitAspects,personalYear,nameNumbers,seasonEvents,wheelPoint} from "./celestial-core.mjs";
const $=id=>document.getElementById(id);
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
const date=$("cs-sky-date"),sky=$("cs-sky-status"),skyBody=$("cs-sky-body"),aspects=$("cs-aspects");
let generation=0;
date.value=new Date().toISOString().slice(0,10);
async function renderSky(now=false){
 const token=++generation;
 skyBody.replaceChildren();aspects.replaceChildren();clearWheel();sky.textContent="Calculating planetary positions…";
 try{
  const instant=now?new Date():parseDay(date.value);
  if(now)date.value=instant.toISOString().slice(0,10);
  const engine=await loadAstronomy();
  if(token!==generation)return;
  const bodies=skySnapshot(engine,instant);renderWheel(bodies);
  for(const b of bodies){const row=el("tr");const header=el("th",b.name);header.scope="row";row.append(header,el("td",b.sign+" "+(Math.floor(b.degree*100)/100).toFixed(2)+"°"),el("td",b.retrograde?"Retrograde":"Direct"),el("td",b.theme));skyBody.append(row);}
  const matches=skyAspects(bodies);
  if(!matches.length)aspects.append(el("li","No listed major aspects within 4°."));
  for(const a of matches)aspects.append(el("li",a.a+" · "+a.type+" · "+a.b+" ("+a.orb.toFixed(2)+"° orb)"));
  sky.textContent="Computed for "+instant.toISOString().replace("T"," ").slice(0,16)+" UTC.";
 }catch(error){if(token===generation)sky.textContent=error.message+" Try again.";}
}
$("cs-sky-form").addEventListener("submit",e=>{e.preventDefault();renderSky();});
$("cs-sky-now").addEventListener("click",()=>renderSky(true));
$("cs-numbers").addEventListener("submit",e=>{
 e.preventDefault();const out=$("cs-number-result");
 try{const {sum,number}=lifePath($("cs-birth").value);out.textContent="Digit sum "+sum+" → "+number+". "+numberThemes[number];}
 catch(error){out.textContent=error.message;}
});
$("cs-numbers").addEventListener("reset",()=>$("cs-number-result").textContent="No calculation yet.");
function card(c,label){const node=el("article",undefined,"cs-reading-card");node.dataset.suit=c[4]||"Major";node.append(el("span",label,"cs-card-label"),el("span",c[0],"cs-roman"),el("h3",c[1]),el("strong",c[2]),el("p",c[3]));return node;}
function reading(n){const labels=n===1?["Reflection"]:n===3?["Current situation","What to examine","Possible next step"]:["Present","Challenge","Resource","Perspective","Next step"];$("cs-reading").replaceChildren(...drawCards(n,Math.random,$("cs-deck").value).map((c,i)=>card(c,labels[i])));$("cs-reading-status").textContent=n+" "+(n===1?"card":"distinct cards")+" drawn for reflection.";}
$("cs-one").addEventListener("click",()=>reading(1));
$("cs-three").addEventListener("click",()=>reading(3));
$("cs-five").addEventListener("click",()=>reading(5));
$("cs-clear").addEventListener("click",()=>{$("cs-reading").replaceChildren();$("cs-reading-status").textContent="Reading cleared.";});
function filterCards(){const q=$("cs-card-search").value.trim().toLowerCase(),matches=deck.filter(c=>c.join(" ").toLowerCase().includes(q));$("cs-arcana").replaceChildren(...matches.map(c=>{const item=el("details");item.append(el("summary",c[0]+" · "+c[1]),el("p",c[2]+" — "+c[3]));return item;}));$("cs-card-count").textContent=matches.length+" cards";}
$("cs-card-search").addEventListener("input",filterCards);filterCards();
const query=$("cs-study-search"),category=$("cs-study-category"),library=$("cs-study-list");
function filterStudies(){
 const q=query.value.trim().toLowerCase(),group=category.value;
 const matches=studies.filter(item=>(!group||group===item[0])&&item.join(" ").toLowerCase().includes(q));
 library.replaceChildren(...matches.map(([group,title,body,prompt])=>{const article=el("article",undefined,"cs-study");article.append(el("span",group,"cs-card-label"),el("h3",title),el("p",body),el("p",prompt,"cs-prompt"));return article;}));
 $("cs-study-count").textContent=matches.length+" "+(matches.length===1?"entry":"entries");
}
query.addEventListener("input",filterStudies);category.addEventListener("change",filterStudies);filterStudies();

const wheel=$("cs-wheel"),planetSelect=$("cs-wheel-select"),wheelDetail=$("cs-wheel-detail");
let wheelBodies=[];
const svgNS="http://www.w3.org/2000/svg";
function shape(tag,attrs={},text){const n=document.createElementNS(svgNS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));if(text!==undefined)n.textContent=text;return n;}
function clearWheel(){wheel.replaceChildren();planetSelect.replaceChildren();planetSelect.disabled=true;wheelBodies=[];wheelDetail.textContent="No sky calculated.";}
function renderWheel(bodies){
 wheelBodies=bodies;
 wheel.replaceChildren();
 for(const r of [62,120,158,192])wheel.append(shape("circle",{cx:200,cy:200,r,class:"cs-wheel-ring"}));
 for(let i=0;i<12;i++){
  const a=wheelPoint(i*30,158),b=wheelPoint(i*30,192),p=wheelPoint(i*30+15,175);
  wheel.append(shape("line",{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:"cs-wheel-line"}),shape("text",{x:p.x,y:p.y,class:"cs-wheel-sign"},String.fromCodePoint(0x2648+i)));
 }
 wheel.append(shape("text",{x:200,y:196,class:"cs-wheel-center"},"TROPICAL"),shape("text",{x:200,y:211,class:"cs-wheel-center"},"SKY"));
 // Dedicated radial lanes avoid overlap at close longitudes; lane radius is not distance.
 bodies.forEach((b,i)=>{
  const p=wheelPoint(b.longitude,72+i*8),edge=wheelPoint(b.longitude,156);
  const g=shape("g",{"data-planet":i,class:"cs-wheel-marker"});g.append(shape("title",{},b.name+" "+b.sign+" "+b.degree.toFixed(2)+"°"),shape("line",{x1:p.x,y1:p.y,x2:edge.x,y2:edge.y}),shape("circle",{cx:p.x,cy:p.y,r:7}),shape("text",{x:p.x,y:p.y},String(i+1)));wheel.append(g);
 });
 planetSelect.replaceChildren(...bodies.map((b,i)=>{const o=el("option",(i+1)+". "+b.name);o.value=String(i);return o;}));planetSelect.disabled=false;inspectPlanet();
}
function inspectPlanet(){
 const i=Number(planetSelect.value),b=wheelBodies[i];if(!b)return;
 for(const marker of wheel.querySelectorAll("[data-planet]"))marker.classList.toggle("is-selected",marker.getAttribute("data-planet")===String(i));
 wheelDetail.textContent=b.name+" · "+b.sign+" "+(Math.floor(b.degree*100)/100).toFixed(2)+"° · "+(b.retrograde?"Retrograde":"Direct")+" · "+b.theme;
}
planetSelect.addEventListener("change",inspectPlanet);
$("cs-transit-utc").defaultValue=new Date().toISOString().slice(0,16);
let transitRun=0;
$("cs-transit-form").addEventListener("submit",async e=>{
 e.preventDefault();const seq=++transitRun,status=$("cs-transit-status"),body=$("cs-transit-body");body.replaceChildren();status.textContent="Comparing skies…";
 try{const n=parseUtcMinute($("cs-natal-utc").value),m=parseUtcMinute($("cs-transit-utc").value),engine=await loadAstronomy();if(seq!==transitRun)return;
 const matches=transitAspects(skySnapshot(engine,n),skySnapshot(engine,m));
 for(const a of matches){const row=el("tr");row.append(el("td",a.transit),el("td",a.type),el("td",a.natal),el("td",a.orb.toFixed(2)+"°"));body.append(row);}
 status.textContent=matches.length+" matching aspects within 2°.";
 }catch(error){if(seq===transitRun)status.textContent=error.message;}
});
$("cs-transit-form").addEventListener("reset",()=>{transitRun++;$("cs-transit-body").replaceChildren();$("cs-transit-status").textContent="Comparison cleared.";});
function numberResult(form,result,calculate){$(form).addEventListener("submit",e=>{e.preventDefault();try{$(result).textContent=calculate();}catch(error){$(result).textContent=error.message;}});$(form).addEventListener("reset",()=>$(result).textContent="No calculation yet.");}
$("cs-personal-year").defaultValue=String(new Date().getUTCFullYear());
numberResult("cs-year-form","cs-year-result",()=>{const n=personalYear($("cs-year-birth").value,Number($("cs-personal-year").value));return "Personal year "+n+" · "+numberThemes[n];});
numberResult("cs-name-form","cs-name-result",()=>{const n=nameNumbers($("cs-name").value);return [["Expression",n.expression],["Soul urge",n.soul],["Personality",n.personality]].map(([label,value])=>label+": "+(value??"not applicable")+(value?" ("+numberThemes[value]+")":"")).join(" • ");});
$("cs-calendar-year").defaultValue=String(new Date().getUTCFullYear());
let calendarRun=0;
async function renderCalendar(){
 const seq=++calendarRun,status=$("cs-calendar-status"),container=$("cs-calendar-events");container.replaceChildren();status.textContent="Calculating seasonal events…";
 try{const year=Number($("cs-calendar-year").value),engine=await loadAstronomy();if(seq!==calendarRun)return;const events=seasonEvents(engine,year);for(const event of events){const article=el("article",undefined,"cs-study"),time=el("time",event.date.replace("T"," ").slice(0,16)+" UTC");time.dateTime=event.date;article.append(el("h3",event.name),time);container.append(article);}status.textContent="Four events calculated for "+year+" (UTC).";}catch(error){if(seq===calendarRun)status.textContent=error.message;}
}
$("cs-calendar-form").addEventListener("submit",e=>{e.preventDefault();renderCalendar();});
renderSky(true);renderCalendar();
