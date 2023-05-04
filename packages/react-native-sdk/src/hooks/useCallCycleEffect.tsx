import { useCall, useCallCallingState } from '@stream-io/video-react-bindings';
import { useEffect } from 'react';
import { CallingState } from '@stream-io/video-client';
import { CallCycleHandlersType } from '../providers';

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
    onCallJoined,
    onCallIncoming,
    onCallOutgoing,
    onCallHungUp,
    onCallRejected,
  } = callCycleHandlers;

  useEffect(() => {
    if (!call) return;

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
    const isCallHungUp =
      callingState === CallingState.LEFT && isCallCreatedByMe && onCallHungUp;
    const isCallRejected =
      callingState === CallingState.LEFT &&
      isCallCreatedByOther &&
      onCallRejected;

    if (isIncomingCall) return onCallIncoming();
    if (isOutgoingCall) return onCallOutgoing();
    if (isActiveCall) return onCallJoined();
    if (isCallHungUp) return onCallHungUp();
    if (isCallRejected) return onCallRejected();
  }, [
    callingState,
    call,
    onCallIncoming,
    onCallOutgoing,
    onCallJoined,
    onCallHungUp,
    onCallRejected,
  ]);
};
