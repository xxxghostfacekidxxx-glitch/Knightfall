import {loadAstronomy} from "./moon-widget.mjs";
import {parseDay,lifePath,numberThemes,arcana,drawCards,skySnapshot,skyAspects,studies,deck,signs,parseUtcMinute,transitAspects,personalYear,nameNumbers,seasonEvents,wheelPoint,celestialEvents,runeLetters,drawRune,geometryPattern,deities,findDeities,zodiacCorrespondences,zodiacFor,houseTopics,planetaryMetals,alchemyStages,tarotMotif,tarotAsset,chamberMap,synastryAspects,studyLessons,planetaryHours} from "./celestial-core.mjs";
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
function card(c,label){const node=el("article",undefined,"cs-reading-card");node.dataset.suit=c[4]||"Major";node.append(el("span",label,"cs-card-label"),tarotArt(c),el("span",c[0],"cs-roman"),el("h3",c[1]),el("strong",c[2]),el("p",c[3]));return node;}
function reading(n){const labels=n===1?["Reflection"]:n===3?["Current situation","What to examine","Possible next step"]:["Present","Challenge","Resource","Perspective","Next step"];$("cs-reading").replaceChildren(...drawCards(n,Math.random,$("cs-deck").value).map((c,i)=>card(c,labels[i])));$("cs-reading-status").textContent=n+" "+(n===1?"card":"distinct cards")+" drawn for reflection.";}
$("cs-one").addEventListener("click",()=>reading(1));
$("cs-three").addEventListener("click",()=>reading(3));
$("cs-five").addEventListener("click",()=>reading(5));
$("cs-clear").addEventListener("click",()=>{$("cs-reading").replaceChildren();$("cs-reading-status").textContent="Reading cleared.";});
function filterCards(){const q=$("cs-card-search").value.trim().toLowerCase(),matches=deck.filter(c=>c.join(" ").toLowerCase().includes(q));$("cs-arcana").replaceChildren(...matches.map(c=>{const item=el("details");item.append(el("summary",c[0]+" · "+c[1]));item.addEventListener("toggle",()=>{if(item.open&&item.childNodes.length===1)item.append(tarotArt(c),el("p",c[2]+" — "+c[3]));});return item;}));$("cs-card-count").textContent=matches.length+" cards";}
$("cs-card-search").addEventListener("input",filterCards);filterCards();
const query=$("cs-study-search"),category=$("cs-study-category"),library=$("cs-study-list");
function filterStudies(){
 const q=query.value.trim().toLowerCase(),group=category.value;
 const matches=studies.filter(item=>(!group||group===item[0])&&item.join(" ").toLowerCase().includes(q));
 library.replaceChildren(...matches.map(([group,title,body,prompt,source])=>{const article=el("article",undefined,"cs-study");article.append(el("span",group,"cs-card-label"),el("h3",title),el("p",body),el("p",prompt,"cs-prompt"));if(source){const link=el("a","Read source");link.href=source;article.append(link);}return article;}));
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
 const seq=++calendarRun,status=$("cs-calendar-status"),container=$("cs-calendar-events");container.replaceChildren();status.textContent="Calculating celestial events…";
 try{const year=Number($("cs-calendar-year").value),engine=await loadAstronomy();if(seq!==calendarRun)return;const events=celestialEvents(engine,year,$("cs-event-type").value);for(const event of events){const article=el("article",undefined,"cs-study"),time=el("time",event.date.replace("T"," ").slice(0,16)+" UTC");time.dateTime=event.date;article.append(el("span",event.kind,"cs-card-label"),el("h3",event.name),time);container.append(article);}status.textContent=events.length+" events calculated for "+year+" (UTC).";}catch(error){if(seq===calendarRun)status.textContent=error.message;}
}
$("cs-calendar-form").addEventListener("submit",e=>{e.preventDefault();renderCalendar();});
renderSky(true);renderCalendar();

