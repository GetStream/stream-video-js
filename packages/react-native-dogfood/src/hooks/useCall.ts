import { useCallback, useState } from 'react';
import { Call, CallMeta, CreateCallInput } from '@stream-io/video-client';
import { useAppGlobalStoreValue } from '../contexts/AppContext';

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
  const videoClient = useAppGlobalStoreValue((store) => store.videoClient);
  const [activeCallMeta, setActiveCallMeta] = useState<CallMeta.Call>();
  const [activeCall, setActiveCall] = useState<Call>();

  const joinCall = useCallback(
    async (id: string, type: string) => {
      if (!videoClient) {
        return;
      }
      const call = await videoClient.joinCall({
        id,
        type,
        // FIXME: OL this needs to come from somewhere
        datacenterId: 'amsterdam',
      });
      setActiveCall(call);
    },
    [videoClient],
  );

  const getOrCreateCall = useCallback(async () => {
    if (!videoClient) {
      return;
    }
    const callMetadata = await videoClient.getOrCreateCall({
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
  }, [autoJoin, callId, callType, input, joinCall, videoClient]);

  return { activeCallMeta, activeCall, getOrCreateCall };
};
