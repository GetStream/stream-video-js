package io.getstream.rnvideosample.e2e

import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.util.Log

/**
 * Turns [E2EAppMessagingService] on or off for the e2e tests. Debug builds only.
 *
 * Android 14+ doesn't let `adb shell pm enable` change an app's components, but an app may always
 * change its own. The tests send:
 * ```
 * adb shell am broadcast -f 32 -n io.getstream.rnvideosample/.e2e.E2EAppMessagingServiceSwitch --ez enabled true
 * ```
 * (`-f 32` delivers it to a force-stopped app too). Only senders with `android.permission.DUMP`,
 * which `adb shell` has and apps don't, can reach it.
 */
class E2EAppMessagingServiceSwitch : BroadcastReceiver() {

  override fun onReceive(context: Context, intent: Intent) {
    val enabled = intent.getBooleanExtra(EXTRA_ENABLED, false)
    context.packageManager.setComponentEnabledSetting(
      ComponentName(context, E2EAppMessagingService::class.java),
      if (enabled) {
        PackageManager.COMPONENT_ENABLED_STATE_ENABLED
      } else {
        PackageManager.COMPONENT_ENABLED_STATE_DEFAULT
      },
      // Keeps the app running, so a Detox test stays connected to it.
      PackageManager.DONT_KILL_APP,
    )
    Log.d(TAG, "E2EAppMessagingService enabled=$enabled")
  }

  private companion object {
    const val TAG = "E2EAppMessagingServiceSwitch"
    const val EXTRA_ENABLED = "enabled"
  }
}
