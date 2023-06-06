import { StreamVideoClient } from '@stream-io/video-client';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { setupFirebaseHandlerAndroid, setupCallkeep } from '../../utils/push';
import { useCallKeepEffect } from './useCallKeepEffect';
import { useIosPushEffect } from './useIosPushEffect';

/**
 * This hook is used to do the initial setup for push notifications.
 */
export const usePushRegisterEffect = (client: StreamVideoClient) => {
  const isCallKeepSetupRan = useRef(false);

  if (!isCallKeepSetupRan.current) {
    isCallKeepSetupRan.current = true;
    setupCallkeep().catch((err) =>
      console.error('initializeCallKeep error:', err),
    );
  }

  useCallKeepEffect();
  useIosPushEffect();

  useEffect(() => {
    if (Platform.OS === 'android') {
      setupFirebaseHandlerAndroid(client);
    }
  }, [client]);
};
