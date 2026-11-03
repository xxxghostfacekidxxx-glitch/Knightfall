import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script,runInNewContext} from "node:vm";
const root=new URL("../",import.meta.url);
const read=path=>readFileSync(new URL(path,root),"utf8");
const html=read("public/profile-edit.html"),styles=read("public/profile-studio-next.css"),studio=read("public/profile-studio-next.js");
const backend=read("backend/src/index.js");
const inline=[...html.matchAll(/<script\b(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes("studioCropBitmap"));
test("Profile Studio 2 JavaScript and markup parse and retain all supported fields",()=>{
 assert.ok(inline&&inline.length>15000);
 assert.doesNotThrow(()=>new Script(inline));
 assert.doesNotThrow(()=>new Script(studio));
 for(const name of ["display_name","bio","avatar_url","cover_url","accent_color","profile_theme","status_message","tagline","interests","favorite_games","favorite_music","favorite_quote","profile_visibility","show_activity"]){
  assert.ok(html.includes('name="'+name+'"'),"Missing profile field "+name);
  assert.ok(backend.includes("body."+name),"API must accept "+name);
 }
 assert.match(html,/profile-studio-next\.js\?v=20261103-studio2/);
 assert.match(html,/profile-studio-next\.css\?v=20261103-studio2/);
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(ids).size,ids.length,"Duplicate profile editor IDs");
});
test("Image crop framing modifies actual uploaded pixels, not only preview CSS",()=>{
 const fragment=inline.match(/function studioCropBitmap\([\s\S]*?\n\}/)?.[0];
 assert.ok(fragment,"crop helper missing");
 const draw=[],mock={document:{createElement:()=>({width:0,height:0,getContext(){return {drawImage(...args){draw.push(args)}}}})}};
 const crop=runInNewContext("("+fragment+")",mock,{timeout:1000});
 const bitmap={width:800,height:1200};
 const centered=crop(bitmap,320,320,"center"),top=crop(bitmap,320,320,"top"),bottom=crop(bitmap,320,320,"bottom");
 assert.equal(centered.width,320);assert.equal(centered.height,320);
 assert.equal(draw[0][2],200);assert.equal(draw[1][2],0);assert.equal(draw[2][2],400);
 draw.length=0;
 const cover=crop(bitmap,1600,900,"top");
 assert.equal(cover.width,1600);assert.equal(cover.height,900);
 assert.equal(draw[0][2],0);
 assert.ok(draw[0][4]<1200,"Cover crop must use real image bounds");
 assert.match(inline,/image\/jpeg","image\/png","image\/webp/);
 assert.match(inline,/bitmap\.width\*bitmap\.height>36000000/);
 assert.match(inline,/studioCropBitmap\(bitmap,1600,900/);
 assert.match(inline,/studioCropBitmap\(bitmap,320,320/);
 assert.match(inline,/kf:profile-process-start/);
 assert.match(inline,/kf:profile-process-end/);
});
test("Saving profile and section layout is coordinated and does not force navigation",()=>{
 assert.match(inline,/fetch\(API\+"\/api\/profile"/);
 assert.match(inline,/if\(layoutTouched\)\{/);
 assert.match(inline,/fetch\(API\+"\/api\/profile\/layout"/);
 assert.match(inline,/kf:profile-details-saved/);
 assert.match(inline,/kf:profile-saved/);
 assert.match(inline,/kf:layout-saved/);
 assert.match(inline,/kf:profile-save-error/);
 assert.doesNotMatch(inline,/setTimeout\(\(\)=>location\.href/);
 assert.match(inline,/lastSavedLayout/);
 assert.match(inline,/kf:profile-reset-layout/);
 assert.match(inline,/kf:layout-reset/);
 assert.match(studio,/window\.addEventListener\('beforeunload'/);
 assert.match(studio,/event\.returnValue=''/);
 assert.match(studio,/form\.requestSubmit\(\)/);
 assert.doesNotMatch(studio,/\blocalStorage\s*[.\[]/);
});
test("Profile Studio sections are accessible and mobile responsive",()=>{
 for(const id of ["studio-save-indicator","studio-completion-percent","studio-completion-track","studio-privacy-guide","studio-discard","studio-avatar-crop","studio-cover-crop","studio-view-profile","studio-save-all-layout"]){
  assert.match(html,new RegExp('id="'+id+'"'),id);
 }
 for(const id of ["studio-appearance","studio-interests","studio-privacy","photo-studio","layout-studio","birth-chart-studio"]){
  assert.match(html,new RegExp('id="'+id+'"'));
  assert.match(html,new RegExp('href="#'+id+'"'));
 }
 assert.match(html,/role="progressbar"/);
 assert.match(html,/aria-valuemax="100"/);
 assert.match(styles,/\.studio-save-bar\{position:sticky/);
 assert.match(styles,/@media\(max-width:540px\)/);
 assert.match(styles,/prefers-reduced-motion/);
 assert.match(styles,/\.studio-jump\{position:sticky/);
 assert.match(styles,/#c6ff45/);
 assert.match(studio,/kf:profile-loaded/);
 assert.match(studio,/kf:layout-changed/);
 assert.match(studio,/kf:profile-saving/);
});
test("Privacy stays explicit, no public autosave and no unsafe remote image uploads",()=>{
 assert.match(studio,/profile_visibility/);
 assert.match(studio,/Friends-only profile/);
 assert.match(studio,/authorized moderators/);
 assert.match(inline,/Cover image must use an HTTPS URL|cover_url/);
 assert.doesNotMatch(studio,/fetch\(.*\/api\/profile.*method:/);
 assert.match(html,/name="show_activity"/);
 assert.match(html,/id="birth-chart-visible"/);
 assert.match(html,/id="birth-chart-remove"/);
 assert.match(html,/if\(!confirm\("Delete your saved birth chart/);
 assert.match(inline,/studioAvatarVersion\+\+/);
 assert.match(inline,/studioCoverVersion\+\+/);
 assert.match(inline,/URL\.revokeObjectURL/);
});
