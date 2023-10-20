import { ConfigPlugin, withMainActivity } from '@expo/config-plugins';
import { addImports } from '@expo/config-plugins/build/android/codeMod';
import { ConfigProps } from './common/types';
import addNewLinesToMainActivity from './common/addNewLinesToMainActivity';

const withStreamVideoReactNativeSDKMainActivity: ConfigPlugin<ConfigProps> = (
  configuration,
  props,
) => {
  return withMainActivity(configuration, (config) => {
    if (['java'].includes(config.modResults.language)) {
      try {
        /*
          import com.streamvideo.reactnative.StreamVideoReactNative;
          import android.util.Rational;
          import androidx.lifecycle.Lifecycle;
          import android.app.PictureInPictureParams;
        */
        config.modResults.contents = addImports(
          config.modResults.contents,
          [
            'com.streamvideo.reactnative.StreamVideoReactNative',
            'android.util.Rational',
            'androidx.lifecycle.Lifecycle',
            'android.app.PictureInPictureParams',
          ],
          config.modResults.language === 'java',
        );
        config.modResults.contents = addOnPictureInPictureModeChanged(
          config.modResults.contents,
        );
        if (props?.androidPictureInPicture?.enableAutomaticEnter) {
          config.modResults.contents = addOnUserLeaveHint(
            config.modResults.contents,
          );
        }
      } catch (error: any) {
        throw new Error(
          "Cannot add StreamVideoReactNativeSDK to the project's MainApplication because it's malformed.",
        );
      }
    } else {
      throw new Error(
        'Cannot setup StreamVideoReactNativeSDK because the MainApplication is not in Java',
      );
    }
    return config;
  });
};

function addOnPictureInPictureModeChanged(contents: string) {
  if (
    !contents.includes('StreamVideoReactNative.onPictureInPictureModeChanged')
  ) {
    const statementToInsert = `
  @Override
  public void onPictureInPictureModeChanged(boolean isInPictureInPictureMode) {
    super.onPictureInPictureModeChanged(isInPictureInPictureMode);
    if (getLifecycle().getCurrentState() == Lifecycle.State.CREATED) {
      // when user clicks on Close button of PIP
      finishAndRemoveTask();
    } else {
      StreamVideoReactNative.onPictureInPictureModeChanged(isInPictureInPictureMode);
    }
  }`;
    contents = addNewLinesToMainActivity(
      contents,
      statementToInsert.trim().split('\n'),
    );
  }
  return contents;
}

function addOnUserLeaveHint(contents: string) {
  if (
    !contents.includes(
      'StreamVideoReactNative.canAutoEnterPictureInPictureMode',
    )
  ) {
    const statementToInsert = `
  @Override
  public void onUserLeaveHint () {
    if (StreamVideoReactNative.canAutoEnterPictureInPictureMode) {
      PictureInPictureParams.Builder builder = new PictureInPictureParams.Builder();
      builder.setAspectRatio(new Rational(480, 640));
      enterPictureInPictureMode(builder.build());
    }
  }`;
    contents = addNewLinesToMainActivity(
      contents,
      statementToInsert.trim().split('\n'),
    );
  }
  return contents;
}

export default withStreamVideoReactNativeSDKMainActivity;
