import {
  Call,
  CallingState,
  getLogger,
  RxUtils,
  StreamVideoClient,
} from '@stream-io/video-client';
import { AppState, Platform } from 'react-native';
import type {
  NonRingingPushEvent,
  StreamVideoConfig,
} from '../StreamVideoRN/types';
import {
  type FirebaseMessagingTypes,
  getExpoNotificationsLib,
  getExpoNotificationsLibNoThrow,
  getFirebaseMessagingLib,
  getFirebaseMessagingLibNoThrow,
  getIncomingCallForegroundServiceTypes,
  getNotifeeLibThrowIfNotInstalledForPush,
  type NotifeeLib,
} from './libs';
import {
  pushAcceptedIncomingCallCId$,
  pushAndroidBackgroundDeliveredIncomingCallCId$,
  pushNonRingingCallData$,
  pushRejectedIncomingCallCId$,
  pushTappedIncomingCallCId$,
  pushUnsubscriptionCallbacks$,
} from './internal/rxSubjects';
import {
  canAddPushWSSubscriptionsRef,
  clearPushWSEventSubscriptions,
  processCallFromPushInBackground,
  shouldCallBeEnded,
} from './internal/utils';
import { setPushLogoutCallback } from '../internal/pushLogoutCallback';
import { getAndroidDefaultRingtoneUrl } from '../getAndroidDefaultRingtoneUrl';
import { StreamVideoRN } from '../StreamVideoRN';

const ACCEPT_CALL_ACTION_ID = 'accept';
const DECLINE_CALL_ACTION_ID = 'decline';

type PushConfig = NonNullable<StreamVideoConfig['push']>;

type onBackgroundEventFunctionParams = Parameters<
  NotifeeLib['default']['onBackgroundEvent']
>[0];

type Event = Parameters<onBackgroundEventFunctionParams>[0];

let lastFirebaseToken = { token: '', userId: '' };

/** Send token to stream  */
export async function initAndroidPushToken(
  client: StreamVideoClient,
  pushConfig: PushConfig,
  setUnsubscribeListener: (unsubscribe: () => void) => void,
) {
  if (Platform.OS !== 'android' || !pushConfig.android.pushProviderName) {
    return;
  }
  const logger = getLogger(['initAndroidPushToken']);
  const setDeviceToken = async (token: string) => {
    const userId = client.streamClient._user?.id ?? '';
    if (client.streamClient.anonymous) {
      logger('debug', 'Skipped sending firebase token for anonymous user');
      return;
    }
    if (
      lastFirebaseToken.token === token &&
      lastFirebaseToken.userId === userId
    ) {
      logger(
        'debug',
        `Skipping setting the same token again for userId: ${userId} and token: ${token}`,
      );
      return;
    }
    lastFirebaseToken = { token, userId };
    setPushLogoutCallback(async () => {
      lastFirebaseToken = { token: '', userId: '' };
      try {
        logger('debug', `Logout removeDeviceToken: ${token}`);
        await client.removeDevice(token);
      } catch (err) {
        logger('warn', 'Failed to remove firebase token from stream', err);
      }
    });
    const push_provider_name = pushConfig.android.pushProviderName;
    logger('debug', `sending firebase token: ${token} for userId: ${userId}`);
    await client.addDevice(token, 'firebase', push_provider_name);
  };
  if (pushConfig.isExpo) {
    const expoNotificationsLib = pushConfig.onTapNonRingingCallNotification
      ? getExpoNotificationsLib()
      : getExpoNotificationsLibNoThrow();
    if (expoNotificationsLib) {
      logger('debug', `setting expo notification token listeners`);
      const subscription = expoNotificationsLib.addPushTokenListener(
        (devicePushToken) => {
          setDeviceToken(devicePushToken.data);
        },
      );
      setUnsubscribeListener(() => subscription.remove());
      const devicePushToken =
        await expoNotificationsLib.getDevicePushTokenAsync();
      const token = devicePushToken.data;
      await setDeviceToken(token);
    }
  }
  // TODO: remove the incomingCallChannel check and find a better way once we have telecom integration for android
  const messaging =
    pushConfig.isExpo && !pushConfig.android.incomingCallChannel
      ? getFirebaseMessagingLibNoThrow(true)
      : getFirebaseMessagingLib();
  if (messaging) {
    logger('debug', `setting firebase token listeners`);
    const unsubscribe = messaging().onTokenRefresh((refreshedToken) =>
      setDeviceToken(refreshedToken),
    );
    setUnsubscribeListener(unsubscribe);
    const token = await messaging().getToken();
    await setDeviceToken(token);
  }
}

/**
 * Creates notification from the push message data.
 * For Ringing and Non-Ringing calls.
 */
