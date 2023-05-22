import { AxiosError, OwnCapability } from '@stream-io/video-client';
import {
  Restricted,
  useCall,
  useHasPermissions,
} from '@stream-io/video-react-bindings';
import { CallControlsButton } from './CallControlsButton';
import { useCallControls, usePermissionNotification } from '../hooks';
import { theme } from '../theme';
import { Mic, MicOff } from '../icons';
import { Alert, StyleSheet } from 'react-native';
import { muteStatusColor } from '../utils';
import { useCallback, useEffect, useState } from 'react';

export const ToggleAudioButton = () => {
  const [isAwaitingApproval, setIsAwaitingApproval] = useState(false);
  const { toggleAudioMuted, isAudioMuted } = useCallControls();
  const userHasSendAudioCapability = useHasPermissions(
    OwnCapability.SEND_AUDIO,
  );

  usePermissionNotification({
    permission: OwnCapability.SEND_AUDIO,
    messageApproved: 'You can now speak.',
    messageRevoked: 'You can no longer speak.',
  });

  const call = useCall();

  useEffect(() => {
    if (userHasSendAudioCapability) {
      setIsAwaitingApproval(false);
    }
  }, [userHasSendAudioCapability]);

  const handleRequestPermission = useCallback(
    async (permission: OwnCapability) => {
      if (call?.permissionsContext.canRequest(permission)) {
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
      }
    },
    [call],
  );

  const handleToggleAudioButton = () => {
    if (!userHasSendAudioCapability) {
      if (!isAwaitingApproval) {
        handleRequestPermission(OwnCapability.SEND_AUDIO);
      } else {
        Alert.alert('Awaiting for an approval to speak.');
      }
      return;
    }
    toggleAudioMuted();
  };

  return (
    <Restricted requiredGrants={[OwnCapability.SEND_AUDIO]}>
      <CallControlsButton
        onPress={handleToggleAudioButton}
        color={muteStatusColor(isAudioMuted)}
        style={!isAudioMuted ? styles.button : null}
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
