import { StreamVideoRN } from '@stream-io/video-react-native-sdk';
import { AndroidImportance } from '@notifee/react-native';
import { StaticNavigationService } from './staticNavigationUtils';

export function setPushConfig() {
  StreamVideoRN.setPushConfig({
    ios: {
      pushProviderName: 'rn-apn-video',
      appName: 'ReactNativeStreamDogFood',
    },
    android: {
      pushProviderName: 'rn-fcm-video',
      phoneCallingAccountPermissionTexts: {
        alertTitle: 'Permission Required',
        alertDescription:
          'This application needs to access your phone calling accounts to make calls',
        cancelButton: 'Cancel',
        okButton: 'Ok',
      },
      incomingCallChannel: {
        id: 'stream_incoming_call',
        name: 'Incoming call notifications',
        importance: AndroidImportance.HIGH,
      },
      incomingCallNotificationTextGetters: {
        getTitle: (createdUserName: string) =>
          `Incoming call from ${createdUserName}`,
        getBody: (_createdUserName: string) => 'Tap to answer the call',
      },
    },
    navigateAcceptCall: () => {
      StaticNavigationService.navigate('Call');
    },
  });
}
