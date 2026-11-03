# Settings for the FCM device matrix. Override any value with an environment variable.

PKG="${PKG:-io.getstream.rnvideosample}"

# Command that rings a user. The callee's user id is appended as the last argument.
# Example: RING_CMD='node /path/to/ring.mjs --callee'
RING_CMD="${RING_CMD:-}"

# Seconds to let the app settle after launching it, before moving it to the target state.
SETTLE_SECONDS="${SETTLE_SECONDS:-6}"
# Seconds to wait after ringing before reading the logs.
RING_WAIT_SECONDS="${RING_WAIT_SECONDS:-15}"
# Seconds to wait after a reboot so Google Play services reconnects to FCM.
POST_BOOT_SECONDS="${POST_BOOT_SECONDS:-60}"

# PIN used for the "reboot_locked" (direct boot) case. Emulators only: the scripts never change
# the lock screen of a real phone.
EMULATOR_PIN="${EMULATOR_PIN:-1111}"

# Every state run-device.sh goes through when none are given.
DEFAULT_STATES="foreground background swiped killed doze reboot reboot_locked force_stopped"
