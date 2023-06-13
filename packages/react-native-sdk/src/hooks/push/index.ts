import { StreamVideoClient } from '@stream-io/video-client';
import { useEffect } from 'react';
import {
  initAndroidPushTokenAndRest,
  setAndroidInitialNotificationListener,
} from '../../utils/push/utils';
import { useIosCallKeepEffect } from './useIosCallKeepEffect';
import { useIosPushEffect } from './useIosPushEffect';
import { StreamVideoRN } from '../../utils';

/**
 * This hook is used to do the initial setup for push notifications.
 */
export const usePushRegisterEffect = (client: StreamVideoClient) => {
  useIosCallKeepEffect();
  useIosPushEffect(client);

  useEffect(() => {
    const pushConfig = StreamVideoRN.getConfig().push;
    if (!pushConfig) {
      return;
    }
    initAndroidPushTokenAndRest(client, pushConfig);
    setAndroidInitialNotificationListener(client);
  }, [client]);
};
