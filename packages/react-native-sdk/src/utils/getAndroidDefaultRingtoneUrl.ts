import { getLogger } from '@stream-io/video-client';
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
    const logger = getLogger(['getAndroidDefaultRingtoneUrl']);
    logger('warn', 'Failed to get default ringtone from native module', e);
  }

  return undefined;
}
