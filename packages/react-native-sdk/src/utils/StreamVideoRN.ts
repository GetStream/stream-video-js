import { StreamReaction } from '@stream-io/video-client';
import { AndroidChannel, AndroidImportance } from '@notifee/react-native';
import { defaultEmojiReactions } from '../constants';

type StreamReactionType = StreamReaction & {
  icon: string | JSX.Element;
};

type StreamVideoConfig = {
  /**
   * Reactions that are to be supported in the app.
   *
   * Note: This is an array of reactions that is rendered in the Reaction list.
   */
  supportedReactions: StreamReactionType[];
  /**
   * The configuration to be used for push notifications.
   * If undefined, push notifications will not be enabled for the app
   * @default undefined
   */
  push?: {
    ios_appName: string;
    /**
     * The texts shown in the notification to keep call alive in the background for Android using a foreground service.
     */
    android_phoneCallingAccountPermissionTexts: {
      alertTitle: string;
      alertDescription: string;
      cancelButton: string;
      okButton: string;
    };
    /**
     * The notification channel to be used for incoming calls for Android.
     * @example
     * {
     *  id: 'stream_incoming_call',
     *  name: 'Incoming call notifications',
     *  importance: AndroidImportance.HIGH
     * }
     */
    android_incomingCallChannel: AndroidChannel;
    /**
     * Functions to create the texts shown in the notification for incoming calls in Android.
     * @example
     * {
     *  title: (createdUserName: string) => `Incoming call from ${createdUserName}`,
     *  body: (createdUserName: string) => `Tap to answer the call`
     * }
     */
    android_incomingCallNotificationTextGetters: {
      getTitle: (createdUserName: string) => string;
      getBody: (createdUserName: string) => string;
    };
    /**
     * The name for the alias of push provider used for Android
     * @example "production-fcm-video" or "staging-fcm-video" based on the environment
     */
    android_pushProviderName: string;
    /**
     * The name for the alias of push provider used for Android
     * @example "production-apn-video" or "staging-apn-video" based on the environment
     */
    ios_pushProviderName: string;
    /** The callback that is called when a call is accepted, used for navigation */
    navigateAcceptCall: () => void;
  };
  /**
   * The notification channel to keep call alive in the background for Android using a foreground service.
   */
  android_foregroundServiceChannel: AndroidChannel;
  /**
   * The texts shown in the notification to keep call alive in the background for Android using a foreground service.
   */
  android_foregroundServiceNotificationTexts: {
    title: string;
    body: string;
  };
};

const DEFAULT_STREAM_VIDEO_CONFIG = {
  supportedReactions: defaultEmojiReactions,
  android_foregroundServiceChannel: {
    id: 'stream_call_foreground_service',
    name: 'Notification Service to keep call alive',
    lights: false,
    vibration: false,
    importance: AndroidImportance.DEFAULT,
  },
  android_foregroundServiceNotificationTexts: {
    title: 'Call in progress',
    body: 'Tap to return to the call',
  },
};

export class StreamVideoRN {
  /**
   * Global config for StreamVideoRN.
   */
  private static config: StreamVideoConfig = DEFAULT_STREAM_VIDEO_CONFIG;

  /**
   * Update the global config for StreamVideoRN.
   * This function accepts an config object that will be merged with the default config.
   * @example StreamVideoRN.setConfig({ onOpenCallParticipantsInfoView: () => {} });
   */
  static updateConfig(config: Partial<StreamVideoConfig>) {
    this.config = { ...this.config, ...config };
  }

  static getConfig() {
    return this.config;
  }
}
