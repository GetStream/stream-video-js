import type { StreamVideoConfig } from './types';
import pushLogoutCallbacks from '../internal/pushLogoutCallback';
import newNotificationCallbacks, {
  type NewCallNotificationCallback,
} from '../internal/newNotificationCallbacks';
import { setupIosVoipPushEvents } from '../push/setupIosVoipPushEvents';
import { setupCallingExpEvents } from '../push/setupCallingExpEvents';
import {
  extractCallingExpOptions,
  getCallingxLib,
} from '../push/libs/callingx';
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
      ongoingChannel: {
        id: 'stream_call_foreground_service',
        name: 'Ongoing calls',
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
   * // Set CallKit/Android Telecom API integration options. All params are optional. If not provided, the default values will be used.
   * const callingExpOptions = {
   *   ios: {
   *     callsHistory: true,
   *     displayCallTimeout: 60000,
   *     sound: 'ringtone',
   *     imageName: 'callkit_icon',
   *   },
   *   android: {
   *     incomingChannel: {
   *       id: 'stream_incoming_call_notifications',
   *       name: 'Call notifications',
   *       vibration: true,
   *       sound: 'default',
   *     },
   *     titleTransformer: (text: string) => text,
   *     subtitleTransformer: (text: string) => text,
   *   },
   * };
   * StreamVideoRN.setPushConfig(pushConfig, callingExpOptions);
   * AppRegistry.registerComponent('app', () => App);
   */
  static setPushConfig(pushConfig: NonNullable<StreamVideoConfig['push']>) {
    if (this.config.push) {
      // Ignoring this config as push config was already set
      return;
    }

    this.config.push = pushConfig;

    try {
      const callingx = getCallingxLib();
      videoLoggerSystem
        .getLogger('StreamVideoRN.setPushConfig')
        .info(JSON.stringify(this.config));
      const options = extractCallingExpOptions(this.config);
      callingx.setup(options);
    } catch {
      throw new Error(
        'react-native-callingx library is not installed. Please check the installation instructions: https://getstream.io/video/docs/react-native/incoming-calls/ringing-setup/react-native/.',
      );
    }

    setupCallingExpEvents(pushConfig);
    setupIosVoipPushEvents(pushConfig);
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
