import { useCallback, useEffect, useState } from 'react';
import {
  useCall,
  useHasPermissions,
  useLocalParticipant,
} from '@stream-io/video-react-bindings';
import { OwnCapability, SfuModels } from '@stream-io/video-client';

import { useMediaDevices } from '../core';

export const useToggleVideoMuteState = () => {
  const { publishVideoStream, stopPublishingVideo } = useMediaDevices();
  const localParticipant = useLocalParticipant();
  const call = useCall();
  const hasPermission = useHasPermissions(OwnCapability.SEND_VIDEO);
  const [isAwaitingApproval, setIsAwaitingApproval] = useState(false);

  const isVideoMute = !localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.VIDEO,
  );

  useEffect(() => {
    if (hasPermission) {
      setIsAwaitingApproval(false);
    }
  }, [hasPermission]);

  const toggleVideoMuteState = useCallback(async () => {
    if (
      !hasPermission &&
      call &&
      call.permissionsContext.canRequest(OwnCapability.SEND_VIDEO)
    ) {
      setIsAwaitingApproval(true);
      await call
        .requestPermissions({
          permissions: [OwnCapability.SEND_VIDEO],
        })
        .catch((reason) => {
          console.log('RequestPermissions failed', reason);
        });
      return;
    }
    if (isVideoMute) {
      if (hasPermission) {
        await publishVideoStream();
      } else {
        console.log('Cannot publish video. Insufficient permissions.');
      }
    } else {
      stopPublishingVideo();
    }
  }, [
    call,
    hasPermission,
    isVideoMute,
    publishVideoStream,
    stopPublishingVideo,
  ]);

  return { toggleVideoMuteState, isAwaitingApproval };
};
