import { AudioContextRecovery } from './AudioContextRecovery';
import { promiseWithResolvers } from './withResolvers';
import type { Tracer } from './tracer';

/**
 * Noise cancellation stalls once shortly after its first frames are processed
 * (seen in Safari about 1s after the first enable) and drops the backlog on
 * its own. Overflows reported within this window after the first enable are
 * ignored.
 */
export const WARM_UP_GRACE_MS = 3000;

/**
 * An interface for the NoiseCancellation implementation.
 * Provided for easier unit testing.
 */
export interface INoiseCancellation {
  isSupported: () => boolean | Promise<boolean>;
  init: (options?: { tracer?: Tracer }) => Promise<void>;
  isEnabled: () => Promise<boolean>;
  canAutoEnable?: () => Promise<boolean>;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
  dispose: () => Promise<void>;
  setSuppressionLevel: (level: number) => void;
  toFilter: () => (mediaStream: MediaStream) => {
    output: MediaStream;
  };
  on: <E extends keyof Events, T = Events[E]>(
    event: E,
    callback: T,
  ) => () => void;
  off: <E extends keyof Events, T = Events[E]>(event: E, callback: T) => void;
}

/**
 * The payload of the `overload` event.
 */
export type NoiseCancellationOverloadEvent = {
  /**
   * `true` when Noise Cancellation will be turned back on automatically
   * after `restoreInMs`, `false` when it stays off.
   */
  willRestore: boolean;
  /**
   * The number of overloads detected so far.
   */
  overflowCount: number;
  /**
   * The delay before Noise Cancellation is turned back on.
   * Set only when `willRestore` is `true`.
   */
  restoreInMs?: number;
};

/**
 * A list of events one can subscribe to.
 */
export type Events = {
  /**
   * Fires when Noise Cancellation state changes.
   *
   * @param enabled true when enabled, false otherwise.
   */
  change: (enabled: boolean) => void;

  /**
   * Fires when Noise Cancellation is turned off automatically because
   * the device can't keep up with the audio processing (CPU overload).
   * Fires after the corresponding `change` event.
   *
   * @param event the overload details.
   */
  overload: (event: NoiseCancellationOverloadEvent) => void;
};

/**
 * The shared plumbing of the Noise Cancellation providers: the init promise,
 * the audio context recovery, event listeners and the stream filter wiring.
 */
export abstract class BaseNoiseCancellation implements INoiseCancellation {
  protected tracer?: Tracer;
  protected audioContext?: AudioContext;

  protected readonly initializing: Promise<void>;
  protected readonly resolveInitialized!: () => void;
  protected readonly rejectInitialized!: (reason?: unknown) => void;

  private recovery?: AudioContextRecovery;
  private readonly listeners: Partial<Record<keyof Events, Array<any>>> = {};

  constructor() {
    const { promise, resolve, reject } = promiseWithResolvers<void>();
    this.initializing = promise;
    this.resolveInitialized = resolve;
    this.rejectInitialized = reject;
  }

  abstract isSupported: () => boolean | Promise<boolean>;
  abstract init: (options?: { tracer?: Tracer }) => Promise<void>;
  abstract isEnabled: () => Promise<boolean>;
  abstract enable: () => Promise<void>;
  abstract disable: () => Promise<void>;
  abstract dispose: () => Promise<void>;
  abstract setSuppressionLevel: (level: number) => void;

  /**
   * Connects the filter between the given source and destination nodes.
   */
  protected abstract connectFilter: (
    source: MediaStreamAudioSourceNode,
    destination: MediaStreamAudioDestinationNode,
  ) => void;

  /**
   * Starts recovering the given audio context when the browser suspends it.
   */
  protected startRecovery = (audioContext: AudioContext) => {
    this.recovery = new AudioContextRecovery({
      audioContext,
      tracer: this.tracer,
    });
  };

  /**
   * Stops the audio context recovery.
   */
  protected stopRecovery = () => {
    if (this.recovery) {
      this.recovery.dispose();
      this.recovery = undefined;
    }
  };

  /**
   * A utility method convenient for our Microphone filters API.
   */
  toFilter = () => (mediaStream: MediaStream) => {
    if (!this.audioContext) {
      throw new Error('NoiseCancellation is not initialized');
    }

    const [audioTrack] = mediaStream.getAudioTracks();
    if (!audioTrack) throw new Error('No audio track found in the stream');

    const source = this.audioContext.createMediaStreamSource(mediaStream);
    const destination = this.audioContext.createMediaStreamDestination();
    destination.channelCount = audioTrack.getSettings().channelCount ?? 1;

    this.connectFilter(source, destination);

    return { output: destination.stream };
  };

  /**
   * Registers the given callback to the event type;
   *
   * @param event the event to listen.
   * @param callback the callback to call.
   */
  on = <E extends keyof Events, T = Events[E]>(event: E, callback: T) => {
    (this.listeners[event] ??= [] as T[]).push(callback);
    return () => {
      this.off(event, callback);
    };
  };

  /**
   * Unregisters the given callback for the event type.
   *
   * @param event the event.
   * @param callback the callback to unregister.
   */
  off = <E extends keyof Events, T = Events[E]>(event: E, callback: T) => {
    const listeners = this.listeners[event] || [];
    this.listeners[event] = listeners.filter((cb) => cb !== callback);
  };

  /**
   * Dispatches a new event payload for the given event type.
   *
   * @param event the event.
   * @param payload the payload.
   */
  protected dispatch = <E extends keyof Events, P = Parameters<Events[E]>[0]>(
    event: E,
    payload: P,
  ) => {
    const listeners = this.listeners[event] || [];
    for (const listener of listeners) {
      listener(payload);
    }
  };
}
