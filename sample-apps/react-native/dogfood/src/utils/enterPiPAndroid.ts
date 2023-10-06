import { NativeModules, Platform } from 'react-native';

export default function enterPiPAndroid(width?: number, height?: number) {
  if (Platform.OS !== 'android') {
    return;
  }
  return NativeModules?.StreamVideoReactNative?.enterPipMode(
    width ? Math.floor(width) : 0,
    height ? Math.floor(height) : 0,
  );
}
