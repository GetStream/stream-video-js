#!/usr/bin/env bash
# Builds the dogfood debug APK (JS bundled in) for one matrix variant and copies it to apks/.
#
# Usage: fcm-matrix/build.sh <prototype|baseline> [--rnfb-service]
#   prototype       callingx from this branch (broadcast receiver)
#   baseline        callingx as on main (service-only): callingx is restored from the commit this
#                   branch was cut from for the build, then put back to HEAD
#   --rnfb-service  keep @react-native-firebase's FirebaseMessagingService in the merged manifest
#                   (dogfood removes it by default), so it competes with ours
set -euo pipefail
source "$(dirname "$0")/lib.sh"

VARIANT="$1"
RNFB_SERVICE="${2:-}"
LABEL="$VARIANT"
[[ "$RNFB_SERVICE" == "--rnfb-service" ]] && LABEL="$VARIANT-rnfb-service"

DOGFOOD="$REPO/sample-apps/react-native/dogfood"
MANIFEST="$DOGFOOD/android/app/src/main/AndroidManifest.xml"
CALLINGX="packages/react-native-callingx"

if [[ -n "$(git -C "$REPO" status --porcelain -- "$CALLINGX")" ]]; then
  echo "$CALLINGX has uncommitted changes; commit or stash them first" >&2
  exit 1
fi

restore() {
  if [[ -f "$MANIFEST.fcm-matrix.bak" ]]; then
    mv "$MANIFEST.fcm-matrix.bak" "$MANIFEST"
  fi
  if [[ "$VARIANT" == "baseline" ]]; then
    git -C "$REPO" restore --source=HEAD --worktree -- "$CALLINGX"
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

if [[ "$RNFB_SERVICE" == "--rnfb-service" ]]; then
  cp "$MANIFEST" "$MANIFEST.fcm-matrix.bak"
  perl -0pi -e 's#\s*<service\s+android:name="io\.invertase\.firebase\.messaging\.ReactNativeFirebaseMessagingService"\s+tools:node="remove"\s*/>##' "$MANIFEST"
fi

export NVM_DIR="$HOME/.nvm"
# shellcheck disable=SC1091
source "$NVM_DIR/nvm.sh"
nvm use 24 >/dev/null
export JAVA_HOME="${JAVA_HOME_FOR_ANDROID:-/Applications/Android Studio.app/Contents/jbr/Contents/Home}"
# A fresh worktree has no (gitignored) local.properties pointing at the SDK.
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"

(cd "$DOGFOOD/android" && ./gradlew :app:assembleDebug --console=plain)

mkdir -p "$APKS_DIR"
cp "$DOGFOOD/android/app/build/outputs/apk/debug/app-debug.apk" "$APKS_DIR/$LABEL.apk"
echo "Built $APKS_DIR/$LABEL.apk"
