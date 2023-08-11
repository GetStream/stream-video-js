import { OwnCapability } from '@stream-io/video-client';
import {
  Restricted,
  useCall,
  useCameraState,
} from '@stream-io/video-react-bindings';
import React from 'react';
import { CallControlsButton } from './CallControlsButton';
import { muteStatusColor } from '../../../utils';
import { CameraSwitch } from '../../../icons';
import { theme } from '../../../theme';
import { StyleSheet } from 'react-native';

export const ToggleCameraFaceButton = () => {
  const call = useCall();
  const { direction } = useCameraState();
  const onPress = async () => {
    await call?.camera.flip();
  };

  return (
    <Restricted requiredGrants={[OwnCapability.SEND_VIDEO]}>
      <CallControlsButton
        onPress={onPress}
        color={muteStatusColor(direction === 'back')}
        style={direction === 'front' ? styles.button : null}
      >
        <CameraSwitch
          color={
            direction === 'front'
              ? theme.light.static_black
              : theme.light.static_white
          }
        />
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
});
