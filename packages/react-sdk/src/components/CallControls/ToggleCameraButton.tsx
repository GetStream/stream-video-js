import { useCallback, useEffect, useState } from 'react';
import {
  useCall,
  useHasPermissions,
  useLocalParticipant,
} from '@stream-io/video-react-bindings';

import { OwnCapability, SfuModels } from '@stream-io/video-client';
import { CompositeButton, IconButton } from '../Button/';
import { useMediaDevices } from '../../core';
import { DeviceSelectorVideo } from '../DeviceSettings';
import { PermissionNotification } from '../Notification';
import { Restricted } from '../Moderation';

export type ToggleCameraPreviewButtonProps = { caption?: string };

export const ToggleCameraPreviewButton = ({
  caption = 'Video',
}: ToggleCameraPreviewButtonProps) => {
  const { toggleInitialVideoMuteState, initialVideoState } = useMediaDevices();

  return (
    <CompositeButton
      Menu={DeviceSelectorVideo}
      active={!initialVideoState.enabled}
      caption={caption}
    >
      <IconButton
        icon={initialVideoState.enabled ? 'camera' : 'camera-off'}
        onClick={toggleInitialVideoMuteState}
      />
    </CompositeButton>
  );
};

type ToggleCameraPublishingButtonProps = {
  caption?: string;
};

export const ToggleCameraPublishingButton = ({
  caption = 'Video',
}: ToggleCameraPublishingButtonProps) => {
  const { publishVideoStream, stopPublishingVideo } = useMediaDevices();
  const localParticipant = useLocalParticipant();
  const isVideoMute = !localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.VIDEO,
  );

  const call = useCall();
  const hasPermission = useHasPermissions(OwnCapability.SEND_VIDEO);
  const [isAwaitingApproval, setIsAwaitingApproval] = useState(false);
  useEffect(() => {
    if (hasPermission) {
      setIsAwaitingApproval(false);
    }
  }, [hasPermission]);

  const handleClick = useCallback(async () => {
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
    if (isVideoMute && hasPermission) {
      await publishVideoStream();
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

  return (
    <Restricted requiredGrants={[OwnCapability.SEND_VIDEO]}>
      <PermissionNotification
        permission={OwnCapability.SEND_VIDEO}
        isAwaitingApproval={isAwaitingApproval}
        messageApproved="You can now share your video."
        messageAwaitingApproval="Awaiting for an approval to share your video."
        messageRevoked="You can no longer share your video."
      >
        <CompositeButton
          Menu={DeviceSelectorVideo}
          active={isVideoMute}
          caption={caption}
        >
          <IconButton
            icon={isVideoMute ? 'camera-off' : 'camera'}
            onClick={handleClick}
          />
        </CompositeButton>
      </PermissionNotification>
    </Restricted>
  );
};
