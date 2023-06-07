import { useCall, useCallCallingState } from '@stream-io/video-react-bindings';
import { useEffect } from 'react';
import { CallingState } from '@stream-io/video-client';
import { CallCycleHandlersType } from '../providers';
import { usePrevious } from '../utils/hooks/usePrevious';

const NON_ACTIVE_CALLING_STATES = [CallingState.UNKNOWN, CallingState.IDLE];
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
  const prevCallingState = usePrevious(callingState);
  const {
    onCallJoined,
    onCallIncoming,
    onCallOutgoing,
    onCallHungUp,
    onCallRejected,
    onCallJoining,
  } = callCycleHandlers;

  useEffect(() => {
    if (!call || NON_ACTIVE_CALLING_STATES.includes(callingState)) return;
    const isCallCreatedByMe = call.data?.created_by.id === call?.currentUserId;
    const isCallCreatedByOther =
      !!call.data?.created_by.id && !isCallCreatedByMe;
    const isIncomingCall =
      callingState === CallingState.RINGING &&
      !isCallCreatedByMe &&
      onCallIncoming;
    const isOutgoingCall =
      callingState === CallingState.RINGING &&
      isCallCreatedByMe &&
      onCallOutgoing;
    const isActiveCall = callingState === CallingState.JOINED && onCallJoined;
    const isCallHungUp = callingState === CallingState.LEFT && onCallHungUp;
    const isCallRejected =
      callingState === CallingState.LEFT &&
      isCallCreatedByOther &&
      onCallRejected;
    const isCallJoining =
      callingState === CallingState.JOINING && onCallJoining;

    if (isIncomingCall) return onCallIncoming();
    if (isOutgoingCall) return onCallOutgoing();
    if (isActiveCall) return onCallJoined();
    if (isCallHungUp) return onCallHungUp();
    if (isCallRejected) return onCallRejected();
    if (isCallJoining) return onCallJoining();
  }, [
    callingState,
    prevCallingState,
    call,
    onCallIncoming,
    onCallOutgoing,
    onCallJoined,
    onCallHungUp,
    onCallRejected,
    onCallJoining,
  ]);
};
