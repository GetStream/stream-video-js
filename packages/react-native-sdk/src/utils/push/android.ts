import notifee, { EventType, Event } from '@notifee/react-native';
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { StreamVideoClient } from '@stream-io/video-client';
import { Platform } from 'react-native';
import type {
  NonRingingPushEvent,
  StreamVideoConfig,
} from '../StreamVideoRN/types';
import {
  getFirebaseMessagingLib,
  getExpoNotificationsLib,
  getExpoTaskManagerLib,
} from './libs';
import {
  pushAcceptedIncomingCallCId$,
  pushRejectedIncomingCallCId$,
  pushTappedIncomingCallCId$,
  pushNonRingingCallData$,
} from './rxSubjects';
import { processCallFromPushInBackground } from './utils';
import { setPushLogoutCallback } from '../internal/pushLogoutCallback';

const ACCEPT_CALL_ACTION_ID = 'accept';
const DECLINE_CALL_ACTION_ID = 'decline';

type PushConfig = NonNullable<StreamVideoConfig['push']>;

/** Setup Firebase push message handler **/
export function setupFirebaseHandlerAndroid(pushConfig: PushConfig) {
  if (Platform.OS !== 'android') {
    return;
  }
  if (pushConfig.isExpo) {
    const Notifications = getExpoNotificationsLib();
    const TaskManager = getExpoTaskManagerLib();
    const BACKGROUND_NOTIFICATION_TASK =
      'STREAM-VIDEO-SDK-INTERNAL-BACKGROUND-NOTIFICATION-TASK';

    TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, ({ data, error }) => {
      if (error) {
        return;
      }
      // @ts-ignore
      const dataToProcess = data.notification?.data;
      firebaseMessagingOnMessageHandler(dataToProcess, pushConfig);
    });
    // background handler
    Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
    // foreground handler
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        // @ts-ignore
        const trigger = notification?.request?.trigger;
        if (trigger.type === 'push') {
          const data = trigger?.remoteMessage?.data;
          if (data?.sender === 'stream.video') {
            await firebaseMessagingOnMessageHandler(data, pushConfig);
            return {
              shouldShowAlert: false,
              shouldPlaySound: false,
              shouldSetBadge: false,
            };
          }
        }
        return {
          shouldShowAlert: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        };
      },
    });
  } else {
    const messaging = getFirebaseMessagingLib();
    messaging().setBackgroundMessageHandler(
      async (msg) =>
        await firebaseMessagingOnMessageHandler(msg.data, pushConfig),
    );
    messaging().onMessage((msg) =>
      firebaseMessagingOnMessageHandler(msg.data, pushConfig),
    ); // this is to listen to foreground messages, which we dont need for now
  }
  notifee.onBackgroundEvent(async (event) => {
    await onNotifeeEvent(event, pushConfig);
  });
  notifee.onForegroundEvent((event) => {
    onNotifeeEvent(event, pushConfig);
  });
}

/** Send token to stream, create notification channel,  */
export async function initAndroidPushToken(
  client: StreamVideoClient,
  pushConfig: PushConfig,
  setUnsubscribeListener: (unsubscribe: () => void) => void,
) {
  if (Platform.OS !== 'android' || !pushConfig.android.pushProviderName) {
    return;
  }
  const setDeviceToken = async (token: string) => {
    setPushLogoutCallback(() => {
      client.removeDevice(token).catch((err) => {
        console.warn('Failed to remove voip token from stream', err);
      });
    });
    const push_provider_name = pushConfig.android.pushProviderName;
    await client.addDevice(token, 'firebase', push_provider_name);
  };
  if (pushConfig.isExpo) {
    const expoNotificationsLib = getExpoNotificationsLib();
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
  } else {
    const messaging = getFirebaseMessagingLib();
    const unsubscribe = messaging().onTokenRefresh((refreshedToken) =>
      setDeviceToken(refreshedToken),
    );
    setUnsubscribeListener(unsubscribe);
    const token = await messaging().getToken();
    await setDeviceToken(token);
  }
}

