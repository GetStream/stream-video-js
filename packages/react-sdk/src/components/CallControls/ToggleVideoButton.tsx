import { ComponentType } from 'react';
import {
  Restricted,
  useCallStateHooks,
  useI18n,
} from '@stream-io/video-react-bindings';

import { OwnCapability, SfuModels } from '@stream-io/video-client';
import { CompositeButton, IconButton } from '../Button/';
import { useMediaDevices } from '../../core';
import { DeviceSelectorVideo } from '../DeviceSettings';
import { PermissionNotification } from '../Notification';
import { useToggleVideoMuteState } from '../../hooks';

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
  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();
  const { t } = useI18n();

  const { caption = t('Video'), Menu = DeviceSelectorVideo } = props;

  const isVideoMute = !localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.VIDEO,
  );

  const { toggleVideoMuteState: handleClick, isAwaitingPermission } =
    useToggleVideoMuteState();

  return (
    <Restricted requiredGrants={[OwnCapability.SEND_VIDEO]}>
      <PermissionNotification
        permission={OwnCapability.SEND_VIDEO}
        isAwaitingApproval={isAwaitingPermission}
        messageApproved={t('You can now share your video.')}
        messageAwaitingApproval={t(
          'Awaiting for an approval to share your video.',
        )}
        messageRevoked={t('You can no longer share your video.')}
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
