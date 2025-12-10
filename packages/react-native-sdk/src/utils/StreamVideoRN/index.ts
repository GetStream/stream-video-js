import { type Options as CallingxOptions } from 'react-native-callingx';
import type { StreamVideoConfig } from './types';
import pushLogoutCallbacks from '../internal/pushLogoutCallback';
import newNotificationCallbacks, {
  type NewCallNotificationCallback,
} from '../internal/newNotificationCallbacks';
import { setupIosVoipPushEvents } from '../push/setupIosVoipPushEvents';
import { setupCallingExpEvents } from '../push/setupCallingExpEvents';
import { getCallingxLib } from '../push/libs/callingx';
import { NativeModules, Platform } from 'react-native';
import { videoLoggerSystem } from '@stream-io/video-client';

// Utility type for deep partial
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Helper function for deep merging
function deepMerge<T extends Record<string, any>>(
  target: T,
  source: DeepPartial<T>,
): T {
  const result = { ...target };

  for (const key in source) {
    if (source[key] !== undefined) {
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        !Array.isArray(source[key]) &&
        typeof target[key] === 'object' &&
        target[key] !== null &&
        !Array.isArray(target[key])
      ) {
        result[key] = deepMerge(
          target[key],
          source[key] as DeepPartial<T[typeof key]>,
        );
      } else {
        result[key] = source[key] as T[typeof key];
      }
    }
  }

  return result;
}

const DEFAULT_STREAM_VIDEO_CONFIG: StreamVideoConfig = {
  foregroundService: {
    android: {
      channel: {
        id: 'stream_call_foreground_service',
        name: 'To keep calls alive',
        lights: false,
        vibration: false,
        importance: 3,
      },
      notificationTexts: {
        title: 'Call in progress',
        body: 'Tap to return to the call',
      },
      taskToRun: () => new Promise(() => {}),
    },
  },
};

export class StreamVideoRN {
  private static config = DEFAULT_STREAM_VIDEO_CONFIG;
  private static busyToneTimeout: NodeJS.Timeout | null = null;

  /**
   * Update the global config for StreamVideoRN except for push config.
   * To set push config use `StreamVideoRN.setPushConfig` instead.
   * This function accepts a partial config object that will be deeply merged with the default config.
   */
  static updateConfig(
    updateConfig: DeepPartial<Omit<StreamVideoConfig, 'push'>>,
  ) {
    this.config = deepMerge(this.config, updateConfig);
  }

  static updateAndroidIncomingCallChannel(
    updateChannel: Partial<
      NonNullable<StreamVideoConfig['push']>['android']['incomingCallChannel']
    >,
  ) {
    const prevChannel = this.config.push?.android?.incomingCallChannel;
    if (prevChannel) {
      this.config.push!.android.incomingCallChannel = {
        ...prevChannel,
        ...updateChannel,
      };
    }
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
    if (
      __DEV__ &&
      (pushConfig.navigateAcceptCall || pushConfig.navigateToIncomingCall)
    ) {
      throw new Error(
        `Support for navigateAcceptCall or navigateToIncomingCall in pushConfig has been removed.
        Please watch for incoming and outgoing calls in the root component of your app.
        Please see https://getstream.io/video/docs/react-native/advanced/ringing-calls/#watch-for-incoming-and-outgoing-calls for more information.`,
      );
    }

    this.config.push = pushConfig;

    setupCallingExpEvents(pushConfig);
    setupIosVoipPushEvents(pushConfig);
  }

  static setupCallingExp(options: CallingxOptions) {
    const callingx = getCallingxLib();
    callingx.setup(options);
    callingx.checkPermissions().catch((error) => {
      videoLoggerSystem
        .getLogger('setupCallingExp')
        .error('failed to check permissions', error);
    });
  }

  static getConfig() {
    return this.config;
  }

  /**
   * This is the function to be called when the push token must be removed.
   * Typically used on user logout.
   */
  static onPushLogout() {
    if (pushLogoutCallbacks.current) {
      return Promise.all(
        pushLogoutCallbacks.current.map((callback) => callback()),
      ).then(() => {});
    }
    return Promise.resolve();
  }

  static clearPushLogoutCallbacks() {
    pushLogoutCallbacks.current = [];
  }

  /**
   * This function is used to add a callback to be called when a new call notification is received.
   * @param callback
   * @returns Unsubscribe function
   */
  static addOnNewCallNotificationListener(
    callback: NewCallNotificationCallback,
  ) {
    if (!newNotificationCallbacks.current) {
      newNotificationCallbacks.current = [callback];
    } else {
      newNotificationCallbacks.current.push(callback);
    }
    return () => {
      newNotificationCallbacks.current =
        newNotificationCallbacks.current?.filter((cb) => cb !== callback);
    };
  }

  /**
   * Play native busy tone for call rejection
   */
  static async playBusyTone() {
    return NativeModules.StreamVideoReactNative.playBusyTone();
  }

  /**
   * Stop native busy tone
   */
  static async stopBusyTone() {
    return NativeModules.StreamVideoReactNative.stopBusyTone();
  }

  /**
   * Check if the device has audio output hardware
   * @returns True if the device has audio output hardware
   */
  static async androidHasAudioOutputHardware(): Promise<boolean> {
    if (Platform.OS !== 'android')
      throw new Error(
        'androidHasAudioOutputHardware function is only available on Android',
      );
    return NativeModules.StreamVideoReactNative.hasAudioOutputHardware();
  }

  /**
   * Check if the device has microphone hardware
   * @returns True if the device has microphone hardware
   */
  static async androidHasMicrophoneHardware(): Promise<boolean> {
    if (Platform.OS !== 'android')
      throw new Error(
        'androidHasMicrophoneHardware function is only available on Android',
      );
    return NativeModules.StreamVideoReactNative.hasMicrophoneHardware();
  }

  /**
   * Check if the device has camera hardware
   * @returns True if the device has camera hardware
   */
  static async androidHasCameraHardware(): Promise<boolean> {
    if (Platform.OS !== 'android')
      throw new Error(
        'androidHasCameraHardware function is only available on Android',
      );
    return NativeModules.StreamVideoReactNative.hasCameraHardware();
  }
}
