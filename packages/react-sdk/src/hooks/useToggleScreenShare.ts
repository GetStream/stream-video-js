import { useCallback, useRef } from 'react';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import {
  getScreenShareStream,
  OwnCapability,
  SfuModels,
} from '@stream-io/video-client';
import { useRequestPermission } from './useRequestPermission';

export const useToggleScreenShare = () => {
  const { useLocalParticipant } = useCallStateHooks();
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

    await call?.stopPublish(SfuModels.TrackType.SCREEN_SHARE);
  }, [call, requestPermission]);

  return { toggleScreenShare, isAwaitingPermission, isScreenSharing };
};
