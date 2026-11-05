import type { Tracer } from './tracer';

/**
 * Options that can be applied after construction, usually from the call
 * settings. They only fill in what wasn't passed to the constructor.
 */
export type NoiseCancellationConfiguration = {
  /**
   * The engine to run, e.g. `krisp` or `stream`.
   * Only used by the {@link NoiseCancellation} router.
   */
  engine?: string;
  /**
   * Whether Safari and other WebKit browsers are reported as supported.
   */
  withSafariSupport?: boolean;
  /**
   * The full URL of the model file to load.
   * Ignored when a `basePath` was passed to the constructor.
   */
  modelPath?: string;
};

/**
 * An interface for the NoiseCancellation implementation.
 * Provided for easier unit testing.
 */
export interface INoiseCancellation {
  /**
   * The noise cancellation engine this implementation runs, e.g. `krisp`.
   */
  engine?: string;
  /**
   * Applies options from the call settings.
   * Call it before {@link isSupported} and {@link init}.
   */
  configure?: (configuration: NoiseCancellationConfiguration) => void;
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
    stop?: () => void;
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
