import type { Tracer } from './tracer';

export type AudioContextRecoveryOptions = {
  audioContext: AudioContext;
  tracer?: Tracer;
};

const needsRecovery = (state: AudioContextState): boolean => {
  return state === 'suspended' || state === 'interrupted';
};

/**
 * Watches an {@link AudioContext} and brings it back to `running` after the
 * platform moves it into `suspended` or `interrupted` (e.g., iOS phone call,
 * Siri, screen lock, tab hidden on WebKit).
 */
export class AudioContextRecovery {
  private readonly audioContext: AudioContext;
  private readonly tracer?: Tracer;
  private readonly intervalMs = 750;

  private readonly controller = new AbortController();
  private intervalId?: ReturnType<typeof setInterval>;
  private disposed = false;

  constructor({ audioContext, tracer }: AudioContextRecoveryOptions) {
    this.audioContext = audioContext;
    this.tracer = tracer;

    this.audioContext.addEventListener('statechange', this.onStateChange, {
      signal: this.controller.signal,
    });

    const { state } = this.audioContext;
    this.tracer?.trace('noiseCancellation.audioContextState', state);
    if (needsRecovery(state)) {
      this.arm();
    }
  }

  dispose = () => {
    if (this.disposed) return;
    this.disposed = true;
    this.disarm();
    this.controller.abort();
  };

  private onStateChange = () => {
    if (this.disposed) return;
    const { state } = this.audioContext;
    this.tracer?.trace('noiseCancellation.audioContextState', state);

    if (state === 'closed') {
      this.dispose();
    } else if (state === 'running') {
      this.disarm();
    } else if (needsRecovery(state)) {
      this.arm();
    }
  };

  private arm = () => {
    if (this.intervalId !== undefined || this.disposed) return;
    this.tick();
    this.intervalId = setInterval(this.tick, this.intervalMs);
  };

  private disarm = () => {
    if (this.intervalId === undefined) return;
    clearInterval(this.intervalId);
    this.intervalId = undefined;
  };

  private tick = () => {
    if (this.disposed || !needsRecovery(this.audioContext.state)) return;
    this.audioContext.resume().catch((err) => {
      if (this.disposed) return;
      this.tracer?.trace(`noiseCancellation.audioContext.error`, err?.message);
    });
  };
}
