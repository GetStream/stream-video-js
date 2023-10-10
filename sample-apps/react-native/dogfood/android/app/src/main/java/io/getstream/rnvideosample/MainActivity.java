package io.getstream.rnvideosample;

import android.app.PictureInPictureParams;
import android.os.Bundle;
import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;
import com.streamvideo.reactnative.StreamVideoReactNative;
import android.util.Rational;
import androidx.lifecycle.Lifecycle;

public class MainActivity extends ReactActivity {

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    // for react-navigation
    super.onCreate(null);
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "StreamReactNativeVideoSDKSample";
  }

  /**
   * Returns the instance of the {@link ReactActivityDelegate}. Here we use a util class {@link
   * DefaultReactActivityDelegate} which allows you to easily enable Fabric and Concurrent React
   * (aka React 18) with two boolean flags.
   */
@Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    return new DefaultReactActivityDelegate(
        this,
        getMainComponentName(),
        // If you opted-in for the New Architecture, we enable the Fabric Renderer.
        DefaultNewArchitectureEntryPoint.getFabricEnabled(), // fabricEnabled
        // If you opted-in for the New Architecture, we enable Concurrent React (i.e. React 18).
        DefaultNewArchitectureEntryPoint.getConcurrentReactEnabled() // concurrentRootEnabled
        );
  }

  @Override
  public void onPictureInPictureModeChanged(boolean isInPictureInPictureMode) {
    super.onPictureInPictureModeChanged(isInPictureInPictureMode);
    if (getLifecycle().getCurrentState() == Lifecycle.State.CREATED) {
      // when user clicks on Close button of PIP
      finishAndRemoveTask();
    } else {
      StreamVideoReactNative.onPictureInPictureModeChanged(isInPictureInPictureMode);
    }
  }

  @Override
  public void onUserLeaveHint () {
    if (StreamVideoReactNative.canAutoEnterPictureInPictureMode) {
      PictureInPictureParams.Builder builder = new PictureInPictureParams.Builder();
      builder.setAspectRatio(new Rational(480, 640));
      enterPictureInPictureMode(builder.build());
    }
  }
}
