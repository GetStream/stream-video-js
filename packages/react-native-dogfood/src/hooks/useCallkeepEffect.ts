import { useEffect } from 'react';
import { PermissionsAndroid } from 'react-native';
import RNCallKeep from 'react-native-callkeep';

const options = {
  ios: {
    appName: 'ReactNativeStreamDogFood',
    // imageName: 'sim_icon',
    supportsVideo: true,
    // maximumCallGroups: '1',
    // maximumCallsPerCallGroup: '1',
  },
  android: {
    alertTitle: 'Permissions Required',
    alertDescription:
      'This application needs to access your phone calling accounts to make calls',
    cancelButton: 'Cancel',
    okButton: 'ok',
    imageName: 'sim_icon',
    additionalPermissions: [PermissionsAndroid.PERMISSIONS.READ_CONTACTS],
  },
};

try {
  RNCallKeep.setup(options);
  RNCallKeep.setAvailable(true); // TODO: set true/false based on login/logout
} catch (err) {
  console.error('initializeCallKeep error:', err);
}

export const useCallKeepEffect = () => {
  useEffect(() => {
    RNCallKeep.addEventListener(
      'didReceiveStartCallAction',
      ({ handle, callUUID, name }) => {
        console.log('didReceiveStartCallAction', { handle, callUUID, name });
      },
    );
    RNCallKeep.addEventListener('answerCall', ({ callUUID }) => {
      console.log('answerCall', { callUUID });
    });
    RNCallKeep.addEventListener('endCall', ({ callUUID }) => {
      console.log('endCall', { callUUID });
    });
    RNCallKeep.addEventListener(
      'didDisplayIncomingCall',
      ({
        error,
        callUUID,
        handle,
        localizedCallerName,
        hasVideo,
        fromPushKit,
        payload,
      }) => {
        console.log('didDisplayIncomingCall', {
          error,
          callUUID,
          handle,
          localizedCallerName,
          hasVideo,
          fromPushKit,
          payload,
        });
      },
    );
    RNCallKeep.addEventListener(
      'didPerformSetMutedCallAction',
      ({ muted, callUUID }) => {
        console.log('didPerformSetMutedCallAction', { muted, callUUID });
      },
    );
    RNCallKeep.addEventListener(
      'didToggleHoldCallAction',
      ({ hold, callUUID }) => {
        console.log('didToggleHoldCallAction', { hold, callUUID });
      },
    );
    RNCallKeep.addEventListener(
      'didPerformDTMFAction',
      ({ digits, callUUID }) => {
        console.log('didPerformDTMFAction', { digits, callUUID });
      },
    );
    RNCallKeep.addEventListener('didActivateAudioSession', () => {
      console.log('didActivateAudioSession');
    });

    return () => {
      RNCallKeep.removeEventListener('didReceiveStartCallAction');
      RNCallKeep.removeEventListener('answerCall');
      RNCallKeep.removeEventListener('endCall');
      RNCallKeep.removeEventListener('didDisplayIncomingCall');
      RNCallKeep.removeEventListener('didPerformSetMutedCallAction');
      RNCallKeep.removeEventListener('didToggleHoldCallAction');
      RNCallKeep.removeEventListener('didPerformDTMFAction');
      RNCallKeep.removeEventListener('didActivateAudioSession');
    };
  }, []);
};
