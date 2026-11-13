#!/usr/bin/env bash
# Rings a user from stream-video-buddy (a headless browser on the `demo` environment, the same one
# dogfood uses by default). Returns right away; the buddy keeps ringing for RING_DURATION seconds.
#
# Usage: RING_CMD='fcm-matrix/ring-buddy.sh' fcm-matrix/run-device.sh …   (or: ring-buddy.sh <user-id>)
# Install: npm i -g 'https://github.com/GetStream/stream-video-buddy#1.8.0'
#          npx -y playwright@1.52.0 install chromium
set -euo pipefail

USER_ID="$1"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Shorter than RING_WAIT_SECONDS, so the call's call.missed push lands in its own case instead of
# the next one.
RING_DURATION="${RING_DURATION:-12}"

export NVM_DIR="$HOME/.nvm"
# shellcheck disable=SC1091
source "$NVM_DIR/nvm.sh"
nvm use 24 >/dev/null

mkdir -p "$HERE/results/logs"
LOG="$HERE/results/logs/buddy-$(date +%Y%m%d-%H%M%S)-$USER_ID.log"
nohup stream-video-buddy ring --user-id "$USER_ID" --duration "$RING_DURATION" \
  --test-name fcm-matrix --verbose >"$LOG" 2>&1 &
echo "buddy ringing $USER_ID for ${RING_DURATION}s (log: $LOG)"
