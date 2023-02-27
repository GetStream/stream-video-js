import {
  useActiveCall,
  useIncomingCalls,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { useCallback } from 'react';
import InCallManager from 'react-native-incall-manager';

/**
 * A helper hook which exposes functions to answerCall, rejectCall, cancelCall
 */
export const useRingCall = () => {
  const client = useStreamVideoClient();
  const activeCall = useActiveCall();
  const activeCallMeta = activeCall?.data.call;
  const [incomingCall] = useIncomingCalls();

  const answerCall = useCallback(() => {
    if (!client || !incomingCall.call) {
      return;
    }
    client
      .acceptCall(incomingCall.call.id, incomingCall.call.type)
      .then(() => {
        InCallManager.start({ media: 'video' });
        InCallManager.setForceSpeakerphoneOn(true);
      })
      .catch((error) => console.log('Error accepting call', error));
  }, [client, incomingCall]);

  const rejectCall = useCallback(async () => {
    if (!client || !incomingCall) {
      return;
    }
    await client.rejectCall(incomingCall.call.id, incomingCall.call.type);
  }, [client, incomingCall]);

  const cancelCall = useCallback(async () => {
    if (!client || !activeCallMeta) {
      return;
    }
    await client.cancelCall(activeCallMeta.id, activeCallMeta.type);
  }, [activeCallMeta, client]);

  return { answerCall, rejectCall, cancelCall };
};
