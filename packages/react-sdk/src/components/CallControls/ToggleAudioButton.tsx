import { ComponentType, useCallback, useEffect, useState } from 'react';
import { OwnCapability, SfuModels } from '@stream-io/video-client';
import {
  Restricted,
  useCall,
  useHasPermissions,
  useI18n,
  useLocalParticipant,
} from '@stream-io/video-react-bindings';

import { useMediaDevices } from '../../core';
import { DeviceSelectorAudioInput } from '../DeviceSettings';
import { CompositeButton, IconButton } from '../Button';
import { PermissionNotification } from '../Notification';

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
  const { publishAudioStream, stopPublishingAudio, setInitialAudioEnabled } =
    useMediaDevices();
  const localParticipant = useLocalParticipant();
  const { t } = useI18n();

  const { caption = t('Mic'), Menu = DeviceSelectorAudioInput } = props;

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
    if (isAudioMute) {
      if (hasPermission) {
        setInitialAudioEnabled(true);
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
    setInitialAudioEnabled,
    stopPublishingAudio,
  ]);

  return (
    <Restricted requiredGrants={[OwnCapability.SEND_AUDIO]}>
      <PermissionNotification
        permission={OwnCapability.SEND_AUDIO}
        isAwaitingApproval={isAwaitingApproval}
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
