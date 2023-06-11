import { StreamVideoRN } from '@stream-io/video-react-native-sdk';
import { AndroidImportance } from '@notifee/react-native';
import { StaticNavigationService } from './staticNavigationUtils';

export function setPushConfig() {
  StreamVideoRN.updateConfig({
    push: {
      android_pushProviderName: 'rn-fcm-video',
      ios_pushProviderName: 'rn-apn-video',
      ios_appName: 'ReactNativeStreamDogFood',
      android_phoneCallingAccountPermissionTexts: {
        alertTitle: 'Permission Required',
        alertDescription:
          'This application needs to access your phone calling accounts to make calls',
        cancelButton: 'Cancel',
        okButton: 'Ok',
      },
      android_incomingCallChannel: {
        id: 'stream_incoming_call',
        name: 'Incoming call notifications',
        importance: AndroidImportance.HIGH,
      },
      android_incomingCallNotificationTextGetters: {
        getTitle: (createdUserName: string) =>
          `Incoming call from ${createdUserName}`,
        getBody: (_createdUserName: string) => 'Tap to answer the call',
      },
      navigateAcceptCall: () => {
        StaticNavigationService.navigate('Call');
      },
    },
  });
}
