import { StreamVideoClient } from '@stream-io/video-client';
import notifee, { EventType } from '@notifee/react-native';
import { Platform } from 'react-native';
import {
  FirebaseMessagingTypes,
  getCallKeepLib,
  getFirebaseMessagingLib,
  RNCallKeepType,
} from './libs';
import { getPushConfig } from './config';
import { pushAcceptedIncomingCallCId$ } from '../../hooks';

// const options: Parameters<RNCallKeepType['setup']>[0] = {
//   ios: {
//     appName: 'ReactNativeStreamDogFood', // TODO: allow user to customise this
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

export async function setupCallkeep() {
  const callkeep = getCallKeepLib();
  const pushConfig = getPushConfig();
  const options: Parameters<RNCallKeepType['setup']>[0] = {
    ios: {
      appName: pushConfig.ios_appName,
      supportsVideo: true,
    },
    android: {
      ...pushConfig.android_phoneCallingAccountPermissionTexts,
      additionalPermissions: [],
    },
  };
  return callkeep.setup(options).then((accepted) => {
    if (accepted) {
      callkeep.setAvailable(true);
    }
  });
}

/** Firebase RemoteMessage handler **/
export async function setupFirebaseHandlerAndroid(client: StreamVideoClient) {
  if (Platform.OS !== 'android') {
    return;
  }
  const messaging = getFirebaseMessagingLib();
  const pushConfig = getPushConfig();
  const firebaseListener = async (
    message: FirebaseMessagingTypes.RemoteMessage,
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
    const data = message.data;
    if (!data) {
      return;
    }
    // Check if the message is for Stream Video Call
    if (data.sender !== 'stream.video') {
      return;
    }
    const { getTitle, getBody } =
      pushConfig.android_incomingCallNotificationTextGetters;
    const channelId = pushConfig.android_incomingCallChannel.id;
    const createdUserName = data.created_by_display_name;
    await notifee.displayNotification({
      title: getTitle(createdUserName),
      body: getBody(createdUserName),
      android: {
        channelId,
        ongoing: true,
        pressAction: {
          id: 'default',
          launchActivity: 'default',
        },
        actions: [
          {
            title: 'Accept',
            pressAction: {
              id: ACCEPT_CALL_ACTION_ID,
            },
          },
          {
            title: 'Decline',
            pressAction: {
              id: DECLINE_CALL_ACTION_ID,
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
  messaging().setBackgroundMessageHandler(firebaseListener);
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    const { notification, pressAction } = detail;
    const notificationId = notification?.id;
    const data = notification?.data;
    if (!data || !pressAction || !notificationId) {
      return;
    }

    if (data.sender !== 'stream.video') {
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
      // Remove the notification
      await notifee.cancelNotification(notificationId);
    }

    // Check if we need to accept the call
    const didPressAccept =
      type === EventType.ACTION_PRESS &&
      pressAction.id === ACCEPT_CALL_ACTION_ID;
    if (didPressAccept) {
      pushAcceptedIncomingCallCId$.next(call_cid);
      pushConfig.navigateAcceptCall();
    }
  });
  // messaging().onMessage(firebaseListener); // this is to listen to foreground messages, which we dont need for now
  const token = await messaging().getToken();
  const push_provider_name = pushConfig.android_pushProviderName;
  await client.addDevice(token, 'firebase', push_provider_name);
  await notifee.createChannel(pushConfig.android_incomingCallChannel);
}
