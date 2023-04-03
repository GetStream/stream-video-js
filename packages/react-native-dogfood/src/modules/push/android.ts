import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';

import RNCallKeep from 'react-native-callkeep';
import { meetingId } from '../helpers/meetingId';

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
