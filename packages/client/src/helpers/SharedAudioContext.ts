import type { RTCStatsDataType, Tracer } from '../stats';

/**
 * A reference to the shared {@link AudioContext}. Call `release` once done
 * with it: the context closes after its last user releases it.
 */
export type AudioContextLease = {
  context: AudioContext;
  release: () => void;
};

type InterruptionListener = (
  interrupted: boolean,
  state: AudioContextState,
) => void;

const GESTURE_EVENTS = ['click', 'touchend', 'keydown'] as const;

/**
 * One {@link AudioContext} shared by the SDK's analysers, detectors, and the
 * silent audio element. A single context keeps a single state to follow
 * through autoplay unlocks and audio interruptions, instead of one per
 * feature. It is created on first use and closed once its last user
 * releases it.
 */
export class SharedAudioContext {
  private context: AudioContext | undefined;
  private users = 0;
  private interrupted = false;
  private interruptionReported = false;
  private wasRunning = false;
  private restartTimer: ReturnType<typeof setTimeout> | undefined;
  private listeners = new Set<InterruptionListener>();
  private tracers = new Set<Tracer>();
  private stuckCheckTimer: ReturnType<typeof setInterval> | undefined;
  private stopWatchingVisibility: (() => void) | undefined;
  private stopWatchingGestures: (() => void) | undefined;

