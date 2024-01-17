import { ConfigPlugin, withMainActivity } from '@expo/config-plugins';
import { addImports } from '@expo/config-plugins/build/android/codeMod';
import { ConfigProps } from './common/types';
import addNewLinesToMainActivity from './common/addNewLinesToMainActivity';

const withStreamVideoReactNativeSDKMainActivity: ConfigPlugin<ConfigProps> = (
  configuration,
  props,
) => {
  return withMainActivity(configuration, (config) => {
    const isMainActivityJava = config.modResults.language === 'java';

    try {
      config.modResults.contents = addImports(
        config.modResults.contents,
        [
          'com.streamvideo.reactnative.StreamVideoReactNative',
          'android.os.Build',
          'android.util.Rational',
          'androidx.lifecycle.Lifecycle',
          'android.app.PictureInPictureParams',
        ],
        isMainActivityJava,
      );
      config.modResults.contents = addOnPictureInPictureModeChanged(
        config.modResults.contents,
        isMainActivityJava,
      );
      if (props?.androidPictureInPicture?.enableAutomaticEnter) {
        config.modResults.contents = addOnUserLeaveHint(
          config.modResults.contents,
          isMainActivityJava,
        );
      }
    } catch (error: any) {
      throw new Error(
        "Cannot add StreamVideoReactNativeSDK to the project's MainApplication because it's malformed.",
      );
    }

    return config;
  });
};

function addOnPictureInPictureModeChanged(contents: string, isJava: boolean) {
  if (
    !contents.includes('StreamVideoReactNative.onPictureInPictureModeChanged')
  ) {
    let statementToInsert = '';

    if (isJava) {
      statementToInsert = `
      @Override
      public void onPictureInPictureModeChanged(boolean isInPictureInPictureMode) {
        super.onPictureInPictureModeChanged(isInPictureInPictureMode);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && getLifecycle().getCurrentState() == Lifecycle.State.CREATED) {
          // when user clicks on Close button of PIP
          finishAndRemoveTask();
        } else {
          StreamVideoReactNative.onPictureInPictureModeChanged(isInPictureInPictureMode);
        }
      }`;
    } else {
      // Kotlin
      statementToInsert = `         
      override fun onPictureInPictureModeChanged(isInPictureInPictureMode: Boolean) {
          super.onPictureInPictureModeChanged(isInPictureInPictureMode)
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && lifecycle.currentState == Lifecycle.State.CREATED) {
              // when user clicks on Close button of PIP
              finishAndRemoveTask()
          } else {
              StreamVideoReactNative.onPictureInPictureModeChanged(isInPictureInPictureMode)
          }
      }`;
    }

    contents = addNewLinesToMainActivity(
      contents,
      statementToInsert.trim().split('\n'),
    );
  }
  return contents;
}

function addOnUserLeaveHint(contents: string, isJava: boolean) {
  if (
    !contents.includes(
      'StreamVideoReactNative.canAutoEnterPictureInPictureMode',
    )
  ) {
    let statementToInsert = '';

    if (isJava) {
      statementToInsert = `
      @Override
      public void onUserLeaveHint () {
        if (StreamVideoReactNative.canAutoEnterPictureInPictureMode) {
          PictureInPictureParams.Builder builder = new PictureInPictureParams.Builder();
          builder.setAspectRatio(new Rational(480, 640));
          enterPictureInPictureMode(builder.build());
        }
      }`;
    } else {
      statementToInsert = `           
      override fun onUserLeaveHint () {
        if (StreamVideoReactNative.canAutoEnterPictureInPictureMode) {
          val builder = PictureInPictureParams.Builder()
          builder.setAspectRatio(Rational(480, 640))
          enterPictureInPictureMode(builder.build())
        }
      }`;
    }

    contents = addNewLinesToMainActivity(
      contents,
      statementToInsert.trim().split('\n'),
    );
  }
  return contents;
}

export default withStreamVideoReactNativeSDKMainActivity;
