import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';

import RNCallKeep from 'react-native-callkeep';
import { meetingId } from '../helpers/meetingId';
import notifee, { AndroidImportance } from '@notifee/react-native';

const FOREGROUND_SERVICE_CHANNEL_ID = 'call_foreground_service';

/** Firebase RemoteMessage handler **/
export function setFirebaseHandler() {
  const firebaseListener = async (
    message: FirebaseMessagingTypes.RemoteMessage,
  ) => {
    /* Example data from firebase
    "message": {
        "data": {
            "call_cid": "default:123",
            "sender": "stream.video",
            "type": "incoming_call"
        },
        // other stuff
    }
    */
    const uuidStr = meetingId(); // a random id
    const localizedCallerName = message.data?.user_names ?? '';
    const handle = 'handle'; // Phone number of the caller
    const handleType = 'generic'; // ios only
    const hasVideo = true; // ios only
    RNCallKeep.displayIncomingCall(
      uuidStr,
      handle,
      localizedCallerName,
      handleType,
      hasVideo,
    );
  };
  messaging().setBackgroundMessageHandler(firebaseListener);
  messaging().onMessage(firebaseListener);
  messaging()
    .getToken()
    .then((token) => {
      // TODO: send token to stream
      console.log({ token });
    });
}

export async function setForegroundService() {
  try {
    await notifee.createChannel({
      id: FOREGROUND_SERVICE_CHANNEL_ID,
      name: 'Stream Call',
      lights: false,
      vibration: false,
      importance: AndroidImportance.DEFAULT,
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
  await notifee.stopForegroundService();
}
