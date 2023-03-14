import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useCallControls } from '../hooks/useCallControls';
import { useCall } from '../hooks/useCall';
import {
  CameraSwitch,
  Chat,
  Mic,
  MicOff,
  PhoneDown,
  Video,
  VideoSlash,
} from '../icons';
import { CallControlsButton } from './CallControlsButton';

/**
 * Props to be passed for the CallControlsView component.
 */
export interface CallControlsViewProps {
  /**
   * Handler called when the call is hanged up by the caller. Mostly used for navigation and related actions.
   */
  onHangupCall?: () => void;
}

/**
 * Shows a list/row of controls (mute audio/video, toggle front/back camera, hangup call etc.)
 * the user can trigger within an active call.
 *
 * | Call Controls |
 * | :--- |
 * | ![call-controls-view](https://user-images.githubusercontent.com/25864161/217349666-af0f3278-393e-449d-b30e-2d1b196abe5e.png) |
 */
export const CallControlsView = ({ onHangupCall }: CallControlsViewProps) => {
  const {
    isAudioMuted,
    isVideoMuted,
    isCameraOnFrontFacingMode,
    toggleVideoMuted,
    toggleAudioMuted,
    toggleCameraFacingMode,
  } = useCallControls();
  const { hangupCall } = useCall();

  const handleHangUpCall = useCallback(async () => {
    await hangupCall();
    if (onHangupCall) onHangupCall();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hangupCall]);

  return (
    <View style={styles.container}>
      <CallControlsButton
        colorKey="activated"
        onPress={() => null}
        svgContainerStyle={styles.chatSvgStyle}
      >
        <Chat color="#080707" />
      </CallControlsButton>
      <CallControlsButton
        onPress={toggleVideoMuted}
        colorKey={isVideoMuted ? 'deactivated' : 'activated'}
      >
        {isVideoMuted ? (
          <VideoSlash color="#ffffff" />
        ) : (
          <Video color="#080707" />
        )}
      </CallControlsButton>
      <CallControlsButton
        onPress={toggleAudioMuted}
        colorKey={isAudioMuted ? 'deactivated' : 'activated'}
      >
        {isAudioMuted ? <MicOff color="#ffffff" /> : <Mic color="#080707" />}
      </CallControlsButton>
      <CallControlsButton
        onPress={toggleCameraFacingMode}
        colorKey={isCameraOnFrontFacingMode ? 'activated' : 'deactivated'}
      >
        <CameraSwitch color={isCameraOnFrontFacingMode ? '#080707' : '#FFF'} />
      </CallControlsButton>
      <CallControlsButton onPress={handleHangUpCall} colorKey="cancel">
        <PhoneDown color="#ffffff" />
      </CallControlsButton>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: 25,
    paddingHorizontal: 16,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    backgroundColor: '#121416',
    bottom: 0,
    zIndex: 2,
  },
  chatSvgStyle: {
    paddingTop: 4,
  },
});
