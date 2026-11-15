#!/usr/bin/env bash
# Validate Gradle's RELEASE signing with a throwaway CI-only certificate.
# The disposable keystore and APK are never uploaded or published.
set -euo pipefail
scratch="$(mktemp -d)"
trap 'rm -rf "$scratch"' EXIT
key="$scratch/disposable-ci-keystore.p12"
password="$(openssl rand -hex 18)"
keytool -genkeypair -noprompt -storetype PKCS12 -keystore "$key" \
  -alias disposable-ci-key -keyalg RSA -keysize 3072 -validity 3 \
  -dname "CN=Disposable CI Test, O=Knightfall, C=US" \
  -storepass "$password" -keypass "$password" >/dev/null 2>&1
export KNIGHTFALL_ANDROID_KEYSTORE_FILE="$key"
export KNIGHTFALL_ANDROID_KEYSTORE_PASSWORD="$password"
export KNIGHTFALL_ANDROID_KEY_ALIAS="disposable-ci-key"
export KNIGHTFALL_ANDROID_KEY_PASSWORD="$password"
gradle --project-dir android :app:assembleRelease --no-daemon \
  -PknightfallVersionCode=2 -PknightfallVersionName=0.1.0
apk="android/app/build/outputs/apk/release/app-release.apk"
test -s "$apk"
apksigner="$ANDROID_SDK_ROOT/build-tools/35.0.0/apksigner"
test -x "$apksigner"
"$apksigner" verify --verbose --print-certs "$apk" > "$scratch/apk-verification.txt"
apk_sha="$(awk -F': ' '/Signer #1 certificate SHA-256 digest:/ {print $2; exit}' "$scratch/apk-verification.txt")"
store_sha="$(keytool -exportcert -keystore "$key" -alias "$KNIGHTFALL_ANDROID_KEY_ALIAS" \
  -storepass "$password" | openssl dgst -sha256 | sed 's/.*= //')"
[[ "$apk_sha" =~ ^[a-f0-9]{64}$ && "$apk_sha" == "$store_sha" ]] || {
  echo "Release APK's certificate does not match the disposable signing key." >&2
  exit 1
}
fingerprint="$(printf %s "$apk_sha" | sed 's/../&:/g;s/:$//' | tr '[:lower:]' '[:upper:]')"
node scripts/android-release-assets.mjs --apk "$apk" \
  --version "0.1.0" --version-code 2 --fingerprint "$fingerprint" --out "$scratch/generated"
node -e '
const fs=require("node:fs");
const x=JSON.parse(fs.readFileSync(process.argv[1]));
const y=JSON.parse(fs.readFileSync(process.argv[2]));
if(x.length!==1||x[0].target.package_name!=="com.ashfall.knightfall")process.exit(1);
if(y.status!=="not_released"||y.versionCode!==2||y.signedReleaseVerified!==false||y.apkUrl!==null)process.exit(1);
' "$scratch/generated/assetlinks.json" "$scratch/generated/android-release-candidate.json"
echo 'Disposable release signing, APK cryptographic verification, and assetlinks generation passed.' >> "$GITHUB_STEP_SUMMARY"
echo 'No permanent signing certificate was generated, stored, or uploaded by this test.' >> "$GITHUB_STEP_SUMMARY"
