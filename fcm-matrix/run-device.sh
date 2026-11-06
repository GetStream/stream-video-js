#!/usr/bin/env bash
# Runs the matrix states on one device. The app must already be installed and logged in as the
# callee (see install.sh).
#
# Usage: fcm-matrix/run-device.sh <serial> <build-label> <callee-user-id> [state ...]
set -euo pipefail
source "$(dirname "$0")/lib.sh"

SERIAL="$1"
BUILD="$2"
CALLEE="$3"
shift 3
STATES="${*:-$DEFAULT_STATES}"

for state in $STATES; do
  "$HERE/run-case.sh" "$SERIAL" "$BUILD" "$state" "$CALLEE" || echo "   → ERROR running $state" >&2
done

echo
echo "Results: $RESULTS_DIR/$BUILD.md"
