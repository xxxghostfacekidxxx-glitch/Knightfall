import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
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
 const meta=makeCandidateMetadata({versionName:'0.2.0',apkSha256:DIGEST,certificateFingerprint:FINGERPRINT});
 assert.equal(meta.status,'not_released');
 assert.equal(meta.signedReleaseVerified,false);
 assert.equal(meta.apkUrl,null);
 assert.equal(meta.applicationId,'com.ashfall.knightfall');
 assert.throws(()=>makeCandidateMetadata({versionName:'0.2.0',apkSha256:'bad',certificateFingerprint:FINGERPRINT}));
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
