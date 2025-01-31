import { CallingState, getLogger, RxUtils } from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { Platform } from 'react-native';
import { useEffect, useState } from 'react';
import { StreamVideoRN } from '../../utils';
import { getCallKeepLib } from '../../utils/push/libs';
import {
  voipCallkeepAcceptedCallOnNativeDialerMap$,
  voipCallkeepCallOnForegroundMap$,
  voipPushNotificationCallCId$,
} from '../../utils/push/internal/rxSubjects';

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

const unsubscribeCallkeepEvents = (activeCallCid: string | undefined) => {
  const voipPushNotificationCallCId = RxUtils.getCurrentValue(
    voipPushNotificationCallCId$
  );
  if (activeCallCid && activeCallCid === voipPushNotificationCallCId) {
    // callkeep events should not be listened anymore so clear the call cid
    voipPushNotificationCallCId$.next(undefined);
  }
};

const logger = getLogger(['useIosCallkeepWithCallingStateEffect']);

/**
 * This hook is used to inform the callkeep library that the call has been joined or ended.
 */
export const useIosCallkeepWithCallingStateEffect = () => {
  const activeCall = useCall();
  const { useCallCallingState } = useCallStateHooks();
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
        logger(
          'debug',
          `Ending call in callkeep: ${acceptedForegroundCallkeepMap.cid}, reason: component unmounted and call was present in acceptedForegroundCallkeepMap`
        );
        unsubscribeCallkeepEvents(acceptedForegroundCallkeepMap.cid);
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
        voipCallkeepAcceptedCallOnNativeDialerMap$
      );
      const foregroundIncomingCallkeepMap = RxUtils.getCurrentValue(
        voipCallkeepCallOnForegroundMap$
      );
      const callkeep = getCallKeepLib();
      if (activeCallCid === nativeDialerAcceptedCallMap?.cid) {
        logger(
          'debug',
          `Ending call in callkeep: ${activeCallCid}, reason: activeCallCid changed or was removed and call was present in nativeDialerAcceptedCallMap`
        );
        unsubscribeCallkeepEvents(activeCallCid);
        callkeep.endCall(nativeDialerAcceptedCallMap.uuid);
        // no need to keep this reference anymore
        voipCallkeepAcceptedCallOnNativeDialerMap$.next(undefined);
      } else if (activeCallCid === foregroundIncomingCallkeepMap?.cid) {
        logger(
          'debug',
          `Ending call in callkeep: ${activeCallCid}, reason: activeCallCid changed or was removed and call was present in foregroundIncomingCallkeepMap`
        );
        unsubscribeCallkeepEvents(activeCallCid);
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
      voipCallkeepCallOnForegroundMap$
    );
    if (foregroundCallkeepMap && foregroundCallkeepMap.cid === activeCallCid) {
      logger(
        'debug',
        // @ts-ignore
        `Accepting call in callkeep: ${activeCallCid}, reason: callingstate went to ${CallingState[callingState]} and call was present in foregroundCallkeepMap`
      );
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
    unsubscribeCallkeepEvents(activeCallCid);

    // this was a previously joined call which had push notification displayed
    // the call was accepted through the app and not through native dialer
    // the call was left using the leave button in the app and not through native dialer
    if (activeCallCid === acceptedForegroundCallkeepMap?.cid) {
      logger(
        'debug',
        // @ts-ignore
        `Ending call in callkeep: ${activeCallCid}, reason: callingstate went to ${CallingState[callingState]} and call was present in acceptedForegroundCallkeepMap`
      );
      callkeep.endCall(acceptedForegroundCallkeepMap.uuid);
      setAcceptedForegroundCallkeepMap(undefined);
      return;
    }
    // this was a call which had push notification displayed but never joined
    // the user rejected in the app and not from native dialer
    const foregroundIncomingCallkeepMap = RxUtils.getCurrentValue(
      voipCallkeepCallOnForegroundMap$
    );
    if (activeCallCid === foregroundIncomingCallkeepMap?.cid) {
      logger(
        'debug',
        // @ts-ignore
        `Ending call in callkeep: ${activeCallCid}, reason: callingstate went to ${CallingState[callingState]} and call was present in foregroundIncomingCallkeepMap`
      );
      callkeep.endCall(foregroundIncomingCallkeepMap.uuid);
      // no need to keep this reference anymore
      voipCallkeepCallOnForegroundMap$.next(undefined);
      return;
    }
    // this was a previously joined call
    // it was an accepted call from native dialer and not from the app
    // the user left using the leave button in the app
    const nativeDialerAcceptedCallMap = RxUtils.getCurrentValue(
      voipCallkeepAcceptedCallOnNativeDialerMap$
    );
    if (activeCallCid === nativeDialerAcceptedCallMap?.cid) {
      logger(
        'debug',
        // @ts-ignore
        `Ending call in callkeep: ${activeCallCid}, reason: callingstate went to ${CallingState[callingState]} and call was present in nativeDialerAcceptedCallMap`
      );
      callkeep.endCall(nativeDialerAcceptedCallMap.uuid);
      // no need to keep this reference anymore
      voipCallkeepAcceptedCallOnNativeDialerMap$.next(undefined);
      return;
    }
  }
};
