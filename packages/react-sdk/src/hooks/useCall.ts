import { useStreamVideoClient } from '../StreamVideo';
import { useCallback, useEffect, useState } from 'react';
import { CallMeta, Call, CreateCallInput } from '@stream-io/video-client';

export type UseCallParams = {
  callId: string;
  callType: string;
  autoJoin: boolean;
  input?: CreateCallInput;
};

export const useCall = ({
  callId,
  callType,
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
        // FIXME: OL optional, but it is marked as required in proto
        datacenterId: '',
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
          await joinCall(callId, callType);
        }
      }
    };

    getOrCreateCall().catch((e) => {
      console.error(`Failed to getOrCreateCall`, callId, callType, e);
    });
  }, [callId, client, callType, autoJoin, joinCall, input]);

  return { activeCallMeta, activeCall };
};
