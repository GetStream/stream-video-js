package io.getstream.expovideosample
import com.oney.WebRTCModule.WebRTCModuleOptions
import android.app.PictureInPictureParams
import androidx.lifecycle.Lifecycle
import android.util.Rational
import com.streamvideo.reactnative.StreamVideoReactNative
import expo.modules.splashscreen.SplashScreenManager

import android.os.Build
import android.os.Bundle

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import expo.modules.ReactActivityDelegateWrapper

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    // Set the theme to AppTheme BEFORE onCreate to support
    // coloring the background, status bar, and navigation bar.
    // This is required for expo-splash-screen.
    // setTheme(R.style.AppTheme);
    // @generated begin expo-splashscreen - expo prebuild (DO NOT MODIFY) sync-f3ff59a738c56c9a6119210cb55f0b613eb8b6af
    SplashScreenManager.registerOnActivity(this)
    // @generated end expo-splashscreen
    super.onCreate(null)
  val options: WebRTCModuleOptions = WebRTCModuleOptions.getInstance()
    options.enableMediaProjectionService = true
}

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "main"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
          this,
          BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
          object : DefaultReactActivityDelegate(
              this,
              mainComponentName,
              fabricEnabled
          ){})
  }

  /**
    * Align the back button behavior with Android S
    * where moving root activities to background instead of finishing activities.
    * @see <a href="https://developer.android.com/reference/android/app/Activity#onBackPressed()">onBackPressed</a>
    */
  override fun invokeDefaultOnBackPressed() {
      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
          if (!moveTaskToBack(false)) {
              // For non-root activities, use the default implementation to finish them.
              super.invokeDefaultOnBackPressed()
          }
          return
      }

      // Use the default back button implementation on Android S
      // because it's doing more than [Activity.moveTaskToBack] in fact.
      super.invokeDefaultOnBackPressed()
  }

override fun onPictureInPictureModeChanged(isInPictureInPictureMode: Boolean) {
          super.onPictureInPictureModeChanged(isInPictureInPictureMode)
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && lifecycle.currentState == Lifecycle.State.CREATED) {
              // when user clicks on Close button of PIP
              finishAndRemoveTask()
          } else {
              StreamVideoReactNative.onPictureInPictureModeChanged(isInPictureInPictureMode)
          }
      }

override fun onUserLeaveHint () {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && StreamVideoReactNative.canAutoEnterPictureInPictureMode) {
          val builder = PictureInPictureParams.Builder()
          builder.setAspectRatio(Rational(480, 640))
          enterPictureInPictureMode(builder.build())
        }
      }
}