import { StreamCallProvider, useCall } from '@stream-io/video-react-bindings';
import React, { PropsWithChildren, useEffect } from 'react';
import { Call } from '@stream-io/video-client';
import { useIosCallkeepWithCallingStateEffect } from '../hooks/push/useIosCallkeepWithCallingStateEffect';
import {
  canAddPushWSSubscriptionsRef,
  clearPushWSEventSubscriptions,
} from '../utils/push/utils';
import { useAndroidKeepCallAliveEffect } from '../hooks/useAndroidKeepCallAliveEffect';
import { useAppStateListener } from '../utils/hooks';
import { NativeModules, Platform } from 'react-native';

export type StreamCallProps = {
  /**
   * Stream Call instance propagated to the component's children as a part of StreamCallContext.
   * Children can access it with useCall() hook.
   */
  call: Call;
};
/**
 * StreamCall is a wrapper component that orchestrates the call life cycle logic and
 * provides the call object to the children components.
 * @param PropsWithChildren<StreamCallProps>
 *
 * @category Client State
 */
export const StreamCall = ({
  call,
  children,
}: PropsWithChildren<StreamCallProps>) => {
  return (
    <StreamCallProvider call={call}>
      <AppStateListener />
      <AndroidKeepCallAlive />
      <IosInformCallkeepCallEnd />
      <ClearPushWSSubscriptions />
      {children}
    </StreamCallProvider>
  );
};

const AppStateListener = () => {
  const call = useCall();

  // Resume/Disable video stream tracks when app goes to background/foreground
  // To save on CPU resources
  useAppStateListener(
    async () => {
      await call?.camera?.resume();
    },
    async () => {
      if (Platform.OS === 'android') {
        // in Android, we need to check if we are in PiP mode
        // in PiP mode, we don't want to disable the camera
        NativeModules?.StreamVideoReactNative?.isInPiPMode().then(
          async (isInPiP: boolean | null | undefined) => {
            if (!isInPiP) {
              await call?.camera?.disable();
            }
          }
        );
      } else {
        await call?.camera?.disable();
      }
    }
  );

  return null;
};

/**
 * This is a renderless component is used to keep the call alive on Android device using useAndroidKeepCallAliveEffect.
 * useAndroidKeepCallAliveEffect needs to called inside a child of StreamCallProvider.
 */
const AndroidKeepCallAlive = () => {
  useAndroidKeepCallAliveEffect();
  return null;
};

/**
 * This is a renderless component to end the call in callkeep for ios.
 * useAndroidKeepCallAliveEffect needs to called inside a child of StreamCallProvider.
 */
const IosInformCallkeepCallEnd = () => {
  useIosCallkeepWithCallingStateEffect();
  return null;
};

/**
 * This is a renderless component to clear all push ws event subscriptions
 * and set whether push ws subscriptions can be added or not.
 */
const ClearPushWSSubscriptions = () => {
  useEffect(() => {
    clearPushWSEventSubscriptions();
    canAddPushWSSubscriptionsRef.current = false;
    return () => {
      canAddPushWSSubscriptionsRef.current = true;
    };
  }, []);
  return null;
};
