import { useCallback, useEffect, useState } from 'react';
import { PermissionsAndroid } from 'react-native';
import RNCallKeep from 'react-native-callkeep';

const useCallKeep = ({ callId }: { callId: string }) => {
  const [heldCalls, setHeldCalls] = useState({}); // callKeep uuid: held
  const [calls, setCalls] = useState({}); // callKeep uuid: number

  const getRandomNumber = () => String(Math.floor(Math.random() * 100000));

  const addCall = useCallback(
    async (number: string) => {
      setHeldCalls({ ...heldCalls, [callId]: false });
      setCalls({ ...calls, [callId]: number });
    },
    [callId, setCalls, setHeldCalls, heldCalls, calls],
  );

  useEffect(() => {
    const options = {
      ios: {
        appName: 'StreamReactNativeVideoSDKSample',
      },
      android: {
        alertTitle: 'Permissions required',
        alertDescription:
          'This application needs to access your phone accounts',
        cancelButton: 'Cancel',
        okButton: 'ok',
        imageName: 'phone_account_icon',
        additionalPermissions: [PermissionsAndroid.PERMISSIONS.READ_CONTACTS],
        // Required to get audio in background when using Android 11
        foregroundService: {
          channelId: 'io.getstream.rnvideosample',
          channelName:
            'Foreground service for the app Stream React Native Dogfood',
          notificationTitle: 'App is running on background',
          notificationIcon: 'Path to the resource icon of the notification',
        },
      },
    };

    try {
      RNCallKeep.setup(options).then((accepted) => {
        console.log(accepted);
      });
    } catch (error) {
      console.log(error);
    }
  }, [callId]);

  const displayIncomingCall = useCallback(
    async (number: string) => {
      await addCall(number);

      try {
        await RNCallKeep.displayIncomingCall(
          callId,
          '2738282929',
          'Test User',
          'number',
          true,
        );
      } catch (error) {
        console.log(error);
      }
    },
    [addCall, callId],
  );

  const displayIncomingCallNow = useCallback(() => {
    displayIncomingCall(getRandomNumber());
  }, [displayIncomingCall]);

  return {
    calls,
    displayIncomingCallNow,
  };
};

export default useCallKeep;
