export interface INoiseCancellation {
  isSupported: () => boolean | Promise<boolean>;
  init: () => Promise<void>;
  canAutoEnable?: () => Promise<boolean>;
  isEnabled: () => Promise<boolean>;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
  dispose: () => Promise<void>;
  resume: () => void;
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
   * Kept for parity with `@stream-io/audio-filters-web`.
   * Never fires on React Native.
   */
  overload: (event: NoiseCancellationOverloadEvent) => void;
};
