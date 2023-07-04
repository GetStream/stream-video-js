import { useCallback, useRef } from 'react';
import { useLocalParticipant } from '@stream-io/video-react-bindings';
import { OwnCapability, SfuModels } from '@stream-io/video-client';

import { useMediaDevices } from '../core';
import { useRequestPermission } from './useRequestPermission';

export const useToggleAudioMuteState = () => {
  const { publishAudioStream, stopPublishingAudio } = useMediaDevices();
  const localParticipant = useLocalParticipant();

  const { isAwaitingPermission, requestPermission } = useRequestPermission(
    OwnCapability.SEND_AUDIO,
  );

  // to keep the toggle function as stable as possible
  const isAudioMutedReference = useRef(false);

  isAudioMutedReference.current = !localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.AUDIO,
  );

  const toggleAudioMuteState = useCallback(async () => {
    if (isAudioMutedReference.current) {
      const canPublish = await requestPermission();
      if (canPublish) return publishAudioStream();
    }

    if (!isAudioMutedReference.current) stopPublishingAudio();
  }, [publishAudioStream, requestPermission, stopPublishingAudio]);

  return { toggleAudioMuteState, isAwaitingPermission };
};
