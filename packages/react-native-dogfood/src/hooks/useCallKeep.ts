import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import RNCallKeep from 'react-native-callkeep';
import { RootStackParamList } from '../../types';
import { useStore } from './useStore';
import { useObservableValue } from './useObservable';

export const useCallKeep = () => {
  const { activeRingCall$, rejectedCall$, incomingRingCalls$ } = useStore();
  const activeRingCall = useObservableValue(activeRingCall$);
  const rejectedCall = useObservableValue(rejectedCall$);
  const incomingRingCalls = useObservableValue(incomingRingCalls$);

  const currentIncomingRingCall =
    incomingRingCalls[incomingRingCalls.length - 1];

  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, 'ActiveCall'>
    >();

  const startCall = useCallback(() => {
    try {
      if (activeRingCall && Platform.OS === 'ios') {
        RNCallKeep.startCall(
          activeRingCall.id,
          '282829292',
          activeRingCall.createdByUserId,
          'generic',
        );
      }
    } catch (err) {
      console.log(err);
    }
  }, [activeRingCall]);

  const displayIncomingCallNow = useCallback(() => {
    try {
      navigation.navigate('IncomingCallScreen');
      console.log({ currentIncomingRingCall });
      if (currentIncomingRingCall) {
        if (Platform.OS === 'ios') {
          RNCallKeep.displayIncomingCall(
            currentIncomingRingCall.id,
            '',
            currentIncomingRingCall.createdByUserId,
            'generic',
            true,
          );
        }
      }
    } catch (error) {
      console.log(error);
    }
  }, [navigation, currentIncomingRingCall]);

  const endCall = useCallback(async () => {
    if (rejectedCall) {
      if (Platform.OS === 'ios') {
        await RNCallKeep.endCall(rejectedCall.id);
      }
      navigation.navigate('HomeScreen');
    }
  }, [navigation, rejectedCall]);

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

  return {
    displayIncomingCallNow,
    startCall,
    endCall,
  };
};
