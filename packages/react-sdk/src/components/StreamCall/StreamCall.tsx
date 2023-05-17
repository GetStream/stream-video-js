import { PropsWithChildren, useEffect, useState } from 'react';
import { Call, CallingState, JoinCallData } from '@stream-io/video-client';
import {
  StreamCallProvider,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { MediaDevicesProvider, MediaDevicesProviderProps } from '../../core';

type InitWithCallCID = {
  callId: string;
  callType: string;
  call?: never;
};

type InitWithCallInstance = {
  call: Call | undefined;
  callId?: never;
  callType?: never;
};

type InitStreamCall = InitWithCallCID | InitWithCallInstance;

export type StreamCallProps = InitStreamCall & {
  /**
   * If true, the call will be joined automatically.
   * Set it to true if you want to join the call immediately.
   * Useful for scenarios where you want to skip prompting the user to join the call.
   *
   * @default false.
   */
  autoJoin?: boolean;

  /**
   * An optional data to pass when joining the call.
   */
  data?: JoinCallData;

  /**
   * An optional props to pass to the `MediaDevicesProvider`.
   */
  mediaDevicesProviderProps?: MediaDevicesProviderProps;
};

export const StreamCall = ({
  children,
  callId,
  callType,
  call,
  autoJoin = false,
  data,
  mediaDevicesProviderProps,
}: PropsWithChildren<StreamCallProps>) => {
  const client = useStreamVideoClient();
  const [activeCall, setActiveCall] = useState<Call | undefined>(() => {
    if (call) return call;
    if (!client || !callId || !callType) return;
    return client.call(callType, callId);
  });

  useEffect(() => {
    if (!client) return;

    if (callId && callType && !activeCall) {
      const newCall = client.call(callType, callId);
      setActiveCall(newCall);
    }
  }, [activeCall, callId, callType, client]);

  useEffect(() => {
    if (autoJoin && activeCall?.state.callingState === CallingState.IDLE) {
      activeCall.join(data).catch((err) => {
        console.error(`Failed to join call`, err);
      });
    }
  }, [activeCall, autoJoin, data]);

  return (
    <StreamCallProvider call={activeCall}>
      <MediaDevicesProvider {...mediaDevicesProviderProps}>
        {children}
      </MediaDevicesProvider>
    </StreamCallProvider>
  );
};