for(const [glyph,name,sound,theme] of runeLetters){const card=el("article",undefined,"cs-rune");card.append(el("span",glyph,"cs-rune-glyph"),el("h3",name),el("p","Transliteration: "+sound),el("p","Reflection: "+theme));$("cs-rune-grid").append(card);}
$("cs-rune-draw").addEventListener("click",()=>{const [glyph,name,,theme]=drawRune();$("cs-rune-result").textContent=glyph+" · "+name+" · Modern reflection: "+theme+". What does this theme invite you to consider?";});
$("cs-rune-clear").addEventListener("click",()=>{$("cs-rune-result").textContent="No rune selected.";});
const descriptions={circle:"Every point is the same distance from the center.",vesica:"Equal circles intersect; their centers lie on each other's circumference.",rosette:"Six evenly spaced outer circles share the central radius.",hexagram:"Six vertices connected in a single continuous closed path."};
function renderGeometry(){const name=$("cs-geometry-select").value,angle=Number($("cs-geometry-rotation").value),g=geometryPattern(name),svg=$("cs-geometry-svg"),group=shape("g",{transform:"rotate("+angle+" 200 200)"});
for(const c of g.circles)group.append(shape("circle",{cx:c.x,cy:c.y,r:c.r,class:"cs-geometry-line"}));for(const p of g.paths)group.append(shape("polyline",{points:p.map(v=>v.join(",")).join(" "),class:"cs-geometry-line"}));group.append(shape("circle",{cx:200,cy:200,r:3,class:"cs-geometry-center"}));svg.replaceChildren(group);$("cs-geometry-angle").textContent=angle+"°";$("cs-geometry-description").textContent=descriptions[name];}
$("cs-geometry-select").addEventListener("change",renderGeometry);$("cs-geometry-rotation").addEventListener("input",renderGeometry);renderGeometry();

function emblemImage(file){const img=el("img");img.src="/assets/knightfall/celestial/"+file;img.alt="";img.width=160;img.height=160;img.loading="lazy";img.className="cs-emblem";return img;}
function tarotArt(c){const m=tarotMotif(c),art=el("div",undefined,"cs-tarot-art");art.append(emblemImage(tarotAsset(c)));return art;}
function renderGods(){
 const found=findDeities($("cs-god-search").value,$("cs-god-category").value),grid=$("cs-god-grid");grid.replaceChildren();
 for(const [id,name,group,symbol,summary,description,links] of found){
  const card=el("article",undefined,"cs-study cs-deity");card.append(emblemImage("deity-"+id+".svg"),el("span",group,"cs-card-label"),el("h3",name),el("strong",summary),el("p",description));
  const related=el("div",undefined,"cs-related");related.append(el("span","Related figures:"));
  for(const target of links){const d=deities.find(x=>x[0]===target);if(!d)continue;const b=el("button",d[1]);b.type="button";b.addEventListener("click",()=>{$("cs-god-category").value="";$("cs-god-search").value=d[1];renderGods();$("cs-god-search").focus();});related.append(b);}
  card.append(related);grid.append(card);
 }$("cs-god-count").textContent=found.length+" figures";
}
$("cs-god-search").addEventListener("input",renderGods);$("cs-god-category").addEventListener("change",renderGods);renderGods();
function renderZodiac(){const element=$("cs-element").value,mode=$("cs-modality").value,grid=$("cs-zodiac-grid");grid.replaceChildren();for(const [name,e,m,r,t] of zodiacCorrespondences.filter(x=>(!element||x[1]===element)&&(!mode||x[2]===mode))){const card=el("article",undefined,"cs-study");card.append(el("span",String.fromCodePoint(0x2648+signs.indexOf(name)),"cs-rune-glyph"),el("h3",name),el("p",e+" · "+m),el("p","Classical ruler: "+r),el("p","Reflection theme: "+t));grid.append(card);}}
$("cs-element").addEventListener("change",renderZodiac);$("cs-modality").addEventListener("change",renderZodiac);renderZodiac();
for(const [i,topic] of houseTopics.entries()){const card=el("article",undefined,"cs-study");card.append(el("span","HOUSE "+(i+1),"cs-card-label"),el("h3",topic));$("cs-house-grid").append(card);}
for(const [planet,metal,symbol] of planetaryMetals){const card=el("article",undefined,"cs-study");card.append(el("span",symbol,"cs-rune-glyph"),el("h3",metal),el("p","Traditional association: "+planet));$("cs-metal-grid").append(card);}
for(const [i,[name,translation,description,prompt]] of alchemyStages.entries()){const card=el("article",undefined,"cs-study cs-stage");card.dataset.stage=String(i);card.append(el("span",translation,"cs-card-label"),el("h3",name),el("p",description),el("p",prompt,"cs-prompt"));$("cs-stage-grid").append(card);}

