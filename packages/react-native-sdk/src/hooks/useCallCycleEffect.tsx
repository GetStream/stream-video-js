import { useCall, useCallCallingState } from '@stream-io/video-react-bindings';
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
  const call = useCall();
  const callingState = useCallCallingState();
  const {
    onActiveCall,
    onIncomingCall,
    onOutgoingCall,
    onHangupCall,
    onRejectCall,
  } = callCycleHandlers;

  useEffect(() => {
    if (!call) return;

    const isCallCreatedByMe = call.data?.created_by.id === call?.currentUserId;
    const isIncomingCall =
      callingState === CallingState.RINGING &&
      !isCallCreatedByMe &&
      onIncomingCall;
    const isOutgoingCall =
      callingState === CallingState.RINGING &&
      isCallCreatedByMe &&
      onOutgoingCall;
    const isActiveCall = callingState === CallingState.JOINED && onActiveCall;
    const isCallHungUp =
      callingState === CallingState.LEFT && isCallCreatedByMe && onHangupCall;
    const isCallRejected =
      callingState === CallingState.LEFT && !isCallCreatedByMe && onRejectCall;

    if (isIncomingCall) return onIncomingCall();
    if (isOutgoingCall) return onOutgoingCall();
    if (isActiveCall) return onActiveCall();
    if (isCallHungUp) return onHangupCall();
    if (isCallRejected) return onRejectCall();
  }, [
    callingState,
    call,
    onIncomingCall,
    onOutgoingCall,
    onActiveCall,
    onHangupCall,
    onRejectCall,
  ]);
};
