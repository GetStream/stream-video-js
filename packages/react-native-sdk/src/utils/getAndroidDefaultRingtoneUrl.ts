import { NativeModules, Platform } from 'react-native';
import { videoLoggerSystem } from '@stream-io/video-client';

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
    const logger = videoLoggerSystem.getLogger('getAndroidDefaultRingtoneUrl');
    logger.warn('Failed to get default ringtone from native module', e);
  }

  return undefined;
}
