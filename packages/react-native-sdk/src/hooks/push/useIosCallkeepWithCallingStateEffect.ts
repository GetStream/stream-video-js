import { CallingState, RxUtils } from '@stream-io/video-client';
import { useCall, useCallCallingState } from '@stream-io/video-react-bindings';
import { Platform } from 'react-native';
import { useEffect, useState } from 'react';
import { StreamVideoRN } from '../../utils';
import { getCallKeepLib } from '../../utils/push/libs';
import {
  voipCallkeepAcceptedCallOnNativeDialerMap$,
  voipCallkeepCallOnForegroundMap$,
} from '../../utils/push/rxSubjects';

const isNonActiveCallingState = (callingState: CallingState) => {
  return (
    callingState === CallingState.IDLE ||
    callingState === CallingState.UNKNOWN ||
    callingState === CallingState.LEFT
  );
};

const isAcceptedCallingState = (callingState: CallingState) => {
  return (
    callingState === CallingState.JOINING ||
    callingState === CallingState.JOINED
  );
};

/**
 * This hook is used to inform the callkeep library that the call has been joined or ended.
 */
export const useIosCallkeepWithCallingStateEffect = () => {
  const activeCall = useCall();
  const callingState = useCallCallingState();
  const [acceptedForegroundCallkeepMap, setAcceptedForegroundCallkeepMap] =
    useState<{
      uuid: string;
      cid: string;
    }>();

  useEffect(() => {
    return () => {
      const pushConfig = StreamVideoRN.getConfig().push;
      if (Platform.OS !== 'ios' || !pushConfig) {
        return;
      }
      const callkeep = getCallKeepLib();
      // if the component is unmounted and the callID was not reported to callkeep, then report it now
      if (acceptedForegroundCallkeepMap) {
        // this call should be ended in callkeep
        callkeep.endCall(acceptedForegroundCallkeepMap.uuid);
      }
    };
  }, [acceptedForegroundCallkeepMap]);

  const activeCallCid = activeCall?.cid;

  useEffect(() => {
    return () => {
      const pushConfig = StreamVideoRN.getConfig().push;
      if (Platform.OS !== 'ios' || !pushConfig || !activeCallCid) {
        return;
      }
      const nativeDialerAcceptedCallMap = RxUtils.getCurrentValue(
        voipCallkeepAcceptedCallOnNativeDialerMap$,
      );
      const foregroundIncomingCallkeepMap = RxUtils.getCurrentValue(
        voipCallkeepCallOnForegroundMap$,
      );
      const callkeep = getCallKeepLib();
      if (activeCallCid === nativeDialerAcceptedCallMap?.cid) {
        callkeep.endCall(nativeDialerAcceptedCallMap.uuid);
        // no need to keep this reference anymore
        voipCallkeepAcceptedCallOnNativeDialerMap$.next(undefined);
      } else if (activeCallCid === foregroundIncomingCallkeepMap?.cid) {
        callkeep.endCall(foregroundIncomingCallkeepMap.uuid);
        // no need to keep this reference anymore
        voipCallkeepCallOnForegroundMap$.next(undefined);
      }
    };
  }, [activeCallCid]);

  const pushConfig = StreamVideoRN.getConfig().push;
  if (Platform.OS !== 'ios' || !pushConfig || !activeCallCid) {
    return;
  }

  /**
   * Check if current call is still needed to be accepted in callkeep
   */
  if (
    isAcceptedCallingState(callingState) &&
    acceptedForegroundCallkeepMap?.cid !== activeCallCid
  ) {
    const callkeep = getCallKeepLib();
    // push notification was displayed
    // but the call has been accepted through the app and not through the native dialer
    const foregroundCallkeepMap = RxUtils.getCurrentValue(
      voipCallkeepCallOnForegroundMap$,
    );
    if (foregroundCallkeepMap && foregroundCallkeepMap.cid === activeCallCid) {
      // this call should be accepted in callkeep
      callkeep.answerIncomingCall(foregroundCallkeepMap.uuid);
      // no need to keep this reference anymore
      voipCallkeepCallOnForegroundMap$.next(undefined);
      setAcceptedForegroundCallkeepMap(foregroundCallkeepMap);
    }
  }

  /**
   * Check if current call is still needed to be ended in callkeep
   */
  if (isNonActiveCallingState(callingState)) {
    const callkeep = getCallKeepLib();
    // this was a previously joined call which had push notification displayed
    // the call was accepted through the app and not through native dialer
    // the call was left using the leave button in the app and not through native dialer
    if (activeCallCid === acceptedForegroundCallkeepMap?.cid) {
      callkeep.endCall(acceptedForegroundCallkeepMap.uuid);
      setAcceptedForegroundCallkeepMap(undefined);
      return;
    }
    // this was a call which had push notification displayed but never joined
    // the user rejected in the app and not from native dialer
    const foregroundIncomingCallkeepMap = RxUtils.getCurrentValue(
      voipCallkeepCallOnForegroundMap$,
    );
    if (activeCallCid === foregroundIncomingCallkeepMap?.cid) {
      callkeep.endCall(foregroundIncomingCallkeepMap.uuid);
      // no need to keep this reference anymore
      voipCallkeepCallOnForegroundMap$.next(undefined);
      return;
    }
    // this was a previously joined call
    // it was an accepted call from native dialer and not from the app
    // the user left using the leave button in the app
    const nativeDialerAcceptedCallMap = RxUtils.getCurrentValue(
      voipCallkeepAcceptedCallOnNativeDialerMap$,
    );
    if (activeCallCid === nativeDialerAcceptedCallMap?.cid) {
      callkeep.endCall(nativeDialerAcceptedCallMap.uuid);
      // no need to keep this reference anymore
      voipCallkeepAcceptedCallOnNativeDialerMap$.next(undefined);
      return;
    }
  }
};
