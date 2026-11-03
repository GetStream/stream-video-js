#!/usr/bin/env bash
# Builds the dogfood debug APK (JS bundled in) for one matrix variant and copies it to apks/.
#
# Usage: fcm-matrix/build.sh <prototype|baseline> [--rnfb-service] [--no-ws-ring]
#   prototype       callingx from this branch (broadcast receiver)
#   baseline        callingx as on main (service-only): callingx is restored from the commit this
#                   branch was cut from for the build, then put back to HEAD
#   --rnfb-service  keep @react-native-firebase's FirebaseMessagingService in the merged manifest
#                   (dogfood removes it by default), so it competes with ours
#   --no-ws-ring    ignore the coordinator's call.ring WebSocket event in the client
#                   (fcm-matrix/ws-ring.sh), so every ring comes from the FCM push; the source is
#                   put back and the client rebuilt when the build ends
set -euo pipefail
source "$(dirname "$0")/lib.sh"

VARIANT="$1"
shift
RNFB_SERVICE=""
NO_WS_RING=""
for opt in "$@"; do
  case "$opt" in
    --rnfb-service) RNFB_SERVICE=1 ;;
    --no-ws-ring) NO_WS_RING=1 ;;
    *) echo "unknown option: $opt" >&2; exit 1 ;;
  esac
done
LABEL="$VARIANT"
[[ -n "$RNFB_SERVICE" ]] && LABEL="$LABEL-rnfb-service"
[[ -n "$NO_WS_RING" ]] && LABEL="$LABEL-no-ws-ring"

DOGFOOD="$REPO/sample-apps/react-native/dogfood"
MANIFEST="$DOGFOOD/android/app/src/main/AndroidManifest.xml"
CALLINGX="packages/react-native-callingx"

if [[ -n "$(git -C "$REPO" status --porcelain -- "$CALLINGX")" ]]; then
  echo "$CALLINGX has uncommitted changes; commit or stash them first" >&2
  exit 1
fi
if [[ "$("$HERE/ws-ring.sh" status)" != "enabled" ]]; then
  echo "call.ring is already disabled in the client source; run fcm-matrix/ws-ring.sh enable" >&2
  exit 1
fi

export NVM_DIR="$HOME/.nvm"
# shellcheck disable=SC1091
source "$NVM_DIR/nvm.sh"
nvm use 24 >/dev/null
export JAVA_HOME="${JAVA_HOME_FOR_ANDROID:-/Applications/Android Studio.app/Contents/jbr/Contents/Home}"
# A fresh worktree has no (gitignored) local.properties pointing at the SDK.
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"

restore() {
  if [[ -f "$MANIFEST.fcm-matrix.bak" ]]; then
    mv "$MANIFEST.fcm-matrix.bak" "$MANIFEST"
  fi
  if [[ "$VARIANT" == "baseline" ]]; then
    git -C "$REPO" restore --source=HEAD --worktree -- "$CALLINGX"
  fi
  if [[ -n "$NO_WS_RING" ]]; then
    "$HERE/ws-ring.sh" enable
    # dist/ must match the source again, or the next build would ship call.ring disabled.
    (cd "$REPO" && yarn build:client >/dev/null)
  fi
}
trap restore EXIT

if [[ "$VARIANT" == "baseline" ]]; then
  BASE="$(git -C "$REPO" merge-base HEAD origin/main)"
  git -C "$REPO" restore --source="$BASE" --worktree -- "$CALLINGX"
elif [[ "$VARIANT" != "prototype" ]]; then
  echo "unknown variant: $VARIANT" >&2
  exit 1
fi

if [[ -n "$RNFB_SERVICE" ]]; then
  cp "$MANIFEST" "$MANIFEST.fcm-matrix.bak"
  perl -0pi -e 's#\s*<service\s+android:name="io\.invertase\.firebase\.messaging\.ReactNativeFirebaseMessagingService"\s+tools:node="remove"\s*/>##' "$MANIFEST"
fi

[[ -n "$NO_WS_RING" ]] && "$HERE/ws-ring.sh" disable
# Metro bundles the client's dist/, not its source; rebuild it so the APK matches the source
# (including the call.ring toggle above).
(cd "$REPO" && yarn build:client >/dev/null)

# Variants swap callingx's sources in place; Kotlin's incremental caches don't follow that reliably
# (unresolved top-level functions, stale classes), so always compile callingx from scratch.
rm -rf "$REPO/$CALLINGX/android/build"

# The bundle task doesn't track node_modules, so a rebuilt workspace package (e.g. the client's
# dist/) would be skipped as up to date; always re-bundle.
(cd "$DOGFOOD/android" &&
  ./gradlew :app:createBundleDebugJsAndAssets --rerun :app:assembleDebug --console=plain)

mkdir -p "$APKS_DIR"
cp "$DOGFOOD/android/app/build/outputs/apk/debug/app-debug.apk" "$APKS_DIR/$LABEL.apk"
echo "Built $APKS_DIR/$LABEL.apk"
