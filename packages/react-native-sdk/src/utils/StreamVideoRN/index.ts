import { AndroidImportance } from '@notifee/react-native';
import { setupFirebaseHandlerAndroid } from '../push/android';
import { StreamVideoConfig } from './types';
import {
  isCameraPermissionGranted$,
  isMicPermissionGranted$,
} from './permissions';

const DEFAULT_STREAM_VIDEO_CONFIG: StreamVideoConfig = {
  foregroundService: {
    android: {
      channel: {
        id: 'stream_call_foreground_service',
        name: 'Notification Service to keep call alive',
        lights: false,
        vibration: false,
        importance: AndroidImportance.DEFAULT,
      },
      notificationTexts: {
        title: 'Call in progress',
        body: 'Tap to return to the call',
      },
    },
  },
};

export class StreamVideoRN {
  private static config = DEFAULT_STREAM_VIDEO_CONFIG;

  /**
   * Update the global config for StreamVideoRN except for push config.
   * To set push config use `StreamVideoRN.setPushConfig` instead.
   * This function accepts a partial config object that will be merged with the default config.
   */
  static updateConfig(updateConfig: Partial<Omit<StreamVideoConfig, 'push'>>) {
    this.config = {
      ...this.config,
      ...updateConfig,
    };
  }

  /**
   * Set the push config for StreamVideoRN.
   * This method must be called **outside** of your application lifecycle, e.g. alongside your
   * `AppRegistry.registerComponent()` method call at the entry point of your application code.
   * Since the app can be opened from a dead state through a push notification
   * Note: This function must be called only once. Further calls will be ignored.
   * @example // in index.js
   * import { AppRegistry } from 'react-native';
   * import { StreamVideoRN } from '@stream-io/video-react-native-sdk';
   * import App from './App';
   * // Set push config
   * const pushConfig = {}; // construct your config
   * StreamVideoRN.setPushConfig(pushConfig);
   * AppRegistry.registerComponent('app', () => App);
   */
  static setPushConfig(pushConfig: NonNullable<StreamVideoConfig['push']>) {
    if (this.config.push) {
      // Ignoring this config as push config was already set
      return;
    }
    this.config.push = pushConfig;
    // After getting the config we should setup callkeep events, firebase handler asap to handle incoming calls from a dead state
    setupFirebaseHandlerAndroid(pushConfig);
  }

  /**
   * Set native permissions config for StreamVideoRN.
   * Note: This function should be called after the user has declined/granted camera and mic permissions.
   * @example
   * See sample-apps/react-native/dogfood/src/hooks/useSyncPermissions.ts
   */
  static setPermissions({
    isCameraPermissionGranted,
    isMicPermissionGranted,
  }: {
    isCameraPermissionGranted: boolean;
    isMicPermissionGranted: boolean;
  }) {
    isCameraPermissionGranted$.next(isCameraPermissionGranted);
    isMicPermissionGranted$.next(isMicPermissionGranted);
  }

  static getConfig() {
    return this.config;
  }
}
