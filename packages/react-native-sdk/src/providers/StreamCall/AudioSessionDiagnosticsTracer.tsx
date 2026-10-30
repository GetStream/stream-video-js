import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { CallingState, videoLoggerSystem } from '@stream-io/video-client';
import {
  AudioDeviceModule,
  audioDeviceModuleEvents,
  type AudioEngineStateSnapshot,
  type EngineErrorEventData,
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

/**
 * Recovery attempts per failure episode. An episode ends with a healthy
 * sample, a recovery, or the end of the episode's rejoin decision.
 */
const MAX_EPISODE_ATTEMPTS = 3;
/** Recovery attempts per call. */
const MAX_CALL_ATTEMPTS = 6;
/** AVAudioSession '!int': another app owns the audio, activation refused. */
const CANNOT_INTERRUPT_OTHERS_CODE = '561017449';
/** Minimum time between two recovery attempts. */
const ATTEMPT_INTERVAL_MS = 3000;
/** Engine error lines attached to a failed recovery trace. */
const MAX_TRACED_ERRORS = 10;
const MAX_ERROR_MESSAGE_LENGTH = 200;
/** Time after the first JOINED to wait for an active audio session. */
const SESSION_TIMEOUT_MS = 10000;
const SESSION_TIMEOUT_TRIGGER = 'sessionTimeout';

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
 * route change, reconnect) the engine state is sampled, except during an
 * audio interruption. An unhealthy engine with an inactive audio session gets
 * one SDK re-activation (`reactivateAudioSession`); when iOS refuses it
 * (another app owns the audio) the tracer waits for the next interruption
 * end, session activation or app foreground, keeping its budget. Otherwise
 * an unhealthy engine
 * is restarted with `AudioDeviceModule.recoverEngineIfNeeded`, at most
 * {@link MAX_EPISODE_ATTEMPTS} times per failure episode (re-checked
 * {@link ATTEMPT_INTERVAL_MS} after each failed attempt) and
 * {@link MAX_CALL_ATTEMPTS} times per call. When a whole episode fails, the
 * call is rejoined once (last resort, mic wanted and app in the foreground;
 * skipped when the rejoin would make the call leave). Either way the episode
 * ends there: the next trigger starts a new one (nothing is rescheduled).
 * Healthy samples are traced too (minimal payload) so the failure rate is
 * measurable.
 *
 * It also traces the ADM engine errors (the actual failure reasons), and an
 * `audio.session.timeout` when the SDK-owned audio session is still inactive
 * {@link SESSION_TIMEOUT_MS} after joining.
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
  const sessionTimeoutScheduledRef = useRef(false);
  // set once the call leaves JOINED, until the next JOINED
  const leftJoinedRef = useRef(false);
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
        if (trigger === SESSION_TIMEOUT_TRIGGER) {
          checkSessionActive().catch((error: unknown) => {
            logger.warn('audio session timeout check failed', error);
          });
          return;
        }
        runCheck(trigger);
      }, delayMs);
      pendingChecks.set(trigger, timeout);
    };

    // traces are stored with the call stats: healthy samples stay minimal and
    // identical consecutive healthy/unhealthy samples are not traced again
    let lastHealthyKey: string | undefined;
    let lastUnhealthyKey: string | undefined;
    let episodeAttempts = 0;
    let callAttempts = 0;
    let lastAttemptAt: number | undefined;
    // the native recovery blocks (up to ~2 s): one check at a time, a trigger
    // arriving meanwhile is kept (the latest one) and checked once afterwards
    let inFlight: Promise<void> | undefined;
    let pendingTrigger: string | undefined;
    // iOS owns the audio during an interruption (phone call, Siri, alarm) and
    // while it refuses to re-activate the session afterwards: no checks until
    // the interruption ends, the session is re-activated or the app is active
    // again (WebRTC treats the latter as an interruption end too)
    let interrupted = false;

    const runCheck = (trigger: string) => {
      if (inFlight) {
        logger.debug(`check '${trigger}' queued, another check is running`);
        pendingTrigger = trigger;
        return;
      }
      inFlight = checkEngine(trigger)
        .catch((error: unknown) => {
          logger.warn('audio engine check failed', error);
        })
        .finally(() => {
          inFlight = undefined;
          const pending = pendingTrigger;
          pendingTrigger = undefined;
          if (pending && !disposed) runCheck(pending);
        });
    };

    const checkEngine = async (trigger: string) => {
      if (call.state.callingState !== CallingState.JOINED) return;
      if (interrupted) {
        logger.debug(
          `check '${trigger}' skipped, the audio is interrupted or the session is inactive`,
        );
        return;
      }
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
        lastUnhealthyKey = undefined;
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
      const unhealthyKey = JSON.stringify(minimalState);
      const changed = unhealthyKey !== lastUnhealthyKey;
      lastUnhealthyKey = unhealthyKey;
      if (changed) {
        let session;
        try {
          session = callManager.ios.getAudioSessionState();
        } catch (error: unknown) {
          logger.warn('failed to read the audio session state', error);
        }
        const unhealthyState = { trigger, wantsRecording, ...state, session };
        call.tracer.trace('ios.audioRecording.state', unhealthyState);
        logger.warn(
          'the audio engine is not running as needed',
          unhealthyState,
        );
      }

      if (state.sessionActive === false) {
        // the ADM cannot restart its engine against an inactive session (no
        // hardware format) and a rejoin would build a half-initialised ADM:
        // re-activate it (WebRTC's own re-activation on interruption end runs
        // once), and wait for the next signal when iOS refuses
        const reason = await reactivateSession();
        if (disposed) return;
        if (reason) {
          if (changed) {
            call.tracer.trace('ios.audioEngine.recovery', {
              trigger,
              result: 'skipped',
              reason,
              attempt: episodeAttempts + 1,
            });
          }
          logger.debug(`recovery '${trigger}' postponed, ${reason}`);
          interrupted = true;
          return;
        }
      }

      await recoverEngine(trigger, wantsRecording, changed);
    };

    /** `undefined` when the session is active afterwards, else the skip reason. */
    const reactivateSession = async () => {
      try {
        const active = await callManager.ios.reactivateAudioSession();
        return active ? undefined : 'sessionInactive';
      } catch (error: unknown) {
        const code = String((error as { code?: unknown })?.code ?? '');
        if (code === CANNOT_INTERRUPT_OTHERS_CODE) return 'sessionRefused';
        logger.warn('failed to re-activate the audio session', error);
        return 'sessionInactive';
      }
    };

    const recoverEngine = async (
      trigger: string,
      wantsRecording: boolean,
      stateChanged: boolean,
    ) => {
      const attempt = episodeAttempts + 1;
      if (wantsRecording && !(await isMicPermissionGranted())) {
        // the native recovery can restart playout without reporting the
        // missing permission, so it is checked here
        if (stateChanged) {
          call.tracer.trace('ios.audioEngine.recovery', {
            trigger,
            result: 'skipped',
            reason: 'noMicPermission',
            attempt,
          });
        }
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

      // the sample is stale after the awaits: a recovery with the old mic
      // intent would unmute a muted ADM (the mic toggle checks on its own)
      if (
        interrupted ||
        call.state.callingState !== CallingState.JOINED ||
        (call.microphone.state.status === 'enabled') !== wantsRecording
      ) {
        logger.debug(`recovery '${trigger}' skipped, the state changed`);
        return;
      }

      const recovery =
        await AudioDeviceModule.recoverEngineIfNeeded(wantsRecording);
      if (disposed) return;
      traceRecovery(trigger, attempt, recovery);

      const { result } = recovery;
      if (result === 'skipped' || result === 'healthy') return;
      episodeAttempts = attempt;
      callAttempts += 1;
      // measured from the end: the native recovery blocks up to ~2 s
      lastAttemptAt = Date.now();
      if (result === 'recovered') {
        episodeAttempts = 0;
        return;
      }
      if (
        episodeAttempts < MAX_EPISODE_ATTEMPTS &&
        callAttempts < MAX_CALL_ATTEMPTS
      ) {
        scheduleCheck('recheck', ATTEMPT_INTERVAL_MS);
      } else if (episodeAttempts >= MAX_EPISODE_ATTEMPTS) {
        rejoinIfAllowed(result);
      } else {
        logger.warn('audio engine recovery failed, giving up', { result });
      }
    };

    // last resort, once per call: a rejoin rebuilds the media stack. The
    // back-to-JOINED check samples the engine once more afterwards.
    let rejoined = false;
    const rejoinIfAllowed = (lastResult: string) => {
      // the episode ends here, rejoined or not: the next trigger starts a new
      // one (still bounded by the call budget and the attempt spacing)
      episodeAttempts = 0;
      const canRejoin =
        !rejoined &&
        !interrupted &&
        call.state.callingState === CallingState.JOINED &&
        AppState.currentState === 'active' &&
        call.microphone.state.status === 'enabled';
      if (!canRejoin) {
        logger.warn('audio engine recovery failed, giving up', {
          result: lastResult,
        });
        return;
      }
      // skipped (not started) when a rejoin would make the call leave, e.g.
      // the rejoin rate limiter has no room: give up for this episode only
      const started = call.rejoinForAudioEngineRecovery();
      call.tracer.trace('ios.audioEngine.rejoin', {
        trigger: 'budgetExhausted',
        lastResult,
        started,
      });
      if (!started) {
        logger.warn('audio engine recovery failed, rejoin skipped', {
          result: lastResult,
        });
        return;
      }
      rejoined = true;
      logger.warn('audio engine recovery failed, rejoining the call', {
        result: lastResult,
      });
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

    // same name as the stream-video-swift trace; trace only, a rejoin would
    // not activate a session that iOS refuses to activate
    const checkSessionActive = async () => {
      if (call.state.callingState !== CallingState.JOINED) return;
      // CallKit activates a callingx-owned session, possibly much later
      try {
        if (callManager.ios.getAudioSessionState().callingxOwnsSession) return;
      } catch (error: unknown) {
        logger.warn('failed to read the audio session state', error);
      }
      const state = await AudioDeviceModule.getEngineState();
      if (disposed || state?.sessionActive !== false) return;
      call.tracer.trace('audio.session.timeout', {
        category: state.sessionCategory,
      });
      logger.warn('the audio session is not active after joining', state);
    };

    scheduleCheckRef.current = scheduleCheck;
    initialCheckScheduledRef.current = false;
    sessionTimeoutScheduledRef.current = false;
    leftJoinedRef.current = false;

    // the ADM's own error lines: the actual reasons of a failed engine start
    const engineErrorSubscription =
      audioDeviceModuleEvents.addEngineErrorListener(
        ({ message, severity, repeat, dropped }: EngineErrorEventData) => {
          call.tracer.trace('ios.audioEngine.error', {
            message: message.slice(0, MAX_ERROR_MESSAGE_LENGTH),
            severity,
            ...(repeat !== undefined && { repeat }),
            ...(dropped !== undefined && { dropped }),
          });
        },
      );

    const removeDiagnosticListener =
      callManager.ios.addAudioSessionDiagnosticListener(
        (event: IOSAudioSessionDiagnosticEvent) => {
          call.tracer.trace(`ios.audioSession.${event.event}`, event);
          if (event.error || event.event.endsWith('Error')) {
            logger.warn(`ios.audioSession.${event.event}`, event);
          }
        },
      );

    // delayed so WebRTC's engine restart can run first
    const onInterruption = (event: IOSAudioInterruptionEvent) => {
      if (event.phase === 'began') {
        interrupted = true;
      } else if (event.phase === 'ended') {
        interrupted = false;
        scheduleCheck('interruptionEnded', 1000);
      }
    };
    const removeInterruptionListener =
      callManager.ios.addAudioInterruptionListener(onInterruption);

    const removeRouteListener = callManager.audioDevices.addChangeListener(() =>
      scheduleCheck('audioRouteChanged', 1000),
    );

    const appStateSubscription = AppState.addEventListener(
      'change',
      (appState) => {
        if (appState !== 'active') return;
        interrupted = false;
        scheduleCheck('appActive', 1000);
      },
    );

    const callingx = getCallingxLibIfAvailable();
    const subscriptions = callingx?.isSetup
      ? [
          callingx.addEventListener(
            'didActivateAudioSession',
            // delayed so the activation-driven engine start can run first
            () => {
              interrupted = false;
              scheduleCheck('audioSessionActivated', 1000);
            },
          ),
          callingx.addEventListener('didAudioInterruption', onInterruption),
        ]
      : [];

    return () => {
      disposed = true;
      scheduleCheckRef.current = undefined;
      engineErrorSubscription.remove();
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
    const prevMicStatus = prevMicStatusRef.current;
    prevMicStatusRef.current = micStatus;
    // a reconnect goes RECONNECTING|MIGRATING -> JOINING -> JOINED, and the
    // first two can land in one render: any state other than JOINED counts
    if (callingState !== CallingState.JOINED) {
      leftJoinedRef.current = true;
      return;
    }
    const scheduleCheck = scheduleCheckRef.current;
    if (!scheduleCheck) return;
    const reconnected = leftJoinedRef.current;
    leftJoinedRef.current = false;

    if (!sessionTimeoutScheduledRef.current) {
      sessionTimeoutScheduledRef.current = true;
      scheduleCheck(SESSION_TIMEOUT_TRIGGER, SESSION_TIMEOUT_MS);
    }

    if (!initialCheckScheduledRef.current) {
      if (micStatus !== 'enabled') return;
      initialCheckScheduledRef.current = true;
      scheduleCheck('joined', 3000);
      return;
    }
    if (reconnected) scheduleCheck('reconnected', 3000);
    if (micStatus === 'enabled' && prevMicStatus !== 'enabled') {
      scheduleCheck('micEnabled', 3000);
    }
  }, [call, callingState, micStatus]);

  return null;
};
