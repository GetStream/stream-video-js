import {
  StreamCallProvider,
  useIncomingCalls,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import React, { PropsWithChildren, useEffect, useState } from 'react';
import { Call } from '@stream-io/video-client';
import { useCallCycleEffect } from '../hooks';

export interface StreamCallProps {
  callId: string;
  callType?: string;
  callCycleHandlers?: CallCycleHandlersType;
}
/**
 *
 * @param props
 * @returns
 *
 * @category Client State
 */
export const StreamCall = ({
  callId,
  callType = 'default',
  callCycleHandlers = {},
  children,
}: PropsWithChildren<StreamCallProps>) => {
  const [call, setCall] = useState<Call>();
  const [incomingCall] = useIncomingCalls();
  const videoClient = useStreamVideoClient();

  useEffect(() => {
    if (!incomingCall) {
      return;
    }

    setCall(incomingCall);
  }, [incomingCall]);

  useEffect(() => {
    if (!callId || !callType || !videoClient) {
      return;
    }
    const newCall = videoClient.call(callType, callId);
    setCall(newCall);

    return () => {
      newCall.leave().catch((e) => console.log(e));
      setCall(undefined);
    };
  }, [callId, callType, videoClient]);

  return (
    <StreamCallProvider call={call}>
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
  onCallJoined?: () => void;
  onCallIncoming?: () => void;
  /**
   * Handler called when the call is hanged up by the caller. Mostly used for navigation and related actions.
   */
  onCallHungUp?: () => void;
  onCallOutgoing?: () => void;
  /**
   * Handler called when the call is rejected. Mostly used for navigation and related actions.
   */
  onCallRejected?: () => void;
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
