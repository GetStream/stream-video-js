import { useCallback, useEffect, useState } from 'react';
import { OwnCapability, SfuModels } from '@stream-io/video-client';
import {
  useCall,
  useHasPermissions,
  useI18n,
  CallPermissionsWrapper,
  useLocalParticipant,
} from '@stream-io/video-react-bindings';

import { useMediaDevices } from '../../core';
import { DeviceSelectorAudioInput } from '../DeviceSettings';
import { CompositeButton, IconButton } from '../Button';
import { PermissionNotification } from '../Notification';

export type ToggleAudioPreviewButtonProps = { caption?: string };

export const ToggleAudioPreviewButton = ({
  caption,
}: ToggleAudioPreviewButtonProps) => {
  const { initialAudioEnabled, toggleAudioMuteState } = useMediaDevices();
  const { t } = useI18n();

  return (
    <CompositeButton
      Menu={DeviceSelectorAudioInput}
      active={!initialAudioEnabled}
      caption={caption || t('Mic')}
    >
      <IconButton
        icon={initialAudioEnabled ? 'mic' : 'mic-off'}
        onClick={toggleAudioMuteState}
      />
    </CompositeButton>
  );
};

export type ToggleAudioPublishingButtonProps = {
  caption?: string;
};

export const ToggleAudioPublishingButton = (
  props: ToggleAudioPublishingButtonProps,
) => {
  const { publishAudioStream, stopPublishingAudio } = useMediaDevices();
  const localParticipant = useLocalParticipant();
  const { t } = useI18n();

  const { caption = t('Mic') } = props;

  const isAudioMute = !localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.AUDIO,
  );

  const call = useCall();
  const hasPermission = useHasPermissions(OwnCapability.SEND_AUDIO);
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
    if (isAudioMute && hasPermission) {
      await publishAudioStream();
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

  return (
    <CallPermissionsWrapper requiredGrants={[OwnCapability.SEND_AUDIO]}>
      <PermissionNotification
        permission={OwnCapability.SEND_AUDIO}
        isAwaitingApproval={isAwaitingApproval}
        messageApproved="You can now speak."
        messageAwaitingApproval="Awaiting for an approval to speak."
        messageRevoked="You can no longer speak."
      >
        <CompositeButton
          Menu={DeviceSelectorAudioInput}
          active={isAudioMute}
          caption={caption}
        >
          <IconButton
            icon={isAudioMute ? 'mic-off' : 'mic'}
            onClick={handleClick}
          />
        </CompositeButton>
      </PermissionNotification>
    </CallPermissionsWrapper>
  );
};
