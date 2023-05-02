import {
  useCallCallingState,
  useIncomingCalls,
  useOutgoingCalls,
} from '@stream-io/video-react-bindings';
import { useEffect } from 'react';
import { CallCycleHandlersType } from '../contexts/CallCycleContext';
import { CallingState } from '@stream-io/video-client';

/**
 *
 * @param callCycleHandlers
 *
 * @category Client State
 */
export const useCallCycleEffect = (
  callCycleHandlers: CallCycleHandlersType,
) => {
  const [outgoingCall] = useOutgoingCalls();
  const [incomingCall] = useIncomingCalls();
  const callingState = useCallCallingState();
  const { onActiveCall, onIncomingCall, onOutgoingCall } = callCycleHandlers;

  useEffect(() => {
    if (incomingCall && onIncomingCall) onIncomingCall();
    else if (outgoingCall && onOutgoingCall) onOutgoingCall();
    else if (callingState === CallingState.JOINED && onActiveCall) {
      onActiveCall();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callingState, incomingCall, outgoingCall]);
};
