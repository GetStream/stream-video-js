import { useIosVoipPushEventsSetupEffect } from './useIosVoipPushEventsSetupEffect';
import { useProcessPushCallEffect } from './useProcessPushCallEffect';
import { useInitAndroidTokenAndRest } from './useInitAndroidTokenAndRest';
import { useIosInitRemoteNotifications } from './useIosInitRemoteNotifications';
import { useProcessPushNonRingingCallEffect } from './useProcessPushNonRingingCallEffect';

/**
 * This hook is used to do the initial setup for push notifications.
 * It must be used in a component which is a child of StreamVideo from bindings
 */
export const usePushRegisterEffect = () => {
  useIosInitRemoteNotifications();
  useIosVoipPushEventsSetupEffect();
  useProcessPushNonRingingCallEffect();
  useProcessPushCallEffect();
  useInitAndroidTokenAndRest();
};
