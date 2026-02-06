import {
  CallingState,
  RxUtils,
  videoLoggerSystem,
} from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { useEffect, useMemo, useRef } from 'react';
import { getCallDisplayName } from '../../utils/internal/callingx';
import { getCallingxLibIfAvailable } from '../../utils/push/libs/callingx';

const logger = videoLoggerSystem.getLogger(
  'Callingx - useCallingExpWithCallingStateEffect',
);

const canEndCall = (
  prevState: CallingState | undefined,
  currentState: CallingState | undefined,
) => {
  if (!prevState && !currentState) {
    return false;
  }

  return (
    (prevState === CallingState.JOINED ||
      prevState === CallingState.JOINING ||
      prevState === CallingState.RINGING ||
      prevState === CallingState.RECONNECTING ||
      prevState === CallingState.MIGRATING ||
      prevState === CallingState.OFFLINE) &&
    (currentState === CallingState.LEFT ||
      currentState === CallingState.RECONNECTING_FAILED ||
      currentState === CallingState.IDLE)
  );
};

/**
 * This hook is used to inform sync call state with CallKit/Telecom (i.e. start call, end call, mute/unmute call).
 */
export const useCallingExpWithCallingStateEffect = () => {
  const {
    useCallCallingState,
    useMicrophoneState,
    useParticipants,
    useCallMembers,
  } = useCallStateHooks();

  const activeCall = useCall();
  const callingState = useCallCallingState();
  const { isMute, microphone } = useMicrophoneState();
  const callMembers = useCallMembers();
  const participants = useParticipants();

  const prevState = useRef<CallingState | undefined>(undefined);

  const activeCallCid = activeCall?.cid;
  const isIncomingCall = activeCall?.ringing && !activeCall?.isCreatedByMe;
  const isOutcomingCall = activeCall?.ringing && activeCall?.isCreatedByMe;
  const currentUserId = activeCall?.currentUserId;
  const isVideoCall = activeCall?.state.settings?.video?.enabled ?? false;

  const callDisplayName = useMemo(
    () => getCallDisplayName(callMembers, participants, currentUserId),
    [callMembers, participants, currentUserId],
  );

  useEffect(() => {
    return () => {
      const callingx = getCallingxLibIfAvailable();
      if (!callingx?.isSetup || !activeCallCid) {
        return;
      }

      const isCallRegistered = callingx.isCallRegistered(activeCallCid);
      if (!isCallRegistered) {
        logger.debug(
          `No active call cid to end in calling exp: ${activeCallCid} isCallRegistered: ${isCallRegistered}`,
        );
        return;
      }
      //if incoming stream call was unmounted, we need to end the call in CallKit/Telecom
      logger.debug(`Ending call in callingx: ${activeCallCid}`);
      callingx
        .endCallWithReason(activeCallCid, 'local')
        .catch((error: unknown) => {
          logger.error(
            `Error ending call in callingx: ${activeCallCid}`,
            error,
          );
        });
    };
  }, [activeCallCid]);

  useEffect(() => {
    const callingx = getCallingxLibIfAvailable();
    if (
      !callingx?.isSetup ||
      !activeCallCid ||
      prevState.current === callingState
    ) {
      return;
    }

    // TODO: handle in client
    //tells if call is registered in CallKit/Telecom
    const isCallRegistered = callingx.isCallRegistered(activeCallCid);
    logger.debug(
      `useEffect: ${activeCallCid} isCallRegistered: ${isCallRegistered} 
      isIncomingCall: ${isIncomingCall} isOutcomingCall: ${isOutcomingCall} 
      prevState: ${prevState.current}, currentState: ${callingState} 
      isOngoingCallsEnabled: ${callingx.isOngoingCallsEnabled}`,
    );

    if (isCallRegistered && canEndCall(prevState.current, callingState)) {
      //in case call was registered as incoming and state changed to "not joined", we need to end the call and clear rxjs subject
      logger.debug(`Should end call in callingx: ${activeCallCid}`);
      //TODO: think about sending appropriate reason for end call
      callingx
        .endCallWithReason(activeCallCid, 'local')
        .catch((error: unknown) => {
          logger.error(
            `Error ending call in callingx: ${activeCallCid}`,
            error,
          );
        });
    }

    prevState.current = callingState;
  }, [
    activeCallCid,
    callingState,
    callDisplayName,
    isIncomingCall,
    isOutcomingCall,
    isVideoCall,
  ]);

  useEffect(() => {
    const callingx = getCallingxLibIfAvailable();
    if (!callingx?.isSetup || !activeCallCid) {
      return;
    }

    const isCallRegistered = callingx.isCallRegistered(activeCallCid);
    if (!isCallRegistered) {
      logger.debug(
        `No active call cid to update callingx: ${activeCallCid} isCallRegistered: ${isCallRegistered}`,
      );
      return;
    }

    callingx.updateDisplay(activeCallCid, activeCallCid, callDisplayName);
  }, [activeCallCid, callDisplayName]);

  // Sync microphone mute state from app → CallKit
  useEffect(() => {
    const callingx = getCallingxLibIfAvailable();
    if (!callingx?.isSetup || !activeCallCid) {
      return;
    }

    const isCallRegistered = callingx.isCallRegistered(activeCallCid);
    if (!isCallRegistered) {
      logger.debug(
        `No active call cid to set muted in calling exp: ${activeCallCid} isCallRegistered: ${isCallRegistered}`,
      );
      return;
    }

    callingx.setMutedCall(activeCallCid, isMute);
  }, [activeCallCid, isMute]);

  // Sync mute state from CallKit → app (only for system-initiated mute actions)
  useEffect(() => {
    const callingx = getCallingxLibIfAvailable();
    if (!callingx?.isSetup || !activeCallCid) {
      return;
    }

    const isCallRegistered = callingx.isCallRegistered(activeCallCid);
    if (!isCallRegistered) {
      logger.debug(
        `No active call cid to set muted in calling exp: ${activeCallCid} isCallRegistered: ${isCallRegistered}`,
      );
      return;
    }

    // Listen to mic toggle events from CallKit/Telecom and update stream call microphone state.
    // Only system-initiated mute actions (e.g. user tapped mute on the native CallKit UI)
    // are sent here — app-initiated actions are filtered out on the native side to prevent
    // the feedback loop: app mutes mic → setMutedCall → CallKit delegate → event to JS → loop.
    const subscription = callingx.addEventListener(
      'didPerformSetMutedCallAction',
      async (event: { callId: string; muted: boolean }) => {
        const { callId, muted } = event;

        if (callId === activeCallCid) {
          const isCurrentlyMuted = microphone.state.status === 'disabled';
          if (isCurrentlyMuted === muted) {
            logger.debug(
              `Mic toggle is already in the desired state: ${muted} for call: ${activeCallCid}`,
            );
            return;
          }

          try {
            if (muted) {
              await microphone.disable();
            } else {
              await microphone.enable();
            }
          } catch (error: unknown) {
            logger.error(
              `Error toggling mic in calling exp: ${activeCallCid}`,
              error,
            );
          }
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, [activeCallCid, microphone]);
};
