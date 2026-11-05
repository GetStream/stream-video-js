import type { Tracer } from './tracer';

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
