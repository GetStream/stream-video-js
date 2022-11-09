import { StreamVideoClient } from '@stream-io/video-client';
import { Call } from '@stream-io/video-client/dist/src/gen/video/coordinator/call_v1/call';
import { useEffect, useState } from 'react';
import { PermissionsAndroid } from 'react-native';
import RNCallKeep from 'react-native-callkeep';
import { useAppGlobalStoreValue } from '../contexts/AppContext';

const getRandomNumber = () => String(Math.floor(Math.random() * 100000));

export const useCallKeep = (videoClient: StreamVideoClient | undefined) => {
  const ringingCallID = useAppGlobalStoreValue((store) => store.ringingCallID);
  const [incomingCall, setIncomingCall] = useState('');

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

    if (videoClient) {
      RNCallKeep.addEventListener('endCall', () => {
        console.log(incomingCall);
        videoClient.rejectCall(incomingCall);
      });
    }
  }, [videoClient, ringingCallID, incomingCall]);

  const startCall = (call: { callCid: string; createdByUserId: string }) => {
    try {
      RNCallKeep.startCall(
        call.callCid,
        '282829292',
        call.createdByUserId,
        'generic',
      );
    } catch (err) {
      console.log(err);
    }
  };

  const displayIncomingCall = async (number: string, call: Call) => {
    try {
      const callID = call.callCid.split(':')[1];
      setIncomingCall(callID);
      await RNCallKeep.displayIncomingCall(
        callID,
        number,
        call.createdByUserId,
        'generic',
        true,
      );
    } catch (error) {
      console.log(error);
    }
  };

  const displayIncomingCallNow = (call: Call) => {
    displayIncomingCall(getRandomNumber(), call);
  };

  const hangupCall = (callID: string) => {
    RNCallKeep.endCall(callID);
  };

  return {
    displayIncomingCallNow,
    hangupCall,
    startCall,
  };
};
