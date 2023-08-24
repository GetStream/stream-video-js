import { StreamCallProvider } from '@stream-io/video-react-bindings';
import React, { PropsWithChildren } from 'react';
import { Call } from '@stream-io/video-client';
import { useAndroidKeepCallAliveEffect, usePermissionRequest } from '../hooks';
import { useIosCallkeepWithCallingStateEffect } from '../hooks/push/useIosCallkeepWithCallingStateEffect';
import {
  MediaDevicesInitialState,
  MediaStreamManagement,
} from './MediaStreamManagement';

export type StreamCallProps = {
  /**
   * Stream Call instance propagated to the component's children as a part of StreamCallContext.
   * Children can access it with useCall() hook.
   */
  call: Call;
  /**
   * Provides the initial status of the media devices(audio/video) to the `MediaStreamManagement`.
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
        <PermissionRequest />
        <AndroidKeepCallAlive />
        <IosInformCallkeepCallEnd />
        {children}
      </MediaStreamManagement>
    </StreamCallProvider>
  );
};

/**
 * This is a renderless component that is used to handler the permission requests using the usePermissionRequest hook.
 * usePermissionRequest needs to be called as a child of StreamCallProvider.
 */
const PermissionRequest = () => {
  usePermissionRequest();
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
