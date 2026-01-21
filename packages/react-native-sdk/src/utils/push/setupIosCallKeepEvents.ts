import {
  pushAcceptedIncomingCallCId$,
  voipCallkeepAcceptedCallOnNativeDialerMap$,
  voipCallkeepCallOnForegroundMap$,
  voipPushNotificationCallCId$,
} from './internal/rxSubjects';
import { RxUtils, videoLoggerSystem } from '@stream-io/video-client';
import { getCallKeepLib, getVoipPushNotificationLib } from './libs';
import type { StreamVideoConfig } from '../StreamVideoRN/types';
import {
  clearPushWSEventSubscriptions,
  processCallFromPushInBackground,
} from './internal/utils';
import { AppState, NativeModules, Platform } from 'react-native';
import { RTCAudioSession } from '@stream-io/react-native-webrtc';
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
    videoLoggerSystem
      .getLogger('setupIosCallKeepEvents')
      .debug(
        'android incomingCallChannel is not defined, so skipping the setupIosCallKeepEvents',
      );
    return;
  }
  const logger = videoLoggerSystem.getLogger('setupIosCallKeepEvents');
  const callkeep = getCallKeepLib();

  async function getCallCid(callUUID: string): Promise<string | undefined> {
    try {
      const call_cid =
        await NativeModules.StreamVideoReactNative.getIncomingCallCid(callUUID);
      // in a case that voipPushNotificationCallCId$ is empty (this should not happen as voipPushNotificationCallCId$ is updated in push reception)]
      // update it with this call_cid
      const voipPushNotificationCallCId = RxUtils.getCurrentValue(
        voipPushNotificationCallCId$,
      );
      if (!voipPushNotificationCallCId) {
        logger.debug(
          `voipPushNotificationCallCId$ is empty, updating it with the call_cid: ${call_cid} for callUUID: ${callUUID}`,
        );
        voipPushNotificationCallCId$.next(call_cid);
      }
      return call_cid;
    } catch {
      logger.debug(
        `Error in getting call cid from native module for callUUID: ${callUUID} - probably the call was already processed, so ignoring this callkeep event`,
      );
    }
    return undefined;
  }

  function answerCall(callUUID: string) {
    getCallCid(callUUID).then((call_cid) => {
      logger.debug(`answerCall event with call_cid: ${call_cid}`);
      iosCallkeepAcceptCall(call_cid, callUUID);
    });
  }

  function endCall(callUUID: string) {
    getCallCid(callUUID).then((call_cid) => {
      logger.debug(`endCall event with call_cid: ${call_cid}`);
      iosCallkeepRejectCall(call_cid, callUUID, pushConfig!);
    });
  }

  /**
   * CallKeep / CallKit audio-session events -> WebRTC (iOS)
   *
   * iOS CallKit is the authority that *activates* and *deactivates* the underlying `AVAudioSession`
   * when a call is answered/ended from the system UI (lock screen, Call UI, Bluetooth, etc).
   *
   * WebRTC on iOS wraps `AVAudioSession` with `RTCAudioSession` and its AudioDeviceModule relies on
   * being notified of those lifecycle transitions to correctly start/stop audio I/O and keep its
   * internal activation state consistent (e.g. activation count, playout/recording start).
   *
   * If these callbacks don’t reach WebRTC, answering via the native dialer UI can result in:
   * - no microphone capture / one-way audio
   * - silent playout until the app forces an audio reconfiguration
   * - flaky audio routing (speaker/earpiece/Bluetooth) across subsequent calls
   *
   * We forward CallKeep’s `didActivateAudioSession` / `didDeactivateAudioSession` events to WebRTC’s
   * `RTCAudioSession.audioSessionDidActivate()` / `audioSessionDidDeactivate()` methods.
   */
  function didActivateAudioSession() {
    logger.debug('didActivateAudioSession');
    RTCAudioSession.audioSessionDidActivate();
  }

  function didDeactivateAudioSession() {
    logger.debug('didDeactivateAudioSession');
    RTCAudioSession.audioSessionDidDeactivate();
  }

  function didDisplayIncomingCall(callUUID: string, payload: object) {
    const voipPushNotification = getVoipPushNotificationLib();
    // @ts-expect-error - call_cid is not part of RNCallKeepEventPayload
    const call_cid = payload?.call_cid as string | undefined;
    logger.debug(
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

  const { remove: removeDidActivateAudioSession } = callkeep.addEventListener(
    'didActivateAudioSession',
    () => {
      didActivateAudioSession();
    },
  );

  const { remove: removeDidDeactivateAudioSession } = callkeep.addEventListener(
    'didDeactivateAudioSession',
    () => {
      didDeactivateAudioSession();
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
        } else if (name === 'RNCallKeepDidActivateAudioSession') {
          didActivateAudioSession();
        } else if (name === 'RNCallKeepDidDeactivateAudioSession') {
          didDeactivateAudioSession();
        }
      });
    },
  );

  setPushLogoutCallback(async () => {
    removeAnswerCall();
    removeEndCall();
    removeDisplayIncomingCall();
    removeDidActivateAudioSession();
    removeDidDeactivateAudioSession();
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
  clearPushWSEventSubscriptions(call_cid);
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
  clearPushWSEventSubscriptions(call_cid);
  // remove the references if the call_cid matches
  const voipPushNotificationCallCId = RxUtils.getCurrentValue(
    voipPushNotificationCallCId$,
  );
  if (voipPushNotificationCallCId === call_cid) {
    voipCallkeepAcceptedCallOnNativeDialerMap$.next(undefined);
    voipCallkeepCallOnForegroundMap$.next(undefined);
    voipPushNotificationCallCId$.next(undefined);
  }

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
