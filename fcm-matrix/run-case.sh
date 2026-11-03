#!/usr/bin/env bash
# Runs one matrix case: put the app in STATE, ring CALLEE, read the logs, append a result row.
#
# Usage: fcm-matrix/run-case.sh <serial> <build-label> <state> <callee-user-id>
set -euo pipefail
source "$(dirname "$0")/lib.sh"

SERIAL="$1"
BUILD="$2"
STATE="$3"
CALLEE="$4"

API="$(api_level)"
DEVICE="$(device_name)"
CASE_ID="$(date +%Y%m%d-%H%M%S)-${SERIAL//[^a-zA-Z0-9]/_}-api$API-$STATE"
mkdir -p "$RESULTS_DIR/logs"
LOG="$RESULTS_DIR/logs/$BUILD-$CASE_ID.log"
TABLE="$RESULTS_DIR/$BUILD.md"

echo "== $DEVICE (API $API) · $BUILD · $STATE"

if ! enter_state "$STATE"; then
  exit 0
fi

PROC_BEFORE="$( [[ -n "$(app_pid)" ]] && echo running || echo dead )"

# A marker line instead of `logcat -c`, which some OEM builds refuse.
dsh log -t FCM_MATRIX "START $CASE_ID"
ring "$CALLEE"
sleep "$RING_WAIT_SECONDS"

adbs logcat -d -v time </dev/null | tr -d '\r' \
  | awk -v id="START $CASE_ID" 'found { print } index($0, id) { found = 1 }' > "$LOG"
NOTIFICATIONS="$(dsh dumpsys notification --noredact | grep "pkg=$PKG" || true)"
SERVICES="$(dsh dumpsys activity services "$PKG" || true)"

count() { grep -c -E "$1" "$LOG" || true; }

RECEIVER_HITS="$(count 'StreamMessagingReceiver.*onReceive messageId')"
SERVICE_HITS="$(count 'StreamMessagingService.*onMessageReceived')"
RING_STARTS="$(count 'startIncomingCallFromPush: Starting incoming call from push')"
BLOCKED="$(count 'startIncomingCallFromPush: Failed to start service|ForegroundServiceStartNotAllowed|startForegroundService\(\) not allowed|Not allowed to start service')"
DEDUPED="$(count 'already handled, skipping')"
NOT_SETUP="$(count 'setup\(\) was never called')"
RNFB_HITS="$(count 'RNFirebaseMsgReceiver.*broadcast received')"
GMS_CANCELLED="$(count "broadcast intent callback: result=CANCELLED.*$PKG")"
NOTIF="$(grep -c -i 'category=call' <<<"$NOTIFICATIONS" || true)"
FGS="$(grep -q 'CallService' <<<"$SERVICES" && echo yes || echo no)"

ENTRY_LINE="$(grep -m1 -E 'StreamMessagingReceiver.*onReceive messageId|StreamMessagingService.*onMessageReceived' "$LOG" || true)"
RING_LINE="$(grep -m1 'startIncomingCallFromPush: Starting incoming call from push' "$LOG" || true)"
LATENCY="-"
if [[ -n "$ENTRY_LINE" && -n "$RING_LINE" ]]; then
  LATENCY="$(( $(line_ms <<<"$RING_LINE") - $(line_ms <<<"$ENTRY_LINE") ))"
fi

if [[ "$STATE" == "force_stopped" ]]; then
  # Android delivers nothing to a force-stopped app; anything else would be surprising.
  [[ "$RING_STARTS" == "0" ]] && VERDICT="PASS (nothing delivered, as expected)" || VERDICT="CHECK"
elif [[ "$STATE" == "reboot_locked" ]]; then
  VERDICT="INFO"
elif [[ "$RING_STARTS" == "1" && "$BLOCKED" == "0" && ( "$NOTIF" != "0" || "$FGS" == "yes" ) ]]; then
  VERDICT="PASS"
elif [[ "$RING_STARTS" -gt 1 ]]; then
  VERDICT="FAIL (handled $RING_STARTS times)"
else
  VERDICT="FAIL"
fi

leave_state "$STATE"

if [[ ! -f "$TABLE" ]]; then
  {
    echo "# FCM matrix: $BUILD"
    echo
    echo "| Device | API | State | App before ring | Receiver | Service | Ring started | Blocked | Deduped | rn-firebase rcv | GMS cancelled | Call notification | CallService | Push→ring (ms) | Verdict | Log |"
    echo "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|"
  } > "$TABLE"
fi
[[ "$NOT_SETUP" != "0" ]] && VERDICT="$VERDICT · setPushConfig never ran"
echo "| $DEVICE | $API | $STATE | $PROC_BEFORE | $RECEIVER_HITS | $SERVICE_HITS | $RING_STARTS | $BLOCKED | $DEDUPED | $RNFB_HITS | $GMS_CANCELLED | $NOTIF | $FGS | $LATENCY | $VERDICT | logs/$(basename "$LOG") |" >> "$TABLE"
echo "   → $VERDICT"
