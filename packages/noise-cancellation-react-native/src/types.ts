export interface INoiseCancellation {
  isSupported: () => boolean | Promise<boolean>;
  init: () => Promise<void>;
  enable: () => void;
  disable: () => void;
  dispose: () => Promise<void>;
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
 * A list of events one can subscribe to.
 */
export type Events = {
  /**
   * Fires when Noise Cancellation state changes.
   *
   * @param enabled true when enabled, false otherwise.
   */
  change: (enabled: boolean) => void;
};
