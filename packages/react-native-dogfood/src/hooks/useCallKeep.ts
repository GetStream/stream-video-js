import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StreamSfuClient, StreamVideoClient } from '@stream-io/video-client';
import { Call } from '@stream-io/video-client/dist/src/gen/video/coordinator/call_v1/call';
import { useEffect, useState } from 'react';
import { PermissionsAndroid } from 'react-native';
import RNCallKeep from 'react-native-callkeep';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../contexts/AppContext';
import { RootStackParamList } from '../../types';
import { useSessionId } from './useSessionId';
import { Call as CallUtil } from '../modules/Call';
import InCallManager from 'react-native-incall-manager';

const getRandomNumber = () => String(Math.floor(Math.random() * 100000));

export const useCallKeep = (videoClient: StreamVideoClient | undefined) => {
  const ringingCallID = useAppGlobalStoreValue((store) => store.ringingCallID);
  const username = useAppGlobalStoreValue((store) => store.username);
  const localMediaStream = useAppGlobalStoreValue(
    (store) => store.localMediaStream,
  );
  const [incomingCall, setIncomingCall] = useState<Call | undefined>(undefined);
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, 'ActiveCall'>
    >();

  const setState = useAppGlobalStoreSetState();

  const sessionId = useSessionId(ringingCallID, username);

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
      RNCallKeep.addEventListener('endCall', async () => {
        if (incomingCall && username !== incomingCall?.createdByUserId) {
          await videoClient.rejectCall(incomingCall?.callCid);
        }
      });

      RNCallKeep.addEventListener('answerCall', async () => {
        if (incomingCall && username !== incomingCall?.createdByUserId) {
          const callID = incomingCall.callCid.split(':')[1];
          await videoClient.answerCall(callID);
          const result = await videoClient.joinCallRaw({
            id: callID,
            type: 'default',
            datacenterId: 'amsterdam',
          });
          if (result) {
            const { response, edge } = result;
            if (response) {
              const { call: activeCall } = response;
              const credentials = edge.credentials;

              if (!credentials || !activeCall) {
                return;
              }

              setState({ activeCall: activeCall.call });
              const serverUrl = 'http://192.168.1.41:3031/twirp';

              const sfuClient = new StreamSfuClient(
                serverUrl,
                credentials.token,
                sessionId,
              );
              const call = new CallUtil(
                sfuClient,
                username,
                serverUrl,
                credentials,
              );
              try {
                const callState = await call.join(localMediaStream);
                if (callState && localMediaStream) {
                  InCallManager.start({ media: 'video' });
                  InCallManager.setForceSpeakerphoneOn(true);
                  await call.publish(localMediaStream);
                  setState({
                    activeCall: activeCall.call,
                    callState,
                    sfuClient,
                    call,
                  });
                  startCall({
                    callID,
                    createdByUserId: username,
                  });
                  navigation.navigate('ActiveCall');
                }
              } catch (err) {
                setState({
                  callState: undefined,
                });
              }
            }
          }
        }
      });
    }
  }, [
    videoClient,
    ringingCallID,
    incomingCall,
    username,
    localMediaStream,
    sessionId,
    navigation,
    setState,
  ]);

  const startCall = (call: { callID: string; createdByUserId: string }) => {
    try {
      RNCallKeep.startCall(
        call.callID,
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
      setIncomingCall(call);
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

  const hangupCall = (call: Call) => {
    const callID = call.callCid.split(':')[1];
    RNCallKeep.endCall(callID);
    setIncomingCall(undefined);
    if (call.createdByUserId === username) {
      setState({
        activeCall: undefined,
        callState: undefined,
        sfuClient: undefined,
        call: undefined,
      });
      navigation.navigate('HomeScreen');
    }
  };

  return {
    displayIncomingCallNow,
    hangupCall,
    startCall,
  };
};
