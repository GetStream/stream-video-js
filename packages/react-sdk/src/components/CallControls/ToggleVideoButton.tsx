import { ComponentType, useCallback, useEffect, useState } from 'react';
import {
  Restricted,
  useCall,
  useHasPermissions,
  useI18n,
  useLocalParticipant,
} from '@stream-io/video-react-bindings';

import { OwnCapability, SfuModels } from '@stream-io/video-client';
import { CompositeButton, IconButton } from '../Button/';
import { DEVICE_STATE, useMediaDevices } from '../../core';
import { DeviceSelectorVideo } from '../DeviceSettings';
import { PermissionNotification } from '../Notification';

export type ToggleVideoPreviewButtonProps = {
  caption?: string;
  Menu?: ComponentType;
};

export const ToggleVideoPreviewButton = (
  props: ToggleVideoPreviewButtonProps,
) => {
  const { toggleInitialVideoMuteState, initialVideoState } = useMediaDevices();
  const { t } = useI18n();
  const { caption = t('Video'), Menu = DeviceSelectorVideo } = props;

  return (
    <CompositeButton
      Menu={Menu}
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

type ToggleVideoPublishingButtonProps = {
  caption?: string;
  Menu?: ComponentType;
};

export const ToggleVideoPublishingButton = (
  props: ToggleVideoPublishingButtonProps,
) => {
  const { publishVideoStream, stopPublishingVideo, setInitialVideoState } =
    useMediaDevices();
  const localParticipant = useLocalParticipant();
  const { t } = useI18n();
  const isVideoMute = !localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.VIDEO,
  );
  const { caption = t('Video'), Menu = DeviceSelectorVideo } = props;

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
    if (isVideoMute) {
      if (hasPermission) {
        setInitialVideoState(DEVICE_STATE.playing);
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
    setInitialVideoState,
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
        <CompositeButton Menu={Menu} active={isVideoMute} caption={caption}>
          <IconButton
            icon={isVideoMute ? 'camera-off' : 'camera'}
            onClick={handleClick}
          />
        </CompositeButton>
      </PermissionNotification>
    </Restricted>
  );
};