function renderChamberMap(){const map=$("cs-constellation-map"),p=chamberMap;for(const [i,j] of [...Array.from({length:8},(_,i)=>[i,(i+1)%8]),[0,8],[1,9],[2,10],[3,10],[4,11],[5,11],[6,8],[7,8],[8,9],[9,10],[10,11],[11,8],[6,12],[12,13],[13,14],[14,4],[5,13]]){const a=p[i],b=p[j];map.append(shape("line",{x1:a[3],y1:a[4],x2:b[3],y2:b[4],class:"cs-map-line"}));}for(const [id,label,glyph,x,y] of p){const link=shape("a",{href:"#"+id,"aria-label":label,tabindex:0,class:"cs-map-star"});link.append(shape("title",{},label),shape("circle",{cx:x,cy:y,r:18}),shape("text",{x,y,class:"cs-map-glyph"},glyph),shape("text",{x,y:y+32,class:"cs-map-label"},label));map.append(link);}}
renderChamberMap();
let synRun=0,synMatches=[];
function renderSynastry(){const filter=$("cs-synastry-filter").value,rows=synMatches.filter(a=>!filter||a.type===filter),body=$("cs-synastry-results");body.replaceChildren(...rows.map(a=>{const row=el("tr");row.append(el("td",a.first),el("td",a.type),el("td",a.second),el("td",a.orb.toFixed(2)+"°"));return row;}));}
$("cs-synastry-filter").addEventListener("change",renderSynastry);
$("cs-synastry-form").addEventListener("submit",async e=>{e.preventDefault();const seq=++synRun,status=$("cs-synastry-status");synMatches=[];renderSynastry();status.textContent="Comparing charts…";try{const a=parseUtcMinute($("cs-synastry-a").value),b=parseUtcMinute($("cs-synastry-b").value),orb=Number($("cs-synastry-orb").value),engine=await loadAstronomy();if(seq!==synRun)return;synMatches=synastryAspects(skySnapshot(engine,a),skySnapshot(engine,b),orb);renderSynastry();status.textContent=synMatches.length+" cross-chart aspects within "+orb+"°.";}catch(error){if(seq===synRun)status.textContent=error.message;}});
$("cs-synastry-form").addEventListener("reset",()=>{synRun++;synMatches=[];renderSynastry();$("cs-synastry-status").textContent="Comparison cleared.";});

function renderLessons(){const v=$("cs-lesson-select").value; $("cs-lesson-grid").replaceChildren(...studyLessons.filter(l=>!v||l[0]===v).map(([path,title,body,prompt])=>{const card=el("article",undefined,"cs-study");card.append(el("span",path,"cs-card-label"),el("h3",title),el("p",body),el("p",prompt,"cs-prompt"));return card;}));}
$("cs-lesson-select").addEventListener("change",renderLessons);renderLessons();
let hourRun=0;
$("cs-hours-date").defaultValue=new Date().toISOString().slice(0,10);
$("cs-hours-form").addEventListener("submit",async e=>{e.preventDefault();const seq=++hourRun,status=$("cs-hours-status"),body=$("cs-hours-body");body.replaceChildren();status.textContent="Calculating sunrise and sunset…";try{const d=$("cs-hours-date").value,lat=$("cs-hours-lat").value,lon=$("cs-hours-lon").value;if(!lat.trim()||!lon.trim())throw Error("Both coordinates are required.");const engine=await loadAstronomy();if(seq!==hourRun)return;const hours=planetaryHours(engine,d,Number(lat),Number(lon));for(const h of hours){const row=el("tr");row.append(el("td",String(h.hour)),el("td",h.period),el("td",h.planet),el("td",h.start.slice(0,16).replace("T"," ")),el("td",h.end.slice(0,16).replace("T"," ")));body.append(row);}status.textContent="24 traditional hours calculated from actual solar events.";}catch(error){if(seq===hourRun)status.textContent=error.message;}});
$("cs-hours-form").addEventListener("reset",()=>{hourRun++;$("cs-hours-body").replaceChildren();$("cs-hours-status").textContent="Calculation cleared.";});
