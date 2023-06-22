import { AndroidImportance } from '@notifee/react-native';
import { defaultEmojiReactions } from '../../constants';
import { setupFirebaseHandlerAndroid } from '../push/android';
import { StreamVideoConfig } from './types';

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
   * @example StreamVideoRN.setConfig({ onOpenCallParticipantsInfoView: () => {} });
   */
  static updateConfig(updateConfig: Partial<Omit<StreamVideoConfig, 'push'>>) {
    this.config = {
      ...this.config,
      ...updateConfig,
    };
  }

  /**
   * Set the push config for StreamVideoRN.
   * Note: This function can only be called once.
   * It is necessary to call this function before AppRegistry.registerComponent since the app can be opened from a dead state through a push notification
   * @example // in index.js
   * import { AppRegistry } from 'react-native';
   * import App from './App';
   * // Set push config
   * StreamVideoRN.setPushConfig(pushConfig); // set push config
   * AppRegistry.registerComponent('app', () => App);
   */
  static setPushConfig(pushConfig: NonNullable<StreamVideoConfig['push']>) {
    if (this.config.push) {
      console.log(
        'setPushConfig: Ignoring this config as push config was already set',
      );
      return;
    }
    this.config.push = pushConfig;
    // After getting the config we should setup callkeep events, firebase handler asap to handle incoming calls from a dead state
    setupFirebaseHandlerAndroid(pushConfig);
  }

  static getConfig() {
    return this.config;
  }
}