export const firebaseDataHandler = async (
  data: FirebaseMessagingTypes.RemoteMessage['data'],
) => {
  if (Platform.OS !== 'android') return;
  /* Example data from firebase
    "message": {
        "data": {
          call_cid: 'audio_room:dcc1638c-e90d-4dcb-bf3b-8fa7767bfbb0',
          call_display_name: '',
          created_by_display_name: 'tommaso',
          created_by_id: 'tommaso-03dcddb7-e9e2-42ec-b2f3-5043aac666ee',
          receiver_id: 'martin-21824f17-319b-401b-a61b-fcab646f0d3f',
          sender: 'stream.video',
          type: 'call.live_started',
          version: 'v2'
        },
        // other stuff
    }
  */
  const pushConfig = StreamVideoRN.getConfig().push;
  if (!pushConfig || !data || data.sender !== 'stream.video') {
    return;
  }
  const notifeeLib = getNotifeeLibThrowIfNotInstalledForPush();
  const notifee = notifeeLib.default;
  const settings = await notifee.getNotificationSettings();
  if (settings.authorizationStatus !== 1) {
    const logger = getLogger(['firebaseDataHandler']);
    logger(
      'debug',
      `Notification permission not granted, unable to post ${data.type} notifications`,
    );
    return;
  }

  if (data.type === 'call.ring') {
    const call_cid = data.call_cid as string;
    const created_by_id = data.created_by_id as string;
    const receiver_id = data.receiver_id as string;

    const shouldCallBeClosed = (callToCheck: Call) => {
      const { mustEndCall } = shouldCallBeEnded(
        callToCheck,
        created_by_id,
        receiver_id,
      );
      return mustEndCall;
    };

    const canListenToWS = () =>
      canAddPushWSSubscriptionsRef.current &&
      AppState.currentState !== 'active';
    const asForegroundService = canListenToWS();

    if (asForegroundService) {
      // Listen to call events from WS through fg service
      // note: this will replace the current empty fg service runner
      notifee.registerForegroundService(() => {
        return new Promise(async () => {
          const client = await pushConfig.createStreamVideoClient();
          if (!client) {
            getLogger(['firebaseMessagingOnMessageHandler'])(
              'debug',
              `Closing fg service as there is no client to create from push config`,
            );
            notifee.stopForegroundService();
            return;
          }
          const callFromPush = await client.onRingingCall(call_cid);
          let _shouldCallBeClosed = shouldCallBeClosed(callFromPush);
          if (_shouldCallBeClosed) {
            getLogger(['firebaseMessagingOnMessageHandler'])(
              'debug',
              `Closing fg service callCid: ${call_cid} shouldCallBeClosed: ${_shouldCallBeClosed}`,
            );
            notifee.stopForegroundService();
            return;
          }
          const unsubscribeFunctions: Array<() => void> = [];
          // check if service needs to be closed if accept/decline event was done on another device
          const unsubscribe = callFromPush.on('all', (event) => {
            const _canListenToWS = canListenToWS();
            if (!_canListenToWS) {
              getLogger(['firebaseMessagingOnMessageHandler'])(
                'debug',
                `Closing fg service from event callCid: ${call_cid} canListenToWS: ${_canListenToWS}`,
                { event },
              );
              unsubscribeFunctions.forEach((fn) => fn());
              notifee.stopForegroundService();
              return;
            }
            _shouldCallBeClosed = shouldCallBeClosed(callFromPush);
            if (_shouldCallBeClosed) {
              getLogger(['firebaseMessagingOnMessageHandler'])(
                'debug',
                `Closing fg service from event callCid: ${call_cid} canListenToWS: ${_canListenToWS} shouldCallBeClosed: ${_shouldCallBeClosed}`,
                { event },
              );
              unsubscribeFunctions.forEach((fn) => fn());
              notifee.stopForegroundService();
            }
          });
          // check if service needs to be closed if call was left
          const subscription = callFromPush.state.callingState$.subscribe(
            (callingState) => {
              if (
                callingState === CallingState.IDLE ||
                callingState === CallingState.LEFT
              ) {
                getLogger(['firebaseMessagingOnMessageHandler'])(
                  'debug',
                  `Closing fg service from callingState callCid: ${call_cid} callingState: ${callingState}`,
                );
                unsubscribeFunctions.forEach((fn) => fn());
                notifee.stopForegroundService();
              }
            },
          );
          unsubscribeFunctions.push(unsubscribe);
          unsubscribeFunctions.push(() => subscription.unsubscribe());
          const unsubscriptionCallbacks =
            RxUtils.getCurrentValue(pushUnsubscriptionCallbacks$) ?? [];
          pushUnsubscriptionCallbacks$.next([
            ...unsubscriptionCallbacks,
            ...unsubscribeFunctions,
          ]);
        });
      });
    }
    const incomingCallChannel = pushConfig.android.incomingCallChannel;
    const incomingCallNotificationTextGetters =
      pushConfig.android.incomingCallNotificationTextGetters;
    if (!incomingCallChannel || !incomingCallNotificationTextGetters) {
      const logger = getLogger(['firebaseMessagingOnMessageHandler']);
      logger(
        'error',
        "Can't show incoming call notification as either or both incomingCallChannel and incomingCallNotificationTextGetters were not provided",
      );
      return;
    }
    /*
     * Sound has to be set on channel level for android 8 and above and cant be updated later after creation!
     * For android 7 and below, sound should be set on notification level
     */
    // set default ringtone if not provided
    if (!incomingCallChannel.sound) {
      incomingCallChannel.sound = await getAndroidDefaultRingtoneUrl();
    }
    await notifee.createChannel(incomingCallChannel);
    const { getTitle, getBody, getAcceptButtonTitle, getDeclineButtonTitle } =
      incomingCallNotificationTextGetters;
    const createdUserName = data.created_by_display_name as string;

    const title = getTitle(createdUserName);
    const body = getBody(createdUserName);

    getLogger(['firebaseMessagingOnMessageHandler'])(
      'debug',
      `Displaying incoming call notification with callCid: ${call_cid} title: ${title} body: ${body} asForegroundService: ${asForegroundService}`,
    );

    const channelId = incomingCallChannel.id;
    await notifee.displayNotification({
      id: call_cid,
      title: getTitle(createdUserName),
      body: getBody(createdUserName),
      data,
      android: {
        channelId,
        smallIcon: pushConfig.android.smallIcon,
        importance: 4, // high importance
        foregroundServiceTypes: getIncomingCallForegroundServiceTypes(),
        asForegroundService,
        ongoing: true,
        sound: incomingCallChannel.sound,
        vibrationPattern: incomingCallChannel.vibrationPattern,
        loopSound: true,
        pressAction: {
          id: 'default',
          launchActivity: 'default', // open the app when the notification is pressed
        },
        actions: [
          {
            title: getDeclineButtonTitle?.() ?? 'Decline',
            pressAction: {
              id: DECLINE_CALL_ACTION_ID,
            },
          },
          {
            title: getAcceptButtonTitle?.() ?? 'Accept',
            pressAction: {
              id: ACCEPT_CALL_ACTION_ID,
              launchActivity: 'default', // open the app when the notification is pressed
            },
          },
        ],
        category: notifeeLib.AndroidCategory.CALL,
        fullScreenAction: {
          id: 'stream_ringing_incoming_call',
        },
        timeoutAfter: 60000, // 60 seconds, after which the notification will be dismissed automatically
      },
    });

    if (asForegroundService) {
      // no need to check if call has be closed as that will be handled by the fg service
      return;
    }

    // check if call needs to be closed if accept/decline event was done
    // before the notification was shown
    const client = await pushConfig.createStreamVideoClient();
    if (!client) {
      return;
    }
    const callFromPush = await client.onRingingCall(call_cid);

    if (shouldCallBeClosed(callFromPush)) {
      getLogger(['firebaseMessagingOnMessageHandler'])(
        'debug',
        `Removing incoming call notification immediately with callCid: ${call_cid} as it should be closed`,
      );
      notifee.cancelDisplayedNotification(call_cid);
    }
  } else {
    // the other types are call.live_started and call.notification
    const callChannel = pushConfig.android.callChannel;
    const callNotificationTextGetters =
      pushConfig.android.callNotificationTextGetters;
    if (!callChannel || !callNotificationTextGetters) {
      const logger = getLogger(['firebaseMessagingOnMessageHandler']);
      logger(
        'debug',
        "Can't show call notification as either or both callChannel and callNotificationTextGetters is not provided",
      );
      return;
    }
    await notifee.createChannel(callChannel);
    const channelId = callChannel.id;
    const { getTitle, getBody } = callNotificationTextGetters;
    const createdUserName = data.created_by_display_name as string;
    // we can safely cast to string because the data is from "stream.video"
    const type = data.type as NonRingingPushEvent;

    const title = getTitle(type, createdUserName);
    const body = getBody(type, createdUserName);

    getLogger(['firebaseMessagingOnMessageHandler'])(
      'debug',
      `Displaying NonRingingPushEvent ${type} notification with title: ${title} body: ${body}`,
    );
    await notifee.displayNotification({
      title: getTitle(type, createdUserName),
      body: getBody(type, createdUserName),
      data,
      android: {
        sound: callChannel.sound,
        smallIcon: pushConfig.android.smallIcon,
        vibrationPattern: callChannel.vibrationPattern,
        channelId,
        importance: 4, // high importance
        pressAction: {
          id: 'default',
          launchActivity: 'default', // open the app when the notification is pressed
        },
        timeoutAfter: 60000, // 60 seconds, after which the notification will be dismissed automatically
      },
    });
    const cid = data.call_cid as string;
    pushNonRingingCallData$.next({ cid, type });
  }
};

