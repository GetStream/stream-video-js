export type DeviceInfoType = typeof import('react-native-device-info').default;

let deviceInfo: DeviceInfoType;

try {
  deviceInfo = require('react-native-device-info').default;
} catch (error) {}

export function getRNDeviceInfoLib() {
  if (!deviceInfo) {
    console.log(
      'react-native-device-info library is not installed. Please see https://github.com/react-native-device-info/react-native-device-info#installation for installation instructions',
    );
  }
  return deviceInfo;
}
