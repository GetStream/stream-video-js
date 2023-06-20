import { useIosCallKeepEffect } from './useIosCallKeepEffect';
import { useIosPushEffect } from './useIosPushEffect';
import { useProcessPushCallEffect } from './useProcessPushCallEffect';
import { useInitAndroidTokenAndRest } from './useInitAndroidTokenAndRest';

/**
 * This hook is used to do the initial setup for push notifications.
 * It must be used in a component which is a child of StreamVideo from bindings
 */
export const usePushRegisterEffect = () => {
  useIosCallKeepEffect();
  useIosPushEffect();
  useProcessPushCallEffect();
  useInitAndroidTokenAndRest();
};
