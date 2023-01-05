import { TrackType } from '../../gen/video/sfu/models/models';

export type TrackedObject = {
  sessionId: string;
  element: HTMLElement;
  trackType: TrackType;
};

export type ViewportTrackerCallback = (
  trackedObject: TrackedObject,
  isVisible: boolean,
) => void;
