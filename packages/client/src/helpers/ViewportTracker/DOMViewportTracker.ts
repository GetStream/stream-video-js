import type {
  TrackType,
  VideoDimension,
} from '../../gen/video/sfu/models/models';
import type {
  TrackedObject,
  ViewportTracker,
  ViewportTrackerCallback,
} from './types';

/**
 * Default options.
 */
const defaultIntersectionObserverOptions: IntersectionObserverInit = {
  threshold: 0.25, // 25% of the element must be visible
};

/**
 * A helper class for tracking elements within predefined viewports.
 * It's primary use within this SDK is to track participant's video elements and
 * notify when they enter or leave the viewport.
 */
export class DOMViewportTracker implements ViewportTracker<HTMLElement> {
  private trackedObjects = new Map<string, TrackedObject<HTMLElement>[]>();
  private intersectionObserver: IntersectionObserver;
  private viewport?: HTMLElement;

  /**
   * Constructs new instance of the {@link DOMViewportTracker}.
   *
   * @param onObjectViewportVisibleStateChange the callback to invoke whenever
   * a tracked object's visibility state (within the viewport) changes.
   */
  constructor(
    private onObjectViewportVisibleStateChange: ViewportTrackerCallback<HTMLElement>,
  ) {
    this.intersectionObserver = new IntersectionObserver(
      this.onIntersect,
      defaultIntersectionObserverOptions,
    );
  }

  /**
   * Sets the viewport element to track objects within.
   *
   * @param viewport the viewport element.
   * @param options optional intersection observer options.
   */
  setViewport = (
    viewport?: HTMLElement,
    options?: Omit<IntersectionObserverInit, 'root'>,
  ) => {
    if (this.viewport === viewport) return;
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }

    this.viewport = viewport;
    if (!this.viewport) return;

    this.intersectionObserver = new IntersectionObserver(this.onIntersect, {
      ...defaultIntersectionObserverOptions,
      ...options,
      root: this.viewport,
    });

    this.trackedObjects.forEach((trackedObjects) => {
      trackedObjects.forEach((trackedObject) => {
        this.intersectionObserver.observe(trackedObject.element);
      });
    });
  };

  /**
   * Enables viewport tracking for the provided element.
   *
   * @param sessionId the session id.
   * @param trackType the track type represented by the element.
   * @param element the element to track.
   */
  addObject = (
    sessionId: string,
    trackType: TrackType,
    element: HTMLElement,
  ) => {
    element.dataset.sessionId = sessionId;

    const trackedObject = { sessionId, element, trackType };
    const trackedObjects = this.trackedObjects.get(sessionId) || [];
    this.trackedObjects.set(sessionId, [...trackedObjects, trackedObject]);
    this.intersectionObserver.observe(element);
  };

  /**
   * Disables viewport tracking for the provided element.
   *
   * @param sessionId the session id.
   * @param trackType the track type represented by the element.
   * @param element the element to stop tracking.
   */
  removeObject = (
    sessionId: string,
    trackType: TrackType,
    element: HTMLElement,
  ) => {
    const trackedObjects = this.trackedObjects.get(sessionId);
    if (!trackedObjects || trackedObjects.length === 0) return;

    this.intersectionObserver.unobserve(element);
    delete element.dataset['sessionId'];
    this.trackedObjects.set(
      sessionId,
      trackedObjects.filter(
        (obj) =>
          obj.sessionId !== sessionId &&
          obj.element !== element &&
          obj.trackType !== trackType,
      ),
    );
  };

  /**
   * Handles intersection observer events.
   * @param entries the changed entries.
   */
  private onIntersect = (entries: IntersectionObserverEntry[]) => {
    entries.forEach((entry) => {
      const element = entry.target as HTMLElement;
      const trackedObject = this.findObjectForElement(element);
      if (trackedObject) {
        let dimension: VideoDimension | undefined;
        if (entry.isIntersecting) {
          dimension = {
            width: element.clientWidth,
            height: element.clientHeight,
          };
        }
        this.onObjectViewportVisibleStateChange(
          trackedObject,
          entry.isIntersecting,
          dimension,
        );
      }
    });
  };

  /**
   * Utility method which finds the tracked object metadata for the provided element.
   * @param element the element.
   */
  private findObjectForElement = (element: HTMLElement) => {
    const sessionId = this.getSessionIdForElement(element);
    if (!sessionId) {
      console.log(`Failed to find sessionId for element`, element);
      return;
    }
    const trackedObjects = this.trackedObjects.get(sessionId);
    if (!trackedObjects || trackedObjects.length === 0) {
      console.log(`There are no trackedObjects for sessionId`, sessionId);
      return;
    }

    const trackedObject = trackedObjects.find((obj) => obj.element === element);
    if (!trackedObject) {
      console.log(`Failed to find trackedObject`, element, sessionId);
    }

    return trackedObject;
  };

  /**
   * Utility method which finds the session id for the provided element.
   * @param element the element.
   */
  private getSessionIdForElement = (element: HTMLElement) => {
    let sessionId = element.dataset.sessionId;
    if (!sessionId) {
      // fallback to find the sessionId from the element
      for (const [key, values] of this.trackedObjects) {
        if (values.find((obj) => obj.element === element)) {
          sessionId = key;
          break;
        }
      }
    }
    return sessionId;
  };
}
