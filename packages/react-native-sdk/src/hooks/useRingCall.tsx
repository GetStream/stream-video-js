import {
  useIncomingCalls,
  useOutgoingCalls,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { useCallback } from 'react';
import InCallManager from 'react-native-incall-manager';

/**
 * A helper hook which exposes functions to answerCall, rejectCall, cancelCall
 *
 * @category Client
 */
export const useRingCall = () => {
  const client = useStreamVideoClient();
  const [incomingCall] = useIncomingCalls();
  const [outgoingCall] = useOutgoingCalls();

  const answerCall = useCallback(() => {
    if (!client || !incomingCall) {
      return;
    }
    client
      .acceptCall(incomingCall.id, incomingCall.type)
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
    await client.rejectCall(incomingCall.id, incomingCall.type);
  }, [client, incomingCall]);

  const cancelCall = useCallback(async () => {
    if (!client) {
      return;
    }
    await client.cancelCall(outgoingCall.id, outgoingCall.type);
  }, [client, outgoingCall]);

  return { answerCall, rejectCall, cancelCall };
};
