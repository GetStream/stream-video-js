import { getVoipPushNotificationLib } from './libs';

import { Platform } from 'react-native';
import { onVoipNotificationReceived } from '..';
import { setPushLogoutCallback } from '../internal/pushLogoutCallback';
import { getLogger } from '@stream-io/video-client';
import { StreamVideoConfig } from '../StreamVideoRN/types';

export function setupIosVoipPushEvents(
  pushConfig: NonNullable<StreamVideoConfig['push']>,
) {
  if (Platform.OS !== 'ios' || !pushConfig.ios?.pushProviderName) {
    return;
  }
  const logger = getLogger(['setupIosVoipPushEvents']);
  const voipPushNotification = getVoipPushNotificationLib();

  logger('debug', 'notification event listener added');
  voipPushNotification.addEventListener('notification', (notification) => {
    onVoipNotificationReceived(notification);
  });
  setPushLogoutCallback(async () => {
    getLogger(['setPushLogoutCallback'])(
      'debug',
      'notification event listener removed',
    );
    voipPushNotification.removeEventListener('notification');
  });
}
