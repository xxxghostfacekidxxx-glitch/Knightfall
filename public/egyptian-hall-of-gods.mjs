import {deities,findDeities} from "./celestial-core.mjs";
const $=id=>document.getElementById(id);
const el=(tag,value,className)=>{const node=document.createElement(tag);if(value!==undefined)node.textContent=value;if(className)node.className=className;return node;};
function emblemImage(file){const img=el("img");img.src="/assets/knightfall/celestial/"+file;img.alt="";img.width=160;img.height=160;img.loading="lazy";img.className="cs-emblem";return img;}
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
