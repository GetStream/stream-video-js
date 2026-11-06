# Shared helpers for the FCM device matrix. Sourced by the other scripts; expects SERIAL to be set
# before calling any device helper.

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HERE/.." && pwd)"
# shellcheck source=config.sh
source "$HERE/config.sh"

RESULTS_DIR="$HERE/results"
APKS_DIR="$HERE/apks"

adbs() { adb -s "$SERIAL" "$@"; }
# `adb shell` reads stdin, which breaks loops; never let it.
dsh() { adbs shell "$@" </dev/null | tr -d '\r'; }

api_level() { dsh getprop ro.build.version.sdk; }
device_name() { echo "$(dsh getprop ro.product.manufacturer) $(dsh getprop ro.product.model)"; }
is_emulator() { [[ "$SERIAL" == emulator-* ]]; }
app_pid() { dsh pidof "$PKG" || true; }
# "locked" / "unlocked", and "awake" / "asleep" for the screen. The output is read in full before
# matching: `| grep -q` exits early, adb gets SIGPIPE, and under pipefail that reads as no match.
keyguard_state() {
  [[ "$(dsh dumpsys activity activities)" == *"mKeyguardShowing=true"* ]] && echo locked || echo unlocked
}
screen_state() {
  [[ "$(dsh dumpsys power)" == *"mWakefulness=Awake"* ]] && echo awake || echo asleep
}

wait_boot() {
  adbs wait-for-device
  until [[ "$(dsh getprop sys.boot_completed)" == "1" ]]; do sleep 2; done
}

# A phone with a PIN stays locked after a reboot, and apps get no pushes until the first unlock
# (that case is reboot_locked). Waits for someone to unlock it; returns at once without a PIN.
wait_first_unlock() {
  local waited=0
  if [[ "$(dsh getprop sys.user.0.ce_available)" != "true" ]]; then
    echo "   Waiting for $(device_name) to be unlocked (up to ${UNLOCK_TIMEOUT_SECONDS}s)…"
    dsh log -t FCM_MATRIX "WAITING FOR UNLOCK"
  fi
  until [[ "$(dsh getprop sys.user.0.ce_available)" == "true" ]]; do
    if (( waited >= UNLOCK_TIMEOUT_SECONDS )); then
      echo "   not unlocked after ${UNLOCK_TIMEOUT_SECONDS}s" >&2
      return 1
    fi
    sleep 3
    waited=$((waited + 3))
  done
}

launch_app() {
  dsh input keyevent KEYCODE_WAKEUP
  dsh monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 >/dev/null
  sleep "$SETTLE_SECONDS"
}

# For states that need the app really on screen: waits for someone to unlock the keyguard first
# (the scripts never enter a real phone's PIN).
launch_app_visible() {
  local waited=0
  dsh input keyevent KEYCODE_WAKEUP
  if [[ "$(keyguard_state)" == "locked" ]]; then
    echo "   Unlock $(device_name) to continue (up to ${UNLOCK_TIMEOUT_SECONDS}s)…"
    until [[ "$(keyguard_state)" == "unlocked" ]]; do
      if (( waited >= UNLOCK_TIMEOUT_SECONDS )); then
        echo "   still locked after ${UNLOCK_TIMEOUT_SECONDS}s" >&2
        return 1
      fi
      sleep 3
      waited=$((waited + 3))
    done
  fi
  launch_app
}

go_home() { dsh input keyevent KEYCODE_HOME; sleep 2; }

# Opens recents and swipes the top card away. Best effort: what actually happened to the
# process is recorded separately in the results.
swipe_from_recents() {
  dsh input keyevent KEYCODE_APP_SWITCH
  sleep 2
  local size w h
  size="$(dsh wm size | awk 'END { print $NF }')"
  w="${size%x*}"
  h="${size#*x}"
  if (( $(api_level) >= 28 )); then
    dsh input swipe $((w / 2)) $((h / 2)) $((w / 2)) $((h / 10)) 250
  else
    dsh input swipe $((w / 2)) $((h / 2)) $((w - 10)) $((h / 2)) 250
  fi
  sleep 2
  go_home
}

# Puts the app in one of the matrix states.
enter_state() {
  case "$1" in
    foreground)
      launch_app_visible ;;
    background)
      launch_app_visible; go_home ;;
    swiped)
      launch_app_visible; swipe_from_recents ;;
    killed)
      launch_app; go_home; dsh am kill "$PKG" ;;
    # Killed, then screen off so a phone with a PIN locks; rests before the ring. Only presses the
    # power key: lock-screen settings are never touched.
    # A stray push during the rest (e.g. call.missed) can restart the process, so it is killed
    # again right before the ring.
    killed_locked)
      launch_app; go_home; dsh am kill "$PKG"
      dsh input keyevent KEYCODE_SLEEP
      sleep "$LOCKED_REST_SECONDS"
      if [[ -n "$(app_pid)" ]]; then
        echo "   process came back during the rest; killing it again"
        dsh am kill "$PKG"
        sleep 1
      fi ;;
    doze)
      launch_app; go_home
      dsh dumpsys battery unplug
      dsh input keyevent KEYCODE_SLEEP
      dsh dumpsys deviceidle force-idle >/dev/null ;;
    # Both reboot cases open the app once first: the previous case's force-stop left the package
    # in the stopped state, which survives a reboot and would block delivery.
    reboot)
      launch_app; go_home
      adbs reboot; wait_boot; wait_first_unlock; sleep "$POST_BOOT_SECONDS" ;;
    reboot_locked)
      if ! is_emulator; then
        echo "skip: reboot_locked only runs on emulators (it sets a lock-screen PIN)" >&2
        return 1
      fi
      launch_app; go_home
      dsh locksettings set-pin "$EMULATOR_PIN" >/dev/null
      adbs reboot; wait_boot; sleep "$POST_BOOT_SECONDS" ;;
    force_stopped)
      dsh am force-stop "$PKG" ;;
    *)
      echo "unknown state: $1" >&2
      return 1 ;;
  esac
}

# Undoes what enter_state changed, then force-stops the app so the next case starts clean
# (this also ends the incoming call and removes its notification).
leave_state() {
  case "$1" in
    killed_locked)
      dsh input keyevent KEYCODE_WAKEUP ;;
    doze)
      dsh dumpsys deviceidle unforce >/dev/null
      dsh dumpsys battery reset
      dsh input keyevent KEYCODE_WAKEUP ;;
    reboot_locked)
      dsh input keyevent KEYCODE_WAKEUP
      dsh input keyevent KEYCODE_MENU
      dsh input text "$EMULATOR_PIN"
      dsh input keyevent KEYCODE_ENTER
      sleep 2
      dsh locksettings clear --old "$EMULATOR_PIN" >/dev/null ;;
  esac
  dsh am force-stop "$PKG"
}

ring() {
  if [[ -z "$RING_CMD" ]]; then
    echo "RING_CMD is not set (see fcm-matrix/config.sh)" >&2
    return 1
  fi
  eval "$RING_CMD \"\$1\""
}

# "MM-DD HH:MM:SS.mmm ..." (logcat -v time) -> milliseconds since midnight.
line_ms() { awk '{ split($2, t, ":"); printf "%d\n", (t[1] * 3600 + t[2] * 60 + t[3]) * 1000 }'; }
