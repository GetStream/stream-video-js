import { useEffect } from 'react';
import { DynascaleManager } from '@stream-io/video-client';
import { useCall } from '@stream-io/video-react-bindings';

export const useTrackElementVisibility = <T extends HTMLElement>({
  trackedElement,
  dynascaleManager: propsDynascaleManager,
  sessionId,
}: {
  trackedElement: T | null;
  sessionId: string;
  dynascaleManager?: DynascaleManager;
}) => {
  const call = useCall();

  const manager = propsDynascaleManager ?? call?.dynascaleManager;

  useEffect(() => {
    if (!trackedElement || !manager || !call) return;

    const unobserve = manager.trackElementVisibility(trackedElement, sessionId);
    return () => {
      unobserve();
    };
  }, [trackedElement, manager, call, sessionId]);
};
