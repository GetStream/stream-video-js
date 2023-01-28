import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';

import RNCallKeep from 'react-native-callkeep';

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
    const cid = message.data?.call_cid ?? '';
    const handle = 'test handle';
    const contactIdentifier = 'test contactIdentifier';
    const handleType = 'generic'; // ios only
    const hasVideo = true; // ios only
    RNCallKeep.startCall(cid, handle, contactIdentifier);
    console.log({ message });
  };
  messaging().setBackgroundMessageHandler(firebaseListener);
  messaging().onMessage(firebaseListener);
}

/** Notifee ForegroundService with Notification */
// export const NOTIFICATION_CHANNEL_ID = 'sendbird.calls.rn.ringing';
// export async function setNotificationForegroundService() {
//   // Create channel
//   await Notifee.createChannel({
//     name: 'Ringing',
//     id: NOTIFICATION_CHANNEL_ID,
//     importance: AndroidImportance.HIGH,
//   });

//   // Register foreground service, NOOP
//   Notifee.registerForegroundService(
//     async (notification) => new Promise(() => notification),
//   );

//   // Register notification listeners
//   const onNotificationAction = async ({ type, detail }: Event) => {
//     if (type !== EventType.ACTION_PRESS || !detail.notification?.data?.call) {
//       return;
//     }

//     const callString = detail.notification.data.call;
//     const callProps: DirectCallProperties = JSON.parse(callString);

//     const directCall = await SendbirdCalls.getDirectCall(callProps.callId);
//     if (directCall.isEnded) {
//       AppLogger.warn('Call is already ended:', directCall.callId);
//       return Notifee.stopForegroundService();
//     }

//     if (detail.pressAction?.id === 'accept') {
//       AppLogger.info('[CALL START]', directCall.callId);
//       RunAfterAppReady<DirectRoutes, DirectRouteWithParams>((navigation) => {
//         if (directCall.isVideoCall) {
//           navigation.navigate(DirectRoutes.VIDEO_CALLING, {
//             callId: directCall.callId,
//           });
//         } else {
//           navigation.navigate(DirectRoutes.VOICE_CALLING, {
//             callId: directCall.callId,
//           });
//         }
//         directCall.accept();
//       });
//     } else if (detail.pressAction?.id === 'decline') {
//       AppLogger.warn('[CALL END]', directCall.callId);
//       await directCall.end();
//     }
//   };

//   Notifee.onBackgroundEvent(onNotificationAction);
//   Notifee.onForegroundEvent(onNotificationAction);
// }

// export async function startRingingWithNotification(call: DirectCallProperties) {
//   const directCall = await SendbirdCalls.getDirectCall(call.callId);
//   const callType = call.isVideoCall ? 'Video' : 'Voice';

//   // Accept only one ongoing call
//   const onGoingCalls = await SendbirdCalls.getOngoingCalls();
//   if (onGoingCalls.length > 1) {
//     AppLogger.warn('Ongoing calls:', onGoingCalls.length);
//     return directCall.end();
//   }

//   // Display Notification for action
//   await Notifee.displayNotification({
//     id: call.callId,
//     title: `${callType} Call from ${call.remoteUser?.nickname ?? 'Unknown'}`,
//     data: { call: JSON.stringify(call) },
//     android: {
//       asForegroundService: true,
//       channelId: NOTIFICATION_CHANNEL_ID,
//       actions: [
//         {
//           title: 'Accept',
//           pressAction: { id: 'accept', launchActivity: 'default' },
//         },
//         { title: 'Decline', pressAction: { id: 'decline' } },
//       ],
//     },
//   });

//   const unsubscribe = directCall.addListener({
//     // Update notification on established
//     onEstablished() {
//       return Notifee.displayNotification({
//         id: call.callId,
//         title: `${callType} Call with ${
//           directCall.remoteUser?.nickname ?? 'Unknown'
//         }`,
//         data: { call: JSON.stringify(call) },
//         android: {
//           asForegroundService: true,
//           channelId: NOTIFICATION_CHANNEL_ID,
//           actions: [{ title: 'End', pressAction: { id: 'decline' } }],
//           timestamp: Date.now(),
//           showTimestamp: true,
//           showChronometer: true,
//         },
//       });
//     },
//     // Remove notification on ended
//     onEnded() {
//       Notifee.stopForegroundService();
//       unsubscribe();
//     },
//   });
// }
