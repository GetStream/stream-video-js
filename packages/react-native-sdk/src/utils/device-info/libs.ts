export type RNDeviceInfoType =
  typeof import('react-native-device-info').default;

let deviceInfo: RNDeviceInfoType | undefined;

try {
  deviceInfo = require('react-native-device-info').default;
} catch (e) {}

export function getDeviceInfoLib() {
  if (!deviceInfo) {
    throw Error(
      'react-native-device-info library is not installed. Please see https://github.com/react-native-device-info/react-native-device-info#installation for installation instructions',
    );
  }
  return deviceInfo;
}
