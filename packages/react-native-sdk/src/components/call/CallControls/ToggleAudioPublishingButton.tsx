import React, { useCallback, useEffect, useState } from 'react';
import { AxiosError, OwnCapability } from '@stream-io/video-client';
import {
  Restricted,
  useCall,
  useHasPermissions,
  useI18n,
} from '@stream-io/video-react-bindings';
import { CallControlsButton } from './CallControlsButton';
import { usePermissionNotification } from '../../../hooks';
import { theme } from '../../../theme';
import { Mic, MicOff } from '../../../icons';
import { Alert } from 'react-native';
import { muteStatusColor } from '../../../utils';
import { useMediaStreamManagement } from '../../../providers';

/**
 * Props for the Toggle Audio publishing button
 */
export type ToggleAudioPublishingButtonProps = {
  /**
   * Handler to be called when the the video publishing button is pressed.
   * @returns void
   */
  onPressHandler?: () => void;
};

/**
 * Button to toggle audio mute/unmute status while in the call.
 */
export const ToggleAudioPublishingButton = ({
  onPressHandler,
}: ToggleAudioPublishingButtonProps) => {
  const [isAwaitingApproval, setIsAwaitingApproval] = useState(false);
  const { isAudioMuted, toggleAudioMuted } = useMediaStreamManagement();
  const userHasSendAudioCapability = useHasPermissions(
    OwnCapability.SEND_AUDIO,
  );
  const { t } = useI18n();

  usePermissionNotification({
    permission: OwnCapability.SEND_AUDIO,
    messageApproved: t('You can now speak.'),
    messageRevoked: t('You can no longer speak.'),
  });

  const call = useCall();

  useEffect(() => {
    if (userHasSendAudioCapability) {
      setIsAwaitingApproval(false);
    }
  }, [userHasSendAudioCapability]);

  const handleRequestPermission = useCallback(
    async (permission: OwnCapability) => {
      if (!call?.permissionsContext.canRequest(permission)) {
        return;
      }
      setIsAwaitingApproval(true);
      try {
        await call.requestPermissions({ permissions: [permission] });
      } catch (error) {
        if (error instanceof AxiosError) {
          console.log(
            'RequestPermissions failed',
            error.response?.data.message,
          );
        }
      }
    },
    [call],
  );

  const handleToggleAudioButton = async () => {
    if (onPressHandler) {
      onPressHandler();
      return;
    }
    if (userHasSendAudioCapability) {
      await toggleAudioMuted();
      return;
    }
    if (!isAwaitingApproval) {
      await handleRequestPermission(OwnCapability.SEND_AUDIO);
    } else {
      Alert.alert('Awaiting for an approval to speak.');
    }
  };

  return (
    <Restricted requiredGrants={[OwnCapability.SEND_AUDIO]}>
      <CallControlsButton
        onPress={handleToggleAudioButton}
        color={muteStatusColor(isAudioMuted)}
      >
        {isAudioMuted ? (
          <MicOff color={theme.light.static_white} />
        ) : (
          <Mic color={theme.light.static_black} />
        )}
      </CallControlsButton>
    </Restricted>
  );
};
