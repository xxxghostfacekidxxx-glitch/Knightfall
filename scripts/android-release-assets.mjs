/**
 * Convert the *real* release signing certificate fingerprint into Android Digital
 * Asset Links metadata. Never infer a fingerprint from the APK file's SHA-256.
 *
 * CI usage:
 * node scripts/android-release-assets.mjs --fingerprint "XX:..." --apk /path/to/app.apk --version 0.2.0 --out /tmp/knightfall-release
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const PKG='com.ashfall.knightfall';
export function validateCertFingerprint(input) {
 const value=String(input??'').trim().toUpperCase();
 if(!/^(?:[A-F0-9]{2}:){31}[A-F0-9]{2}$/.test(value))throw new TypeError('Expected a SHA-256 signing certificate fingerprint (32 colon-separated bytes).');
 return value;
}
export function makeAssetLinks(packageName,fingerprint){
 if(packageName!==PKG)throw new TypeError('Unexpected Knightfall package identifier.');
 return [{relation:['delegate_permission/common.handle_all_urls'],
   target:{namespace:'android_app',package_name:packageName,
     sha256_cert_fingerprints:[validateCertFingerprint(fingerprint)]}}];
}
export function makeCandidateMetadata({versionName,apkSha256,certificateFingerprint}){
 if(!/^[0-9]+\.[0-9]+\.[0-9]+(?:-[a-z0-9.]+)?$/i.test(String(versionName)))throw new TypeError('Invalid release version.');
 if(!/^[a-f0-9]{64}$/i.test(String(apkSha256)))throw new TypeError('Expected APK file SHA-256 digest.');
 const fingerprint=validateCertFingerprint(certificateFingerprint);
 return {schemaVersion:1,platform:'android',status:'not_released',
   applicationId:PKG,versionName,apkUrl:null,apkSha256:apkSha256.toLowerCase(),
   signedReleaseVerified:false,signingCertificateSha256:fingerprint,
   notes:'Signed release candidate only. Publish Digital Asset Links, verify on Android hardware, then explicitly release the APK before enabling the public link.'};
}
async function main(){
 const args=new Map();
 for(let i=2;i<process.argv.length;i+=2){
   if(!/^--(?:fingerprint|apk|version|out)$/.test(process.argv[i])||!process.argv[i+1])throw Error('Unrecognized or missing CLI option.');
   args.set(process.argv[i].slice(2),process.argv[i+1]);
 }
 if(args.size!==4)throw Error('Expected --fingerprint, --apk, --version and --out.');
 const apk=readFileSync(resolve(args.get('apk')));
 if(apk.length<10000)throw Error('APK is missing or unexpectedly small.');
 const apkSha256=createHash('sha256').update(apk).digest('hex');
 const out=resolve(args.get('out'));mkdirSync(out,{recursive:true});
 const fingerprint=validateCertFingerprint(args.get('fingerprint'));
 const metadata=makeCandidateMetadata({versionName:args.get('version'),apkSha256,certificateFingerprint:fingerprint});
 writeFileSync(join(out,'assetlinks.json'),JSON.stringify(makeAssetLinks(PKG,fingerprint),null,2)+'\n');
 writeFileSync(join(out,'android-release-candidate.json'),JSON.stringify(metadata,null,2)+'\n');
 writeFileSync(join(out,'app-release.apk.sha256'),apkSha256+'  app-release.apk\n');
 process.stdout.write('Verified certificate fingerprint metadata and private release candidate generated.\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 main().catch(err=>{console.error(err.message);process.exitCode=1});
}
