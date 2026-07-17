import { Call, CallingState, videoLoggerSystem } from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import { AudioDeviceModule } from '@stream-io/react-native-webrtc';
import { filter, take } from 'rxjs/operators';
import { getCallDisplayName } from '../../utils/internal/callingx/callingx';
import { getCallingxLibIfAvailable } from '../../utils/push/libs/callingx';

const logger = videoLoggerSystem.getLogger('callingx');

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
  const createdByUserId = activeCall?.state.createdBy?.id;
  const callCustomDisplayName = activeCall?.state.custom?.display_name;
  const currentUserId = activeCall?.currentUserId;
  const isIncoming =
    (activeCall?.ringing && !activeCall?.isCreatedByMe) || false;

  const callDisplayName = useMemo(
    () =>
      callCustomDisplayName ??
      getCallDisplayName(callMembers, participants, currentUserId),
    [callMembers, participants, currentUserId, callCustomDisplayName],
  );

  useEffect(() => {
    const callingx = getCallingxLibIfAvailable();
    if (!callingx?.isSetup || !activeCall) {
      return;
    }
    // need to capture RINGING -> Joining -> Joined state change for the first time
    // and inform callingx that the call is active
    const shouldMakeCallActive = (call: Call): boolean => {
      // only for outgoing calls or non-ringing ongoing calls in callingx
      // Note: incoming calls are handled by callingx pending states instead
      return (
        (call.ringing && call.isCreatedByMe) ||
        (!call.ringing && callingx.isOngoingCallsEnabled)
      );
    };
    const subscription = activeCall.state.callingState$
      .pipe(
        filter(
          (callingState) =>
            shouldMakeCallActive(activeCall) &&
            callingState === CallingState.JOINED &&
            callingx.isCallTracked(activeCall.cid),
        ),
        take(1), // only need to capture the first joined state for outgoing calls
        // then subscription completes and is automatically unsubscribed
      )
      .subscribe(() => {
        callingx.setCurrentCallActive(activeCall.cid);
      });
    return () => {
      subscription.unsubscribe();
    };
  }, [activeCall]);

  useEffect(() => {
    return () => {
      const callingx = getCallingxLibIfAvailable();
      if (!callingx?.isSetup || !activeCallCid) {
        return;
      }

      const isCallTracked = callingx.isCallTracked(activeCallCid);
      if (!isCallTracked) {
        logger.debug(
          `useCallingExpWithCallingStateEffect:No active call cid to end in calling exp: ${activeCallCid} isCallTracked: ${isCallTracked}`,
        );
        return;
      }
      //if incoming stream call was unmounted, we need to end the call in CallKit/Telecom
      logger.debug(
        `useCallingExpWithCallingStateEffect: Ending call in callingx: ${activeCallCid}`,
      );
      callingx
        .endCallWithReason(activeCallCid, 'local')
        .catch((error: unknown) => {
          logger.error(
            `useCallingExpWithCallingStateEffect: Error ending call in callingx: ${activeCallCid}`,
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

    const isCallTracked = callingx.isCallTracked(activeCallCid);
    if (!isCallTracked) {
      logger.debug(
        `useCallingExpWithCallingStateEffect:No active call cid to update callingx: ${activeCallCid} isCallTracked: ${isCallTracked}`,
      );
      return;
    }

    callingx.updateDisplay(
      activeCallCid,
      createdByUserId ?? callDisplayName,
      callDisplayName,
      isIncoming,
    );
  }, [activeCallCid, createdByUserId, callDisplayName, isIncoming]);

  // Sync microphone mute state from app → CallKit
  useEffect(() => {
    const callingx = getCallingxLibIfAvailable();
    if (!callingx?.isSetup || !activeCallCid) {
      return;
    }

    const isCallTracked = callingx.isCallTracked(activeCallCid);
    if (!isCallTracked) {
      logger.debug(
        `useCallingExpWithCallingStateEffect: No active call cid to set muted in calling exp: ${activeCallCid} isCallTracked: ${isCallTracked}`,
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
        `useCallingExpWithCallingStateEffect: No active call cid to set muted in calling exp: ${activeCallCid} callingx isSetup: ${callingx?.isSetup}`,
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

        const isCallTracked = callingx.isCallTracked(activeCallCid);
        if (!isCallTracked || callId !== activeCallCid) {
          logger.debug(
            `useCallingExpWithCallingStateEffect: No active call cid to set muted in calling exp: ${activeCallCid} isCallTracked: ${isCallTracked} callId: ${callId}`,
          );
          return;
        }

        const isCurrentlyMuted = microphone.state.status === 'disabled';
        if (isCurrentlyMuted === muted) {
          logger.debug(
            `useCallingExpWithCallingStateEffect: Mic toggle is already in the desired state: ${muted} for call: ${activeCallCid}`,
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
            `useCallingExpWithCallingStateEffect: Error toggling mic in calling exp: ${activeCallCid}`,
            error,
          );
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, [activeCallCid, microphone]);

  // Trace CallKit audio session activation/deactivation onto the call's tracer.
  useEffect(() => {
    const callingx = getCallingxLibIfAvailable();
    if (!callingx?.isSetup || !activeCall) {
      return;
    }

    const activateSubscription = callingx.addEventListener(
      'didActivateAudioSession',
      () => {
        activeCall.tracer.trace('callingx.didActivateAudioSession', null);
      },
    );
    const deactivateSubscription = callingx.addEventListener(
      'didDeactivateAudioSession',
      () => {
        activeCall.tracer.trace('callingx.didDeactivateAudioSession', null);
      },
    );

    return () => {
      activateSubscription.remove();
      deactivateSubscription.remove();
    };
  }, [activeCall]);

  // Trace the iOS ADM recording state to detect silent-mic calls: the engine's
  // input bring-up racing the CallKit audio-session activation could leave
  // recording silently never started (mic track live, zero audio RTP sent).
  // Samples shortly after JOINED and after every didActivateAudioSession, and
  // traces healthy calls too so the failure rate is measurable. Detection only;
  // the engine-availability gate in callingx owns prevention.
  useEffect(() => {
    const callingx = getCallingxLibIfAvailable();
    if (Platform.OS !== 'ios' || !callingx?.isSetup || !activeCall) {
      return;
    }

    const timeouts = new Set<ReturnType<typeof setTimeout>>();

    const traceRecordingState = (trigger: string) => {
      if (activeCall.state.callingState !== CallingState.JOINED) return;
      if (activeCall.microphone.state.status !== 'enabled') return;

      const isRecording = AudioDeviceModule.isRecording();
      const state = {
        trigger,
        isRecording,
        isEngineRunning: AudioDeviceModule.isEngineRunning(),
        isMicrophoneMuted: AudioDeviceModule.isMicrophoneMuted(),
      };
      activeCall.tracer.trace('ios.audioRecording.state', state);
      if (!isRecording) {
        logger.warn('mic is enabled but ADM is not recording', state);
      }
    };

    const scheduleCheck = (trigger: string, delayMs: number) => {
      const timeout = setTimeout(() => {
        timeouts.delete(timeout);
        traceRecordingState(trigger);
      }, delayMs);
      timeouts.add(timeout);
    };

    const joinedSubscription = activeCall.state.callingState$
      .pipe(
        filter((callingState) => callingState === CallingState.JOINED),
        take(1),
      )
      // delayed so the normal engine bring-up can complete on its own
      .subscribe(() => scheduleCheck('joined', 3000));

    const activationSubscription = callingx.addEventListener(
      'didActivateAudioSession',
      // delayed so the activation-driven engine start can run first
      () => scheduleCheck('audioSessionActivated', 1000),
    );

    return () => {
      joinedSubscription.unsubscribe();
      activationSubscription.remove();
      timeouts.forEach(clearTimeout);
      timeouts.clear();
    };
  }, [activeCall]);
};
