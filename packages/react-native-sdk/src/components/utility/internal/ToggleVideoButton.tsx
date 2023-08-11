import React from 'react';
import { OwnCapability } from '@stream-io/video-client';
import {
  Restricted,
  useCall,
  useCameraState,
} from '@stream-io/video-react-bindings';
import { CallControlsButton } from './CallControlsButton';
import { muteStatusColor } from '../../../utils';
import { StyleSheet } from 'react-native';
import { theme } from '../../../theme';
import { Video, VideoSlash } from '../../../icons';

export const ToggleVideoButton = () => {
  const call = useCall();
  const { status } = useCameraState();

  const onPress = async () => {
    await call?.camera.toggle();
  };

  return (
    <Restricted requiredGrants={[OwnCapability.SEND_VIDEO]}>
      <CallControlsButton
        onPress={onPress}
        color={muteStatusColor(status === 'disabled')}
        style={status !== 'disabled' ? styles.button : null}
      >
        {status === 'disabled' ? (
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
