import {
  CallingState,
  MemberResponse,
  RxUtils,
  videoLoggerSystem,
} from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { useEffect, useMemo, useRef } from 'react';
import { getCallingxLibIfAvailable } from '../../utils/push/libs/callingx';

//calling state methods are not exhaustive, so we need to add more methods to cover all the cases
//for now we can check is state is joined or !joined
const isAcceptedCallingState = (callingState: CallingState | undefined) => {
  if (!callingState) {
    return false;
  }

  return callingState === CallingState.JOINED;
};

const logger = videoLoggerSystem.getLogger(
  'useCallingExpWithCallingStateEffect',
);

function getOutcomingDisplayName(
  members: MemberResponse[] | undefined,
  currentUserId: string | undefined,
) {
  if (!members || !currentUserId) {
    return 'Unknown';
  }

  const names = members
    .filter((member) => member.user_id !== currentUserId)
    .map((member) => member.user.name)
    .filter(Boolean);

  return names.length > 0 ? names.join(', ') : 'Unknown';
}

/**
 * This hook is used to inform sync call state with CallKit/Telecom (i.e. start call, end call, mute/unmute call).
 */
export const useCallingExpWithCallingStateEffect = () => {
  const { useCallCallingState, useMicrophoneState } = useCallStateHooks();

  const activeCall = useCall();
  const callingState = useCallCallingState();
  const { isMute, microphone } = useMicrophoneState();

  const prevState = useRef<CallingState | undefined>(undefined);

  const activeCallCid = activeCall?.cid;
  const isOutcomingCall = activeCall?.isCreatedByMe && activeCall?.ringing; //is this reliable??
  const currentUserId = activeCall?.currentUserId;
  const isVideoCall = activeCall?.state.settings?.video?.enabled ?? false;

  const outcomingDisplayName = useMemo(
    () => getOutcomingDisplayName(activeCall?.state.members, currentUserId),
    [activeCall?.state.members, currentUserId],
  );

  useEffect(() => {
    return () => {
      const callingx = getCallingxLibIfAvailable();
      if (!callingx || !activeCallCid) {
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
        .endCallWithReason(activeCallCid, 'remote')
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
    if (!callingx || !activeCallCid || prevState.current === callingState) {
      return;
    }

    //tells if call is registered in CallKit/Telecom
    const isCallRegistered = callingx.isCallRegistered(activeCallCid);
    logger.debug(
      `useEffect: ${activeCallCid} isCallRegistered: ${isCallRegistered} isOutcomingCall: ${isOutcomingCall}`,
    );
    logger.debug(
      `prevState.current: ${prevState.current}, current callingState: ${callingState}`,
    );
    logger.debug(
      `isOutcomingCallsEnabled: ${callingx.isOutcomingCallsEnabled}`,
    );

    if (
      !isAcceptedCallingState(prevState.current) &&
      isAcceptedCallingState(callingState)
    ) {
      if (
        isOutcomingCall &&
        !isCallRegistered &&
        callingx.isOutcomingCallsEnabled
      ) {
        //we request start call action from CallKit/Telecom, next step is to make call active when we receive call started event
        logger.debug(`Should start call in callkeep: ${activeCallCid}`);
        callingx
          .startCall(
            activeCallCid,
            activeCallCid,
            outcomingDisplayName,
            isVideoCall,
          )
          .catch((error: unknown) => {
            logger.error(
              `Error starting call in calling exp: ${activeCallCid}`,
              error,
            );
          });
      } else if (isCallRegistered) {
        logger.debug(
          `Should accept call in callkeep: ${activeCallCid} isCallRegistered: ${isCallRegistered}`,
        );
        callingx.answerIncomingCall(activeCallCid).catch((error: unknown) => {
          logger.error(
            `Error answering call in calling exp: ${activeCallCid}`,
            error,
          );
        });
      }
    } else if (
      isAcceptedCallingState(prevState.current) &&
      !isAcceptedCallingState(callingState) &&
      isCallRegistered
    ) {
      //in case call was registered as incoming and state changed to "not joined", we need to end the call and clear rxjs subject
      logger.debug(`Should end call in callkeep: ${activeCallCid}`);
      //TODO: think about sending appropriate reason for end call
      callingx
        .endCallWithReason(activeCallCid, 'remote')
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
    isOutcomingCall,
    outcomingDisplayName,
    isVideoCall,
  ]);

  useEffect(() => {
    const callingx = getCallingxLibIfAvailable();
    if (!callingx || !activeCallCid) {
      return;
    }

    //listen to start call action from CallKit/Telecom and set the current call active
    const subscription = callingx.addEventListener(
      'didReceiveStartCallAction',
      ({ callId }: { callId: string }) => {
        if (callId === activeCallCid) {
          logger.debug(`Received start call action for call: ${activeCallCid}`);
          callingx.answerIncomingCall(activeCallCid).catch((error: unknown) => {
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
    if (!callingx || !activeCallCid) {
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
    if (!callingx || !activeCallCid) {
      return;
    }

    //listen to mic toggle events from CallKit/Telecom and update stream call microphone state
    const subscription = callingx.addEventListener(
      'didPerformSetMutedCallAction',
      async (event: { callId: string; muted: boolean }) => {
        const { callId, muted } = event;

        if (callId === activeCallCid) {
          const isCurrentlyMuted =
            RxUtils.getCurrentValue(microphone.state.status$) === 'disabled';
          if (isCurrentlyMuted === muted) {
            logger.debug(
              `Mic toggle is already in the desired state: ${muted} for call: ${activeCallCid}`,
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
