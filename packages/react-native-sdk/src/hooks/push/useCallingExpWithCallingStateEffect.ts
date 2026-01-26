import {
  CallingState,
  MemberResponse,
  StreamVideoParticipant,
  videoLoggerSystem,
} from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { useEffect, useMemo, useRef } from 'react';
import { getCallingxLibIfAvailable } from '../../utils/push/libs/callingx';
import { AppState } from 'react-native';

const logger = videoLoggerSystem.getLogger(
  'useCallingExpWithCallingStateEffect',
);

//calling state methods are not exhaustive, so we need to add more methods to cover different cases
const canAcceptIncomingCall = (
  prevState: CallingState | undefined,
  currentState: CallingState | undefined,
) => {
  if (!prevState && !currentState) {
    return false;
  }

  const isJoined = (state: CallingState | undefined) => {
    if (!state) {
      return false;
    }

    return state === CallingState.JOINING || state === CallingState.JOINED;
  };

  return (
    (!isJoined(prevState) && isJoined(currentState)) ||
    (prevState === CallingState.JOINING && currentState === CallingState.JOINED)
  );
};

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

const canStartCall = (
  prevState: CallingState | undefined,
  currentState: CallingState | undefined,
) => {
  if (!prevState && !currentState) {
    return false;
  }

  return (
    (!prevState ||
      prevState === CallingState.IDLE ||
      prevState === CallingState.UNKNOWN) &&
    (currentState === CallingState.JOINED ||
      currentState === CallingState.JOINING ||
      currentState === CallingState.RINGING)
  );
};

function getCallDisplayName(
  callMembers: MemberResponse[] | undefined,
  participants: StreamVideoParticipant[] | undefined,
  currentUserId: string | undefined,
) {
  if (!callMembers || !participants || !currentUserId) {
    return 'Call';
  }

  let names: string[] = [];

  if (callMembers.length > 0) {
    names = callMembers
      .filter((member) => member.user.id !== currentUserId)
      .map((member) => member.user.name)
      .filter((name): name is string => name !== undefined);
  } else if (participants.length > 0) {
    names = participants
      .filter((participant) => participant.userId !== currentUserId)
      .map((participant) => participant.name)
      .filter(Boolean);
  }

  return names.length > 0 ? names.sort().join(', ') : 'Call';
}

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
      logger.debug(`Ending call in calling exp: ${activeCallCid}`);
      callingx
        .endCallWithReason(activeCallCid, 'local')
        .catch((error: unknown) => {
          logger.error(
            `Error ending call in calling exp: ${activeCallCid}`,
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

    //tells if call is registered in CallKit/Telecom
    const isCallRegistered = callingx.isCallRegistered(activeCallCid);
    logger.debug(
      `useEffect: ${activeCallCid} isCallRegistered: ${isCallRegistered} isIncomingCall: ${isIncomingCall} prevState: ${prevState.current}, currentState: ${callingState}`,
    );

    if (
      isIncomingCall &&
      isCallRegistered &&
      canAcceptIncomingCall(prevState.current, callingState)
    ) {
      logger.debug(`Should accept call in callkeep: ${activeCallCid}`);
      callingx.answerIncomingCall(activeCallCid).catch((error: unknown) => {
        logger.error(
          `Error answering call in calling exp: ${activeCallCid}`,
          error,
        );
      });
    } else if (
      !isIncomingCall &&
      !isCallRegistered &&
      canStartCall(prevState.current, callingState)
    ) {
      logger.debug(`Should register call in callkeep: ${activeCallCid}`);
      //we request start call action from CallKit/Telecom, next step is to make call active when we receive call started event
      callingx
        .startCall(activeCallCid, activeCallCid, callDisplayName, isVideoCall)
        .catch((error: unknown) => {
          logger.error(
            `Error starting call in calling exp: ${activeCallCid}`,
            error,
          );
        });
    } else if (
      isCallRegistered &&
      canEndCall(prevState.current, callingState)
    ) {
      //in case call was registered as incoming and state changed to "not joined", we need to end the call and clear rxjs subject
      logger.debug(`Should end call in callkeep: ${activeCallCid}`);
      //TODO: think about sending appropriate reason for end call
      callingx
        .endCallWithReason(activeCallCid, 'local')
        .catch((error: unknown) => {
          logger.error(
            `Error ending call in calling exp: ${activeCallCid}`,
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
    isVideoCall,
  ]);

  useEffect(() => {
    const callingx = getCallingxLibIfAvailable();
    if (!callingx?.isSetup || !activeCallCid) {
      return;
    }

    //listen to start call action from CallKit/Telecom and set the current call active
    const subscription = callingx.addEventListener(
      'didReceiveStartCallAction',
      ({ callId }: { callId: string }) => {
        if (callId === activeCallCid) {
          logger.debug(`Received start call action for call: ${activeCallCid}`);
          callingx
            .setCurrentCallActive(activeCallCid)
            .catch((error: unknown) => {
              logger.error(
                `Error answering call in calling exp: ${activeCallCid}`,
                error,
              );
            });
        }
      },
    );

    return () => {
      subscription.remove();
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
        `No active call cid to set on hold in calling exp: ${activeCallCid} isCallRegistered: ${isCallRegistered}`,
      );
      return;
    }

    callingx.updateDisplay(activeCallCid, activeCallCid, callDisplayName);
  }, [activeCallCid, callDisplayName]);

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

  useEffect(() => {
    const callingx = getCallingxLibIfAvailable();
    if (!callingx?.isSetup || !activeCallCid) {
      return;
    }

    //listen to mic toggle events from CallKit/Telecom and update stream call microphone state
    const subscription = callingx.addEventListener(
      'didPerformSetMutedCallAction',
      async (event: { callId: string; muted: boolean }) => {
        const { callId, muted } = event;

        if (callId === activeCallCid) {
          if (AppState.currentState === 'active') {
            logger.debug(
              `Mic toggle event received but app is active, so skipping: ${muted} for call: ${activeCallCid}`,
            );
            //this check prevents mic toggle when state change was initiated from client and not from CallKit/Telecom
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
