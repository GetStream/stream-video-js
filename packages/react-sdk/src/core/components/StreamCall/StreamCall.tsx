import { PropsWithChildren, useEffect, useState } from 'react';
import { Call, CallingState, JoinCallData } from '@stream-io/video-client';
import {
  StreamCallProvider,
  useConnectedUser,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import {
  MediaDevicesProvider,
  MediaDevicesProviderProps,
} from '../../contexts';

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
  call?: never;
};

type InitWithCallInstance = {
  /**
   * The call instance to use.
   */
  call: Call | undefined;
  /**
   * The call type.
   */
  callType?: never;
  /**
   * The call id.
   */
  callId?: never;
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
   * If true, the call data will be loaded automatically from the server.
   *
   * This property is useful for the scenarios where you declaratively create
   * the call instance by using the `callId` and `callType` props,
   * and you have a UI that depends on the call metadata.
   *
   * @example
   * ```jsx
   * <StreamCall callId="call-id" callType="call-type" autoLoad>
   *   <CallMetadata /> // has access to `call.metadata` although not joined yet
   *   <CallUI />
   *   <CallControls />
   * </StreamCall>
   * ```
   *
   * This property is ignored if you pass the `call` prop or enable `autoJoin`.
   *
   * @default true.
   */
  autoLoad?: boolean;

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
  autoLoad = true,
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

  const connectedUser = useConnectedUser();
  useEffect(() => {
    // run the effect only when the user is connected and the call
    // is created declaratively by using the `callId` and `callType` props.
    if (!connectedUser) return;
    if (activeCall && callType && callId && autoLoad && !autoJoin) {
      activeCall
        .getOrCreate({
          ring: data?.ring,
          data: data?.data,
          members_limit: data?.members_limit,
        })
        .catch((err) => {
          console.error(`Failed to get or create call`, err);
        });
    }
  }, [
    activeCall,
    autoJoin,
    autoLoad,
    callId,
    callType,
    connectedUser,
    data?.data,
    data?.members_limit,
    data?.ring,
  ]);

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
