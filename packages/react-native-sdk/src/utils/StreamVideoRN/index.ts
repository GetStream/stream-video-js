import { AndroidImportance } from '@notifee/react-native';
import { defaultEmojiReactions } from '../../constants';
import { setupFirebaseHandlerAndroid } from '../push/android';
import { StreamVideoConfig } from './types';
import pushLogoutCallbacks from '../internal/pushLogoutCallback';
import { setupRemoteNotificationsHandleriOS } from '../push/ios';
import newNotificationCallbacks, {
  NewCallNotificationCallback,
} from '../internal/newNotificationCallbacks';

const DEFAULT_STREAM_VIDEO_CONFIG: StreamVideoConfig = {
  supportedReactions: defaultEmojiReactions,
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
    // setup ios handler for non-voip push notifications asap
    setupRemoteNotificationsHandleriOS(pushConfig);
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
      pushLogoutCallbacks.current.forEach((callback) => callback());
    }
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
}
