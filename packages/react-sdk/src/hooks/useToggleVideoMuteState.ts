import { useCallback, useRef } from 'react';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { OwnCapability, SfuModels } from '@stream-io/video-client';

import { useMediaDevices } from '../core';
import { useRequestPermission } from './useRequestPermission';

export const useToggleVideoMuteState = () => {
  const { publishVideoStream, stopPublishingVideo } = useMediaDevices();
  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();

  const { isAwaitingPermission, requestPermission } = useRequestPermission(
    OwnCapability.SEND_VIDEO,
  );

  // to keep the toggle function as stable as possible
  const isVideoMutedReference = useRef(false);

  isVideoMutedReference.current = !localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.VIDEO,
  );

  const toggleVideoMuteState = useCallback(async () => {
    if (isVideoMutedReference.current) {
      const canPublish = await requestPermission();
      if (canPublish) return publishVideoStream();
    }

    if (!isVideoMutedReference.current) stopPublishingVideo();
  }, [publishVideoStream, requestPermission, stopPublishingVideo]);

  return { toggleVideoMuteState, isAwaitingPermission };
};
