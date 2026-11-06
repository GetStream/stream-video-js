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

PROC_BEFORE="$( [[ -n "$(app_pid)" ]] && echo running || echo dead ), $(screen_state), $(keyguard_state)"

# A marker line instead of `logcat -c`, which some OEM builds refuse.
dsh log -t FCM_MATRIX "START $CASE_ID"
ring "$CALLEE"

# The call stops ringing (and its notification and CallService go away) when the caller hangs up,
# so poll while it rings instead of checking once at the end. NOTIF is the most live
# incoming-call notifications seen at once; FGS is whether CallService was ever running.
# Live notifications only: "StatusBarNotification(" lines are the archive of past ones.
NOTIF=0
FGS=no
POLL_END=$((SECONDS + RING_WAIT_SECONDS))
while (( SECONDS < POLL_END )); do
  seen="$(dsh dumpsys notification --noredact | grep "NotificationRecord(.*pkg=$PKG" \
    | grep -c 'channel=stream_incoming_calls_channel' || true)"
  (( seen > NOTIF )) && NOTIF="$seen"
  [[ "$(dsh dumpsys activity services "$PKG")" == *CallService* ]] && FGS=yes
  sleep 1
done

adbs logcat -d -v time </dev/null | tr -d '\r' \
  | awk -v id="START $CASE_ID" 'found { print } index($0, id) { found = 1 }' > "$LOG"

count() { grep -c -E "$1" "$LOG" || true; }

# Other pushes land in a case too (e.g. call.missed for the previous case's call), so the
# Receiver/Service columns count only this ring's push. The prototype's service line has no data,
# so it is matched by the message ids the receiver saw for call.ring.
RING_IDS="$(grep -E 'StreamMessagingReceiver.*onReceive messageId=.*type=call\.ring' "$LOG" \
  | sed -E 's/.*messageId=([^ ]+).*/\1/' | sort -u || true)"
RECEIVER_HITS="$(count 'StreamMessagingReceiver.*onReceive messageId=.*type=call\.ring')"
SERVICE_HITS="$(grep -E 'StreamMessagingService.*onMessageReceived' "$LOG" \
  | { if [[ -n "$RING_IDS" ]]; then grep -E "type=call\.ring|$(paste -sd'|' - <<<"$RING_IDS")"; else grep -E 'type=call\.ring'; fi; } \
  | grep -c . || true)"
OTHER_PUSHES="$(grep -E 'StreamMessagingReceiver.*onReceive messageId=|StreamMessagingService.*onMessageReceived data=' "$LOG" \
  | grep -v 'type=call\.ring' | grep -o -E 'type=[a-z._]+' | sed 's/type=//' | sort | uniq -c \
  | awk '{ printf "%s%s×%s", sep, $2, $1; sep = ", " }' || true)"
OTHER_PUSHES="${OTHER_PUSHES:--}"
RING_STARTS="$(count 'startIncomingCallFromPush: Starting incoming call from push')"
BLOCKED="$(count 'startIncomingCallFromPush: Failed to start service|ForegroundServiceStartNotAllowed|startForegroundService\(\) not allowed|Not allowed to start service')"
DEDUPED="$(count 'already handled, skipping')"
NOT_SETUP="$(count 'setup\(\) was never called')"
RNFB_HITS="$(count 'RNFirebaseMsgReceiver.*broadcast received')"
GMS_CANCELLED="$(count "broadcast intent callback: result=CANCELLED.*$PKG")"

ENTRY_LINE="$(grep -m1 -E 'StreamMessagingReceiver.*onReceive messageId=.*type=call\.ring|StreamMessagingService.*onMessageReceived data=.*type=call\.ring' "$LOG" || true)"
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
    echo "| Device | API | State | Before ring (process, screen, lock) | Receiver (ring) | Service (ring) | Other pushes | Ring started | Blocked | Deduped | rn-firebase rcv | GMS cancelled | Incoming-call notification (live) | CallService | Push→ring (ms) | Verdict | Log |"
    echo "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|"
  } > "$TABLE"
fi
[[ "$NOT_SETUP" != "0" ]] && VERDICT="$VERDICT · setPushConfig never ran"
echo "| $DEVICE | $API | $STATE | $PROC_BEFORE | $RECEIVER_HITS | $SERVICE_HITS | $OTHER_PUSHES | $RING_STARTS | $BLOCKED | $DEDUPED | $RNFB_HITS | $GMS_CANCELLED | $NOTIF | $FGS | $LATENCY | $VERDICT | logs/$(basename "$LOG") |" >> "$TABLE"
echo "   → $VERDICT"
