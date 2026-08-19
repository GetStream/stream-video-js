import { Platform } from 'react-native';
import { videoLoggerSystem } from '@stream-io/video-client';
import { StreamVideoConfig } from '../StreamVideoRN/types';
import { getCallingxLib } from './libs';
import { firebaseDataHandler } from './android';

export function setupAndroidPushEvents(
  pushConfig: NonNullable<StreamVideoConfig['push']>,
) {
  const logger = videoLoggerSystem.getLogger('setupAndroidPushEvents');
  if (Platform.OS !== 'android' || !pushConfig.android?.pushProviderName) {
    logger.debug(
      `setupAndroidPushEvents skipped: platform=${Platform.OS} pushProviderName=${pushConfig.android?.pushProviderName}`,
    );
    return;
  }

  const callingx = getCallingxLib();
  callingx.addEventListener('ringCallPushReceived', (params) => {
    logger.debug(`ringCallPushReceived event call_cid: ${params?.call_cid}`);
    firebaseDataHandler(params);
  });
}
