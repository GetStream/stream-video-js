import {
  StreamCallProvider,
  useIncomingCalls,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import React, { PropsWithChildren, useEffect, useState } from 'react';
import { CallCycleHandlersType, CallCycleProvider } from '../contexts';
import { Call } from '@stream-io/video-client';

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
    console.log('StreamCall >>>>>>>> useEffect', callId, callType, videoClient);
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
      <CallCycleProvider callCycleHandlers={callCycleHandlers}>
        {children}
      </CallCycleProvider>
    </StreamCallProvider>
  );
};
