import {
  useIncomingCalls,
  useOutgoingCalls,
} from '@stream-io/video-react-bindings';
import { useCallback } from 'react';
import InCallManager from 'react-native-incall-manager';

/**
 * A helper hook which exposes functions to answer and reject incoming calls and cancel outgoing calls
 *
 * @category Call Operations
 */
export const useRingCall = () => {
  const [incomingCall] = useIncomingCalls();
  const [outgoingCall] = useOutgoingCalls();

  const answerCall = useCallback(() => {
    if (!incomingCall) {
      return;
    }
    incomingCall
      .accept()
      .then(() => {
        InCallManager.start({ media: 'video' });
        InCallManager.setForceSpeakerphoneOn(true);
      })
      .catch((error) => console.log('Error accepting call', error));
  }, [incomingCall]);

  const rejectCall = useCallback(async () => {
    if (!incomingCall) {
      return;
    }
    await incomingCall.reject();
  }, [incomingCall]);

  const cancelCall = useCallback(async () => {
    await outgoingCall.cancel();
  }, [outgoingCall]);

  return { answerCall, rejectCall, cancelCall };
};
