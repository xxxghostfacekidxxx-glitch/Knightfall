#!/usr/bin/env bash
# One script: the Android emulator runner invokes each command line separately
# unless a shell file is passed as its script. Preserve conditions and pipes.
set -euo pipefail
mkdir -p emulator-evidence
test -s android-test/app-debug.apk
adb install -r android-test/app-debug.apk
adb shell pm path com.ashfall.knightfall | tee emulator-evidence/installed-package.txt
adb shell am start -W -n com.ashfall.knightfall/com.google.androidbrowserhelper.trusted.LauncherActivity | tee emulator-evidence/launch.txt
grep -q 'Status: ok' emulator-evidence/launch.txt
sleep 12
adb shell dumpsys activity activities > emulator-evidence/activities.txt
adb logcat -d -t 2000 > emulator-evidence/logcat.txt
if grep -A 12 -E 'FATAL EXCEPTION' emulator-evidence/logcat.txt | grep -F 'com.ashfall.knightfall'; then
  echo 'Knightfall launcher crashed on Android emulator.' >&2
  exit 1
fi
adb shell screencap -p /sdcard/knightfall-launch.png
adb pull /sdcard/knightfall-launch.png emulator-evidence/launch.png
test -s emulator-evidence/launch.png
{
  echo 'Emulator APK installation, launcher activity and crash-check smoke passed.'
  echo 'This does not verify signed-release Digital Asset Links, authentication, full-screen chat, push or real-device behavior.'
} >> "$GITHUB_STEP_SUMMARY"
