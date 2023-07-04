import { ComponentType } from 'react';
import { OwnCapability, SfuModels } from '@stream-io/video-client';
import {
  Restricted,
  useI18n,
  useLocalParticipant,
} from '@stream-io/video-react-bindings';

import { useMediaDevices } from '../../core';
import { DeviceSelectorAudioInput } from '../DeviceSettings';
import { CompositeButton, IconButton } from '../Button';
import { PermissionNotification } from '../Notification';
import { useToggleAudioMuteState } from '../../hooks';

export type ToggleAudioPreviewButtonProps = {
  caption?: string;
  Menu?: ComponentType;
};

export const ToggleAudioPreviewButton = (
  props: ToggleAudioPreviewButtonProps,
) => {
  const { initialAudioEnabled, toggleInitialAudioMuteState } =
    useMediaDevices();
  const { t } = useI18n();
  const { caption = t('Mic'), Menu = DeviceSelectorAudioInput } = props;

  return (
    <CompositeButton
      Menu={Menu}
      active={!initialAudioEnabled}
      caption={caption || t('Mic')}
    >
      <IconButton
        icon={initialAudioEnabled ? 'mic' : 'mic-off'}
        onClick={toggleInitialAudioMuteState}
      />
    </CompositeButton>
  );
};

export type ToggleAudioPublishingButtonProps = {
  caption?: string;
  Menu?: ComponentType;
};

export const ToggleAudioPublishingButton = (
  props: ToggleAudioPublishingButtonProps,
) => {
  const localParticipant = useLocalParticipant();
  const { t } = useI18n();

  const { caption = t('Mic'), Menu = DeviceSelectorAudioInput } = props;

  const isAudioMute = !localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.AUDIO,
  );

  const { toggleAudioMuteState: handleClick, isAwaitingPermission } =
    useToggleAudioMuteState();

  return (
    <Restricted requiredGrants={[OwnCapability.SEND_AUDIO]}>
      <PermissionNotification
        permission={OwnCapability.SEND_AUDIO}
        isAwaitingApproval={isAwaitingPermission}
        messageApproved="You can now speak."
        messageAwaitingApproval="Awaiting for an approval to speak."
        messageRevoked="You can no longer speak."
      >
        <CompositeButton Menu={Menu} active={isAudioMute} caption={caption}>
          <IconButton
            icon={isAudioMute ? 'mic-off' : 'mic'}
            onClick={handleClick}
          />
        </CompositeButton>
      </PermissionNotification>
    </Restricted>
  );
};
