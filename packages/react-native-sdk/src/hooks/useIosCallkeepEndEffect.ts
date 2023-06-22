import { CallingState } from '@stream-io/video-client';
import { useCall, useCallCallingState } from '@stream-io/video-react-bindings';
import { Platform } from 'react-native';
import { useEffect, useRef } from 'react';
import { StreamVideoRN } from '../utils';
import { getCallKeepLib } from '../utils/push/libs';

const isNonActiveCallingState = (callingState: CallingState) => {
  return (
    callingState === CallingState.IDLE ||
    callingState === CallingState.UNKNOWN ||
    callingState === CallingState.LEFT
  );
};

/**
 * This hook is used to inform the callkeep library that the call has ended.
 */
export const useIosCallkeepEndEffect = () => {
  const activeCall = useCall();
  const callingState = useCallCallingState();
  const currentActiveCallIdRef = useRef<string>();

  useEffect(() => {
    const pushConfig = StreamVideoRN.getConfig().push;
    if (Platform.OS !== 'ios' || !pushConfig) {
      return;
    }
    const callkeep = getCallKeepLib();
    return () => {
      // if the component is unmounted and the callID was not reported to callkeep, then report it now
      if (currentActiveCallIdRef.current) {
        callkeep.endCall(currentActiveCallIdRef.current);
        currentActiveCallIdRef.current = undefined;
      }
    };
  }, []);

  const activeCallId = activeCall?.id;
  const pushConfig = StreamVideoRN.getConfig().push;
  if (Platform.OS !== 'ios' || !pushConfig || !activeCallId) {
    return;
  }
  if (!isNonActiveCallingState(callingState)) {
    currentActiveCallIdRef.current = activeCallId;
    return;
  }
  // the current call has ended, so report it to callkeep asap
  if (activeCallId === currentActiveCallIdRef.current) {
    const callkeep = getCallKeepLib();
    callkeep.endCall(activeCall?.id);
    currentActiveCallIdRef.current = undefined;
  }
};
