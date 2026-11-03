#!/usr/bin/env bash
# Installs a built variant on a device, opens it for the guest login, then checks from the logs
# that the FCM token was registered with Stream.
#
# Usage: fcm-matrix/install.sh <serial> <build-label>
set -euo pipefail
source "$(dirname "$0")/lib.sh"

SERIAL="$1"
BUILD="$2"

adbs install -r "$APKS_DIR/$BUILD.apk"
# Android 13+: allow the incoming-call notification without a prompt.
if (( $(api_level) >= 33 )); then
  dsh pm grant "$PKG" android.permission.POST_NOTIFICATIONS || true
fi

dsh log -t FCM_MATRIX "INSTALL $BUILD"
launch_app
echo "Log in as a guest on $(device_name), then press Enter."
read -r

TOKEN_LOG="$(adbs logcat -d -v time </dev/null | tr -d '\r' \
  | awk -v id="INSTALL $BUILD" 'found { print } index($0, id) { found = 1 }')"
if grep -q 'Skipped sending firebase token for anonymous user' <<<"$TOKEN_LOG"; then
  echo "FAIL: logged in as an anonymous user; the SDK never registers a push token for those."
elif grep -q -E 'sending (initial )?firebase token' <<<"$TOKEN_LOG"; then
  echo "OK: FCM token sent to Stream (addDevice)."
else
  echo "UNKNOWN: no token registration log line yet (JS log level may be above debug)."
fi
