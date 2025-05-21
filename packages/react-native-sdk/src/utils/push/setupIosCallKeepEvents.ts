import {
  pushAcceptedIncomingCallCId$,
  voipCallkeepAcceptedCallOnNativeDialerMap$,
  voipCallkeepCallOnForegroundMap$,
  voipPushNotificationCallCId$,
} from './internal/rxSubjects';
import { getLogger, RxUtils } from '@stream-io/video-client';
import { getCallKeepLib, getVoipPushNotificationLib } from './libs';
import type { StreamVideoConfig } from '../StreamVideoRN/types';
import {
  clearPushWSEventSubscriptions,
  processCallFromPushInBackground,
} from './internal/utils';
import { AppState, NativeModules, Platform } from 'react-native';
import { setPushLogoutCallback } from '../internal/pushLogoutCallback';

type PushConfig = NonNullable<StreamVideoConfig['push']>;

/**
 * This hook is used to listen to callkeep events and do the necessary actions
 */
export function setupIosCallKeepEvents(
  pushConfig: NonNullable<StreamVideoConfig['push']>,
) {
  if (Platform.OS !== 'ios' || !pushConfig.ios.pushProviderName) {
    return;
  }
  if (!pushConfig.android.incomingCallChannel) {
    // TODO: remove this check and find a better way once we have telecom integration for android
    getLogger(['setupIosCallKeepEvents'])(
      'debug',
      'android incomingCallChannel is not defined, so skipping the setupIosCallKeepEvents',
    );
    return;
  }
  const logger = getLogger(['setupIosCallKeepEvents']);
  const callkeep = getCallKeepLib();

  async function getCallCid(callUUID: string): Promise<string | undefined> {
    let call_cid = RxUtils.getCurrentValue(voipPushNotificationCallCId$);
    if (!call_cid) {
      // if call_cid is not available, try to get it from native module
      try {
        call_cid =
          await NativeModules?.StreamVideoReactNative?.getIncomingCallCid(
            callUUID,
          );
        voipPushNotificationCallCId$.next(call_cid);
      } catch (error) {
        logger(
          'debug',
          'Error in getting call cid from native module - probably the call was already processed, so ignoring this callkeep event',
          error,
        );
      }
    }
    return call_cid;
  }

  function answerCall(callUUID: string) {
    getCallCid(callUUID).then((call_cid) => {
      logger('debug', `answerCall event with call_cid: ${call_cid}`);
      iosCallkeepAcceptCall(call_cid, callUUID);
    });
  }

  function endCall(callUUID: string) {
    getCallCid(callUUID).then((call_cid) => {
      logger('debug', `endCall event with call_cid: ${call_cid}`);
      iosCallkeepRejectCall(call_cid, callUUID, pushConfig!);
    });
  }

  function didDisplayIncomingCall(callUUID: string, payload: object) {
    const voipPushNotification = getVoipPushNotificationLib();
    // @ts-expect-error - call_cid is not part of RNCallKeepEventPayload
    const call_cid = payload?.call_cid as string | undefined;
    logger(
      'debug',
      `didDisplayIncomingCall event with callUUID: ${callUUID} call_cid: ${call_cid}`,
    );
    if (call_cid) {
      if (AppState.currentState === 'background') {
        processCallFromPushInBackground(
          pushConfig!,
          call_cid,
          'backgroundDelivered',
        );
      }
      voipCallkeepCallOnForegroundMap$.next({
        uuid: callUUID,
        cid: call_cid,
      });
    }
    voipPushNotification.onVoipNotificationCompleted(callUUID);
  }

  const { remove: removeAnswerCall } = callkeep.addEventListener(
    'answerCall',
    ({ callUUID }) => {
      answerCall(callUUID);
    },
  );
  const { remove: removeEndCall } = callkeep.addEventListener(
    'endCall',
    ({ callUUID }) => {
      endCall(callUUID);
    },
  );

  const { remove: removeDisplayIncomingCall } = callkeep.addEventListener(
    'didDisplayIncomingCall',
    ({ callUUID, payload }) => {
      didDisplayIncomingCall(callUUID, payload);
    },
  );

  const { remove: removeDidLoadWithEvents } = callkeep.addEventListener(
    'didLoadWithEvents',
    (events) => {
      if (!events || !Array.isArray(events) || events.length < 1) {
        return;
      }

      events.forEach((event) => {
        const { name, data } = event;
        if (name === 'RNCallKeepDidDisplayIncomingCall') {
          didDisplayIncomingCall(data.callUUID, data.payload);
        } else if (name === 'RNCallKeepPerformAnswerCallAction') {
          answerCall(data.callUUID);
        } else if (name === 'RNCallKeepPerformEndCallAction') {
          endCall(data.callUUID);
        }
      });
    },
  );

  setPushLogoutCallback(async () => {
    removeAnswerCall();
    removeEndCall();
    removeDisplayIncomingCall();
    removeDidLoadWithEvents();
  });
}

const iosCallkeepAcceptCall = (
  call_cid: string | undefined,
  callUUIDFromCallkeep: string,
) => {
  if (!shouldProcessCallFromCallkeep(call_cid, callUUIDFromCallkeep)) {
    return;
  }
  clearPushWSEventSubscriptions();
  // to call end callkeep later if ended in app and not through callkeep
  voipCallkeepAcceptedCallOnNativeDialerMap$.next({
    uuid: callUUIDFromCallkeep,
    cid: call_cid,
  });
  // to process the call in the app
  pushAcceptedIncomingCallCId$.next(call_cid);
  // no need to keep these references anymore
  voipCallkeepCallOnForegroundMap$.next(undefined);
};

const iosCallkeepRejectCall = async (
  call_cid: string | undefined,
  callUUIDFromCallkeep: string,
  pushConfig: PushConfig,
) => {
  if (!shouldProcessCallFromCallkeep(call_cid, callUUIDFromCallkeep)) {
    return;
  }
  clearPushWSEventSubscriptions();
  // no need to keep these references anymore
  voipCallkeepAcceptedCallOnNativeDialerMap$.next(undefined);
  voipCallkeepCallOnForegroundMap$.next(undefined);
  voipPushNotificationCallCId$.next(undefined);
  await processCallFromPushInBackground(pushConfig, call_cid, 'decline');
  await NativeModules.StreamVideoReactNative?.removeIncomingCall(call_cid);
};

/**
 * Helper function to determine if the answer/end call event from callkeep must be processed
 * Just checks if we have a valid call_cid and acts as a type guard for call_cid
 */
const shouldProcessCallFromCallkeep = (
  call_cid: string | undefined,
  callUUIDFromCallkeep: string,
): call_cid is string => {
  if (!call_cid || !callUUIDFromCallkeep) {
    return false;
  }
  return true;
};
