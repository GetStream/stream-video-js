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

export function setupCallkeep(pushConfig: PushConfig) {
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
  callkeep.setup(options).then((accepted) => {
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
  messaging().setBackgroundMessageHandler(
    async (msg) => await firebaseMessagingOnMessageHandler(msg, pushConfig),
  );
  // messaging().onMessage(firebaseMessagingOnMessageHandler); // this is to listen to foreground messages, which we dont need for now
  notifee.onBackgroundEvent(async (event) => {
    // NOTE: When app was opened from a quit state, we will never hit this when on accept event as app will open and the click event will go to foreground
    await onNotifeeEvent(event, pushConfig);
  });
  notifee.onForegroundEvent((event) => {
    // NOTE: When app was opened from a quit state, we will never hit this when on accept event as app will open and go to foreground immediately
    onNotifeeEvent(event, pushConfig);
  });
}

/** Send token to stream, create notification channel,  */
export async function initAndroidPushToken(
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
  await notifee.createChannel(pushConfig.android.incomingCallChannel);
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
      timeoutAfter: 60000, // 60 seconds, after which the notification will be dismissed automatically
    },
  });
  // const callkeep = getCallKeepLib();
  // const uuid = message.data.call_cid;
  // const localizedCallerName = message.data.created_by_display_name;
  // const handle = 'handle'; // Phone number of the caller // TODO: unclear what this is used for?!
  // callkeep.displayIncomingCall(uuid, handle, localizedCallerName);
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

  // Check if we need to decline the call
  const didPressDecline =
    type === EventType.ACTION_PRESS &&
    pressAction.id === DECLINE_CALL_ACTION_ID;
  const didDismiss = type === EventType.DISMISSED;
  const mustDecline = didPressDecline || didDismiss;
  // Check if we need to accept the call
  const mustAccept =
    type === EventType.ACTION_PRESS && pressAction.id === ACCEPT_CALL_ACTION_ID;
  if (mustAccept) {
    pushAcceptedIncomingCallCId$.next(call_cid);
    pushConfig.navigateAcceptCall();
    // NOTE: accept will be handled by the app with rxjs observers as the app will go to foreground always
  } else if (mustDecline) {
    pushRejectedIncomingCallCId$.next(call_cid);
    const hasObservers =
      pushAcceptedIncomingCallCId$.observed &&
      pushRejectedIncomingCallCId$.observed;
    if (hasObservers) {
      // if we had observers we can return here as the observers will handle the call as the app is in the foreground state
      return;
    }
    // call has been declined from the notification
    // we need to create a new client and connect the user to decline the call
    // this is because the app is in background state and we don't have a client to decline the call
    let videoClient: StreamVideoClient | undefined;

    try {
      videoClient = await pushConfig.createStreamVideoClient();
      if (!videoClient) {
        return;
      }
      await videoClient.connectUser();
      await processCallFromPush(videoClient, call_cid, 'decline');
    } catch (e) {
      console.log('failed to create video client and connect user', e);
    }
  }
};

/**
 * This function is used process the call from push notifications due to incoming call
 * It does the following steps:
 * 1. Get the call from the client if present or create a new call
 * 2. Fetch the latest state of the call from the server if its not already in ringing state
 * 3. Join or leave the call based on the user's action.
 */
export const processCallFromPush = async (
  client: StreamVideoClient,
  call_cid: string,
  action: 'accept' | 'decline',
) => {
  // if the we find the call and is already ringing, we don't need create a new call
  // as client would have received the call.ring state because the app had WS alive when receiving push notifications
  let callFromPush = client.readOnlyStateStore.calls.find(
    (call) => call.cid === call_cid && call.ringing,
  );
  if (!callFromPush) {
    // if not it means that WS is not alive when receiving the push notifications and we need to fetch the call
    const [callType, callId] = call_cid.split(':');
    callFromPush = client.call(callType, callId, true);
    await callFromPush.get();
  }
  try {
    if (action === 'accept') {
      await callFromPush.join();
    } else {
      await callFromPush.leave({ reject: true });
    }
  } catch (e) {
    console.log('failed to process call from push notification', e, action);
  }
};
