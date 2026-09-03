// import { getVoipPushNotificationLib } from './libs';

import { Platform } from 'react-native';
import { onVoipNotificationReceived } from './internal/ios';
import { StreamVideoConfig } from '../StreamVideoRN/types';
import { videoLoggerSystem } from '@stream-io/video-client';
import { getCallingxLib } from './libs';

export function setupIosVoipPushEvents(
  pushConfig: NonNullable<StreamVideoConfig['push']>,
) {
  const logger = videoLoggerSystem.getLogger('setupIosVoipPushEvents');
  if (Platform.OS !== 'ios' || !pushConfig.ios?.pushProviderName) {
    logger.debug(
      `setupIosVoipPushEvents skipped: platform=${Platform.OS} pushProviderName=${pushConfig.ios?.pushProviderName}`,
    );
    return;
  }

  const callingx = getCallingxLib();
  callingx.addEventListener('voipNotificationReceived', (params) => {
    logger.debug(
      `voipNotificationReceived event call_cid: ${params?.stream?.call_cid}`,
    );
    onVoipNotificationReceived(params, pushConfig).catch((error) => {
      logger.error(`Error in onVoipNotificationReceived: ${error}`);
    });
  });
}
