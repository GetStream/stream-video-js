export type RNDeviceInfoType =
  typeof import('react-native-device-info').default;

export type ExpoDeviceInfoType = typeof import('expo-device');

let RNdeviceInfo: RNDeviceInfoType;
let expoDeviceInfo: ExpoDeviceInfoType;

try {
  expoDeviceInfo = require('expo-device');
} catch (error) {}

try {
  RNdeviceInfo = require('react-native-device-info').default;
} catch (error) {}

export function getRNDeviceInfoLib() {
  if (!RNdeviceInfo) {
    console.log(
      'react-native-device-info library is not installed. Please see https://github.com/react-native-device-info/react-native-device-info#installation for installation instructions',
    );
  }
  return RNdeviceInfo;
}

export function getExpoDeviceInfoLib() {
  if (!expoDeviceInfo) {
    console.log(
      'expo-device library is not installed. Please see https://docs.expo.dev/versions/latest/sdk/device/ for installation instructions',
    );
  }
  return expoDeviceInfo;
}
