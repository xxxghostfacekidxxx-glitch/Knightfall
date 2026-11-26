import {loadAstronomy} from "./moon-widget.mjs";
import {parseDay,lifePath,numberThemes,arcana,drawCards,skySnapshot,skyAspects,studies} from "./celestial-core.mjs";
const $=id=>document.getElementById(id);
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
const date=$("cs-sky-date"),sky=$("cs-sky-status"),skyBody=$("cs-sky-body"),aspects=$("cs-aspects");
let generation=0;
date.value=new Date().toISOString().slice(0,10);
async function renderSky(now=false){
 const token=++generation;
 skyBody.replaceChildren();aspects.replaceChildren();sky.textContent="Calculating planetary positions…";
 try{
  const instant=now?new Date():parseDay(date.value);
  if(now)date.value=instant.toISOString().slice(0,10);
  const engine=await loadAstronomy();
  if(token!==generation)return;
  const bodies=skySnapshot(engine,instant);
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
function card(c,label){const node=el("article",undefined,"cs-reading-card");node.append(el("span",label,"cs-card-label"),el("span",c[0],"cs-roman"),el("h3",c[1]),el("strong",c[2]),el("p",c[3]));return node;}
function reading(n){const labels=n===1?["Reflection"]:["Current situation","What to examine","Possible next step"];$("cs-reading").replaceChildren(...drawCards(n).map((c,i)=>card(c,labels[i])));$("cs-reading-status").textContent=n+" "+(n===1?"card":"distinct cards")+" drawn for reflection.";}
$("cs-one").addEventListener("click",()=>reading(1));
$("cs-three").addEventListener("click",()=>reading(3));
$("cs-clear").addEventListener("click",()=>{$("cs-reading").replaceChildren();$("cs-reading-status").textContent="Reading cleared.";});
for(const c of arcana){const item=el("details");item.append(el("summary",c[0]+" · "+c[1]),el("p",c[2]+" — "+c[3]));$("cs-arcana").append(item);}
const query=$("cs-study-search"),category=$("cs-study-category"),library=$("cs-study-list");
function filterStudies(){
 const q=query.value.trim().toLowerCase(),group=category.value;
 const matches=studies.filter(item=>(!group||group===item[0])&&item.join(" ").toLowerCase().includes(q));
 library.replaceChildren(...matches.map(([group,title,body,prompt])=>{const article=el("article",undefined,"cs-study");article.append(el("span",group,"cs-card-label"),el("h3",title),el("p",body),el("p",prompt,"cs-prompt"));return article;}));
 $("cs-study-count").textContent=matches.length+" "+(matches.length===1?"entry":"entries");
}
query.addEventListener("input",filterStudies);category.addEventListener("change",filterStudies);filterStudies();renderSky(true);
