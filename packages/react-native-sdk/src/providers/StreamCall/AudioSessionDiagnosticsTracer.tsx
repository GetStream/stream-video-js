import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { CallingState, videoLoggerSystem } from '@stream-io/video-client';
import {
  AudioDeviceModule,
  type AudioEngineStateSnapshot,
  type RecoverEngineResult,
} from '@stream-io/react-native-webrtc';
import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
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

/** Recovery attempts per failure episode (reset by a healthy sample). */
const MAX_EPISODE_ATTEMPTS = 3;
/** Recovery attempts per call. */
const MAX_CALL_ATTEMPTS = 6;
/** Minimum time between two recovery attempts. */
const ATTEMPT_INTERVAL_MS = 3000;
/** Engine error lines attached to a failed recovery trace. */
const MAX_TRACED_ERRORS = 10;
const MAX_ERROR_MESSAGE_LENGTH = 200;

const isEngineHealthy = (
  state: AudioEngineStateSnapshot,
  wantsRecording: boolean,
) =>
  wantsRecording
    ? state.isRecording && state.isEngineRunning && !state.isMicrophoneMuted
    : !state.isPlaying || state.isEngineRunning;

const isMicPermissionGranted = async () => {
  const permissions = globalThis.streamRNVideoSDK?.permissions;
  // without the SDK globals, the native recovery checks the permission itself
  if (!permissions) return true;
  return permissions.check('microphone');
};

/**
 * Traces the iOS audio session diagnostics and the ADM engine state while a
 * StreamCall provider is mounted, and restarts a dead audio engine.
 *
 * WebRTC's iOS ADM can keep a failed engine start as "running", which leaves
 * the mic (or the playout) dead for the rest of the call. On every trigger
 * (join, mic enabled, CallKit activation, interruption end, app foreground,
 * route change, reconnect) the engine state is sampled; an unhealthy engine
 * is restarted with `AudioDeviceModule.recoverEngineIfNeeded`, at most
 * {@link MAX_EPISODE_ATTEMPTS} times per failure episode (re-checked
 * {@link ATTEMPT_INTERVAL_MS} after each failed attempt) and
 * {@link MAX_CALL_ATTEMPTS} times per call. Healthy samples are traced too
 * (minimal payload) so the failure rate is measurable.
 */
