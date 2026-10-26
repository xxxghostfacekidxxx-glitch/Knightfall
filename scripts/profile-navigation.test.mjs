import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script} from "node:vm";
const root=new URL("../public/",import.meta.url);
const js=readFileSync(new URL("profile.js",root),"utf8");
const css=readFileSync(new URL("profile.css",root),"utf8");
test("profile script is valid JavaScript",()=>{assert.doesNotThrow(()=>new Script(js,{filename:"profile.js"}));});
test("profile links reject unsafe URL schemes",()=>{
 const match=js.match(/const safeExternalUrl = ([^;]+);/);
 assert.ok(match,"URL sanitizer exists");
 assert.match(js,/\["https:","http:"\]/);
 assert.match(js,/const safeWebsite = safeExternalUrl\(u.website_url\)/);
});
test("profile jump links only target rendered sections",()=>{
 assert.match(js,/const section=root.querySelector\(selector\)/);
 assert.match(js,/if\(!section\)continue/);
 assert.match(js,/aria-label","Profile sections"/);
 assert.match(js,/if\(jump.children.length>1\)/);
});
test("profile navigation supports mobile and keyboard access",()=>{
 assert.match(css,/\.profile-jump a:focus-visible/);
 assert.match(css,/\.profile-jump\{flex-wrap:nowrap;overflow-x:auto/);
 assert.match(css,/scroll-margin-top/);
});

test("profile editor section navigation targets real editor panels",()=>{
 const html=readFileSync(new URL("profile-edit.html",root),"utf8");
 for(const id of ["studio-appearance","studio-interests","studio-privacy","layout-studio","birth-chart-studio"]){
   assert.match(html,new RegExp('href="#'+id+'"'),"jump link "+id);
   assert.match(html,new RegExp('id="'+id+'"'),"section "+id);
 }
 assert.match(html,/class="studio-save-bar"/);
 assert.match(html,/type="submit">Save profile/);
});
test("cover photo and member details remain usable on phones",()=>{
 assert.match(css,/#profile \.profile-cover::after/);
 assert.match(css,/#profile:has\(\.profile-cover\) \.profile-top/);
 assert.match(css,/#profile dl\{display:grid/);
 assert.match(css,/\.studio-jump a:focus-visible/);
 assert.match(css,/\.studio-save-bar button\{width:100%\}/);
});

test("profile shortcuts follow visible customized panels and include photo gallery",()=>{
 assert.match(js,/function refreshProfileJump\(\)/);
 assert.match(js,/\["#profile-photo-gallery","Photos"\]/);
 assert.match(js,/\["\.profile-social-panel","Updates"\]/);
 assert.match(js,/if\(!section\|\|section.hidden\)continue/);
 assert.match(js,/refreshProfileJump\(\);\}/);
});
test("gallery validates size and image format before uploading",()=>{
 assert.match(js,/file.size>8\*1024\*1024/);
 assert.match(js,/\["image\/jpeg","image\/png","image\/gif","image\/webp"\]/);
 assert.match(js,/finally\{button.disabled=false;\}/);
});

test("gallery viewer restores scroll and disables navigation for one photo",()=>{
 assert.match(js,/document\.body\.style\.overflow="hidden"/);
 assert.match(js,/document\.body\.style\.overflow=previousBodyOverflow/);
 assert.match(js,/\[data-prev\]"\)\.disabled=galleryPhotos\.length<2/);
 assert.match(js,/\[data-next\]"\)\.disabled=galleryPhotos\.length<2/);
});
test("album picker uses a real select instead of a typed album name",()=>{
 assert.match(js,/data-photo-album/);
 assert.match(js,/Choose album for photo/);
 assert.match(js,/albumIds\.find\(a=>String\(a\.id\)===selected\)/);
 assert.doesNotMatch(js,/prompt\("Add to which album/);
});
