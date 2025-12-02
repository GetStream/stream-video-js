import {
  CallingState,
  RxUtils,
  videoLoggerSystem,
} from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { useEffect, useRef } from 'react';
import { voipPushNotificationCallCId$ } from '../../utils/push/internal/rxSubjects';
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

/**
 * This hook is used to inform sync call state with CallKit/Telecom (e.i. start call, end call, mute/unmute call).
 */
export const useCallingExpWithCallingStateEffect = () => {
  const { useCallCallingState, useMicrophoneState } = useCallStateHooks();

  const activeCall = useCall();
  const callingState = useCallCallingState();
  const { isMute, microphone } = useMicrophoneState();

  const prevState = useRef<CallingState | undefined>(undefined);

  const activeCallCid = activeCall?.cid;
  // const isOutcomingCall = activeCall?.isCreatedByMe; //can be used to trigger CallKit/Telecom start call for outcoming calls

  useEffect(() => {
    return () => {
      const callingx = getCallingxLibIfAvailable();
      if (!callingx) {
        return;
      }
      //as an alternative think about method which will return CallKit/Telecom state for given cid
      const incomingCallCid = RxUtils.getCurrentValue(
        voipPushNotificationCallCId$,
      );
      if (
        !activeCallCid ||
        !incomingCallCid ||
        incomingCallCid !== activeCallCid
      ) {
        logger.debug(
          `No active call cid to end in calling exp: ${activeCallCid} incomingCallCid: ${incomingCallCid}`,
        );
        return;
      }
      //if incoming stream call was unmounted, we need to end the call in CallKit/Telecom
      //TODO: think about sending appropriate reason for end call
      callingx.endCallWithReason(activeCallCid, 'local');
      voipPushNotificationCallCId$.next(undefined);
    };
  }, [activeCallCid]);

  useEffect(() => {
    const callingx = getCallingxLibIfAvailable();
    if (!callingx) {
      return;
    }

    //as an alternative think about method which will return CallKit/Telecom state for given cid
    const incomingCallCid = RxUtils.getCurrentValue(
      voipPushNotificationCallCId$,
    );
    if (
      !incomingCallCid ||
      !activeCallCid ||
      incomingCallCid !== activeCallCid
    ) {
      logger.debug(
        `No active call cid to end in calling exp: ${activeCallCid} incomingCallCid: ${incomingCallCid}`,
      );
      return;
    }

    logger.debug(
      `useEffect: ${activeCallCid} incomingCallCid: ${incomingCallCid}`,
    );
    logger.debug(
      `prevState.current: ${prevState.current}, current callingState: ${callingState}`,
    );

    if (prevState.current !== callingState) {
      if (
        !isAcceptedCallingState(prevState.current) &&
        isAcceptedCallingState(callingState)
      ) {
        //in case call was registered as incoming and state changed to joined, we need to answer the call
        logger.debug(
          `Should accept call in callkeep: ${activeCallCid} callCid: ${incomingCallCid}`,
        );
        callingx.answerIncomingCall(activeCallCid);
      } else if (
        isAcceptedCallingState(prevState.current) &&
        !isAcceptedCallingState(callingState)
      ) {
        //in case call was registered as incoming and state changed to "not joined", we need to end the call and clear rxjs subject
        logger.debug(`Should end call in callkeep: ${activeCallCid}`);
        //TODO: think about sending appropriate reason for end call
        callingx.endCallWithReason(activeCallCid, 'local');
        voipPushNotificationCallCId$.next(undefined);
      }
    }

    prevState.current = callingState;
  }, [activeCallCid, callingState]);

  useEffect(() => {
    const callingx = getCallingxLibIfAvailable();
    if (!callingx) {
      return;
    }

    //for now supports only incoming calls
    const incomingCallCid = RxUtils.getCurrentValue(
      voipPushNotificationCallCId$,
    );
    if (
      !incomingCallCid ||
      !activeCallCid ||
      incomingCallCid !== activeCallCid
    ) {
      logger.debug(
        `No active call cid to set muted in calling exp: ${activeCallCid} incomingCallCid: ${incomingCallCid}`,
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
      async (event) => {
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

          if (muted) {
            await microphone.disable();
          } else {
            await microphone.enable();
          }
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, [activeCallCid, microphone]);
};
