import { useCallback, useRef } from 'react';
import { useCall, useLocalParticipant } from '@stream-io/video-react-bindings';
import {
  OwnCapability,
  SfuModels,
  getScreenShareStream,
} from '@stream-io/video-client';
import { useRequestPermission } from './useRequestPermission';

export const useToggleScreenShare = () => {
  const localParticipant = useLocalParticipant();
  const call = useCall();
  const isScreenSharingReference = useRef(false);
  const { isAwaitingPermission, requestPermission } = useRequestPermission(
    OwnCapability.SCREENSHARE,
  );

  const isScreenSharing = !!localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.SCREEN_SHARE,
  );

  isScreenSharingReference.current = isScreenSharing;

  const toggleScreenShare = useCallback(async () => {
    if (!isScreenSharingReference.current) {
      const canPublish = await requestPermission();
      if (!canPublish) return;

      const stream = await getScreenShareStream().catch((e) => {
        console.log(`Can't share screen: ${e}`);
      });

      if (stream) {
        return call?.publishScreenShareStream(stream);
      }
    }

    call?.stopPublish(SfuModels.TrackType.SCREEN_SHARE);
  }, [call, requestPermission]);

  return { toggleScreenShare, isAwaitingPermission, isScreenSharing };
};
