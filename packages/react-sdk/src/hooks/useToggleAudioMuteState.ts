import { useCallback, useEffect, useState } from 'react';
import {
  useCall,
  useHasPermissions,
  useLocalParticipant,
} from '@stream-io/video-react-bindings';
import { OwnCapability, SfuModels } from '@stream-io/video-client';

import { useMediaDevices } from '../core';

export const useToggleAudioMuteState = () => {
  const { publishAudioStream, stopPublishingAudio } = useMediaDevices();
  const localParticipant = useLocalParticipant();
  const call = useCall();
  const hasPermission = useHasPermissions(OwnCapability.SEND_AUDIO);
  const [isAwaitingApproval, setIsAwaitingApproval] = useState(false);

  const isAudioMute = !localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.AUDIO,
  );

  useEffect(() => {
    if (hasPermission) {
      setIsAwaitingApproval(false);
    }
  }, [hasPermission]);

  const toggleAudioMuteState = useCallback(async () => {
    if (
      !hasPermission &&
      call &&
      call.permissionsContext.canRequest(OwnCapability.SEND_AUDIO)
    ) {
      setIsAwaitingApproval(true);
      await call
        .requestPermissions({
          permissions: [OwnCapability.SEND_AUDIO],
        })
        .catch((reason) => {
          console.log('RequestPermissions failed', reason);
        });
      return;
    }
    if (isAudioMute) {
      if (hasPermission) {
        await publishAudioStream();
      } else {
        console.log('Cannot publish audio stream. Insufficient permissions.');
      }
    } else {
      stopPublishingAudio();
    }
  }, [
    call,
    hasPermission,
    isAudioMute,
    publishAudioStream,
    stopPublishingAudio,
  ]);

  return { toggleAudioMuteState, isAwaitingApproval };
};
