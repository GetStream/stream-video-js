import { NativeModules, Platform } from 'react-native';

export async function getAndroidDefaultRingtoneUrl(): Promise<
  string | undefined
> {
  if (Platform.OS !== 'android') {
    return undefined;
  }
  try {
    const url =
      await NativeModules.StreamVideoReactNative?.getDefaultRingtoneUrl();
    return url;
  } catch (e) {
    console.info(e);
  }

  return undefined;
}
