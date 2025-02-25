import { StreamCallProvider } from '@stream-io/video-react-bindings';
import React, { type PropsWithChildren, useEffect } from 'react';
import { Call } from '@stream-io/video-client';
import { useIosCallkeepWithCallingStateEffect } from '../../hooks/push/useIosCallkeepWithCallingStateEffect';
import {
  canAddPushWSSubscriptionsRef,
  clearPushWSEventSubscriptions,
} from '../../utils/push/internal/utils';
import { useAndroidKeepCallAliveEffect } from '../../hooks/useAndroidKeepCallAliveEffect';
import { AppStateListener } from './AppStateListener';
import { DeviceStats } from './DeviceStats';

// const PIP_CHANGE_EVENT = 'StreamVideoReactNative_PIP_CHANGE_EVENT';

// const isAndroid8OrAbove = Platform.OS === 'android' && Platform.Version >= 26;

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
      <DeviceStats />
      {children}
    </StreamCallProvider>
  );
};

/**
 * This is a renderless component to keep the call alive on Android device using useAndroidKeepCallAliveEffect.
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
