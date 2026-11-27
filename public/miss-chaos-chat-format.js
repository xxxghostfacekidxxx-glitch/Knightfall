/* Limited safe reply formatting. No model-provided HTML or arbitrary executable links. */
(function(root){"use strict";
const hosts=new Set(["ash-fall.com","www.ash-fall.com","openlibrary.org","www.openlibrary.org","doi.org","www.doi.org","polyhaven.com","www.polyhaven.com","www.wikidata.org","en.wikipedia.org","www.metmuseum.org"]);
function safeUrl(value){try{const u=new URL(value);return u.protocol==="https:"&&hosts.has(u.hostname)&&!u.username&&!u.password?u.href:null;}catch{return null;}}
function blocks(value){
 const lines=String(value??"").replace(/\r\n?/g,"\n").split("\n"),out=[];let code=null,paragraph=[];
 const flush=()=>{if(paragraph.length){out.push({type:"paragraph",text:paragraph.join("\n")});paragraph=[];}};
 for(const line of lines){
  if(code){if(/^\s*```\s*$/.test(line)){out.push({type:"code",text:code.lines.join("\n"),lang:code.lang});code=null;}else code.lines.push(line);continue;}
  const fence=line.match(/^\s*```([a-zA-Z0-9_+-]{0,20})\s*$/);if(fence){flush();code={lang:fence[1],lines:[]};continue;}
  if(!line.trim()){flush();continue;}
  const h=line.match(/^(#{1,4})\s+(.+)$/);if(h){flush();out.push({type:"heading",text:h[2]});continue;}
  const list=line.match(/^\s*([-*]|\d+[.)])\s+(.+)$/);if(list){flush();const type=/^\d/.test(list[1])?"ol":"ul",last=out.at(-1);if(last?.type===type)last.items.push(list[2]);else out.push({type,items:[list[2]]});continue;}
  paragraph.push(line);
 }
 if(code)out.push({type:"code",text:code.lines.join("\n"),lang:code.lang});flush();return out;
}
function inline(node,value){
 const token=/(`[^`\n]+`|\*\*[^*\n]+\*\*|https:\/\/[^\s<>"']+)/g;let end=0;
 for(const m of value.matchAll(token)){node.append(value.slice(end,m.index));const raw=m[0];if(raw.startsWith("`")){const e=document.createElement("code");e.textContent=raw.slice(1,-1);node.append(e);}else if(raw.startsWith("**")){const e=document.createElement("strong");e.textContent=raw.slice(2,-2);node.append(e);}else{const trimmed=raw.replace(/[.,;:!?)}\]]+$/g,""),url=safeUrl(trimmed);if(url){const a=document.createElement("a");a.href=url;a.textContent=trimmed;a.rel="noopener noreferrer";if(new URL(url).origin!==location.origin)a.target="_blank";node.append(a,raw.slice(trimmed.length));}else node.append(raw);}end=m.index+raw.length;}
 node.append(value.slice(end));
}
function render(node,value){node.replaceChildren();node.mcRaw=String(value??"");for(const block of blocks(value)){let el;if(block.type==="code"){el=document.createElement("pre");const c=document.createElement("code");c.textContent=block.text;el.append(c);}else if(block.type==="ul"||block.type==="ol"){el=document.createElement(block.type);for(const item of block.items){const li=document.createElement("li");inline(li,item);el.append(li);}}else{el=document.createElement(block.type==="heading"?"h3":"p");inline(el,block.text);}node.append(el);}}
root.KnightfallChaosFormat=Object.freeze({blocks,safeUrl,render});
})(globalThis);
