import { StreamCallProvider } from '@stream-io/video-react-bindings';
import React, { PropsWithChildren } from 'react';
import { Call } from '@stream-io/video-client';
import {
  useAndroidKeepCallAliveEffect,
  useCallCycleEffect,
  usePermissionRequest,
  usePublishMediaStreams,
} from '../hooks';
import { useIosCallkeepEndEffect } from '../hooks/useIosCallkeepEndEffect';

export type StreamCallProps = {
  call: Call;
  callCycleHandlers: CallCycleHandlersType;
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
  callCycleHandlers = {},
  children,
}: PropsWithChildren<StreamCallProps>) => {
  return (
    <StreamCallProvider call={call}>
      <PublishMediaStream />
      <PermissionRequest />
      <AndroidKeepCallAlive />
      <IosInformCallkeepCallEnd />
      <CallCycleLogicsWrapper callCycleHandlers={callCycleHandlers}>
        {children}
      </CallCycleLogicsWrapper>
    </StreamCallProvider>
  );
};

/**
 * Exclude types from documentation site, but we should still add doc comments
 * @internal
 */
export type CallCycleHandlersType = {
  /**
   * Handler called after a call is joined. Mostly used for navigation and related actions.
   */
  onCallJoined?: () => void;
  /**
   * Handler called after a callee receives a call. Mostly used for navigation and related actions.
   */
  onCallIncoming?: () => void;
  /**
   * Handler called after a call is hung up by the caller. Mostly used for navigation and cleanup actions.
   */
  onCallHungUp?: () => void;
  /**
   * Handler called after a caller initiates a call. Mostly used for navigation and related actions.
   */
  onCallOutgoing?: () => void;
  /**
   * Handler called after a call is rejected. Mostly used for navigation and cleanup actions.
   */
  onCallRejected?: () => void;
  /**
   * Handler called when the call is in joining state. Mostly used for navigation and related actions.
   */
  onCallJoining?: () => void;
};

/**
 * Exclude types from documentaiton site, but we should still add doc comments
 * @internal
 */
export type CallCycleLogicsWrapperProps = {
  callCycleHandlers: CallCycleHandlersType;
};

export const CallCycleLogicsWrapper = ({
  callCycleHandlers,
  children,
}: PropsWithChildren<CallCycleLogicsWrapperProps>) => {
  useCallCycleEffect(callCycleHandlers);

  return <>{children}</>;
};

/**
 * This is a renderless component that is used to publish media stream using the usePublishMediaStreams hook.
 * usePublishMediaStreams needs to be called as a child of StreamCallProvider.
 */
const PublishMediaStream = () => {
  usePublishMediaStreams();
  return null;
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
