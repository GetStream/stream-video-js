import type { CallState } from '../store';
import { VideoTrackType, VisibilityState } from '../types';

const DEFAULT_THRESHOLD = 0.35;

const DEFAULT_VIEWPORT_VISIBILITY_STATE: Record<
  VideoTrackType,
  VisibilityState
> = {
  videoTrack: VisibilityState.UNKNOWN,
  screenShareTrack: VisibilityState.UNKNOWN,
} as const;

export type EntryHandler = (entry: IntersectionObserverEntry) => void;

export type Unobserve = () => void;

export type Observe = (
  element: HTMLElement,
  entryHandler: EntryHandler,
) => Unobserve;

export class ViewportTracker {
  private callState: CallState;

  private elementHandlerMap: Map<
    HTMLElement,
    (entry: IntersectionObserverEntry) => void
  > = new Map();

  private observer: IntersectionObserver | null = null;

  // in React children render before viewport is set, add
  // them to the queue and observe them once the observer is ready
  private queueSet: Set<readonly [HTMLElement, EntryHandler]> = new Set();

  constructor(callState: CallState) {
    this.callState = callState;
  }

  /**
   * Method to set scrollable viewport as root for the IntersectionObserver, returns
   * cleanup function to be invoked upon disposing of the DOM element to prevent memory leaks
   */
  setViewport = (
    viewportElement: HTMLElement,
    options?: Pick<IntersectionObserverInit, 'threshold' | 'rootMargin'>,
  ) => {
    const cleanup = () => {
      this.observer?.disconnect();
      this.observer = null;
      this.elementHandlerMap.clear();
    };

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const handler = this.elementHandlerMap.get(
            entry.target as HTMLElement,
          );
          handler?.(entry);
        });
      },
      {
        root: viewportElement,
        ...options,
        threshold: options?.threshold ?? DEFAULT_THRESHOLD,
      },
    );

    if (this.queueSet.size) {
      this.queueSet.forEach(([queueElement, queueHandler]) => {
        // check if element which requested observation is
        // a child of a viewport element, skip if isn't
        if (!viewportElement.contains(queueElement)) return;

        this.observer!.observe(queueElement);
        this.elementHandlerMap.set(queueElement, queueHandler);
      });
      this.queueSet.clear();
    }

    return cleanup;
  };

  /**
   * Method to set element to observe and handler to be triggered whenever IntersectionObserver
   * detects a possible change in element's visibility within specified viewport, returns
   * cleanup function to be invoked upon disposing of the DOM element to prevent memory leaks
   */
  observe: Observe = (element, handler) => {
    const queueItem = [element, handler] as const;

    const cleanup = () => {
      this.elementHandlerMap.delete(element);
      this.observer?.unobserve(element);
      this.queueSet.delete(queueItem);
    };

    if (this.elementHandlerMap.has(element)) return cleanup;

    if (!this.observer) {
      this.queueSet.add(queueItem);
      return cleanup;
    }

    if (this.observer.root!.contains(element)) {
      this.elementHandlerMap.set(element, handler);
      this.observer.observe(element);
    }

    return cleanup;
  };

  /**
   * Tracks the given element for visibility changes and mirrors the result
   * into `participant.viewportVisibilityState[trackType]` in `CallState`.
   * Returns a function that unobserves the element and resets the visibility
   * state back to `UNKNOWN`.
   */
  trackElementVisibility = <T extends HTMLElement>(
    element: T,
    sessionId: string,
    trackType: VideoTrackType,
  ) => {
    const cleanup = this.observe(element, (entry) => {
      this.callState.updateParticipant(sessionId, (participant) => {
        const previousVisibilityState =
          participant.viewportVisibilityState ??
          DEFAULT_VIEWPORT_VISIBILITY_STATE;

        // observer triggers when the element is "moved" to be a fullscreen element
        // keep it VISIBLE if that happens to prevent fullscreen with placeholder
        const isVisible =
          entry.isIntersecting || document.fullscreenElement === element
            ? VisibilityState.VISIBLE
            : VisibilityState.INVISIBLE;
        return {
          ...participant,
          viewportVisibilityState: {
            ...previousVisibilityState,
            [trackType]: isVisible,
          },
        };
      });
    });

    return () => {
      cleanup();
      // reset visibility state to UNKNOWN upon cleanup
      // so that the layouts that are not actively observed
      // can still function normally (runtime layout switching)
      this.callState.updateParticipant(sessionId, (participant) => {
        const previousVisibilityState =
          participant.viewportVisibilityState ??
          DEFAULT_VIEWPORT_VISIBILITY_STATE;
        return {
          ...participant,
          viewportVisibilityState: {
            ...previousVisibilityState,
            [trackType]: VisibilityState.UNKNOWN,
          },
        };
      });
    };
  };
}
