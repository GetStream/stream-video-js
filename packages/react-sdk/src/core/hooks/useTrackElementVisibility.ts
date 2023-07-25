import { useEffect, useMemo, useRef } from 'react';
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

  const isIntersectingReference = useRef<boolean | null>(null);

  const viewportTracker = propsViewportTracker ?? call?.viewportTracker;

  const participantVisibility = useMemo(
    () => ({
      update: (isVisible: boolean) => {
        call?.state.updateParticipant(sessionId, (p) => {
          // skip update if the participant state is already in the expected state
          if (
            (isVisible &&
              p.viewportVisibilityState === VisibilityState.VISIBLE) ||
            (!isVisible &&
              p.viewportVisibilityState === VisibilityState.INVISIBLE)
          )
            return p;

          return {
            ...p,
            viewportVisibilityState: isVisible
              ? VisibilityState.VISIBLE
              : VisibilityState.INVISIBLE,
          };
        });
      },
      reset: () => {
        call?.state.updateParticipant(sessionId, (p) => {
          // skip update if the participant state is already in the expected state
          if (p.viewportVisibilityState === VisibilityState.UNKNOWN) return p;

          return {
            ...p,
            viewportVisibilityState: VisibilityState.UNKNOWN,
          };
        });
      },
    }),
    [call, sessionId],
  );

  useEffect(() => {
    if (!call || !trackedElement) return;

    const handleVisibilityChange = () => {
      const isDocumentVisible = document.visibilityState === 'visible';
      const isPIP = trackedElement.contains(document.pictureInPictureElement);
      if (isPIP) return;
      participantVisibility.update(
        isDocumentVisible && isIntersectingReference.current !== false,
      );
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      participantVisibility.reset();
    };
  }, [call, participantVisibility, trackedElement]);

  useEffect(() => {
    if (!trackedElement || !viewportTracker || !call) return;

    const unobserve = viewportTracker.observe(trackedElement, (entry) => {
      isIntersectingReference.current = entry.isIntersecting;

      participantVisibility.update(
        // observer triggers when element is "moved" to be a fullscreen element
        // keep it VISIBLE if that happens to prevent fullscreen with placeholder
        entry.isIntersecting ||
          document.fullscreenElement === trackedElement ||
          trackedElement.contains(document.pictureInPictureElement),
      );
    });

    return () => {
      unobserve();
      // reset visibility state to UNKNOWN upon cleanup
      // so that the layouts that are not actively observed
      // can still function normally (runtime layout switching)
      participantVisibility.reset();

      isIntersectingReference.current = null;
    };
  }, [trackedElement, viewportTracker, participantVisibility, call]);
};
