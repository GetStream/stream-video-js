import { useEffect } from 'react';
import { DeviceEventEmitter, NativeModules, Platform } from 'react-native';
import InCallManager from 'react-native-incall-manager';

// This hook is responsible to handle the proximity effect through IncallManager
export const useIncallManagerProximityEffect = () => {
  useEffect(() => {
    InCallManager.start();
    InCallManager.setForceSpeakerphoneOn();
    // Added this because of https://github.com/react-native-webrtc/react-native-incall-manager/issues/82#issuecomment-385241109
    if (Platform.OS === 'ios') {
      NativeModules.InCallManager.addListener('Proximity');
    }
    DeviceEventEmitter.addListener('Proximity', function (data) {
      console.log(data);
    });

    return () => InCallManager.stop();
  }, []);
};
