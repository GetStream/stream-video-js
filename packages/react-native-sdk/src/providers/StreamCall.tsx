import {
  StreamCallProvider,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import React, { PropsWithChildren, useEffect, useState } from 'react';
import { Call, CallingState } from '@stream-io/video-client';
import { useAndroidKeepCallAliveEffect, useCallCycleEffect } from '../hooks';

type InitWithCallCID = {
  /**
   * The call type.
   */
  callType: string;
  /**
   * The call id.
   */
  callId: string;
  /**
   * The call instance to use.
   */
  call?: Call;
};

type InitWithCallInstance = {
  /**
   * The call instance to use.
   */
  call: Call | undefined;
  /**
   * The call type.
   */
  callType?: string;
  /**
   * The call id.
   */
  callId?: string;
};

type InitStreamCall = InitWithCallCID | InitWithCallInstance;

export type StreamCallProps = InitStreamCall & {
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
  callId,
  callType = 'default',
  call,
  callCycleHandlers = {},
  children,
}: PropsWithChildren<StreamCallProps>) => {
  const videoClient = useStreamVideoClient();
  const [activeCall, setActiveCall] = useState<Call | undefined>(() => {
    if (call) {
      return call;
    }
    if (!videoClient || !callId || !callType) {
      return;
    }
    return videoClient?.call(callType, callId);
  });

  // Effect to create a new call with the given call id and type if the call doesn't exist
  useEffect(() => {
    if (!videoClient) {
      return;
    }

    if (callId && callType && !activeCall) {
      const newCall = videoClient.call(callType, callId);
      setActiveCall(newCall);
    }

    return () => {
      if (activeCall?.state.callingState === CallingState.LEFT) {
        return;
      }
      activeCall?.leave().catch((e) => console.log(e));
      setActiveCall(undefined);
    };
  }, [activeCall, callId, callType, videoClient]);

  return (
    <StreamCallProvider call={activeCall}>
      <AndroidKeepCallAlive />
      <CallCycleLogicsWrapper callCycleHandlers={callCycleHandlers}>
        {children}
      </CallCycleLogicsWrapper>
    </StreamCallProvider>
  );
};

/**
 * Exclude types from documentaiton site, but we should still add doc comments
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
 * A renderless component that runs useAndroidKeepCallAliveEffect hook.
 * The hook must be a child of StreamCallProvider so we create a renderless component to use it
 * @internal
 */
export const AndroidKeepCallAlive = (): React.ReactElement | null => {
  useAndroidKeepCallAliveEffect();

  return null;
};
