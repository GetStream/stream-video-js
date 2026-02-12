import { videoLoggerSystem } from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { useEffect, useMemo } from 'react';
import { getCallDisplayName } from '../../utils/internal/callingx';
import { getCallingxLibIfAvailable } from '../../utils/push/libs/callingx';

const logger = videoLoggerSystem.getLogger(
  'Callingx - useCallingExpWithCallingStateEffect',
);

/**
 * This hook is used to inform sync call state with CallKit/Telecom (i.e. start call, end call, mute/unmute call).
 */
export const useCallingExpWithCallingStateEffect = () => {
  const { useMicrophoneState, useParticipants, useCallMembers } =
    useCallStateHooks();

  const activeCall = useCall();
  const { isMute, microphone } = useMicrophoneState();
  const callMembers = useCallMembers();
  const participants = useParticipants();

  const activeCallCid = activeCall?.cid;
  const currentUserId = activeCall?.currentUserId;

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
      logger.debug(
        `No active call cid to set muted in calling exp: ${activeCallCid} callingx isSetup: ${callingx?.isSetup}`,
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

        const isCallRegistered = callingx.isCallRegistered(activeCallCid);
        if (!isCallRegistered || callId !== activeCallCid) {
          logger.debug(
            `No active call cid to set muted in calling exp: ${activeCallCid} isCallRegistered: ${isCallRegistered} callId: ${callId}`,
          );
          return;
        }

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
      },
    );

    return () => {
      subscription.remove();
    };
  }, [activeCallCid, microphone]);
};
