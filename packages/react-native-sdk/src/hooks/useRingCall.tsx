import {
  useIncomingCalls,
  useOutgoingCalls,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { useCallback } from 'react';
import InCallManager from 'react-native-incall-manager';

export const useRingCall = () => {
  const client = useStreamVideoClient();
  const [incomingCall] = useIncomingCalls();
  const [outgoingCall] = useOutgoingCalls();

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
    if (!client) {
      return;
    }
    await client.cancelCall(outgoingCall.call.id, outgoingCall.call.type);
  }, [client, outgoingCall]);

  return { answerCall, rejectCall, cancelCall };
};
