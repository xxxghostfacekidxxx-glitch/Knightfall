#!/usr/bin/env bash
# Knightfall owner-only Android release signing bootstrap.
# Run on your trusted Chromebook/Linux/Termux, never inside public CI.
# No private signing key or password is committed or uploaded as an artifact.
set -euo pipefail
umask 077

REPO="xxxghostfacekidxxx-glitch/Knightfall"
ALIAS="knightfall"
DATA_HOME="${XDG_DATA_HOME:-$HOME/.local/share}"
SAFE_DIR="$DATA_HOME/knightfall/android-signing"
KEYSTORE="$SAFE_DIR/knightfall-release.p12"
VERSION_NAME="${KNIGHTFALL_VERSION_NAME:-0.2.0}"
VERSION_CODE="${KNIGHTFALL_VERSION_CODE:-2}"

die(){ printf 'ERROR: %s\n' "$*" >&2; exit 1; }
for app in gh keytool base64 tr; do
  command -v "$app" >/dev/null 2>&1 || die "Missing $app. Install GitHub CLI and Java keytool on your device first."
done
gh auth status --hostname github.com >/dev/null 2>&1 || die "Sign in to GitHub locally first with: gh auth login"
gh repo view "$REPO" --json nameWithOwner --jq .nameWithOwner >/dev/null || die "GitHub account does not have access to $REPO."
[[ -t 0 ]] || die "Run this interactively on your trusted device, not in a web or CI job."
[[ "$VERSION_NAME" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]] || die "Invalid Android version"
[[ "$VERSION_CODE" =~ ^[1-9][0-9]*$ ]] || die "Android versionCode must be a positive integer"
mkdir -p "$SAFE_DIR"
chmod 700 "$SAFE_DIR"

# Avoid regenerating a production signing identity silently.
if [[ -f "$KEYSTORE" ]]; then
  printf 'Reusing existing keystore in %s\n' "$KEYSTORE"
  read -r -s -p 'Enter the existing private keystore password: ' KEY_PASS
  printf '\n'
else
  printf 'This creates a PERMANENT Android app signing identity.\n'
  printf 'Keep a separate secure backup of the resulting keystore and its password.\n'
  read -r -s -p 'Choose a unique keystore password (minimum 14 characters): ' KEY_PASS
  printf '\n'
  read -r -s -p 'Repeat your password: ' CONFIRM
  printf '\n'
  [[ "$KEY_PASS" == "$CONFIRM" ]] || die "Passwords did not match."
  [[ ${#KEY_PASS} -ge 14 ]] || die "The password must be at least 14 characters."
  unset CONFIRM
  export KNIGHTFALL_BOOTSTRAP_KEYPASS="$KEY_PASS"
  keytool -genkeypair -noprompt -storetype PKCS12 \
    -keystore "$KEYSTORE" -alias "$ALIAS" \
    -keyalg RSA -keysize 3072 -validity 10000 \
    -dname "CN=Knightfall, O=Knightfall, C=US" \
    -storepass:env KNIGHTFALL_BOOTSTRAP_KEYPASS \
    -keypass:env KNIGHTFALL_BOOTSTRAP_KEYPASS >/dev/null
  chmod 600 "$KEYSTORE"
  printf 'Created private signing identity. Back up %s separately.\n' "$KEYSTORE"
fi
export KNIGHTFALL_BOOTSTRAP_KEYPASS="$KEY_PASS"
keytool -list -storetype PKCS12 -keystore "$KEYSTORE" -alias "$ALIAS" \
  -storepass:env KNIGHTFALL_BOOTSTRAP_KEYPASS >/dev/null ||
  die "Cannot open keystore; password or alias is incorrect."

printf '\nStoring four encrypted GitHub Actions secrets directly via gh CLI...\n'
# GitHub CLI reads these values from stdin and encrypts them locally. The full
# keystore and password must never be printed or passed via process arguments.
base64 "$KEYSTORE" | tr -d '\r\n' | gh secret set -R "$REPO" KNIGHTFALL_ANDROID_KEYSTORE_BASE64
printf '%s' "$KEY_PASS" | gh secret set -R "$REPO" KNIGHTFALL_ANDROID_KEYSTORE_PASSWORD
printf '%s' "$KEY_PASS" | gh secret set -R "$REPO" KNIGHTFALL_ANDROID_KEY_PASSWORD
printf '%s' "$ALIAS" | gh secret set -R "$REPO" KNIGHTFALL_ANDROID_KEY_ALIAS
unset KEY_PASS KNIGHTFALL_BOOTSTRAP_KEYPASS
printf 'Stored secrets. Only their NAMES, never their values, can be reviewed on GitHub.\n'

# First run: signed candidate ONLY. Do not falsely confirm physical-device QA.
printf '\nStarting Knightfall signed Android candidate (not a public release)...\n'
gh workflow run knightfall-android-release.yml \
  --repo "$REPO" --ref main \
  -f "version_name=$VERSION_NAME" \
  -f "version_code=$VERSION_CODE" \
  -f "stage_asset_links=true" \
  -f "publish_public_release=false" \
  -f "physical_test_confirmation=NOT_TESTED"
printf '\nCandidate requested. Review the Actions run and test the signed APK on a real phone.\n'
printf 'Keep the original keystore plus an encrypted offline backup. Never share either in chat.\n'
