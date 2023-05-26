import { useEffect } from 'react';
import { ViewportTracker, VisibilityState } from '@stream-io/video-client';
import { useCall } from '@stream-io/video-react-bindings';

export const useTrackElementVisibility = <T extends HTMLElement>({
  trackedElement,
  viewportTracker: propsViewportTracker,
  sessionId,
}: {
  trackedElement: T | null;
  sessionId: string;
  viewportTracker?: ViewportTracker;
}) => {
  const call = useCall();

  const viewportTracker = propsViewportTracker ?? call?.viewportTracker;

  useEffect(() => {
    if (!trackedElement || !viewportTracker || !call) return;

    const unobserve = viewportTracker.observe(trackedElement, (entry) => {
      call.state.updateParticipant(sessionId, (p) => ({
        ...p,
        viewportVisibilityState:
          // observer triggers when element is "moved" to be a fullscreen element
          // keep it VISIBLE if that happens to prevent fullscreen with placeholder
          entry.isIntersecting || document.fullscreenElement === trackedElement
            ? VisibilityState.VISIBLE
            : VisibilityState.INVISIBLE,
      }));
    });

    return () => {
      unobserve();
      // reset visibility state to UNKNOWN upon cleanup
      // so that the layouts that are not actively observed
      // can still function normally (runtime layout switching)
      call.state.updateParticipant(sessionId, (p) => ({
        ...p,
        viewportVisibilityState: VisibilityState.UNKNOWN,
      }));
    };
  }, [trackedElement, viewportTracker, call, sessionId]);
};
