import { useEffect } from 'react';
import RNCallKeep from 'react-native-callkeep';
import { BehaviorSubject } from 'rxjs';
import {
  RunStaticNavigation,
  StaticNavigationService,
} from '../utils/staticNavigationUtils';

const options: Parameters<typeof RNCallKeep.setup>[0] = {
  ios: {
    appName: 'ReactNativeStreamDogFood',
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

try {
  RNCallKeep.setup(options);
  RNCallKeep.setAvailable(true); // TODO: set true/false based on login/logout
} catch (err) {
  console.error('initializeCallKeep error:', err);
}

export const callkeepCallId$ = new BehaviorSubject<string | undefined>(
  undefined,
);

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
      RNCallKeep.backToForeground();
      // close the dialer screen so that the app can be seen (only android needs this)
      RNCallKeep.endCall(callUUID);

      RunStaticNavigation(() => {
        callkeepCallId$.next(callUUID);
        StaticNavigationService.navigate('CallScreen');
      });
    });
    RNCallKeep.addEventListener('endCall', ({ callUUID }) => {
      if (callUUID) {
        RNCallKeep.endCall(callUUID);
      }
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
    RNCallKeep.addEventListener('checkReachability', () => {
      /*
       * On Android when the application is in background, after a certain delay the OS will close every connection with informing about it. So we have to check if the application is reachable before making a call from the native phone application.
       */
      RNCallKeep.setReachable();
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
      RNCallKeep.removeEventListener('checkReachability');
    };
  }, []);
};
