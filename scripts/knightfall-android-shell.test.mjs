import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const nav=read('public/nav.js');
const index=read('public/index.html');
const josh=read('public/remembering-josh.html');
const installPage=read('public/install.html');
const installScript=read('public/install.js');
const installMeta=JSON.parse(read('public/android-release.json'));
const chat=read('public/chat-bubbles.js');
const arcadeNextgen=read('public/arcade/nextgen.js');
const cabinet=read('public/arcade-cabinet-ui.js');
const androidManifest=read('android/app/src/main/AndroidManifest.xml');
const androidGradle=read('android/app/build.gradle');
const workflow=read('.github/workflows/knightfall-android.yml');

test('shared header includes install link, admin shortcut and persistent admin announcement',()=>{
 assert.doesNotThrow(()=>new vm.Script(nav));
 assert.match(nav,/href="\/install\.html"/);
 assert.match(nav,/class="kf-admin-quick-link"/);
 assert.match(nav,/header\.querySelector\("\.kf-admin-quick-link"\)\.hidden=!admin/);
 assert.match(nav,/id="kf-shared-announcement"/);
 assert.match(nav,/header\.append\(banner\)/);
 assert.match(nav,/announcements_enabled/);
 assert.match(nav,/kf-shared-maintenance/);
});
test('Josh dedication is a footer navigation link, not a home-page hero section',()=>{
 assert.doesNotMatch(index,/id="memorial"/);
 assert.match(index,/class="kf-dedication-link"/);
 assert.match(nav,/href="\/remembering-josh\.html"/);
 assert.match(josh,/Josh.*Van Patten/);
 assert.match(nav,/footer\.site-footer/);
});
test('floating conversations stay usable over first-party fullscreen games',()=>{
 assert.doesNotThrow(()=>new vm.Script(chat));
 assert.match(chat,/function syncFullscreenChat\(\)/);
 assert.match(chat,/fullscreen\.tagName/);
 assert.match(chat,/host\.append\(dock\)/);
 assert.match(chat,/dock\.hidden=false/);
 assert.doesNotMatch(chat,/dock\.hidden=!!document\.fullscreenElement/);
 assert.match(chat,/event\.stopPropagation\(\)/);
 assert.match(arcadeNextgen,/script\[data-kf-arcade-nav\]/);
 assert.match(cabinet,/script\[data-kf-arcade-nav\]/);
});
test('install center supports PWA now and gates APK behind verified release',()=>{
 assert.doesNotThrow(()=>new vm.Script(installScript));
 assert.match(installPage,/id="kf-pwa-install"/);
 assert.match(installPage,/id="kf-apk-download"[^>]*hidden/);
 assert.match(installScript,/beforeinstallprompt/);
 assert.match(installScript,/signedReleaseVerified!==true/);
 assert.match(installScript,/\/releases\/download\//);
 assert.equal(installMeta.status,'not_released');
 assert.equal(installMeta.signedReleaseVerified,false);
 assert.equal(installMeta.apkUrl,null);
});
test('Android TWA test build uses official site, Android API 36, and hosted debug artifacts only',()=>{
 assert.match(androidManifest,/androidbrowserhelper\.trusted\.LauncherActivity/);
 assert.match(androidManifest,/https:\/\/ash-fall\.com\//);
 assert.match(androidManifest,/android:usesCleartextTraffic="false"/);
 assert.match(androidGradle,/compileSdk 36/);
 assert.match(androidGradle,/targetSdk 36/);
 assert.match(androidGradle,/com\.google\.androidbrowserhelper:androidbrowserhelper:/);
 assert.match(workflow,/gradle --project-dir android :app:assembleDebug/);
 assert.match(workflow,/actions\/upload-artifact@v4/);
 assert.match(workflow,/DEBUG-SIGNED TEST APK/);
 assert.doesNotMatch(workflow,/gh release create|:app:bundleRelease/);
});

test('install center uses current Android workflow instead of expiring build artifacts',()=>{
 const page=read('public/install.html');
 assert.match(page,/actions\/workflows\/knightfall-android\.yml/);
 assert.doesNotMatch(page,/actions\/runs\/[0-9]+/);
 assert.doesNotMatch(page,/Artifact expires November/);
 assert.match(page,/id="kf-install-check-run"/);
 assert.match(page,/id="kf-install-check-results"/);
 const code=read('public/install-health.js');
 assert.doesNotThrow(()=>new vm.Script(code));
 assert.match(code,/credentials:"omit"/);
 assert.match(code,/serviceWorker\.getRegistration/);
 assert.match(code,/\/manifest\.webmanifest/);
 assert.match(code,/\/android-release\.json/);
 assert.match(code,/\/\.well-known\/assetlinks\.json/);
 assert.doesNotMatch(code,/api\.ash-fall\.com|credentials:"include"/);
 assert.match(read('public/sw.js'),/knightfall-shell-v36/);
 assert.match(read('public/sw.js'),/\/install-health\.js/);
});

test('Android phone QA is tied to the candidate version, GitHub run and exact APK checksum',()=>{
 const qa=read('public/android-device-check.js');
 assert.doesNotThrow(()=>new vm.Script(qa));
 for(const id of ['kf-qa-build-version','kf-qa-run-id','kf-qa-apk-sha256','kf-qa-device']){
   assert.match(installPage,new RegExp('id="'+id+'"'));
   assert.match(qa,new RegExp(id));
 }
 assert.match(qa,/kf-android-physical-qa-v2/);
 assert.match(qa,/\\^\\[a-f0-9\\]\\{64\\}\\$/);
 assert.match(qa,/Build identity changed: old test checkmarks were cleared/);
 assert.match(qa,/checks\.forEach\(x=>x\.checked=false\)/);
 assert.doesNotMatch(qa,/fetch\(|https?:\/\//);
});
