import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import vm from "node:vm";
const root=new URL("../public/",import.meta.url);
const read=p=>readFileSync(new URL(p,root),"utf8");
const manifest=JSON.parse(read("chaosphere.webmanifest"));
test("Chaosphere is canonical across pages, navigation, chat and home",()=>{
 for(const page of ["chaosphere.html","messages.html","index.html","nav.js","ruinwire-app.js"])
  assert.match(read(page),/Chaosphere|CHAOSPHERE/,"not branded: "+page);
 assert.match(read("chaosphere.html"),/Enter the chaos\. Find your kind/);
 assert.match(read("chat-bubbles.js"),/kf-chaosphere-demon/);
 assert.match(read("chat-bubbles.css"),/kf-imp-panic/);
 assert.match(read("chat-bubbles.js"),/ChaosphereImp\.mount/);
 assert.match(read("chat-bubbles.js"),/unreadBaselineReady/);
 assert.match(read("chat-bubbles.js"),/serverUnreadBaseline=fetched\.map/);
 assert.match(read("messages.html"),/id="cs-hero-imp"/);
 assert.match(read("sw.js"),/chaosphere-imp\.js/);
 assert.match(read("messages.css"),/\.cs-hero-brand/);
 assert.match(read("index.html"),/href="\/chaosphere\.html"/);
 assert.match(read("install.html"),/Install Chaosphere Messenger/);
 assert.match(read("manifest.webmanifest"),/"name": "Chaosphere"/);
 assert.match(read("arcade-chat-bridge.js"),/Chaosphere/);
});
test("Original mascot ships as accessible SVG without remote assets",()=>{
 const icon=read("icons/chaosphere.svg");
 assert.match(icon,/<svg/);assert.match(icon,/<title /);
 assert.match(icon,/<desc /);
 assert.match(icon,/<\/svg>/);
 assert.doesNotMatch(icon,/<image\b|(?:href|src)=["']https?:\/\//);
 assert.match(read("messages.html"),/alt="Chaosphere's little demon mascot"/);
 assert.match(read("chaosphere.html"),/icons\/chaosphere\.svg/);
});
test("Legacy installed messenger identities remain stable, with no new message database",()=>{
 assert.equal(manifest.id,"/ruinwire");
 assert.equal(manifest.start_url,"/messages?app=chaosphere");
 assert.equal(manifest.short_name,"Chaosphere");
 assert.equal(manifest.icons[0].src,"/icons/chaosphere.svg");
 assert.deepEqual(JSON.parse(read("ruinwire.webmanifest")),manifest);
 assert.match(read("ruinwire.html"),/location\.replace\("\/chaosphere\.html"/);
 assert.match(read("ruinwire-app.js"),/\["chaosphere","ruinwire"\]/);
 assert.match(read("ruinwire-app.js"),/\/chaosphere\.webmanifest/);
 assert.match(read("chat-bubbles.js"),/\/api\/messages\/conversations/);
 assert.match(read("sw.js"),/knightfall-shell-v\d+/);
 for(const path of ["chaosphere.html","chaosphere.webmanifest","icons/chaosphere.svg"])
  assert.ok(existsSync(new URL(path,root)),path+" must be shipped");
 new vm.Script(read("ruinwire-app.js"));
 new vm.Script(read("ruinwire-install.js"));
});
test("Android keeps its upgrade package and launches Chaosphere",()=>{
 const app=readFileSync(new URL("../android/ruinwire/build.gradle",import.meta.url),"utf8");
 const androidManifest=readFileSync(new URL("../android/ruinwire/src/main/AndroidManifest.xml",import.meta.url),"utf8");
 const androidLabel=readFileSync(new URL("../android/ruinwire/src/main/res/values/strings.xml",import.meta.url),"utf8");
 assert.match(app,/applicationId 'com\.ashfall\.ruinwire'/);
 assert.match(androidManifest,/app=chaosphere/);
 assert.match(androidLabel,/>Chaosphere<\/string>/);
 assert.ok(existsSync(new URL("../android/ruinwire/src/main/res/drawable/ruinwire_icon.xml",import.meta.url)));
});
test("Existing games still target canonical conversation fallback and branded overlay",()=>{
 for(const p of ["arcade/hosted/hex-and-whisk/index.html","arcade/hosted/imp-inferno/index.html","city-of-cinders.html"]){
  assert.match(read(p),/arcade-chat-bridge\.js\?v=20261117-chaosphere1/);
  assert.match(read(p),/Chaosphere/);
  assert.match(read(p),/\/messages\.html/);
 }
});

test("Trouble uses the detailed static messenger icon and matching Android palette",()=>{
 const icon=read("icons/chaosphere.svg");
 assert.ok(icon.includes("Trouble, Knightfall's infernal messenger"));
 assert.ok(icon.includes('id="eyes"')&&icon.includes('id="badge"'));
 assert.ok(!icon.includes("<style>")&&!icon.includes("<animate"));
 assert.ok(read("sw.js").includes("knightfall-shell-v"));
 assert.ok(read("chat-bubbles.js").includes('src="/icons/chaosphere.svg"'));
 const native=readFileSync(new URL("../android/ruinwire/src/main/res/drawable/ruinwire_icon.xml",import.meta.url),"utf8");
 assert.ok(native.includes('viewportWidth="320"')&&native.includes("#ffcf4c"));
});
