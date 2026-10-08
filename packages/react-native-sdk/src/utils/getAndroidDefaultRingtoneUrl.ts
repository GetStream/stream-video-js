import { Platform } from 'react-native';
import NativeStreamVideoReactNative from '../native/NativeStreamVideoReactNative';
import { videoLoggerSystem } from '@stream-io/video-client';

export async function getAndroidDefaultRingtoneUrl(): Promise<
  string | undefined
> {
  if (Platform.OS !== 'android') {
    return undefined;
  }
  try {
    const url = NativeStreamVideoReactNative.getDefaultRingtoneUrl();
    if (url == null) {
      throw new Error('Cannot get default ringtone in Android');
    }
    return url;
  } catch (e) {
    const logger = videoLoggerSystem.getLogger('getAndroidDefaultRingtoneUrl');
    logger.warn('Failed to get default ringtone from native module', e);
  }

  return undefined;
}
