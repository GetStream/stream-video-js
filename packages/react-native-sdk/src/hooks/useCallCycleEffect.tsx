import {
  useActiveCall,
  useIncomingCalls,
  useOutgoingCalls,
} from '@stream-io/video-react-bindings';
import { useEffect } from 'react';
import { CallCycleHandlersType } from '../contexts/CallCycleContext';

export const useCallCycleEffect = (
  callCycleHandlers: CallCycleHandlersType,
) => {
  const [outgoingCall] = useOutgoingCalls();
  const [incomingCall] = useIncomingCalls();
  const activeCall = useActiveCall();
  const { onActiveCall, onHangupCall, onIncomingCall, onOutgoingCall } =
    callCycleHandlers;

  useEffect(() => {
    if (incomingCall && onIncomingCall) onIncomingCall();
    else if (outgoingCall && onOutgoingCall) onOutgoingCall();
    else if (activeCall && onActiveCall) onActiveCall();
    else if (onHangupCall) onHangupCall();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCall, incomingCall, outgoingCall]);
};
