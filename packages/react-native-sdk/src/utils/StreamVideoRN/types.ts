import {
  type ClientPublishOptions,
  StreamVideoClient,
  type Call,
} from '@stream-io/video-client';
import type { AndroidChannel } from '@notifee/react-native';
import type { CallingExpOptions } from '../push/libs/callingx';

export type NonRingingPushEvent =
  | 'call.live_started'
  | 'call.notification'
  | 'call.missed';

export type StreamVideoConfig = {
  /**
   * The configuration to be used for push notifications.
   * If undefined, push notifications will not be enabled for the app
   * @default undefined
   */
  push?: {
    isExpo?: boolean;
    /**
     * The publish options to be used when joining a call from a push notification.
     *
     * @internal
     */
    publishOptions?: ClientPublishOptions;

    ios: {
      /**
       * The name for the alias of push provider used for iOS
       * Pass undefined if you will not be using stream's push notifications but still want to use the functionality of the SDK
       * @example "production-apn-video" or "staging-apn-video" based on the environment
       */
      pushProviderName?: string;
      supportsVideo?: boolean;
      /**
       * Sound to play when an incoming call is received. Must be a valid sound resource name in the project.
       * @default '' (no sound)
       */
      sound?: string;
      /**
       * Image to display when an incoming call is received. Must be a valid image resource name in the project.
       * @default '' (no image)
       */
      imageName?: string;
      /**
       * Enable calls history. When enabled, the call will be added to the calls history.
       * @default false
       */
      callsHistory?: boolean;
      /**
       * Timeout to display an incoming call. When the call is displayed for more than the timeout, the call will be rejected.
       * @default 60000 (1 minute)
       */
      displayCallTimeout?: number;
    };
    android: {
      /**
       * The small icon to be used for push notifications for Android
       * Reference the name created (Optional, defaults to 'ic_launcher')
       * @example "smallIcon: 'ic_small_icon'" or "smallIcon: 'ic_notification'"
       */
      smallIcon?: string;
      /**
       * The name for the alias of push provider used for Android.
       * Pass undefined if you will not be using stream's push notifications but still want to use the functionality of the SDK.
       * @example "production-fcm-video" or "staging-fcm-video" based on the environment
       */
      pushProviderName?: string;
      /**
       * The notification channel to be used for non ringing calls for Android.
       * @example
       * {
       *  id: 'stream_call_notifications',
       *  name: 'Call notifications',
       *  importance: AndroidImportance.HIGH,
       *  sound: 'default',
       * }
       */
      callChannel?: AndroidChannel;
      /**
       * The notification channel to be used for incoming calls for Android.
       * @example
       * {
       *  id: 'incoming_calls_channel',
       *  name: 'Incoming calls',
       *  sound?: string;
       *  vibration?: boolean;
       * }
       */
      incomingChannel?: {
        id?: string;
        name?: string;
        sound?: string;
        vibration?: boolean;
      };
      /**
       * The notification channel to be used for outgoing calls for Android.
       * @example
       * {
       *  id: 'outgoing_calls_channel',
       *  name: 'Outgoing calls',
       * }
       */
      outgoingChannel?: {
        id?: string;
        name?: string;
      };
      /**
       * Functions to create the texts shown in the notification for non ringing calls in Android.
       * @example
       *  getTitle(type, createdUserName) {
            if (type === 'call.live_started') {
              return `Call went live, it was started by ${createdUserName}`;
            } else if (type === 'call.missed') {
              return `Missed call from ${createdUserName}`;
            } else {
              return `${createdUserName} is notifying you about a call`;
            }
          },
          getBody(type, _createdUserName) {
            if (type === 'call.missed') {
              return 'Missed call!';
            } else {
              return 'Tap to open the call';
            }
          },
       */
      callNotificationTextGetters?: {
        getTitle: (
          type: NonRingingPushEvent,
          createdUserName: string,
        ) => string;
        getBody: (type: NonRingingPushEvent, createdUserName: string) => string;
      };
    };
    /**
     * Whether to reject calls when the user is busy.
     * @default false
     */
    shouldRejectCallWhenBusy?: boolean;
    /**
     * This function is used to create a custom video client.
     * This is used create a video client for incoming calls in the background and inform call events to the server.
     * If you are unable to create a video client, for example if you dont know the logged in user yet, return undefined.
     * @example
     * createStreamVideoClient: async () => {
     *  const userId = await AsyncStorage.getItem('@userId');
     *  const userName = await AsyncStorage.getItem('@userName');
     *  const tokenProvider = async () => await AsyncStorage.getItem('@userToken');
     *  if (!username || !userId) return undefined;
     *  const user = { id: userId, name: userName };
     *  return StreamVideoClient.getOrCreateInstance({
     *    apiKey,
     *    tokenProvider,
     *    user
     *  });
     * }
     */
    createStreamVideoClient: () => Promise<StreamVideoClient | undefined>;
    /** Callback that is called when a non ringing push notification was tapped */
    onTapNonRingingCallNotification?: (
      call_cid: string,
      type: NonRingingPushEvent,
    ) => void;
  };
  foregroundService: {
    android: {
      /**
       * The notification channel to keep call alive in the background for Android using a foreground service.
       */
      channel: AndroidChannel;
      /**
       * The texts shown in the notification to keep call alive in the background
       */
      notificationTexts: {
        title: string;
        body: string;
      };
      /**
       * The task to run in the foreground service
       * The task must resolve a promise once complete
       */
      taskToRun: (call: Call) => Promise<void>;
    };
  };
};
