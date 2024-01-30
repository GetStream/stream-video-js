import { NativeModules, Platform } from 'react-native';

export async function getAndroidDefaultRingtoneUrl(): Promise<
  string | undefined
> {
  if (Platform.OS !== 'android') {
    return undefined;
  }
  const url =
    await NativeModules.StreamVideoReactNative?.getDefaultRingtoneUrl();
  return url;
}
