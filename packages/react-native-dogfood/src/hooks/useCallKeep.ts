import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import InCallManager from 'react-native-incall-manager';
import RNCallKeep from 'react-native-callkeep';
import { RootStackParamList } from '../../types';
import {
  useActiveCall,
  useActiveRingCall,
} from '@stream-io/video-react-native-sdk';

export const useCallKeep = () => {
  const call = useActiveCall();
  const activeRingCallMeta = useActiveRingCall();

  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, 'ActiveCall'>
    >();

  const startCall = useCallback(() => {
    try {
      if (activeRingCallMeta && Platform.OS === 'ios') {
        RNCallKeep.startCall(
          activeRingCallMeta.id,
          '',
          activeRingCallMeta.createdByUserId,
          'generic',
        );
      }
    } catch (err) {
      console.log(err);
    }
  }, [activeRingCallMeta]);

  const displayIncomingCallNow = useCallback(() => {
    try {
      navigation.navigate('IncomingCallScreen');
    } catch (error) {
      console.log(error);
    }
  }, [navigation]);

  const endCall = useCallback(async () => {
    if (Platform.OS === 'ios' && activeRingCallMeta) {
      await RNCallKeep.endCall(activeRingCallMeta.id);
    }
    call?.leave();
    InCallManager.stop();

    navigation.navigate('HomeScreen');
  }, [navigation, activeRingCallMeta, call]);

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
