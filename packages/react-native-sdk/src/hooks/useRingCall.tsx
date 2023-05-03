import { Call } from '@stream-io/video-client';
import {
  useIncomingCalls,
  useOutgoingCalls,
} from '@stream-io/video-react-bindings';
import { useCallback } from 'react';

/**
 * A helper hook which exposes functions to answer and reject incoming calls and cancel outgoing calls
 *
 * @category Call Operations
 */
export const useRingCall = () => {
  const [incomingCall] = useIncomingCalls();
  const [outgoingCall] = useOutgoingCalls();

  const answerCall = useCallback((call: Call) => {
    if (!call) {
      return;
    }
    call.join().catch((error) => console.log('Error accepting call', error));
  }, []);

  const rejectCall = useCallback(async () => {
    if (!incomingCall) {
      return;
    }
    await incomingCall.leave({ reject: true });
  }, [incomingCall]);

  const cancelCall = useCallback(async () => {
    await outgoingCall.leave();
  }, [outgoingCall]);

  return { answerCall, rejectCall, cancelCall };
};
