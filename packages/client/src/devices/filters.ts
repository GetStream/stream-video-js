export type MediaStreamFilter = (input: MediaStream) => MediaStreamFilterResult;
export type MediaStreamFilterCleanup = () => void;

export interface MediaStreamFilterResult {
  /**
   * Transformed media stream. If the filter is asynchronous, a promise which
   * resolves with a transformed media stream.
   */
  output: MediaStream | Promise<MediaStream>;

  /**
   * An optional cleanup callback. It is called when the filter is stopped, and
   * when it is unregistered.
   */
  stop?: MediaStreamFilterCleanup;
}

export interface MediaStreamFilterEntry {
  start: MediaStreamFilter;

  /**
   * When the filter is running, it holds a cleanup callback returned when the filter
   * was started.
   */
  stop: MediaStreamFilterCleanup | undefined;
}

export interface MediaStreamFilterRegistrationResult {
  /**
   * Promise that resolves when the filter is applied to the stream.
   */
  registered: Promise<void>;

  /**
   * Function that can be called to unregister the filter.
   */
  unregister: () => Promise<void>;
}
