import { PropsWithChildren, useEffect, useState } from 'react';
import { Call, CallingState, JoinCallRequest } from '@stream-io/video-client';
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

type InitStreamMeeting = InitWithCallCID | InitWithCallInstance;

export type StreamMeetingProps = InitStreamMeeting & {
  /**
   * If true, the call will be joined automatically.
   * Usually, in the "ring" scenario, this flag should be set to false as
   * the callee should decide whether to join the call or not.
   *
   * @default true.
   */
  autoJoin?: boolean;

  /**
   * An optional data to pass when joining the call.
   */
  data?: JoinCallRequest;

  /**
   * An optional props to pass to the `MediaDevicesProvider`.
   */
  mediaDevicesProviderProps?: MediaDevicesProviderProps;
};

export const StreamMeeting = ({
  children,
  callId,
  callType,
  call,
  autoJoin = true,
  data,
  mediaDevicesProviderProps,
}: PropsWithChildren<StreamMeetingProps>) => {
  const client = useStreamVideoClient();
  const [activeCall, setActiveCall] = useState<Call | undefined>(call);

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
