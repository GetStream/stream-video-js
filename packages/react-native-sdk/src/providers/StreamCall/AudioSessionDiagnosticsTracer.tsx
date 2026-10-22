import { useCall } from '@stream-io/video-react-bindings';
import { CallingState, videoLoggerSystem } from '@stream-io/video-client';
import { AudioDeviceModule } from '@stream-io/react-native-webrtc';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { filter, take } from 'rxjs/operators';
import { callManager } from '../../modules/call-manager';
import type {
  IOSAudioInterruptionEvent,
  IOSAudioSessionDiagnosticEvent,
} from '../../modules/call-manager';
import { getCallingxLibIfAvailable } from '../../utils/push/libs/callingx';

type CallingxAudioInterruptionEvents = {
  addEventListener: (
    eventName: 'didAudioInterruption',
    listener: (event: IOSAudioInterruptionEvent) => void,
  ) => { remove: () => void };
};

/** Delay before re-sampling an unhealthy recording state. */
const RECHECK_DELAY_MS = 10000;

/**
 * Traces the iOS audio session diagnostics and the ADM recording state while
 * a StreamCall provider is mounted.
 *
 * The recording state detects silent-mic calls (mic track live, zero audio RTP
 * sent) caused by an audio engine that never started, both on the CallKit
 * (callingx) and on the in-call manager path. Healthy calls are traced too
 * (minimal payload) so the failure rate is measurable; unhealthy samples add
 * the mute mode, recording-prepared mode and the audio session snapshot.
 * Detection only.
 */
export const AudioSessionDiagnosticsTracer = () => {
  const call = useCall();

  useEffect(() => {
    if (Platform.OS !== 'ios' || !call) {
      return;
    }

    const logger = videoLoggerSystem.getLogger('AudioSessionDiagnostics');
    const timeouts = new Set<ReturnType<typeof setTimeout>>();

    const scheduleCheck = (trigger: string, delayMs: number) => {
      const timeout = setTimeout(() => {
        timeouts.delete(timeout);
        traceRecordingState(trigger);
      }, delayMs);
      timeouts.add(timeout);
    };

    // traces are stored with the call stats: healthy samples stay minimal and
    // identical consecutive healthy samples are not traced again
    let lastHealthyKey: string | undefined;

    const traceRecordingState = (trigger: string) => {
      if (call.state.callingState !== CallingState.JOINED) return;
      if (call.microphone.state.status !== 'enabled') return;

      let state;
      try {
        state = {
          isRecording: AudioDeviceModule.isRecording(),
          isPlaying: AudioDeviceModule.isPlaying(),
          isEngineRunning: AudioDeviceModule.isEngineRunning(),
          isMicrophoneMuted: AudioDeviceModule.isMicrophoneMuted(),
        };
      } catch (error: unknown) {
        logger.warn('failed to read the ADM recording state', error);
        return;
      }

      const healthy =
        state.isRecording && state.isEngineRunning && !state.isMicrophoneMuted;
      if (healthy) {
        const key = JSON.stringify(state);
        if (key === lastHealthyKey) return;
        lastHealthyKey = key;
        call.tracer.trace('ios.audioRecording.state', { trigger, ...state });
        return;
      }

      lastHealthyKey = undefined;
      let details;
      try {
        details = {
          muteMode: AudioDeviceModule.getMuteMode(),
          alwaysPrepared: AudioDeviceModule.isRecordingAlwaysPreparedMode(),
          session: callManager.ios.getAudioSessionState(),
        };
      } catch (error: unknown) {
        logger.warn('failed to read the audio session state', error);
      }
      const unhealthyState = { trigger, ...state, ...details };
      call.tracer.trace('ios.audioRecording.state', unhealthyState);
      logger.warn(
        'mic is enabled but the ADM is not capturing',
        unhealthyState,
      );
      if (trigger !== 'recheck') {
        // tells a transient bring-up apart from an engine that never starts
        scheduleCheck('recheck', RECHECK_DELAY_MS);
      }
    };

    const joinedSubscription = call.state.callingState$
      .pipe(
        filter((callingState) => callingState === CallingState.JOINED),
        take(1),
      )
      // delayed so the normal engine bring-up can complete on its own
      .subscribe(() => scheduleCheck('joined', 3000));

    const removeDiagnosticListener =
      callManager.ios.addAudioSessionDiagnosticListener(
        (event: IOSAudioSessionDiagnosticEvent) => {
          call.tracer.trace(`ios.audioSession.${event.event}`, event);
          if (event.event !== 'engineEnableApplied') {
            logger.warn(`ios.audioSession.${event.event}`, event);
          }
        },
      );

    // delayed so WebRTC's engine restart can run first
    const onInterruption = (event: IOSAudioInterruptionEvent) => {
      if (event.phase === 'ended') scheduleCheck('interruptionEnded', 1000);
    };
    const removeInterruptionListener =
      callManager.ios.addAudioInterruptionListener(onInterruption);

    const callingx = getCallingxLibIfAvailable();
    const subscriptions = callingx?.isSetup
      ? [
          callingx.addEventListener(
            'didActivateAudioSession',
            // delayed so the activation-driven engine start can run first
            () => scheduleCheck('audioSessionActivated', 1000),
          ),
          (
            callingx as unknown as CallingxAudioInterruptionEvents
          ).addEventListener('didAudioInterruption', onInterruption),
        ]
      : [];

    return () => {
      joinedSubscription.unsubscribe();
      removeDiagnosticListener();
      removeInterruptionListener();
      subscriptions.forEach((s) => s.remove());
      timeouts.forEach(clearTimeout);
      timeouts.clear();
    };
  }, [call]);

  return null;
};
