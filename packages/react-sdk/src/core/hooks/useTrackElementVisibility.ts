import { useEffect } from 'react';
import { VideoTrackType } from '@stream-io/video-client';
import { useCall } from '@stream-io/video-react-bindings';

export const useTrackElementVisibility = <T extends HTMLElement>({
  trackedElement,
  sessionId,
  trackType,
}: {
  trackedElement: T | null;
  sessionId: string;
  trackType: VideoTrackType | 'none';
}) => {
  const call = useCall();
  useEffect(() => {
    if (!trackedElement || !call || trackType === 'none') return;
    return call.trackElementVisibility(trackedElement, sessionId, trackType);
  }, [trackedElement, call, sessionId, trackType]);
};
