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
    const isMainActivityJava = config.modResults.language === 'java';

    config.modResults.contents = addImports(
      config.modResults.contents,
      [
        'com.streamvideo.reactnative.StreamVideoReactNative',
        'android.os.Build',
        'android.content.res.Configuration',
        'androidx.lifecycle.Lifecycle',
        'com.oney.WebRTCModule.WebRTCModuleOptions',
      ],
      isMainActivityJava,
    );
    config.modResults.contents = addOnPictureInPictureModeChanged(
      config.modResults.contents,
      isMainActivityJava,
    );
    if (props?.androidPictureInPicture) {
      config.modResults.contents = addOnUserLeaveHint(
        config.modResults.contents,
        isMainActivityJava,
      );
    }
    if (props?.enableScreenshare) {
      config.modResults.contents = addInsideOnCreateScreenshare(
        config.modResults.contents,
        isMainActivityJava,
      );
    }

    if (props?.ringingPushNotifications?.showWhenLockedAndroid) {
      config.modResults.contents = addInsideOnCreateLockscreen(
        config.modResults.contents,
        isMainActivityJava,
      );
    }

    return config;
  });
};

function addOnPictureInPictureModeChanged(contents: string, isJava: boolean) {
  if (
    !contents.includes(
      'StreamVideoReactNative.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig)',
    )
  ) {
    let statementToInsert = '';

    if (isJava) {
      statementToInsert = `
      @Override
      public void onPictureInPictureModeChanged(boolean isInPictureInPictureMode, Configuration newConfig) {
          super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig);
          if (isFinishing()) {
            return;
          }
          if (lifecycleOwner.getLifecycle().getCurrentState() == Lifecycle.State.CREATED) {
              // When user clicks on Close button of PIP
              finishAndRemoveTask();
          } else {
              StreamVideoReactNative.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig);
          }
      }`;
    } else {
      // Kotlin
      statementToInsert = `         
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
    }

    contents = addNewLinesToMainActivity(
      contents,
      statementToInsert.trim().split('\n'),
    );
  }
  return contents;
}

function addOnUserLeaveHint(contents: string, isJava: boolean) {
  let statementToInsert = '';

  if (isJava) {
    if (
      !contents.includes(
        'StreamVideoReactNative.Companion.getCanAutoEnterPictureInPictureMode',
      )
    ) {
      statementToInsert = `
      @Override
      protected void onUserLeaveHint() {
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
              Build.VERSION.SDK_INT < Build.VERSION_CODES.S &&
              StreamVideoReactNative.Companion.getCanAutoEnterPictureInPictureMode()) {
              Configuration config = getResources().getConfiguration();
              onPictureInPictureModeChanged(true, config);
          }
      }`;
    }
  } else {
    if (
      !contents.includes(
        'StreamVideoReactNative.canAutoEnterPictureInPictureMode',
      )
    ) {
      statementToInsert = `           
      override fun onUserLeaveHint() {
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
              Build.VERSION.SDK_INT < Build.VERSION_CODES.S &&
              StreamVideoReactNative.canAutoEnterPictureInPictureMode) {
              val config = resources.configuration
              onPictureInPictureModeChanged(true,  config)
          }
      }`;
    }
  }

  if (statementToInsert) {
    contents = addNewLinesToMainActivity(
      contents,
      statementToInsert.trim().split('\n'),
    );
  }

  return contents;
}

function addInsideOnCreateScreenshare(contents: string, isJava: boolean) {
  const addScreenShareServiceEnablerBlock = isJava
    ? `WebRTCModuleOptions options = WebRTCModuleOptions.getInstance();
    options.enableMediaProjectionService = true;
`
    : `val options: WebRTCModuleOptions = WebRTCModuleOptions.getInstance()
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

function addInsideOnCreateLockscreen(contents: string, isJava: boolean) {
  const addLockscreenServiceEnablerBlock = isJava
    ? `StreamVideoReactNative.setupCallActivity(this);`
    : `StreamVideoReactNative.setupCallActivity(this)`;
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
