import { StreamVideoClient } from '@stream-io/video-client';
import { useEffect } from 'react';
import { setupFirebaseHandlerAndroid, setupCallkeep } from '../../utils/push';
import { useIosCallKeepEffect } from './useIosCallKeepEffect';
import { useIosPushEffect } from './useIosPushEffect';

// flag to check if setupCallkeep has already been run once
let isCallKeepSetupRan = false;

/**
 * This hook is used to do the initial setup for push notifications.
 */
export const usePushRegisterEffect = (client: StreamVideoClient) => {
  if (!isCallKeepSetupRan) {
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
