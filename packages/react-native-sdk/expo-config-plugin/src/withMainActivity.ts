import { type ConfigPlugin, withMainActivity } from '@expo/config-plugins';
import {
  addImports,
  appendContentsInsideDeclarationBlock,
} from '@expo/config-plugins/build/android/codeMod';
import { type ConfigProps } from './common/types';
import addNewLinesToMainActivity from './common/addNewLinesToMainActivity';

const withStreamVideoReactNativeSDKMainActivity: ConfigPlugin<ConfigProps> = (
  configuration,
  props,
) => {
  return withMainActivity(configuration, (config) => {
    if (config.modResults.language !== 'kt') {
      throw new Error(
        `Cannot setup StreamVideoReactNativeSDK: a Kotlin MainActivity is required (the default since Expo SDK 50), found ${config.modResults.language}`,
      );
    }

    config.modResults.contents = addImports(
      config.modResults.contents,
      [
        'com.streamvideo.reactnative.StreamVideoReactNative',
        'android.os.Build',
        'android.content.res.Configuration',
        'androidx.lifecycle.Lifecycle',
        'com.oney.WebRTCModule.WebRTCModuleOptions',
      ],
      false,
    );
    config.modResults.contents = addOnPictureInPictureModeChanged(
      config.modResults.contents,
    );
    if (props?.androidPictureInPicture) {
      config.modResults.contents = addOnUserLeaveHint(
        config.modResults.contents,
      );
    }
    if (props?.enableScreenshare) {
      config.modResults.contents = addInsideOnCreateScreenshare(
        config.modResults.contents,
      );
    }

    if (props?.ringing) {
      config.modResults.contents = addInsideOnCreateLockscreen(
        config.modResults.contents,
      );
    }

    return config;
  });
};

function addOnPictureInPictureModeChanged(contents: string) {
  if (
    !contents.includes(
      'StreamVideoReactNative.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig)',
    )
  ) {
    const statementToInsert = `
      override fun onPictureInPictureModeChanged(isInPictureInPictureMode: Boolean, newConfig: Configuration) {
        super.onPictureInPictureModeChanged(isInPictureInPictureMode)
        if (isFinishing) {
          return
        }
        if (lifecycle.currentState === Lifecycle.State.CREATED) {
            // when user clicks on Close button of PIP
            finishAndRemoveTask()
        } else {
            StreamVideoReactNative.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig)
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
      override fun onUserLeaveHint() {
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
              Build.VERSION.SDK_INT < Build.VERSION_CODES.S &&
              StreamVideoReactNative.canAutoEnterPictureInPictureMode) {
              val config = resources.configuration
              onPictureInPictureModeChanged(true,  config)
          }
      }`;
    contents = addNewLinesToMainActivity(
      contents,
      statementToInsert.trim().split('\n'),
    );
  }

  return contents;
}

function addInsideOnCreateScreenshare(contents: string) {
  const addScreenShareServiceEnablerBlock = `val options: WebRTCModuleOptions = WebRTCModuleOptions.getInstance()
    options.enableMediaProjectionService = true
`;
  if (!contents.includes('options.enableMediaProjectionService = true')) {
    contents = appendContentsInsideDeclarationBlock(
      contents,
      'onCreate',
      addScreenShareServiceEnablerBlock,
    );
  }
  return contents;
}

function addInsideOnCreateLockscreen(contents: string) {
  const addLockscreenServiceEnablerBlock = `StreamVideoReactNative.setupCallActivity(this)`;
  if (!contents.includes('StreamVideoReactNative.setupCallActivity')) {
    contents = appendContentsInsideDeclarationBlock(
      contents,
      'onCreate',
      addLockscreenServiceEnablerBlock,
    );
  }
  return contents;
}
export default withStreamVideoReactNativeSDKMainActivity;
