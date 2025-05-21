import { getVoipPushNotificationLib } from './libs';

import { Platform } from 'react-native';
import { onVoipNotificationReceived } from './internal/ios';
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
  if (!pushConfig.android.incomingCallChannel) {
    // TODO: remove this check and find a better way once we have telecom integration for android
    logger(
      'debug',
      'android incomingCallChannel is not defined, so skipping the setupIosVoipPushEvents',
    );
    return;
  }
  const voipPushNotification = getVoipPushNotificationLib();

  logger('debug', 'notification event listener added');
  voipPushNotification.addEventListener('notification', (notification) => {
    onVoipNotificationReceived(notification, pushConfig);
  });
  setPushLogoutCallback(async () => {
    getLogger(['setPushLogoutCallback'])(
      'debug',
      'notification event listener removed',
    );
    voipPushNotification.removeEventListener('notification');
  });
}