  /**
   * Returns the shared context, creating it on first use.
   *
   * A context created outside a user gesture starts suspended. It is resumed
   * here and on the next user gesture while the page is visible, which
   * succeeds once the page may play audio; a hidden page leaves it alone so
   * it can't take the audio session from another app.
   *
   * @returns a lease on the context, or `undefined` when Web Audio is
   * unavailable.
   */
  acquire = (): AudioContextLease | undefined => {
    if (typeof AudioContext === 'undefined') return;
    if (!this.context || this.context.state === 'closed') {
      this.dispose();
      this.context = this.create();
      this.users = 0;
    }
    const context = this.context;
    this.users += 1;
    if (context.state === 'suspended') this.resumeIfVisible(context);

    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      if (context !== this.context) return;
      this.users -= 1;
      if (this.users > 0) return;
      this.dispose();
    };
    return { context, release };
  };

  /**
   * Whether playback should wait for an audio interruption to end (a phone
   * call, an alarm, Siri, another app taking the audio session), as observed
   * through the shared context. Only a context that was running can report
   * one. It is a playback gate, not the system state:
   * {@link clearInterruption} lifts it while the context may still be
   * interrupted.
   */
  isInterrupted = () => this.interrupted;

  /**
   * Whether the shared context exists and is running.
   */
  isRunning = () => this.context?.state === 'running';

  /**
   * Lifts the playback gate of {@link isInterrupted}, e.g. when the user
   * returns to the page and playback takes the audio session back. The end
   * of the interruption is still reported once the context runs again.
   */
  clearInterruption = () => {
    this.interrupted = false;
  };

  /**
   * Invokes `listener` when an audio interruption starts (`true`) and when
   * the system hands the audio session back (`false`), with the context
   * state.
   *
   * @returns a function that stops listening.
   */
  watchInterruptions = (listener: InterruptionListener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /**
   * Reports the context's lifecycle and state changes to `tracer`.
   *
   * @returns a function that stops reporting.
   */
  addTracer = (tracer: Tracer) => {
    this.tracers.add(tracer);
    return () => {
      this.tracers.delete(tracer);
    };
  };

  private trace = (tag: string, data: RTCStatsDataType) => {
    this.tracers.forEach((tracer) => tracer.trace(tag, data));
  };

  private setInterrupted = (value: boolean, state: AudioContextState) => {
    this.interrupted = value;
    if (value === this.interruptionReported) return;
    this.interruptionReported = value;
    this.listeners.forEach((listener) => listener(value, state));
  };

  private resumeIfVisible = (context: AudioContext) => {
    if (typeof document === 'undefined' || document.hidden) return;
    context.resume().catch(() => {});
  };

  /**
   * Closes the current context and drops everything tied to it.
   */
  private dispose = () => {
    if (this.stuckCheckTimer) clearInterval(this.stuckCheckTimer);
    this.stuckCheckTimer = undefined;
    this.endRestart();
    this.stopWatchingVisibility?.();
    this.stopWatchingVisibility = undefined;
    this.unwatchGestures();
    const context = this.context;
    this.context = undefined;
    this.interrupted = false;
    this.interruptionReported = false;
    if (!context) return;
    this.trace('audioContext.shared.close', null);
    if (context.state !== 'closed') context.close().catch(() => {});
  };

  /**
   * A suspended context resumes on the next user gesture: one created
   * outside a gesture (a meter in the lobby, a join without a tap) starts
   * suspended, and only a gesture lets it run.
   */
  private watchGestures = () => {
    if (this.stopWatchingGestures || typeof document === 'undefined') return;
    const onGesture = () => {
      const context = this.context;
      if (context?.state === 'suspended') this.resumeIfVisible(context);
    };
    const controller = new AbortController();
    const options = { capture: true, passive: true, signal: controller.signal };
    GESTURE_EVENTS.forEach((type) =>
      document.addEventListener(type, onGesture, options),
    );
    this.stopWatchingGestures = () => controller.abort();
  };

  private unwatchGestures = () => {
    this.stopWatchingGestures?.();
    this.stopWatchingGestures = undefined;
  };

  /**
   * Traces a running context whose clock stopped advancing: its audio
   * processing has stalled while it still reports running. On iOS this
   * follows a resume whose rendering never started, so a visible page
   * restarts it once, the way a silent media element is paused and played.
   */
  private watchClock = (context: AudioContext) => {
    const isVisible = () => typeof document !== 'undefined' && !document.hidden;
    let lastTime = context.currentTime;
    let stuck = false;
    let restarted = false;
    let wasRunning = context.state === 'running';
    let wasVisible = isVisible();
    this.stuckCheckTimer = setInterval(() => {
      const { currentTime } = context;
      const running = context.state === 'running';
      const judge = running && wasRunning;
      wasRunning = running;
      const visible = isVisible();
      const canRestart = visible && wasVisible;
      wasVisible = visible;
      if (!judge) {
        lastTime = currentTime;
        return;
      }
      const frozen = currentTime === lastTime;
      lastTime = currentTime;
      if (frozen && !stuck) {
        stuck = true;
        this.trace('audioContext.shared.stuck', {
          currentTime,
          users: this.users,
        });
      } else if (!frozen && stuck) {
        stuck = false;
        restarted = false;
        this.trace('audioContext.shared.unstuck', { currentTime });
      }
      if (stuck && !restarted && canRestart) {
        restarted = true;
        void this.restart(context);
      }
    }, 5000);
  };

  /**
   * Suspends and resumes `context` to restart its rendering. The state
   * changes it causes are not an interruption, so listeners aren't told; an
   * interruption that starts meanwhile ends the restart and is reported.
   */
  private restart = async (context: AudioContext) => {
    this.restartTimer = setTimeout(this.onRestartTimeout, 2000);
    this.trace('audioContext.shared.restart', null);
    try {
      await context.suspend();
      if (document.hidden || !this.restartTimer) return this.endRestart();
      context.resume().catch(() => {});
    } catch {
      this.endRestart();
    }
  };

  private endRestart = () => {
    if (this.restartTimer) clearTimeout(this.restartTimer);
    this.restartTimer = undefined;
  };

  /**
   * A resume that never settled leaves the context suspended: it resumes on
   * the next user gesture, like a context created outside one.
   */
  private onRestartTimeout = () => {
    this.endRestart();
    const context = this.context;
    if (context?.state !== 'suspended') return;
    this.watchGestures();
    this.resumeIfVisible(context);
  };

  private create = () => {
    const context = new AudioContext();
    this.wasRunning = context.state === 'running';
    this.trace('audioContext.shared.create', context.state);
    if (context.state === 'suspended') this.watchGestures();
    this.watchClock(context);
    context.addEventListener('statechange', () => {
      if (context !== this.context) return;
      const { state } = context;
      this.trace('audioContext.shared.state', { state, users: this.users });
      if (this.restartTimer) {
        if (state === 'suspended') return;
        this.endRestart();
        if (state === 'running') return;
      }
      if (state === 'running') {
        this.wasRunning = true;
        this.unwatchGestures();
        this.setInterrupted(false, state);
        return;
      }
      if (state === 'suspended') this.watchGestures();
      if (state !== 'interrupted' && state !== 'suspended') return;
      if (!this.wasRunning) return;
      this.setInterrupted(true, state);
      if (state === 'suspended') this.resumeIfVisible(context);
    });
    if (typeof document !== 'undefined') {
      const controller = new AbortController();
      document.addEventListener(
        'visibilitychange',
        () => {
          if (this.wasRunning && context.state === 'suspended') {
            this.resumeIfVisible(context);
          }
        },
        { signal: controller.signal },
      );
      this.stopWatchingVisibility = () => controller.abort();
    }
    return context;
  };
}

/**
 * The page-wide shared audio context used by the SDK.
 */
export const sharedAudioContext = new SharedAudioContext();
