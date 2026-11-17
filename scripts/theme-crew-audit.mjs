// Veil Sentinel: repository-wide CSS and asset guard. Read-only.
// Every CSS file is recorded. Critical shared-theme errors fail the workflow.
import {readdirSync,readFileSync,statSync,existsSync,mkdirSync,writeFileSync} from "node:fs";
import {join,relative,dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
const root=fileURLToPath(new URL("../public/",import.meta.url));
const output=fileURLToPath(new URL("../artifacts/theme-crew/",import.meta.url));
const files=[],pages=[];
function walk(dir){
 for(const item of readdirSync(dir,{withFileTypes:true})){
  const absolute=join(dir,item.name);
  if(item.isDirectory())walk(absolute);
  else if(item.isFile()){
   const relativePath=relative(root,absolute).replaceAll("\\","/");
   if(item.name.endsWith(".css"))files.push({file:relativePath,absolute,size:statSync(absolute).size});
   else if(item.name.endsWith(".html")&&!relativePath.includes("/"))pages.push(relativePath);
  }
 }
}
walk(root);
const failures=[],warnings=[];
const core=new Set(["theme.css","knightfall-unified-theme.css","theme-crew.css","knightfall-requiem.css"]);
const legacy=/#(?:ff55d8|c6ff45|a8ff3e)(?:[0-9a-f]{2})?\b|rgba\(\s*255\s*,\s*85\s*,\s*216/i;
const records=[];
function balanced(text){
 let curly=0,round=0,quote="",comment=false;
 for(let i=0;i<text.length;i++){
  const c=text[i],n=text[i+1];
  if(comment){if(c==="*"&&n==="/"){comment=false;i++}continue}
  if(quote){if(c==="\\"){i++;continue}if(c===quote)quote="";continue}
  if(c==="/"&&n==="*"){comment=true;i++;continue}
  if(c==='"'||c==="'"){quote=c;continue}
  if(c==="{")curly++;
  if(c==="}")curly--;
  if(c==="(")round++;
  if(c===")")round--;
  if(curly<0||round<0)return false;
 }
 return curly===0&&round===0&&!quote&&!comment;
}
for(const item of files){
 const body=readFileSync(item.absolute,"utf8");
 const important=(body.match(/!important\b/g)||[]).length;
 const legacyColors=(body.match(/#(?:ff55d8|c6ff45|a8ff3e)(?:[0-9a-f]{2})?\b/gi)||[]).length;
 const isCore=core.has(item.file);
 const imports=[...body.matchAll(/@import\s+(?:url\()?\s*["']?([^"')\s;]+)/gi)].map(m=>m[1]);
 const missingAssets=[];
 for(const m of body.matchAll(/url\(\s*["']?(\/[^)'"]+)["']?\s*\)/g)){
  const url=m[1].trim().split(/[?#]/)[0];
  if(url.startsWith("//")||url.includes("$"+"{"))continue;
  const file=resolve(root,"."+url);
  if(!file.startsWith(root)||!existsSync(file))missingAssets.push(url);
 }
 for(const target of imports){
  if(/^data:|^https?:/i.test(target))continue;
  const local=target.startsWith("/")?resolve(root,"."+target.split("?")[0]):resolve(dirname(item.absolute),target.split("?")[0]);
  if(!existsSync(local))failures.push({type:"missing_import",file:item.file,ref:target});
 }
 if(!balanced(body))(isCore?failures:warnings).push({type:"unbalanced_css",file:item.file});
 if(isCore&&legacy.test(body))failures.push({type:"retired_palette",file:item.file});
 if(isCore&&missingAssets.length)failures.push({type:"missing_assets",file:item.file,refs:[...new Set(missingAssets)]});
 else if(missingAssets.length)warnings.push({type:"missing_assets",file:item.file,count:missingAssets.length,refs:[...new Set(missingAssets)].slice(0,8)});
 if(isCore&&important>75)warnings.push({type:"important_heavy",file:item.file,count:important});
 records.push({file:item.file,size:item.size,important,imports:imports.length,missing_assets:missingAssets.length,legacy_colors:legacyColors,core:isCore});
}
const read=name=>readFileSync(join(root,name),"utf8");
for(const name of core)if(!existsSync(join(root,name)))failures.push({type:"missing_shared_css",file:name});
const nav=read("nav.js"),base=read("theme.css"),sw=read("sw.js");
const ordered=["design-system.css","visual-refresh.css","knightfall-unified-theme.css","theme-crew.css","knightfall-requiem.css"];
const positions=ordered.map(x=>base.indexOf('"/'+x));
for(const retired of ["section-overhaul.css","knightfall-artwork.css","knightfall-cathedral-v2.css"]){
 if(existsSync(join(root,retired))||base.includes('"/'+retired))failures.push({type:"retired_css_layer_returned",file:retired});
}
const shared=read("knightfall-unified-theme.css");
for(const marker of ["SECTION FOUNDATIONS","GOTHIC CHROME","ORIGINAL ARTWORK","CATHEDRAL ARCHITECTURE"]){
 if(!shared.includes("/* === CANONICAL KNIGHTFALL CHROME: "+marker+" === */"))failures.push({type:"missing_canonical_block",marker});
}
if(!nav.includes("kfCanonicalTheme")||!nav.includes("themes.shift()"))failures.push({type:"duplicate_theme_loader_guard_missing"});
if(positions.some(i=>i<0)||positions.some((p,i)=>i&&p<positions[i-1]))failures.push({type:"incorrect_theme_layer_order",order:ordered});
if(!base.includes('@import url("/theme-crew.css?'))failures.push({type:"theme_crew_missing_from_base"});
if(!nav.includes('theme-crew-runtime.js'))failures.push({type:"theme_crew_runtime_not_loaded"});
for(const name of ["theme-crew.css","theme-crew-runtime.js","theme-crew.html","theme-crew-ui.js"])
 if(!sw.includes('"/'+name+'"'))failures.push({type:"offline_shell_missing",file:name});
const crew=read("theme-crew.css");
for(const text of ["profile-custom-theme",":has(#profile[data-theme])","kf-gameplay-page"])
 if(!crew.includes(text))failures.push({type:"scope_guard_missing",guard:text});
for(const term of [/\bcanvas\s*\{/i,/\.message\.(?:mine|theirs)\s*\{/i,/[{\s]background\s*:\s*url\(https?:/i])
 if(term.test(crew))failures.push({type:"unsafe_global_css",pattern:String(term)});
for(const p of pages){
 const page=read(p);
 if(!page.includes("nav.js")&&!page.includes("theme-crew-runtime.js")&&page.includes("theme.css")&&!["offline.html","personal-bots-offline.html"].includes(p))warnings.push({type:"no_live_theme_runtime",file:p});
}
const report={time:new Date().toISOString(),css_files:files.length,top_level_pages:pages.length,core_stylesheets:[...core],
 failures,warnings,heaviest_important:records.slice().sort((a,b)=>b.important-a.important).slice(0,12),
 orphan_detection:"See scripts/css-route-inventory.mjs for the separate reference audit",files:records};
mkdirSync(output,{recursive:true});
writeFileSync(join(output,"css-audit.json"),JSON.stringify(report,null,2)+"\n");
console.log("VEIL SENTINEL / CSS AUDIT\n"+JSON.stringify({css_files:report.css_files,pages:report.top_level_pages,critical:failures.length,warnings:warnings.length,heaviest:report.heaviest_important.slice(0,5)},null,2));
if(warnings.length)console.warn("CSS audit warnings (review, do not blindly delete):\n"+JSON.stringify(warnings,null,2));
if(failures.length){console.error("Critical CSS errors\n"+JSON.stringify(failures,null,2));process.exitCode=1}
