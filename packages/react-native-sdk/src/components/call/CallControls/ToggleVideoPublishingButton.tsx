import React, { useCallback, useEffect, useState } from 'react';
import { AxiosError, OwnCapability } from '@stream-io/video-client';
import {
  Restricted,
  useCall,
  useHasPermissions,
  useI18n,
} from '@stream-io/video-react-bindings';
import { CallControlsButton } from './CallControlsButton';
import { muteStatusColor } from '../../../utils';
import { Alert } from 'react-native';
import { theme } from '../../../theme';
import { Video, VideoSlash } from '../../../icons';
import { usePermissionNotification } from '../../../hooks';
import { useMediaStreamManagement } from '../../../providers';

/**
 * Props for the Toggle Video publishing button
 */
export type ToggleVideoPublishingButtonProps = {
  /**
   * Handler to be called when the the video publishing button is pressed.
   * @returns void
   */
  onPressHandler?: () => void;
};

/**
 * Button to toggle video mute/unmute status while in the call.
 */
export const ToggleVideoPublishingButton = ({
  onPressHandler,
}: ToggleVideoPublishingButtonProps) => {
  const [isAwaitingApproval, setIsAwaitingApproval] = useState(false);
  const { isVideoMuted, toggleVideoMuted } = useMediaStreamManagement();
  const { t } = useI18n();

  const userHasSendVideoCapability = useHasPermissions(
    OwnCapability.SEND_VIDEO,
  );
  const call = useCall();

  useEffect(() => {
    if (userHasSendVideoCapability) {
      setIsAwaitingApproval(false);
    }
  }, [userHasSendVideoCapability]);

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

  usePermissionNotification({
    permission: OwnCapability.SEND_VIDEO,
    messageApproved: t('You can now share your video.'),
    messageRevoked: t('You can no longer share your video.'),
  });

  const handleToggleVideoButton = async () => {
    if (onPressHandler) {
      onPressHandler();
      return;
    }
    if (userHasSendVideoCapability) {
      toggleVideoMuted();
      return;
    }
    if (!isAwaitingApproval) {
      await handleRequestPermission(OwnCapability.SEND_VIDEO);
    } else {
      Alert.alert('Awaiting for an approval to share your video.');
    }
  };

  return (
    <Restricted requiredGrants={[OwnCapability.SEND_VIDEO]}>
      <CallControlsButton
        onPress={handleToggleVideoButton}
        color={muteStatusColor(isVideoMuted)}
      >
        {isVideoMuted ? (
          <VideoSlash color={theme.light.static_white} />
        ) : (
          <Video color={theme.light.static_black} />
        )}
      </CallControlsButton>
    </Restricted>
  );
};
