import type { ViewportTrackerCtor } from './helpers/ViewportTracker';

/**
 * Optional options used for join call flow.
 */
export type JoinCallOptions<ElementType> = {
  /**
   * An optional Constructor function which implements the {@link ViewportTracker} interface.
   * If not provided, the default {@link DOMViewportTracker} will be used.
   *
   * Typical use-case is to provide a custom implementation of the {@link ViewportTracker}
   * interface in non-browser environments like React Native.
   */
  viewportTracker?: ViewportTrackerCtor<ElementType>;
};
