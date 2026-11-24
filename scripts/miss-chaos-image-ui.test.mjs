import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {checkChaosLocalPhoto} from "../public/chaos-chat-image-picker.mjs";
const load=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const popup=load("public/miss-chaos-presence.js");
const style=load("public/miss-chaos-presence.css");
const full=load("public/miss-chaos.js");
const fullHtml=load("public/miss-chaos.html");
const isisHtml=load("public/samantha-chaos.html");
const library=load("public/devil-tools.html");
const libraryJs=load("public/creator-art-studio.js");
const imageModule=load("public/chaos-chat-image-picker.mjs");
test("dock has a verified Osiris/Isis mode switch, distinct per-mode draft and conversation state",()=>{
 assert.match(popup,/id="mc-private-switch"/);
 assert.match(popup,/privateToggle\.addEventListener\("click"/);
 assert.match(popup,/availableModes\.find\(m=>m\.id==="owner"\|\|m\.id==="partner"\)/);
 assert.match(popup,/await ensureAccount\(true\)/);
 assert.match(popup,/modeLabel\.hidden=availableModes\.length<2/);
 assert.match(popup,/privateToggle\.hidden=!privateMode/);
 assert.match(popup,/chatPhoto\?\.clear\(\)/);
 assert.match(popup,/missChaosPresenceConversation/);
 assert.match(popup,/missChaosPresenceDraft/);
 assert.match(popup,/\/api\/chaos\/modes/);
 assert.match(popup,/companion:assistantMode==="standard"\?undefined:assistantMode/);
});
test("floating popup uses stable viewport coordinates without squashing its avatar and chat composer",()=>{
 assert.match(style,/#miss-chaos-presence\{[^}]*position:fixed/);
 assert.match(style,/#miss-chaos-presence #miss-chaos-window,#miss-chaos-presence #mc-memo-panel\{position:absolute/);
 assert.match(style,/height:min\(550px,calc\(100dvh - 115px\)\)/);
 assert.match(style,/\.mc-head img\{/);
 assert.match(style,/#miss-chaos-launcher img\{width:46px;height:46px/);
 assert.match(style,/#mc-messages\{display:flex;flex:1;flex-direction:column;gap:\.65rem;overflow-y:auto/);
 assert.match(style,/#mc-input\{flex:1;min-width:0;max-height:110px/);
 assert.match(style,/width:min\(404px,calc\(100vw - 24px\)\)/);
 assert.match(style,/@media\(max-width:480px\)/);
});
test("full chat and floating popup both offer one opt-in image that is never stored as bytes",()=>{
 for(const html of [fullHtml,isisHtml]){
  assert.match(html,/id="chaos-chat-image-status"/);
  assert.match(html,/image using \+ Image/);
  assert.match(html,/raw picture is not stored/);
 }
 assert.match(full,/mountChaosChatImage/);
 assert.match(popup,/mountChaosChatImage/);
 assert.match(full,/image:image\|\|undefined/);
 assert.match(popup,/image:imageData\|\|undefined/);
 assert.match(full,/sendingPhoto\?await chatPhoto\.prepare\(\):null/);
 assert.match(popup,/sendingPhoto\?await chatPhoto\.prepare\(\):null/);
 assert.match(full,/chatPhoto\?\.clear\(\)/);
 assert.match(imageModule,/createImageBitmap\(file\)/);
 assert.match(imageModule,/canvas\.toDataURL\("image\/jpeg"/);
 assert.match(imageModule,/field\.accept="image\/\*"/);
 assert.match(imageModule,/event\.clipboardData\?\.files/);
 assert.doesNotMatch(imageModule,/\bfetch\s*\(|XMLHttpRequest|WebSocket|localStorage\.setItem|sessionStorage\.setItem/);
});
test("browser image selection does not expose SVG upload tricks and permits Android image codecs",()=>{
 const base={name:"photo.jpg",type:"image/jpeg",size:2048};
 assert.equal(checkChaosLocalPhoto(base),base);
 assert.equal(checkChaosLocalPhoto({...base,type:"image/heic"}).type,"image/heic");
 assert.throws(()=>checkChaosLocalPhoto({...base,type:"image/svg+xml"}),/Choose/);
 assert.throws(()=>checkChaosLocalPhoto({...base,type:"application/pdf"}),/Choose/);
 assert.throws(()=>checkChaosLocalPhoto({...base,size:9*1024*1024}),/Choose/);
});
test("Site Image Library exposes a dedicated Android Photos picker and real clipboard fallback",()=>{
 assert.match(library,/id="kf-art-photo-input" accept="image\/\*"/);
 assert.match(library,/for="kf-art-photo-input"/);
 assert.match(library,/Google Photos cloud-only items/);
 assert.match(library,/id="kf-art-paste"/);
 assert.match(libraryJs,/photoInput\?\.addEventListener\('change'/);
 assert.match(libraryJs,/navigator\.clipboard\.read\(\)/);
 assert.match(libraryJs,/KnightfallPhotoUpload\.decode\(file\)/);
 assert.match(load("public/photo-upload.js"),/createImageBitmap\(file\)/);
 assert.match(libraryJs,/image\/heic/);
 assert.match(libraryJs,/api\/devil-tools\/asset-submissions/);
});
