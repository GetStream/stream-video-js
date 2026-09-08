import {
  type ClientPublishOptions,
  StreamVideoClient,
  type Call,
} from '@stream-io/video-client';

export type AndroidChannelConfig = {
  id: string;
  name: string;
  sound?: string;
  vibration?: boolean;
};

export type KeepAliveAndroidNotificationTexts = {
  title: string;
  body: string;
};

export type NonRingingPushEvent =
  'call.live_started' | 'call.notification' | 'call.missed';

/**
 * Hooks that run around a ringing call's join, wherever that join is triggered.
 *
 * A ringing call is joined by the SDK, not by your code: the accept button joins
 * internally, and an outgoing call joins itself once the callee answers. That
 * leaves no moment in which app code holds the call and the join has not yet
 * happened - which is a problem for anything that must be installed first, most
 * notably `call.setE2EEManager()`, since it throws once a call has peer
 * connections.
 *
 * These hooks are that moment. They run for every ringing path: accepted from the
 * CallKit/Telecom UI, accepted inside the app, and outgoing.
 *
 * Register them with {@link StreamVideoRN.setRingingCallLifecycleHooks} at your app's
 * entry point, next to `setPushConfig`. A call accepted from a push notification
 * can be created and joined before any component mounts - the app may be launched
 * from a killed state - so registering them from inside React is too late.
 */
export type RingingCallLifecycleHooks = {
  /**
   * Awaited by `Call.join()` for a ringing call, before any peer connection exists.
   * **Throwing aborts the join** and the call is not entered.
   *
   * That is deliberate: joining without whatever this hook installs would, in the
   * E2EE case, publish unencrypted media on a call the user believes is private.
   * On the push path there is no UI to reveal it, so the join fails closed instead.
   *
   * Keep it fast. On the CallKit accept path it runs inside iOS's accept deadline
   * (roughly 30s before the app is killed) and anything slower than five seconds is
   * treated as a failure. Deriving a key locally is fine; fetching one over the
   * network does not belong here.
   *
   * @example
   * onBeforeCallJoin: async (call) => {
   *   await attachE2EEIfConfigured(call);
   * }
   */
  onBeforeCallJoin?: (call: Call) => Promise<void>;
  /**
   * Called once, when a ringing call is finished with: normally when it leaves, and
   * also when a join fails after {@link onBeforeCallJoin} has already run -
   * otherwise whatever that hook installed would never be released. A call that
   * rings and is then rejected, cancelled or missed never joins, so it was never
   * set up and there is nothing here to release.
   *
   * Use it to free per-call resources the SDK does not own. An E2EE manager is the
   * motivating case: it has no native detach, closing the peer connections does not
   * free it, and on the push path the call can end while the app is still in the
   * background, where no React cleanup ever runs.
   *
   * When an {@link onBeforeCallJoin} is also registered, this is only called for a
   * call that hook actually entered, so it always pairs with a setup that happened.
   * Registered on its own it has no such pairing to honour and is called for every
   * ringing call that ends.
   *
   * May return a promise; rejections are logged. Nothing is gated on it, so do not
   * rely on it completing before the OS suspends the app.
   */
  onAfterCallLeave?: (call: Call) => void | Promise<void>;
};

export type StreamVideoConfig = {
  /**
   * The configuration to be used for push notifications.
   * If undefined, push notifications will not be enabled for the app
   * @default undefined
   */
  push?: {
    /**
     * @deprecated Expo is auto-detected; this value is ignored and the property will be removed in a future major version.
     */
    isExpo?: boolean;
    /**
     * The publish options to be used when joining a call from a push notification.
     *
     * @internal
     */
    publishOptions?: ClientPublishOptions;

    ios?: {
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
      /**
       * Whether to enable ongoing calls.
       * @default false
       */
      enableOngoingCalls?: boolean;
      /**
       * When true, ringing pushes that arrive while the app is in the
       * foreground are not shown by CallKit. The push is still delivered to
       * JS, so the app must show its own ringing UI. Background pushes are unaffected.
       * Requires iOS 26.4 or newer version of iOS.
       * @default false
       */
      skipIncomingPushInForeground?: boolean;
      /**
       * Default audio endpoint for CallKit-managed calls on iOS.
       * `'earpiece'` routes voice-only / phone-style calls to the built-in receiver.
       * Set via `setPushConfig` so it's in place before CallKit's `CXAnswerCallAction`.
       * @default 'speaker'
       */
      defaultDeviceEndpointType?: 'speaker' | 'earpiece';
    };
    android?: {
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
       * The notification channel to be used for incoming calls for Android.
       * @example
       * {
       *  id: 'incoming_calls_channel',
       *  name: 'Incoming calls',
       *  sound?: string;
       *  vibration?: boolean;
       * }
       */
      incomingChannel?: AndroidChannelConfig;
      /**
       * Texts used for call state notifications while the system is connecting or declining the call.
       * If not provided, platform defaults will be used.
       * @example
       * {
       *  accepting: 'Connecting...',
       *  rejecting: 'Declining...',
       * }
       */
      notificationTexts?: {
        accepting?: string;
        rejecting?: string;
      };
      /**
       * The transformer to be used to transform the call title in the notification for ringing and ongoing calls for Android.
       */
      titleTransformer?: (memberName: string, incoming: boolean) => string;
      enableOngoingCalls?: boolean;
      /**
       * When true, incoming call push notifications (call.ring) will not be displayed
       * as a notification when the app is in the foreground.
       * @default false
       */
      skipIncomingPushInForeground?: boolean;
      /**
       * Default audio endpoint for Telecom-managed calls on Android.
       * @default 'speaker'
       */
      defaultDeviceEndpointType?: 'speaker' | 'earpiece';
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
  };
  foregroundService: {
    android: {
      /**
       * The notification channel to keep call alive in the background for Android using a foreground service.
       */
      channel: Omit<AndroidChannelConfig, 'sound' | 'vibration'>;
      /**
       * The texts shown in the notification to keep call alive in the background
       */
      notificationTexts: KeepAliveAndroidNotificationTexts;
      /**
       * The task to run in the foreground service.
       */
      taskToRun: (call: Call) => Promise<void>;
    };
  };
};
