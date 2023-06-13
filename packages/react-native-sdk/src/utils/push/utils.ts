import { StreamVideoClient } from '@stream-io/video-client';
import notifee, { EventType, Event } from '@notifee/react-native';
import { Platform } from 'react-native';
import {
  FirebaseMessagingTypes,
  getCallKeepLib,
  getFirebaseMessagingLib,
  RNCallKeepType,
} from './libs';
import {
  pushAcceptedIncomingCallCId$,
  pushRejectedIncomingCallCId$,
} from './rxSubjects';
import type { StreamVideoConfig } from '../StreamVideoRN/types';

// const options: Parameters<RNCallKeepType['setup']>[0] = {
//   ios: {
//     appName: 'ReactNativeStreamDogFood',
//     supportsVideo: true,
//   },
//   android: {
//     alertTitle: 'Permissions Required',
//     alertDescription:
//       'This application needs to access your phone calling accounts to make calls',
//     cancelButton: 'Cancel',
//     okButton: 'ok',
//     additionalPermissions: [],
//     // Required to get audio in background when using Android 11
//     // foregroundService: {
//     //   channelId: 'com.company.my',
//     //   channelName: 'Foreground service for my app',
//     //   notificationTitle: 'My app is running on background',
//     //   notificationIcon: 'Path to the resource icon of the notification',
//     // },
//   },
// };

const ACCEPT_CALL_ACTION_ID = 'accept';
const DECLINE_CALL_ACTION_ID = 'decline';

type PushConfig = NonNullable<StreamVideoConfig['push']>;

export async function setupCallkeep(pushConfig: PushConfig) {
  const callkeep = getCallKeepLib();
  const options: Parameters<RNCallKeepType['setup']>[0] = {
    ios: {
      appName: pushConfig.ios.appName,
      supportsVideo: true,
    },
    android: {
      ...pushConfig.android.phoneCallingAccountPermissionTexts,
      additionalPermissions: [],
    },
  };
  if (Platform.OS !== 'ios') {
    return;
  }
  return callkeep.setup(options).then((accepted) => {
    if (accepted) {
      callkeep.setAvailable(true);
    }
  });
}

/** Setup Firebase push message handler **/
export function setupFirebaseHandlerAndroid(pushConfig: PushConfig) {
  if (Platform.OS !== 'android') {
    return;
  }
  const messaging = getFirebaseMessagingLib();
  messaging().setBackgroundMessageHandler((msg) =>
    firebaseMessagingOnMessageHandler(msg, pushConfig),
  );
  // messaging().onMessage(firebaseMessagingOnMessageHandler); // this is to listen to foreground messages, which we dont need for now
  notifee.onBackgroundEvent((event) =>
    onNotifeeBackgroundEvent(event, pushConfig),
  );
}

/** Send token to stream, create notification channel,  */
export async function initAndroidPushTokenAndRest(
  client: StreamVideoClient,
  pushConfig: PushConfig,
) {
  if (Platform.OS !== 'android') {
    return;
  }
  const messaging = getFirebaseMessagingLib();
  const token = await messaging().getToken();
  const push_provider_name = pushConfig.android.pushProviderName;
  await client.addDevice(token, 'firebase', push_provider_name);
  await notifee.createChannel(pushConfig.android.incomingCallChannel);
  await notifee.requestPermission();
}

const firebaseMessagingOnMessageHandler = async (
  message: FirebaseMessagingTypes.RemoteMessage,
  pushConfig: PushConfig,
) => {
  if (Platform.OS !== 'android') {
    return;
  }
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
  const data = message.data;
  if (!data || data.sender !== 'stream.video') {
    return;
  }
  const { getTitle, getBody } =
    pushConfig.android.incomingCallNotificationTextGetters;
  const channelId = pushConfig.android.incomingCallChannel.id;
  const createdUserName = data.created_by_display_name;
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
    },
  });
  // const callkeep = getCallKeepLib();
  // const uuid = message.data.call_cid;
  // const localizedCallerName = message.data.created_by_display_name;
  // const handle = 'handle'; // Phone number of the caller // TODO: unclear what this is used for?!
  // callkeep.displayIncomingCall(uuid, handle, localizedCallerName);
};

const onNotifeeBackgroundEvent = async (
  event: Event,
  pushConfig: PushConfig,
) => {
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

  // Check if we need to decline the call
  const didPressDecline =
    type === EventType.ACTION_PRESS &&
    pressAction.id === DECLINE_CALL_ACTION_ID;
  const didDismiss = type === EventType.DISMISSED;
  if (didPressDecline || didDismiss) {
    pushRejectedIncomingCallCId$.next(call_cid);
    // Remove the notification
    await notifee.cancelNotification(notificationId);
  }

  // Check if we need to accept the call
  const didPressAccept =
    type === EventType.ACTION_PRESS && pressAction.id === ACCEPT_CALL_ACTION_ID;
  if (didPressAccept) {
    pushAcceptedIncomingCallCId$.next(call_cid);
    pushConfig.navigateAcceptCall();
  }
};

export async function setAndroidInitialNotificationListener(
  videoClient: StreamVideoClient,
) {
  if (Platform.OS !== 'android') {
    return;
  }

  const initialNotification = await notifee.getInitialNotification();
  if (!initialNotification) {
    return;
  }
  const { pressAction, notification } = initialNotification;
  const data = notification.data;
  if (!data || !pressAction || data.sender !== 'stream.video') {
    return;
  }
  const call_cid = data.call_cid as string;
  const [callType, callId] = call_cid.split(':');
  const call = videoClient.call(callType, callId);
  try {
    await call.get();
    const didPressDecline = pressAction.id === DECLINE_CALL_ACTION_ID;
    const didPressAccept = pressAction.id === ACCEPT_CALL_ACTION_ID;
    if (didPressDecline) {
      await call.reject();
      await call.leave();
    } else if (didPressAccept) {
      await call.accept();
      await call.join();
    }
  } catch (err) {
    console.warn(
      "Couldn't process the incoming call that opened app from quit state",
      call_cid,
      err,
    );
    return undefined;
  }
  return call;
}
