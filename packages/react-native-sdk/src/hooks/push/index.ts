import { StreamVideoClient } from '@stream-io/video-client';
import { useEffect } from 'react';
import { setupFirebaseHandlerAndroid, setupCallkeep } from '../../utils/push';
import { useIosCallKeepEffect } from './useIosCallKeepEffect';
import { useIosPushEffect } from './useIosPushEffect';
import { getPushConfig } from '../../utils/push/config';

// flag to check if setupCallkeep has already been run once
let isCallKeepSetupRan = false;

/**
 * This hook is used to do the initial setup for push notifications.
 */
export const usePushRegisterEffect = (client: StreamVideoClient) => {
  const pushConfig = getPushConfig();
  if (!isCallKeepSetupRan && pushConfig) {
    isCallKeepSetupRan = true;
    setupCallkeep().catch((err) =>
      console.error('initializeCallKeep error:', err),
    );
  }

  useIosCallKeepEffect();
  useIosPushEffect(client);

  useEffect(() => {
    setupFirebaseHandlerAndroid(client);
  }, [client]);
};