const firebaseMessagingOnMessageHandler = async (
  data: FirebaseMessagingTypes.RemoteMessage['data'],
  pushConfig: PushConfig,
) => {
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
  if (!data || data.sender !== 'stream.video') {
    return;
  }

  if (data.type === 'call.ring') {
    const incomingCallChannel = pushConfig.android.incomingCallChannel;
    const incomingCallNotificationTextGetters =
      pushConfig.android.incomingCallNotificationTextGetters;
    if (!incomingCallChannel || !incomingCallNotificationTextGetters) {
      console.debug(
        "Can't show incoming call notification as either or both incomingCallChannel and was not provided",
      );
      return;
    }
    await notifee.createChannel(incomingCallChannel);
    const { getTitle, getBody } = incomingCallNotificationTextGetters;
    const createdUserName = data.created_by_display_name;

    const channelId = incomingCallChannel.id;
    await notifee.displayNotification({
      title: getTitle(createdUserName),
      body: getBody(createdUserName),
      data,
      android: {
        channelId,
        pressAction: {
          id: 'default',
          launchActivity: 'default', // open the app when the notification is pressed
        },
        actions: [
          {
            title: 'Decline',
            pressAction: {
              id: DECLINE_CALL_ACTION_ID,
            },
          },
          {
            title: 'Accept',
            pressAction: {
              id: ACCEPT_CALL_ACTION_ID,
              launchActivity: 'default', // open the app when the notification is pressed
            },
          },
        ],
        timeoutAfter: 60000, // 60 seconds, after which the notification will be dismissed automatically
      },
    });
  } else {
    // the other types are call.live_started and call.notification
    const callChannel = pushConfig.android.callChannel;
    const callNotificationTextGetters =
      pushConfig.android.callNotificationTextGetters;
    if (!callChannel || !callNotificationTextGetters) {
      console.debug(
        "Can't show call notification as either or both callChannel and callNotificationTextGetters is not provided",
      );
      return;
    }
    await notifee.createChannel(callChannel);
    const channelId = callChannel.id;
    const { getTitle, getBody } = callNotificationTextGetters;
    const createdUserName = data.created_by_display_name;
    // we can safely cast to string because the data is from "stream.video"
    const type = data.type as NonRingingPushEvent;
    await notifee.displayNotification({
      title: getTitle(type, createdUserName),
      body: getBody(type, createdUserName),
      data,
      android: {
        channelId,
        pressAction: {
          id: 'default',
          launchActivity: 'default', // open the app when the notification is pressed
        },
        timeoutAfter: 60000, // 60 seconds, after which the notification will be dismissed automatically
      },
    });
    const cid = data.call_cid;
    pushNonRingingCallData$.next({ cid, type });
  }
};

const onNotifeeEvent = async (event: Event, pushConfig: PushConfig) => {
  const { type, detail } = event;
  const { notification, pressAction } = detail;
  const notificationId = notification?.id;
  const data = notification?.data;
  if (
    !data ||
    !pressAction ||
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

    // Check if we need to decline the call
    const didPressDecline =
      type === EventType.ACTION_PRESS &&
      pressAction.id === DECLINE_CALL_ACTION_ID;
    const didDismiss = type === EventType.DISMISSED;
    const mustDecline = didPressDecline || didDismiss;
    // Check if we need to accept the call
    const mustAccept =
      type === EventType.ACTION_PRESS &&
      pressAction.id === ACCEPT_CALL_ACTION_ID;
    if (mustAccept) {
      pushAcceptedIncomingCallCId$.next(call_cid);
      // NOTE: accept will be handled by the app with rxjs observers as the app will go to foreground always
    } else if (mustDecline) {
      pushRejectedIncomingCallCId$.next(call_cid);
      if (hasObservers) {
        // if we had observers we can return here as the observers will handle the call as the app is in the foreground state
        return;
      }
      await processCallFromPushInBackground(pushConfig, call_cid, 'decline');
    } else if (type === EventType.PRESS) {
      pushTappedIncomingCallCId$.next(call_cid);
      // pressed state will be handled by the app with rxjs observers as the app will go to foreground always
    }
  } else {
    if (type === EventType.PRESS) {
      pushTappedIncomingCallCId$.next(call_cid);
      pushConfig.onTapNonRingingCallNotification?.(
        call_cid,
        data.type as NonRingingPushEvent,
      );
    }
  }
};
