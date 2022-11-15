import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Call } from '@stream-io/video-client/dist/src/gen/video/coordinator/call_v1/call';
import { useCallback, useEffect } from 'react';
import { PermissionsAndroid } from 'react-native';
import RNCallKeep from 'react-native-callkeep';
import { useAppGlobalStoreValue } from '../contexts/AppContext';
import { RootStackParamList } from '../../types';
import { useStore } from './useStore';
import { useObservableValue } from './useObservable';

export const useCallKeep = () => {
  const videoClient = useAppGlobalStoreValue((store) => store.videoClient);
  const { activeCallMeta$, incomingRingCalls$, rejectedCall$ } = useStore();
  const activeCall = useObservableValue(activeCallMeta$);
  const incomingRingCalls = useObservableValue(incomingRingCalls$);
  const rejectedCall = useObservableValue(rejectedCall$);

  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, 'ActiveCall'>
    >();

  const startCall = useCallback(() => {
    try {
      if (activeCall) {
        RNCallKeep.startCall(
          activeCall.id,
          '282829292',
          activeCall.createdByUserId,
          'generic',
        );
      }
    } catch (err) {
      console.log(err);
    }
  }, [activeCall]);

  const displayIncomingCallNow = useCallback(() => {
    try {
      navigation.navigate('IncomingCallScreen');
    } catch (error) {
      console.log(error);
    }
  }, [navigation]);

  const rejectCall = useCallback(async () => {
    if (rejectedCall) {
      await RNCallKeep.endCall(rejectedCall.id);

      navigation.navigate('HomeScreen');
    }
  }, [navigation, rejectedCall]);

  useEffect(() => {
    if (rejectedCall) {
      rejectCall();
    }
    if (activeCall) {
      startCall();
    }
    if (incomingRingCalls.length > 0) {
      displayIncomingCallNow();
    }
  }, [
    activeCall,
    rejectedCall,
    incomingRingCalls,
    displayIncomingCallNow,
    rejectCall,
    startCall,
  ]);

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

  const hangupCall = async (call: Call, cancelled?: boolean) => {
    await RNCallKeep.endCall(call.id);

    if (cancelled) {
      videoClient?.cancelCall(call.callCid);
      return;
    }
    navigation.navigate('HomeScreen');
  };

  return {
    displayIncomingCallNow,
    hangupCall,
    startCall,
    rejectCall,
  };
};
