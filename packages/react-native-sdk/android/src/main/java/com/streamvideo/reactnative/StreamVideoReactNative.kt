package com.streamvideo.reactnative

import android.app.Activity
import android.app.KeyguardManager
import android.content.res.Configuration
import android.os.Build
import android.view.WindowManager
import androidx.core.content.getSystemService
import java.util.concurrent.CopyOnWriteArrayList // For thread safety

object StreamVideoReactNative {

    // Use CopyOnWriteArrayList for thread safety
    private val pipListeners = CopyOnWriteArrayList<(isInPip: Boolean, newConfig: Configuration) -> Unit>()

    @JvmField
    var canAutoEnterPictureInPictureMode = false

    private var isInPictureInPictureMode: Boolean = false

    @Deprecated("No need to use setup() anymore")
    @JvmStatic
    fun setup() {
        // Do nothing
    }

    @JvmStatic
    fun addPipListener(listener: (isInPip: Boolean, newConfig: Configuration) -> Unit) {
        pipListeners.add(listener)
    }

    @JvmStatic
    fun clearPipListeners() {
        pipListeners.clear()
    }

    @JvmStatic
    fun onPictureInPictureModeChanged(isInPictureInPictureMode: Boolean, newConfig: Configuration) {
        this.isInPictureInPictureMode = isInPictureInPictureMode
        // Iterate safely over the list
        pipListeners.forEach { listener ->
            listener(isInPictureInPictureMode, newConfig)
        }
    }

    /**
     * Enable the calling activity to be shown in the lockscreen and dismiss the keyguard to enable
     * users to answer without unblocking.
     */
    @JvmStatic
    fun setupCallActivity(activity: Activity) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            activity.setShowWhenLocked(true)
            activity.setTurnScreenOn(true)
        } else {
            activity.window.addFlags(
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                        or WindowManager.LayoutParams.FLAG_ALLOW_LOCK_WHILE_SCREEN_ON,
            )
        }

        val keyguardManager = activity.getSystemService<KeyguardManager>()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && keyguardManager != null) {
            keyguardManager.requestDismissKeyguard(activity, null)
        }
    }
}