export const onAndroidNotifeeEvent = async ({
  event,
  isBackground,
}: {
  event: Event;
  isBackground: boolean;
}) => {
  if (Platform.OS !== 'android') return;
  const { type, detail } = event;
  const { notification, pressAction } = detail;
  const notificationId = notification?.id;
  const data = notification?.data;
  const pushConfig = StreamVideoRN.getConfig().push;
  if (
    !pushConfig ||
    !data ||
    !notificationId ||
    data.sender !== 'stream.video'
  ) {
    return;
  }

  // we can safely cast to string because the data is from "stream.video"
  const call_cid = data.call_cid as string;

  if (data.type === 'call.ring') {
    // check if we have observers for the call cid (this means the app is in the foreground state)
    const hasObservers =
      pushAcceptedIncomingCallCId$.observed &&
      pushRejectedIncomingCallCId$.observed;

    const notifeeLib = getNotifeeLibThrowIfNotInstalledForPush();
    const notifee = notifeeLib.default;
    // Check if we need to decline the call
    const didPressDecline =
      type === notifeeLib.EventType.ACTION_PRESS &&
      pressAction?.id === DECLINE_CALL_ACTION_ID;
    const didDismiss = type === notifeeLib.EventType.DISMISSED;
    const mustDecline = didPressDecline || didDismiss;
    // Check if we need to accept the call
    const mustAccept =
      type === notifeeLib.EventType.ACTION_PRESS &&
      pressAction?.id === ACCEPT_CALL_ACTION_ID;

    if (
      mustAccept ||
      mustDecline ||
      type === notifeeLib.EventType.ACTION_PRESS
    ) {
      getLogger(['onAndroidNotifeeEvent'])(
        'debug',
        `clearPushWSEventSubscriptions for callCId: ${call_cid} mustAccept: ${mustAccept} mustDecline: ${mustDecline}`,
      );
      clearPushWSEventSubscriptions();
      notifee.stopForegroundService();
    }

    if (mustAccept) {
      getLogger(['onAndroidNotifeeEvent'])(
        'debug',
        `pushAcceptedIncomingCallCId$ added with callCId: ${call_cid}`,
      );
      pushAcceptedIncomingCallCId$.next(call_cid);
      // NOTE: accept will be handled by the app with rxjs observers as the app will go to foreground always
    } else if (mustDecline) {
      getLogger(['onAndroidNotifeeEvent'])(
        'debug',
        `pushRejectedIncomingCallCId$ added with callCId: ${call_cid}`,
      );
      pushRejectedIncomingCallCId$.next(call_cid);
      if (hasObservers) {
        // if we had observers we can return here as the observers will handle the call as the app is in the foreground state
        getLogger(['onAndroidNotifeeEvent'])(
          'debug',
          `Skipped processCallFromPushInBackground for Declining call with callCId: ${call_cid} as the app is in the foreground state`,
        );
        return;
      }
      getLogger(['onAndroidNotifeeEvent'])(
        'debug',
        `start processCallFromPushInBackground - Declining call with callCId: ${call_cid}`,
      );
      await processCallFromPushInBackground(pushConfig, call_cid, 'decline');
    } else {
      if (type === notifeeLib.EventType.PRESS) {
        getLogger(['onAndroidNotifeeEvent'])(
          'debug',
          `pushTappedIncomingCallCId$ added with callCId: ${call_cid}`,
        );
        pushTappedIncomingCallCId$.next(call_cid);
        // pressed state will be handled by the app with rxjs observers as the app will go to foreground always
      } else if (isBackground && type === notifeeLib.EventType.DELIVERED) {
        getLogger(['onAndroidNotifeeEvent'])(
          'debug',
          `pushAndroidBackgroundDeliveredIncomingCallCId$ added with callCId: ${call_cid}`,
        );
        pushAndroidBackgroundDeliveredIncomingCallCId$.next(call_cid);
        // background delivered state will be handled by the app with rxjs observers as processing needs to happen only when app is opened
      }
    }
  } else {
    const notifeeLib = getNotifeeLibThrowIfNotInstalledForPush();
    if (type === notifeeLib.EventType.PRESS) {
      getLogger(['onAndroidNotifeeEvent'])(
        'debug',
        `onTapNonRingingCallNotification with callCId: ${call_cid}`,
      );
      pushConfig.onTapNonRingingCallNotification?.(
        call_cid,
        data.type as NonRingingPushEvent,
      );
    }
  }
};
