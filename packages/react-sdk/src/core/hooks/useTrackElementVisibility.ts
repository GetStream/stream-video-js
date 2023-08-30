import { useEffect } from 'react';
import { DynascaleManager, VideoTrackType } from '@stream-io/video-client';
import { useCall } from '@stream-io/video-react-bindings';

export const useTrackElementVisibility = <T extends HTMLElement>({
  trackedElement,
  dynascaleManager: propsDynascaleManager,
  sessionId,
  trackType,
}: {
  trackedElement: T | null;
  sessionId: string;
  dynascaleManager?: DynascaleManager;
  trackType: VideoTrackType | 'none';
}) => {
  const call = useCall();
  const manager = propsDynascaleManager ?? call?.dynascaleManager;
  useEffect(() => {
    if (!trackedElement || !manager || !call || trackType === 'none') return;
    const unobserve = manager.trackElementVisibility(
      trackedElement,
      sessionId,
      trackType,
    );
    return () => {
      unobserve();
    };
  }, [trackedElement, manager, call, sessionId, trackType]);
};
