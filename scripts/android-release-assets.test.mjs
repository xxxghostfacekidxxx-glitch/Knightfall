import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { runInNewContext } from 'node:vm';
import { makeAssetLinks, makeCandidateMetadata, validateCertFingerprint } from './android-release-assets.mjs';

const FINGERPRINT = 'AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99';
const DIGEST = 'a'.repeat(64);
test('certificate fingerprint must contain exactly 32 bytes', () => {
 assert.equal(validateCertFingerprint(FINGERPRINT), FINGERPRINT);
 for(const bad of ['', 'ABC', 'AA'.repeat(31), '00:11:22', '00'.repeat(33), '../hijack']) {
   assert.throws(() => validateCertFingerprint(bad));
 }
});
test('Digital Asset Links derive from the real certificate and exact Android package', () => {
 const data=makeAssetLinks('com.ashfall.knightfall',FINGERPRINT);
 assert.equal(data.length,1);
 assert.equal(data[0].target.namespace,'android_app');
 assert.equal(data[0].target.package_name,'com.ashfall.knightfall');
 assert.deepEqual(data[0].target.sha256_cert_fingerprints,[FINGERPRINT]);
 assert.deepEqual(data[0].relation,['delegate_permission/common.handle_all_urls']);
 assert.throws(()=>makeAssetLinks('com.other-package',FINGERPRINT));
});
test('candidate metadata is fail-closed, never a public download', () => {
 const meta=makeCandidateMetadata({versionName:'0.2.0',versionCode:2,apkSha256:DIGEST,certificateFingerprint:FINGERPRINT});
 assert.equal(meta.status,'not_released');
 assert.equal(meta.signedReleaseVerified,false);
 assert.equal(meta.apkUrl,null);
 assert.equal(meta.applicationId,'com.ashfall.knightfall');
 assert.equal(meta.versionCode,2);
 assert.throws(()=>makeCandidateMetadata({versionName:'0.2.0',versionCode:0,apkSha256:DIGEST,certificateFingerprint:FINGERPRINT}));
 assert.throws(()=>makeCandidateMetadata({versionName:'0.2.0',versionCode:2,apkSha256:'bad',certificateFingerprint:FINGERPRINT}));
});
test('Android build and emulator smoke are configured without releasing a debug APK',()=>{
 const b=readFileSync(new URL('../android/app/build.gradle',import.meta.url),'utf8');
 const yaml=readFileSync(new URL('../.github/workflows/knightfall-android.yml',import.meta.url),'utf8');
 assert.match(b,/KNIGHTFALL_ANDROID_KEYSTORE_FILE/);
 assert.match(b,/canSignRelease/);
 assert.match(yaml,/emulator-smoke:/);
 assert.match(yaml,/reactivecircus\/android-emulator-runner@v2/);
 assert.match(yaml,/assembleDebug/);
});

test('owner-local signing bootstrap parses safely and cannot publish a public release', () => {
 const scriptPath=new URL('./bootstrap-android-signing.sh',import.meta.url);
 const bootstrap=readFileSync(scriptPath,'utf8');
 const syntax=spawnSync('bash',['-n',scriptPath.pathname],{encoding:'utf8'});
 assert.equal(syntax.status,0,syntax.stderr);
 assert.match(bootstrap,/set -euo pipefail/);
 assert.match(bootstrap,/umask 077/);
 assert.match(bootstrap,/keytool -genkeypair/);
 assert.match(bootstrap,/gh auth status/);
 assert.equal((bootstrap.match(/gh secret set -R "\$REPO" KNIGHTFALL_ANDROID_/g)||[]).length,4);
 assert.match(bootstrap,/KEYSTORE_BASE64/);
 assert.match(bootstrap,/publish_public_release=false/);
 assert.match(bootstrap,/physical_test_confirmation=NOT_TESTED/);
 assert.doesNotMatch(bootstrap,/gh release create|publish_public_release=true/);
 assert.doesNotMatch(bootstrap,/echo "\$KEY_PASS"/);
});

