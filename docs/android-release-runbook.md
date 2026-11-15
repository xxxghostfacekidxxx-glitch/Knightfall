# Knightfall Android release and signing runbook

Last updated: 2026-11-14. Public origin: https://ash-fall.com. Provisional Android package: `com.ashfall.knightfall`.

> Account-erasure evidence and implementation gates: [Account erasure matrix](ACCOUNT-DELETION-ERASURE-MATRIX-2026-11-15.md). Production request intake exists, but verified cross-store erasure is **not complete**.

## Status and separation of responsibilities

- **Debug build:** `.github/workflows/knightfall-android.yml` builds an installable debug APK in GitHub Actions; now also runs an Android emulator smoke job. This build has a *temporary* signing certificate and is not a permanent public release. The job does **not** put signing keys into files or the repository.
- **Signed release candidate:** `.github/workflows/knightfall-android-release.yml` can assemble both a release APK and Play-ready AAB, verify their signatures, and generate a matching Digital Asset Links statement. **It does not run on pushes or pull requests.** It requires manual dispatch on `main` and four configured GitHub Actions secrets.
- **Public install center:** `public/install.html` links the working PWA and current test builds. The official public APK URL remains disabled in `public/android-release.json` until the verified signed release is actually published.
- **Real Android hardware tests:** still require a physical device. The GitHub emulator smoke test is a separate and narrower technical check, not evidence of working push notifications or real phone gestures.
- **Play Store:** requires its own policy/identity steps, including verified privacy and account-deletion flows. A public GitHub APK does not imply Play Store approval.

## Owner setup in one local script (recommended)

A secure bootstrap script is available in the repository at [`scripts/bootstrap-android-signing.sh`](../scripts/bootstrap-android-signing.sh). On your trusted Chromebook Linux terminal, install the GitHub CLI and Java 17 once, sign in, then run:

```bash
sudo apt update && sudo apt install -y gh openjdk-17-jdk git
gh auth login
git clone https://github.com/xxxghostfacekidxxx-glitch/Knightfall.git
cd Knightfall
bash scripts/bootstrap-android-signing.sh
```

If you already cloned Knightfall, use the existing checkout and `git pull --ff-only origin main` instead of cloning again. The script runs **locally**, prompts invisibly for a long password, creates or reuses a private persistent keystore under `~/.local/share/knightfall/android-signing/`, uploads four encrypted GitHub Actions secrets **directly from stdin**, and starts the signed candidate workflow on the existing `main` branch with public release disabled. It never prints the keystore or password to the terminal and never creates a pull request. It requires a GitHub account with permission to edit repository Actions secrets.

On Android, use a trusted Termux environment with `git`, `gh`, and Java `keytool` installed; the same script works in an interactive POSIX-compatible Bash environment. Do not run the bootstrap in public CI, from a link that you have not inspected, or on a shared device. Confirm that you have a secure backup of the signing key before publishing.

## One-time release signing key, performed privately by site owner

**Never paste the keystore or passwords into ChatGPT, GitHub issues, commits, forum threads, or website files.** Keep at least two encrypted, independently stored backups of the keystore. If the signing key is lost, future installed APK updates may be impossible to sign with the same identity.

Use a Linux terminal on your Chromebook (no Android Studio necessary) or another trusted system:

```bash
sudo apt update
sudo apt install -y openjdk-17-jdk
umask 077
keytool -genkeypair -v -storetype PKCS12 \
  -keystore knightfall-upload.jks -alias knightfall \
  -keyalg RSA -keysize 3072 -validity 10000 \
  -dname "CN=Knightfall, O=Knightfall, C=US"
```

`keytool` asks for the password without printing it. Record the alias and passwords in a secure password manager. Do not place `knightfall-upload.jks` in the Knightfall repository.

In **GitHub → Knightfall repository → Settings → Secrets and variables → Actions**, create:

| GitHub Actions secret | Value |
| --- | --- |
| `KNIGHTFALL_ANDROID_KEYSTORE_BASE64` | Exact base64 of the binary `knightfall-upload.jks`. On Linux use `base64 -w0 knightfall-upload.jks`; treat this output as highly sensitive. |
| `KNIGHTFALL_ANDROID_KEYSTORE_PASSWORD` | The private keystore password |
| `KNIGHTFALL_ANDROID_KEY_ALIAS` | The alias entered during key generation, e.g. `knightfall` |
| `KNIGHTFALL_ANDROID_KEY_PASSWORD` | The private key password (often the same as the store password for PKCS12) |

Do **not** confuse these secrets with the `CLOUDFLARE_API_TOKEN`, GitHub account password, or an unrelated Android app key. Do not expose these credentials through any uploaded GitHub Actions artifact. The signing workflow runs on `main` only, with release credentials present only in the protected workflow environment.

## Stage 1: Build a signed release candidate

