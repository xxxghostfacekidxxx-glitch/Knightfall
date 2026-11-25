/* Apotheosis: safe plain-text message formatting. No HTML from members is trusted. */
(function(root){
"use strict";
const escape=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function render(value,renderPlain){
 const plain=typeof renderPlain==="function"?renderPlain:s=>escape(s).replace(/\n/g,"<br>");
 const raw=String(value??"");
 const pattern=/(\*\*[^*\n]{1,1000}\*\*|\|\|[^|\n]{1,1000}\|\||`[^`\n]{1,1000}`|(?<!\*)\*[^*\n]{1,1000}\*(?!\*))/g;
 return raw.split(pattern).map((part,i)=>{
  if(i%2===0)return plain(part);
  if(part.startsWith("**"))return "<strong>"+plain(part.slice(2,-2))+"</strong>";
  if(part.startsWith("||"))return '<span class="cs-spoiler"><button type="button" class="cs-spoiler-toggle" aria-expanded="false">Reveal spoiler</button><span hidden>'+plain(part.slice(2,-2))+"</span></span>";
  if(part.startsWith("`"))return "<code>"+escape(part.slice(1,-1))+"</code>";
  return "<em>"+plain(part.slice(1,-1))+"</em>";
 }).join("");
}
function wrap(value,start,end,marker,placeholder){
 const text=String(value??""),a=Math.max(0,Math.min(text.length,Number(start)||0)),b=Math.max(a,Math.min(text.length,Number(end)||0));
 const selection=text.slice(a,b)||placeholder;
 const result=text.slice(0,a)+marker+selection+marker+text.slice(b);
 if(result.length>4000)return null;
 return {value:result,start:a+marker.length,end:a+marker.length+selection.length};
}
function command(text){
 const raw=String(text??"");
 if(raw==="/shrug")return "¯\\_(ツ)_/¯";
 if(raw==="/tableflip")return "(╯°□°)╯︵ ┻━┻";
 if(raw.startsWith("/spoiler ")&&raw.slice(9).trim()&&!raw.slice(9).includes("||")&&!raw.slice(9).includes("\n"))return "||"+raw.slice(9)+"||";
 return raw;
}
root.ChaosphereFormat=Object.freeze({render,wrap,command});
})(globalThis);