test('public Android release promotes only exact successful signed candidate tested on device',()=>{
 const workflow=readFileSync(new URL('../.github/workflows/knightfall-android-release.yml',import.meta.url),'utf8');
 assert.match(workflow,/candidate_run_id:/);
 assert.match(workflow,/tested_apk_sha256:/);
 assert.match(workflow,/DEVICE_CONFIRMATION.*inputs.physical_test_confirmation/);
 assert.match(workflow,/ANDROID_VERIFIED/);
 assert.match(workflow,/^\s+if: \$\{\{ !inputs.publish_public_release \}\}/m);
 assert.match(workflow,/gh run view "\$CANDIDATE_RUN_ID"/);
 assert.match(workflow,/run\.conclusion!=='success'/);
 assert.match(workflow,/run\.headBranch!=='main'/);
 assert.match(workflow,/gh run download "\$CANDIDATE_RUN_ID"/);
 assert.match(workflow,/sha256sum --check --status/);
 assert.match(workflow,/String\(info\.apkSha256\)\.toLowerCase\(\)/);
 assert.match(workflow,/info\.versionCode!==Number\(process\.env\.VERSION_CODE\)/);
 assert.match(workflow,/STORE_CERT_SHA/);
 assert.match(workflow,/ACTUAL_SHA.*TESTED_APK_SHA256/);
 assert.match(workflow,/cmp -s "\$RUNNER_TEMP\/live-assetlinks\.json"/);
 assert.match(workflow,/gh release create/);
 const verify=workflow.indexOf('ACTUAL_SHA=');
 const release=workflow.indexOf('gh release create');
 const published=workflow.indexOf("entry.signedReleaseVerified=true");
 assert.ok(verify>-1&&release>verify&&published>release,'APK hash verification must precede GitHub Release and site publication');
});

test('internal Android APK finder links only to a successful exact GitHub workflow artifact', async () => {
 const code=readFileSync(new URL('../public/android-test-apk-links.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../public/install.html',import.meta.url),'utf8');
 const ruinwire=readFileSync(new URL('../public/ruinwire.html',import.meta.url),'utf8');
 assert.match(html,/data-android-debug-find="knightfall-android-debug-apk"/);
 assert.match(ruinwire,/data-android-debug-find="ruinwire-android-debug-apk"/);
 assert.match(code,/credentials:"omit"/);
 assert.doesNotMatch(code,/archive_download_url|release create|signedReleaseVerified=true/);
 let click;
 const button={
  dataset:{androidDebugFind:'knightfall-android-debug-apk',targetLink:'debug-link',targetStatus:'debug-status'},
  disabled:false,addEventListener(type,listener){if(type==='click')click=listener;}
 };
 const link={href:'',hidden:true},status={textContent:''};
 const document={
  querySelectorAll:()=>[button],
  getElementById:id=>id==='debug-link'?link:id==='debug-status'?status:null
 };
 const run=(id,conclusion)=>({name:'Knightfall Android test APK',head_branch:'main',conclusion});
 const calls=[];
 const fetch=async url=>{
  calls.push(url);
  let response;
  if(url.includes('/actions/artifacts?'))response={artifacts:[
   {id:100,name:'knightfall-android-debug-apk',expired:false,workflow_run:{id:41}},
   {id:101,name:'knightfall-android-debug-apk',expired:false,workflow_run:{id:42}}
  ]};
  else if(url.endsWith('/41'))response=run(41,'failure');
  else if(url.endsWith('/42'))response=run(42,'success');
  else throw Error('Unexpected URL '+url);
  return {ok:true,json:async()=>response};
 };
 runInNewContext(code,{document,fetch,encodeURIComponent,Object,Number,Error,Array});
 assert.equal(typeof click,'function');
 await click();
 assert.equal(link.hidden,false);
 assert.equal(link.href,'https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions/runs/42/artifacts/101');
 assert.match(status.textContent,/debug-signed/);
 assert.equal(button.disabled,false);
 assert.equal(calls.length,3);
});

test('official Android release download stays disabled without signed verification',()=>{
 const meta=JSON.parse(readFileSync(new URL('../public/android-release.json',import.meta.url),'utf8'));
 const installJs=readFileSync(new URL('../public/install.js',import.meta.url),'utf8');
 assert.equal(meta.status,'not_released');
 assert.equal(meta.signedReleaseVerified,false);
 assert.equal(meta.apkUrl,null);
 assert.match(installJs,/data\.status!=="released"/);
 assert.match(installJs,/data\.signedReleaseVerified!==true/);
});
