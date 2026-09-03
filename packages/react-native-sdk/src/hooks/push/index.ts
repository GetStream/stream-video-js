import { useIosVoipPushEventsSetupEffect } from './useIosVoipPushEventsSetupEffect';
import { useInitAndroidTokenAndRest } from './useInitAndroidTokenAndRest';

/**
 * This hook is used to do the initial setup for push notifications.
 * It must be used in a component which is a child of StreamVideo from bindings
 */
export const usePushRegisterEffect = () => {
  useIosVoipPushEventsSetupEffect();
  useInitAndroidTokenAndRest();
};
