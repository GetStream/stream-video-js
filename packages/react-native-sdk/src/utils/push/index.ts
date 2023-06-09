import { StreamVideoClient } from '@stream-io/video-client';
import PushLibs, {
  RNCallKeepType,
  FirebaseMessagingTypes,
  callkeepIsInstalled,
  messagingIsInstalled,
  notifeeIsInstalled,
} from './optionalLibs';
import { Platform } from 'react-native';

const { callkeep, notifee, messaging } = PushLibs;

const FOREGROUND_SERVICE_CHANNEL_ID = 'stream_call_foreground_service';
const INCOMING_CALL_CHANNEL_ID = 'stream_incoming_call';

const options: Parameters<RNCallKeepType['setup']>[0] = {
  ios: {
    appName: 'ReactNativeStreamDogFood', // TODO: allow user to customise this
    supportsVideo: true,
  },
  android: {
    alertTitle: 'Permissions Required',
    alertDescription:
      'This application needs to access your phone calling accounts to make calls',
    cancelButton: 'Cancel',
    okButton: 'ok',
    additionalPermissions: [],
    // Required to get audio in background when using Android 11
    foregroundService: {
      channelId: 'com.company.my',
      channelName: 'Foreground service for my app',
      notificationTitle: 'My app is running on background',
      notificationIcon: 'Path to the resource icon of the notification',
    },
  },
};

export async function setupCallkeep() {
  if (!callkeepIsInstalled(callkeep)) {
    return;
  }
  return callkeep.setup(options).then((accepted) => {
    if (accepted) {
      callkeep.setAvailable(true);
    }
  });
}

/** Firebase RemoteMessage handler **/
export async function setupFirebaseHandlerAndroid(client: StreamVideoClient) {
  if (
    Platform.OS !== 'android' ||
    !messagingIsInstalled(messaging) ||
    !notifeeIsInstalled(notifee)
  ) {
    return;
  }
  const firebaseListener = async (
    message: FirebaseMessagingTypes.RemoteMessage,
  ) => {
    if (!callkeepIsInstalled(callkeep)) {
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
    // Check if the message is for Stream Video Call
    if (message.data?.sender !== 'stream.video' || !message.data) {
      return;
    }
    await notifee.displayNotification({
      title: `Incoming call from ${message.data.created_by_display_name}`,
      body: 'Tap to accept or reject the call',
      android: {
        channelId: INCOMING_CALL_CHANNEL_ID,
        ongoing: true,
        pressAction: {
          id: 'default',
          launchActivity: 'default',
        },
      },
    });
    // const uuid = message.data.call_cid;
    // const localizedCallerName = message.data.created_by_display_name;
    // const handle = 'handle'; // Phone number of the caller // TODO: unclear what this is used for?!
    // callkeep.displayIncomingCall(uuid, handle, localizedCallerName);
  };
  messaging().setBackgroundMessageHandler(firebaseListener);
  // messaging().onMessage(firebaseListener); // this is to listen to foreground messages, which we dont need for now
  const token = await messaging().getToken();
  const push_provider_name = 'prod-firebase-android'; // TODO: allow user to customise this
  await client.addDevice(token, 'firebase', push_provider_name);
  await notifee.createChannel({
    id: INCOMING_CALL_CHANNEL_ID,
    name: 'Service to keep call alive', // TODO: allow user to customise this
    importance: 4, // AndroidImportance.HIGH
  });
}

export async function setForegroundService() {
  if (!notifeeIsInstalled(notifee)) {
    return;
  }
  try {
    await notifee.createChannel({
      id: FOREGROUND_SERVICE_CHANNEL_ID,
      name: 'Service to keep call alive', // TODO: allow user to customise this
      lights: false,
      vibration: false,
      importance: 3, // AndroidImportance.DEFAULT
    });
    notifee.registerForegroundService(() => {
      return new Promise(() => {
        console.log('Foreground service running for call in progress');
      });
    });
  } catch (err) {
    // Handle Error
  }
}

export async function startForegroundService() {
  if (!notifeeIsInstalled(notifee)) {
    return;
  }
  // TODO: allow user to customise this
  await notifee.displayNotification({
    title: 'Call in progress',
    body: 'Tap to return to the call',
    android: {
      channelId: FOREGROUND_SERVICE_CHANNEL_ID,
      asForegroundService: true,
      ongoing: true,
      pressAction: {
        id: 'default',
        launchActivity: 'default',
      },
    },
  });
}

export async function stopForegroundService() {
  if (!notifeeIsInstalled(notifee)) {
    return;
  }
  await notifee.stopForegroundService();
}
