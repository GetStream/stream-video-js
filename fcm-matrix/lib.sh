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

wait_boot() {
  adbs wait-for-device
  until [[ "$(dsh getprop sys.boot_completed)" == "1" ]]; do sleep 2; done
}

launch_app() {
  dsh monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 >/dev/null
  sleep "$SETTLE_SECONDS"
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
      launch_app ;;
    background)
      launch_app; go_home ;;
    swiped)
      launch_app; swipe_from_recents ;;
    killed)
      launch_app; go_home; dsh am kill "$PKG" ;;
    doze)
      launch_app; go_home
      dsh dumpsys battery unplug
      dsh input keyevent KEYCODE_SLEEP
      dsh dumpsys deviceidle force-idle >/dev/null ;;
    reboot)
      adbs reboot; wait_boot; sleep "$POST_BOOT_SECONDS" ;;
    reboot_locked)
      if ! is_emulator; then
        echo "skip: reboot_locked only runs on emulators (it sets a lock-screen PIN)" >&2
        return 1
      fi
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
