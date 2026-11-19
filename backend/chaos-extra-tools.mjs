/**
 * Free public creative assistants. Palette math is local and deterministic;
 * dictionary lookup uses only a fixed free public endpoint, never arbitrary URLs.
 */
import {checkChaosContrast} from "./chaos-design-tools.mjs";
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
function parseHex(color){
 if(typeof color!=="string")throw Error("A seed hex color is required.");
 const raw=color.trim().replace(/^#/,"");
 if(!/^(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw))throw Error("Use an opaque #RGB or #RRGGBB color.");
 const hex=raw.length===3?raw.split("").map(ch=>ch+ch).join(""):raw;
 return "#"+hex.toUpperCase();
}
function toHsl(hex){
 const [r,g,b]=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
 const hi=Math.max(r,g,b),lo=Math.min(r,g,b),delta=hi-lo;
 let h=0,s=0,l=(hi+lo)/2;
 if(delta){
  s=delta/(1-Math.abs(2*l-1));
  switch(hi){case r:h=((g-b)/delta)%6;break;case g:h=(b-r)/delta+2;break;default:h=(r-g)/delta+4;}
  h=(h*60+360)%360;
 }
 return {h,s,l};
}
function toHex(h,s,l){
 const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;
 const t=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];
 return "#"+t.map(n=>Math.round((n+m)*255).toString(16).padStart(2,"0")).join("").toUpperCase();
}
export function buildChaosPalette(input={}){
 const seed=parseHex(input.seed);
 const mode=input.mode||"analogous";
 if(!["analogous","complementary","triadic","monochrome"].includes(mode))throw Error("Choose analogous, complementary, triadic or monochrome.");
 const {h,s,l}=toHsl(seed);
 const offsets={analogous:[-45,-22,0,22,45],complementary:[-24,0,24,156,180],triadic:[0,120,240,150,270],monochrome:[0,0,0,0,0]}[mode];
 const lightOffsets=mode==="monochrome"?[-0.24,-0.12,0,0.13,0.26]:[-0.06,0,0.035,-0.02,0.05];
 const colors=offsets.map((offset,index)=>{
  const hex=index===2&&mode==="analogous"||index===1&&mode==="complementary"||index===2&&mode==="monochrome"||index===0&&mode==="triadic"?
    seed:toHex((h+offset+360)%360,clamp(s,0.16,0.95),clamp(l+lightOffsets[index],0.08,0.92));
  const access=checkChaosContrast({foreground:hex,background:hex});
  return {slot:index+1,hex,heading_text:access.best_black_or_white_text,
   heading_text_contrast:access.best_text_contrast_ratio,normal_text_AA:access.best_text_contrast_ratio>=4.5};
 });
 const css=colors.map((color,index)=>`  --chaos-color-${index+1}: ${color.hex};`).join("\n");
 return {source:"Deterministic local Knightfall HSL harmonies and WCAG contrast",seed,mode,colors,
  css_tokens:":root {\n"+css+"\n}",
  limitations:"Harmony is a starting point, not color-management or proof of visual accessibility. Verify colors in context; opaque sRGB only."};
}
export async function lookupChaosDictionary(input={}, {fetcher=fetch}={}){
 const word=String(input.word||"").trim();
 if(!/^[a-z][a-z'-]{0,45}$/i.test(word))throw Error("Enter one English word using letters, apostrophes or hyphens (max 46 characters).");
 const normalized=word.toLowerCase();
 const url="https://api.dictionaryapi.dev/api/v2/entries/en/"+encodeURIComponent(normalized);
 let response;
 try{response=await fetcher(url,{method:"GET",redirect:"error",headers:{accept:"application/json"},
  signal:typeof AbortSignal.timeout==="function"?AbortSignal.timeout(6500):undefined});}
 catch{throw Error("Free dictionary is temporarily unreachable.");}
 const source="Free Dictionary API / English Wiktionary";
 const source_url="https://en.wiktionary.org/wiki/"+encodeURIComponent(normalized);
 if(response?.status===404)return {available:false,word:normalized,source,source_url,message:"No entry found. Try another spelling."};
 if(!response?.ok)throw Error("Free dictionary is unavailable or rate-limited.");
 let data;
 try{data=await response.json();}catch{throw Error("Free dictionary returned unreadable data.");}
 if(!Array.isArray(data))throw Error("Free dictionary returned invalid data.");
 const entries=data.slice(0,2).flatMap(entry=>(Array.isArray(entry.meanings)?entry.meanings:[]).slice(0,3).map(meaning=>({
  part_of_speech:String(meaning.partOfSpeech||"").slice(0,32),
  definitions:(Array.isArray(meaning.definitions)?meaning.definitions:[]).slice(0,2).map(x=>({
   meaning:String(x.definition||"").slice(0,300),example:String(x.example||"").slice(0,170)
  })).filter(x=>x.meaning),
  synonyms:(Array.isArray(meaning.synonyms)?meaning.synonyms:[]).slice(0,7).map(x=>String(x).slice(0,55))
 })).filter(x=>x.definitions.length)).slice(0,6);
 return {available:entries.length>0,word:normalized,phonetic:String(data[0]?.phonetic||"").slice(0,90),
  entries,source,source_url,attribution:"Definitions derive from Wiktionary contributors; attribution and CC BY-SA conditions apply. Follow source for verification.",
  limitations:"A dictionary entry is not a writing critique, and synonyms are not always interchangeable."};
}
