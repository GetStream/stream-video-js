import { StreamCallProvider } from '@stream-io/video-react-bindings';
import React, { PropsWithChildren, useEffect } from 'react';
import { Call } from '@stream-io/video-client';
import { useIosCallkeepWithCallingStateEffect } from '../hooks/push/useIosCallkeepWithCallingStateEffect';
import {
  MediaDevicesInitialState,
  MediaStreamManagement,
} from './MediaStreamManagement';
import {
  canAddPushWSSubscriptionsRef,
  clearPushWSEventSubscriptions,
} from '../utils/push/utils';
import { useAndroidKeepCallAliveEffect } from '../hooks/useAndroidKeepCallAliveEffect';

export type StreamCallProps = {
  /**
   * Stream Call instance propagated to the component's children as a part of StreamCallContext.
   * Children can access it with useCall() hook.
   */
  call: Call;
  /**
   * Optionally provide the initial status of the media devices(audio/video) to the `MediaStreamManagement`.
   * Note: It will override the default state of the media devices set from the server side.
   * It is used to control the initial state of the media devices(audio/video) in a custom lobby component.
   */
  mediaDeviceInitialState?: MediaDevicesInitialState;
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
  mediaDeviceInitialState = {},
  children,
}: PropsWithChildren<StreamCallProps>) => {
  return (
    <StreamCallProvider call={call}>
      <MediaStreamManagement {...mediaDeviceInitialState}>
        <AndroidKeepCallAlive />
        <IosInformCallkeepCallEnd />
        <ClearPushWSSubscriptions />
        {children}
      </MediaStreamManagement>
    </StreamCallProvider>
  );
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
