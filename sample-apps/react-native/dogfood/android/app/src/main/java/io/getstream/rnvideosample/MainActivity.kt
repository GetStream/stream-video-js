package io.getstream.rnvideosample

import android.content.res.Configuration
import android.os.Build
import android.os.Bundle
import androidx.lifecycle.Lifecycle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.oney.WebRTCModule.WebRTCModuleOptions
import com.streamvideo.reactnative.StreamVideoReactNative

class MainActivity : ReactActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        val options: WebRTCModuleOptions = WebRTCModuleOptions.getInstance()
        options.enableMediaProjectionService = true
        // for react-navigation
        super.onCreate(null)
    }

    /**
     * Returns the name of the main component registered from JavaScript. This is used to schedule
     * rendering of the component.
     */
    override fun getMainComponentName(): String = "StreamReactNativeVideoSDKSample"

    /**
     * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
     * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
     */
    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

    override fun onPictureInPictureModeChanged(isInPictureInPictureMode: Boolean, newConfig: Configuration) {
        super.onPictureInPictureModeChanged(isInPictureInPictureMode)
        if (lifecycle.currentState == Lifecycle.State.CREATED) {
            // when user clicks on Close button of PIP
            finishAndRemoveTask()
        } else {
            StreamVideoReactNative.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig)
        }
    }

    override fun onUserLeaveHint() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
            Build.VERSION.SDK_INT < Build.VERSION_CODES.S &&
            StreamVideoReactNative.canAutoEnterPictureInPictureMode) {
            val config = resources.configuration
            onPictureInPictureModeChanged(true,  config)
        }
    }
}
