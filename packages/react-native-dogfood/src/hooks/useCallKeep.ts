import { useEffect } from 'react';
import { PermissionsAndroid } from 'react-native';
import RNCallKeep from 'react-native-callkeep';

export const useCallKeep = () => {
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
};
