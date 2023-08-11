import React from 'react';
import { OwnCapability } from '@stream-io/video-client';
import {
  Restricted,
  useCall,
  useMicrophoneState,
} from '@stream-io/video-react-bindings';
import { CallControlsButton } from './CallControlsButton';
import { theme } from '../../../theme';
import { Mic, MicOff } from '../../../icons';
import { StyleSheet } from 'react-native';
import { muteStatusColor } from '../../../utils';

export const ToggleAudioButton = () => {
  const call = useCall();
  const { status } = useMicrophoneState();

  const onPress = async () => {
    await call?.microphone.toggle();
  };

  return (
    <Restricted requiredGrants={[OwnCapability.SEND_AUDIO]}>
      <CallControlsButton
        onPress={onPress}
        color={muteStatusColor(status === 'disabled')}
        style={status === 'enabled' ? styles.button : null}
      >
        {status === 'disabled' ? (
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
