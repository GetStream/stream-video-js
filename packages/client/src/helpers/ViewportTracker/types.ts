import { TrackType, VideoDimension } from '../../gen/video/sfu/models/models';

export type TrackedObject<ElementType> = {
  sessionId: string;
  element: ElementType;
  trackType: TrackType;
};

export type ViewportTrackerCallback<ElementType> = (
  trackedObject: TrackedObject<ElementType>,
  isVisible: boolean,
  dimension: VideoDimension | undefined,
) => void;

export interface ViewportTrackerCtor<ElementType> {
  new (
    callback: ViewportTrackerCallback<ElementType>,
  ): ViewportTracker<ElementType>;
}

export interface ViewportTracker<
  ElementType,
  ViewportTrackerOptionsType = Omit<IntersectionObserverInit, 'root'>,
> {
  setViewport: (
    viewport?: ElementType,
    options?: ViewportTrackerOptionsType,
  ) => void;

  addObject: (
    sessionId: string,
    trackType: TrackType,
    element: ElementType,
  ) => void;

  removeObject: (
    sessionId: string,
    trackType: TrackType,
    element: ElementType,
  ) => void;
}
