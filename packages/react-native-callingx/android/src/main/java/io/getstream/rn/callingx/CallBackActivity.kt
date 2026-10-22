package io.getstream.rn.callingx

import android.app.Activity
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.telecom.TelecomManager
import android.util.Log

/**
 * Invisible trampoline for call log callbacks (Android 16 QPR2+ unified call history).
 *
 * Declaring a `TelecomManager.ACTION_CALL_BACK` handler is what opts the app into call logging,
 * so the component ships disabled and is toggled at runtime from the `callsHistory` setup option.
 * When the user taps a call log entry, the system starts this activity with
 * `TelecomManager.EXTRA_UUID` (the Telecom call id). It opens the app's launch activity.
 */
class CallBackActivity : Activity() {

    companion object {
        private const val TAG = "[Callingx] CallBackActivity"

        const val EXTRA_CALL_BACK_UUID = "io.getstream.rn.callingx.CALL_BACK_UUID"

        fun setEnabled(context: Context, enabled: Boolean) {
            val state =
                    if (enabled) PackageManager.COMPONENT_ENABLED_STATE_ENABLED
                    else PackageManager.COMPONENT_ENABLED_STATE_DISABLED
            val component = ComponentName(context, CallBackActivity::class.java)
            try {
                // Avoid a redundant PACKAGE_CHANGED broadcast on every setup.
                if (context.packageManager.getComponentEnabledSetting(component) == state) return
                context.packageManager.setComponentEnabledSetting(
                        component,
                        state,
                        PackageManager.DONT_KILL_APP,
                )
            } catch (e: Exception) {
                Log.e(TAG, "[callback] setEnabled: Failed to set enabled=$enabled: ${e.message}", e)
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        handleIntent(intent)
        finish()
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        handleIntent(intent)
        finish()
    }

    private fun handleIntent(intent: Intent?) {
        if (intent?.action != TelecomManager.ACTION_CALL_BACK) return

        val uuid = intent.getStringExtra(TelecomManager.EXTRA_UUID)
        debugLog(TAG, "[callback] handleIntent: Call back requested for $uuid")

        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
        if (launchIntent == null) {
            Log.w(TAG, "[callback] handleIntent: No launch activity found")
            return
        }
        launchIntent.apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            uuid?.let { putExtra(EXTRA_CALL_BACK_UUID, it) }
        }
        try {
            startActivity(launchIntent)
        } catch (e: Exception) {
            Log.e(TAG, "[callback] handleIntent: Failed to open launch activity: ${e.message}", e)
        }
    }
}
