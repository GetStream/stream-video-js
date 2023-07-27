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
import { Alert, StyleSheet } from 'react-native';
import { theme } from '../../../theme';
import { Video, VideoSlash } from '../../../icons';
import { useCallControls, usePermissionNotification } from '../../../hooks';

export const ToggleVideoButton = () => {
  const [isAwaitingApproval, setIsAwaitingApproval] = useState(false);
  const { toggleVideoMuted, isVideoPublished } = useCallControls();
  const { t } = useI18n();

  const isVideoMuted = !isVideoPublished;

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
    if (userHasSendVideoCapability) {
      await toggleVideoMuted();
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
        style={!isVideoMuted ? styles.button : null}
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

const styles = StyleSheet.create({
  button: {
    // For iOS
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,

    // For android
    elevation: 6,
  },
  svgContainerStyle: {
    paddingTop: theme.padding.xs,
  },
});
