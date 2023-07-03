import { StreamCallProvider } from '@stream-io/video-react-bindings';
import React, { PropsWithChildren } from 'react';
import { Call } from '@stream-io/video-client';
import { useAndroidKeepCallAliveEffect, usePermissionRequest } from '../hooks';
import { useIosCallkeepEndEffect } from '../hooks/useIosCallkeepEndEffect';
import { MediaStreamManagement } from './MediaStreamManagement';

export type StreamCallProps = {
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
      <MediaStreamManagement>
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
  useIosCallkeepEndEffect();
  return null;
};