export const AudioSessionDiagnosticsTracer = () => {
  const call = useCall();
  const { useCallCallingState, useMicrophoneState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const { status: micStatus } = useMicrophoneState({
    optimisticUpdates: false,
  });
  const scheduleCheckRef = useRef<
    ((trigger: string, delayMs: number) => void) | undefined
  >(undefined);
  const initialCheckScheduledRef = useRef(false);
  const prevCallingStateRef = useRef(callingState);
  const prevMicStatusRef = useRef(micStatus);

  useEffect(() => {
    if (Platform.OS !== 'ios' || !call) {
      return;
    }

    const logger = videoLoggerSystem.getLogger('AudioSessionDiagnostics');
    // one pending check per trigger name
    const pendingChecks = new Map<string, ReturnType<typeof setTimeout>>();
    let disposed = false;

    const scheduleCheck = (trigger: string, delayMs: number) => {
      if (disposed || pendingChecks.has(trigger)) return;
      const timeout = setTimeout(() => {
        pendingChecks.delete(trigger);
        runCheck(trigger);
      }, delayMs);
      pendingChecks.set(trigger, timeout);
    };

    // traces are stored with the call stats: healthy samples stay minimal and
    // identical consecutive healthy samples are not traced again
    let lastHealthyKey: string | undefined;
    let episodeAttempts = 0;
    let callAttempts = 0;
    let lastAttemptAt: number | undefined;
    // the native recovery blocks (up to ~2 s): one check at a time
    let inFlight: Promise<void> | undefined;

    const runCheck = (trigger: string) => {
      if (inFlight) {
        logger.debug(`check '${trigger}' skipped, another check is running`);
        return;
      }
      inFlight = checkEngine(trigger)
        .catch((error: unknown) => {
          logger.warn('audio engine check failed', error);
        })
        .finally(() => {
          inFlight = undefined;
        });
    };

    const checkEngine = async (trigger: string) => {
      if (call.state.callingState !== CallingState.JOINED) return;
      const wantsRecording = call.microphone.state.status === 'enabled';

      const state = await AudioDeviceModule.getEngineState();
      if (!state || disposed) return;

      const { isRecording, isPlaying, isEngineRunning, isMicrophoneMuted } =
        state;
      const minimalState = {
        wantsRecording,
        isRecording,
        isPlaying,
        isEngineRunning,
        isMicrophoneMuted,
      };
      if (isEngineHealthy(state, wantsRecording)) {
        episodeAttempts = 0;
        const key = JSON.stringify(minimalState);
        if (key === lastHealthyKey) return;
        lastHealthyKey = key;
        call.tracer.trace('ios.audioRecording.state', {
          trigger,
          ...minimalState,
        });
        return;
      }

      lastHealthyKey = undefined;
      let session;
      try {
        session = callManager.ios.getAudioSessionState();
      } catch (error: unknown) {
        logger.warn('failed to read the audio session state', error);
      }
      const unhealthyState = { trigger, wantsRecording, ...state, session };
      call.tracer.trace('ios.audioRecording.state', unhealthyState);
      logger.warn('the audio engine is not running as needed', unhealthyState);

      await recoverEngine(trigger, wantsRecording);
    };

    const recoverEngine = async (trigger: string, wantsRecording: boolean) => {
      const attempt = episodeAttempts + 1;
      if (wantsRecording && !(await isMicPermissionGranted())) {
        // the native recovery can restart playout without reporting the
        // missing permission, so it is checked here
        call.tracer.trace('ios.audioEngine.recovery', {
          trigger,
          result: 'skipped',
          reason: 'noMicPermission',
          attempt,
        });
        return;
      }
      if (episodeAttempts >= MAX_EPISODE_ATTEMPTS) {
        logger.debug('recovery budget of the failure episode is exhausted');
        return;
      }
      if (callAttempts >= MAX_CALL_ATTEMPTS) {
        logger.debug('recovery budget of the call is exhausted');
        return;
      }
      const sinceLastAttempt =
        lastAttemptAt === undefined ? Infinity : Date.now() - lastAttemptAt;
      if (sinceLastAttempt < ATTEMPT_INTERVAL_MS) {
        scheduleCheck('recheck', ATTEMPT_INTERVAL_MS - sinceLastAttempt);
        return;
      }

      const startedAt = Date.now();
      const recovery =
        await AudioDeviceModule.recoverEngineIfNeeded(wantsRecording);
      if (disposed) return;
      traceRecovery(trigger, attempt, recovery);

      const { result } = recovery;
      if (result === 'skipped' || result === 'healthy') return;
      episodeAttempts = attempt;
      callAttempts += 1;
      lastAttemptAt = startedAt;
      if (result === 'recovered') {
        episodeAttempts = 0;
        return;
      }
      if (
        episodeAttempts < MAX_EPISODE_ATTEMPTS &&
        callAttempts < MAX_CALL_ATTEMPTS
      ) {
        scheduleCheck('recheck', ATTEMPT_INTERVAL_MS);
      } else {
        logger.warn('audio engine recovery failed, giving up', { result });
      }
    };

    const traceRecovery = (
      trigger: string,
      attempt: number,
      recovery: RecoverEngineResult,
    ) => {
      const { result, reason, before, after, codes, recentErrors } = recovery;
      const failed = result === 'failed' || result === 'outputOnly';
      call.tracer.trace('ios.audioEngine.recovery', {
        trigger,
        result,
        ...(reason && { reason }),
        attempt,
        ...(failed && {
          before,
          after,
          codes,
          recentErrors: recentErrors?.slice(-MAX_TRACED_ERRORS).map((e) => ({
            ...e,
            message: e.message.slice(0, MAX_ERROR_MESSAGE_LENGTH),
          })),
        }),
      });
      if (failed) logger.warn(`audio engine recovery: ${result}`, recovery);
    };

    scheduleCheckRef.current = scheduleCheck;
    initialCheckScheduledRef.current = false;

    const removeDiagnosticListener =
      callManager.ios.addAudioSessionDiagnosticListener(
        (event: IOSAudioSessionDiagnosticEvent) => {
          call.tracer.trace(`ios.audioSession.${event.event}`, event);
          // a skip is expected when callingx owns the session (CallKit activates it)
          const unexpectedSkip =
            event.event === 'engineEnableSkipped' &&
            event.callingxOwnsSession !== true;
          if (event.error || event.event.endsWith('Error') || unexpectedSkip) {
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

    const removeRouteListener = callManager.audioDevices.addChangeListener(() =>
      scheduleCheck('audioRouteChanged', 1000),
    );

    const appStateSubscription = AppState.addEventListener(
      'change',
      (appState) => {
        if (appState === 'active') scheduleCheck('appActive', 1000);
      },
    );

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
      disposed = true;
      scheduleCheckRef.current = undefined;
      removeDiagnosticListener();
      removeInterruptionListener();
      removeRouteListener();
      appStateSubscription.remove();
      subscriptions.forEach((s) => s.remove());
      pendingChecks.forEach(clearTimeout);
      pendingChecks.clear();
    };
  }, [call]);

  // first sample once the call is joined with the mic enabled, which may be
  // later than the join itself (e.g. joining muted); later on, every mic
  // enable and every return to JOINED after a reconnect is checked again.
  // All delayed so the normal engine bring-up can complete on its own.
  useEffect(() => {
    const prevCallingState = prevCallingStateRef.current;
    const prevMicStatus = prevMicStatusRef.current;
    prevCallingStateRef.current = callingState;
    prevMicStatusRef.current = micStatus;
    const scheduleCheck = scheduleCheckRef.current;
    if (!scheduleCheck || callingState !== CallingState.JOINED) return;

    if (!initialCheckScheduledRef.current) {
      if (micStatus !== 'enabled') return;
      initialCheckScheduledRef.current = true;
      scheduleCheck('joined', 3000);
      return;
    }
    if (
      prevCallingState === CallingState.RECONNECTING ||
      prevCallingState === CallingState.MIGRATING
    ) {
      scheduleCheck('reconnected', 3000);
    }
    if (micStatus === 'enabled' && prevMicStatus !== 'enabled') {
      scheduleCheck('micEnabled', 3000);
    }
  }, [call, callingState, micStatus]);

  return null;
};