1. Open [Knightfall signed Android release workflow](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions/workflows/knightfall-android-release.yml).
2. Choose **Run workflow** on the existing `main` branch.
3. Enter a unique `version_name` such as `0.2.0` and positive `version_code` such as `2`.
4. Set **stage_asset_links** to **true** to commit `public/.well-known/assetlinks.json` on `main` and wait for https://ash-fall.com/.well-known/assetlinks.json to serve the *actual* certificate fingerprint. The workflow fails closed if Cloudflare does not serve it.
5. Keep **publish_public_release** **false** for now and keep **physical_test_confirmation** at `NOT_TESTED`.
6. On success, download the `knightfall-signed-release-candidate` artifact and check `app-release.apk`, `app-release.aab`, their SHA-256 checksums, `assetlinks.json`, and `android-release-candidate.json`. These are public-repo CI artifacts, not a secure channel for keystores/passwords.

The workflow verifies that the APK's signing certificate matches the configured keystore before creating Digital Asset Links. A SHA-256 **APK file hash** is **not** an Android signing-certificate fingerprint; never substitute one for the other.

## Stage 2: Verify on a real Android phone

After the domain statement is live, install the **signed candidate APK** on an Android test device from the official GitHub Actions artifact.

Test at minimum: app launch and absence of address-bar chrome; account sign-in and sign-out; incoming and outgoing messages; chat overlays while an original arcade game is fullscreen; game touch controls and back navigation; switching apps and returning; denied/granted push permission; notification receipt while backgrounded; offline fallback; screen rotation, app update, and link handling.

You can also use Android Platform Tools:

```bash
adb install -r app-release.apk
adb shell pm get-app-links com.ashfall.knightfall
adb shell am start -W -n com.ashfall.knightfall/com.google.androidbrowserhelper.trusted.LauncherActivity
```

If Android still opens a Custom Tab rather than a verified TWA, inspect the exact `assetlinks.json`, the signing certificate, browser version, redirects, and app-link verification. Never mark hardware testing complete based solely on CI or a screenshot.

## Stage 3: Publish the **exact APK that was tested**

Do **not** rebuild the APK during promotion. Different signing timestamps or toolchain states can change the output, even if the source is unchanged. Knightfall now publishes the **exact signed candidate artifact** tested on the Android phone.

1. In the successful [signed-candidate workflow](https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions/workflows/knightfall-android-release.yml), record the numeric GitHub **run ID** from the URL and download the `knightfall-signed-release-candidate` ZIP. It contains `app-release.apk`, `app-release.aab`, `app-release.apk.sha256`, `assetlinks.json`, and `android-release-candidate.json`.
2. Verify the SHA-256 of the extracted `app-release.apk` against `app-release.apk.sha256`. Android device testing must use **this extracted signed candidate APK**, not a debug APK or a newly rebuilt APK. Record the exact 64-character SHA-256 hash as `tested_apk_sha256`.
3. Verify sign-in, chat during games, touch navigation, real background push, Android Back, browser-chrome-free TWA verification, account recovery, and update install on actual hardware. The browser-only and emulator checks do not replace these checks. Record the phone model/Android version and the test results.
4. Rerun the **signed Android release workflow** from `main` with the **same** `version_name` and `version_code` as the candidate, set **candidate_run_id** to the successful candidate run ID, **tested_apk_sha256** to the exact verified candidate hash, **stage_asset_links=true**, **publish_public_release=true**, and **physical_test_confirmation=ANDROID_VERIFIED**.
5. The workflow verifies that the candidate run was a successful manual signing run on `main`, retrieves its original GitHub Actions artifact, confirms its version name, numeric Android version code and package identity, checks the file SHA-256 against the phone-tested fingerprint, verifies its APK signature against the protected release keystore, and only then publishes that **same file** on the official GitHub Release. It does **not** rebuild the APK for promotion.
6. The workflow compares the deployed Digital Asset Links to the real signing fingerprint on `https://ash-fall.com/.well-known/assetlinks.json`. It only enables the site's public download link after the GitHub Release contains the signed APK.

**Publication fails closed** if the run ID is missing/incorrect, artifact expired, APK hash differs, certificate does not match, required physical test confirmation is missing, or live domain verification fails. Candidate artifacts expire after seven days by default; create a new signed candidate and retest if the artifact is no longer available. Never use `ANDROID_VERIFIED` unless you actually completed the hardware acceptance tests.

A GitHub Actions publication has `contents:write` scope and requires permission to push `main`. If branch protection or Cloudflare deployment fails, resolve that blocker rather than forcing an unverified download. The Play Store path additionally requires policy, privacy and account-deletion work; a GitHub APK release is not Play Console approval.

## Threat and ownership notes

The GitHub repository is public, so assume build artifacts and GitHub releases can be retrieved by other people. The signing keystore must never be part of those files. Use a unique persistent release certificate for the app and protect it offline. A Play Store app using Play App Signing may use Google's managed app signing certificate for store distribution; adjust Digital Asset Links accordingly if that later differs from the direct APK release certificate.

Current pending items: owner-managed keystore and four GitHub Action secrets; signed release-candidate run; verified production Digital Asset Links; real-device test evidence; Play Console enrollment, privacy/account deletion and store-policy readiness where relevant.
