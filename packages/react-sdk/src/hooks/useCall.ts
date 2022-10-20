import { useStreamVideoClient } from '../StreamVideo';
import { useCallback, useEffect, useState } from 'react';
import {
  CallMeta,
  CallCreated,
  Call,
  CreateCallInput,
} from '@stream-io/video-client';

export type UseCallParams = {
  callId: string;
  callType: string;
  currentUser: string;
  autoJoin: boolean;
  input?: CreateCallInput;
};

export const useCall = ({
  callId,
  callType,
  currentUser,
  autoJoin,
  input,
}: UseCallParams) => {
  const client = useStreamVideoClient();
  const [activeCallMeta, setActiveCallMeta] = useState<CallMeta.Call>();
  const [activeCall, setActiveCall] = useState<Call>();

  const joinCall = useCallback(
    async (id: string, type: string) => {
      if (!client) return;
      const call = await client.joinCall({
        id,
        type,
        // FIXME: OL this needs to come from somewhere
        datacenterId: 'amsterdam',
      });
      setActiveCall(call);
    },
    [client],
  );

  useEffect(() => {
    if (!client) return;
    const getOrCreateCall = async () => {
      const callMetadata = await client.getOrCreateCall({
        id: callId,
        type: callType,
        input,
      });
      if (callMetadata) {
        setActiveCallMeta(callMetadata.call);
        if (autoJoin) {
          joinCall(callId, callType);
        }
      }
    };

    getOrCreateCall().catch((e) => {
      console.error(`Failed to getOrCreateCall`, callId, callType, e);
    });
  }, [callId, client, callType, autoJoin, joinCall]);

  // useEffect(() => {
  //   return client?.on(
  //     'callStarted',
  //     (event: CallStarted, envelopes?: Envelopes) => {
  //       const startedCall = envelopes?.calls[event.callCid];
  //       if (
  //         startedCall &&
  //         startedCall.id === callId &&
  //         startedCall.type === callType
  //       ) {
  //         setActiveCall(startedCall);
  //         if (autoJoin) {
  //           joinCall(startedCall.id, startedCall.type).catch((e) => {
  //             console.error(`Failed to join call`, startedCall, e);
  //           });
  //         }
  //       }
  //     },
  //   );
  // }, [callId, client, callType, autoJoin, joinCall]);

  return { activeCallMeta, activeCall };
};
