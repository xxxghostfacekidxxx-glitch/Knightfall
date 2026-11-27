// Isolated Egyptian reference archive; no shared Sanctum state.
const root=document.getElementById("egyptian-archive");
if(root){
 const search=root.querySelector("#eg-search"),category=root.querySelector("#eg-category"),count=root.querySelector("#eg-count");
 const entries=[...root.querySelectorAll("[data-eg-record]")].map(el=>({el,category:el.dataset.category,text:normalize(el.textContent)}));
 const sections=[...root.querySelectorAll("[data-eg-section]")];
 function normalize(value){return value.normalize("NFKD").replace(/\p{Diacritic}/gu,"").toLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").trim();}
 function render(){const terms=normalize(search.value).split(/\s+/).filter(Boolean);let n=0;const visible=new Set();for(const entry of entries){const show=(!category.value||entry.category===category.value)&&terms.every(t=>entry.text.includes(t));entry.el.hidden=!show;if(show){n++;visible.add(entry.category);}}for(const section of sections)section.hidden=!visible.has(section.dataset.egSection);count.textContent=n+" of "+entries.length+" records"+(n?"":" — try another name or clear the filter");}
 search.addEventListener("input",render);category.addEventListener("change",render);render();
}
