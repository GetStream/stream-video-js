#!/usr/bin/env bash
# Turns the client's handling of the coordinator's call.ring WebSocket event off or on, so a ring
# under test can only come from the FCM push. Only edits the source; build.sh --no-ws-ring also
# rebuilds the client and puts the line back afterwards.
#
# Usage: fcm-matrix/ws-ring.sh <disable|enable|status>
set -euo pipefail

FILE="$(cd "$(dirname "$0")/.." && pwd)/packages/client/src/StreamVideoClient.ts"
LINE="this.on('call.ring', (event) => this.initCallFromEvent(event)),"
MARKER='// FCM-MATRIX: call.ring disabled by fcm-matrix/ws-ring.sh, do not commit'

# Exact matches, so a changed line fails loudly instead of being skipped.
enabled() { grep -q -F -x "      $LINE" "$FILE"; }
disabled() { grep -q -F -x "      // $LINE" "$FILE" && grep -q -F "$MARKER" "$FILE"; }

case "${1:-}" in
  disable)
    if disabled; then echo "call.ring already disabled"; exit 0; fi
    enabled || { echo "call.ring line not found in $FILE; update ws-ring.sh" >&2; exit 1; }
    LINE="$LINE" MARKER="$MARKER" perl -pi -e \
      's/^(\s*)\Q$ENV{LINE}\E$/$1$ENV{MARKER}\n$1\/\/ $ENV{LINE}/' "$FILE"
    echo "call.ring disabled" ;;
  enable)
    if enabled; then echo "call.ring already enabled"; exit 0; fi
    disabled || { echo "call.ring line not found in $FILE; update ws-ring.sh" >&2; exit 1; }
    LINE="$LINE" MARKER="$MARKER" perl -0pi -e \
      's/^(\s*)\Q$ENV{MARKER}\E\n\s*\/\/ \Q$ENV{LINE}\E$/$1$ENV{LINE}/m' "$FILE"
    echo "call.ring enabled" ;;
  status)
    if disabled; then echo "disabled"; elif enabled; then echo "enabled"; else echo "unknown"; exit 1; fi ;;
  *)
    echo "usage: $0 <disable|enable|status>" >&2
    exit 1 ;;
esac
