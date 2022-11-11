import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Call } from '@stream-io/video-client/dist/src/gen/video/coordinator/call_v1/call';
import { useEffect, useState } from 'react';
import { PermissionsAndroid } from 'react-native';
import RNCallKeep from 'react-native-callkeep';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../contexts/AppContext';
import { RootStackParamList } from '../../types';

export const useCallKeep = () => {
  const username = useAppGlobalStoreValue((store) => store.username);
  const videoClient = useAppGlobalStoreValue((store) => store.videoClient);

  const [incomingCall, setIncomingCall] = useState<Call | undefined>(undefined);
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, 'ActiveCall'>
    >();

  const setState = useAppGlobalStoreSetState();

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
        selfManaged: true,
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
        console.log('RNCallKeep', accepted ? 'Working' : 'Not working');
      });
    } catch (error) {
      console.log(error);
    }
  }, []);

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

  const displayIncomingCallNow = (call: Call) => {
    try {
      navigation.navigate('IncomingCallScreen', call);
    } catch (error) {
      console.log(error);
    }
  };

  const rejectCall = async (call: Call) => {
    await RNCallKeep.endCall(call.id);
    setIncomingCall(undefined);
    if (call.createdByUserId === username) {
      setState({
        activeCall: undefined,
        call: undefined,
      });
      navigation.navigate('HomeScreen');
    }
  };

  const hangupCall = async (call: Call, cancelled?: boolean) => {
    await RNCallKeep.endCall(call.id);
    setIncomingCall(undefined);

    if (call.createdByUserId === username) {
      setState({
        activeCall: undefined,
        call: undefined,
      });
      if (cancelled) {
        videoClient?.cancelCall(call.callCid);
        return;
      }
    }
    navigation.navigate('HomeScreen');
  };

  return {
    displayIncomingCallNow,
    hangupCall,
    incomingCall,
    startCall,
    rejectCall,
  };
};
