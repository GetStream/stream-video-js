import { StyleSheet, View } from 'react-native';
import { useCall, useCallControls } from '../../hooks';
import {
  CameraSwitch,
  Chat,
  Mic,
  MicOff,
  PhoneDown,
  Video,
  VideoSlash,
} from '../../icons';
import { CallControlsButton } from './CallControlsButton';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: 25,
    paddingHorizontal: 16,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    backgroundColor: '#FFFFFF',
    bottom: 0,
    zIndex: 2,
  },
  chatSvgStyle: {
    paddingTop: 4,
  },
});

export const CallControlsView = () => {
  const {
    isAudioMuted,
    isVideoMuted,
    cameraBackFacingMode,
    toggleAudioState,
    toggleVideoState,
    toggleCamera,
    toggleChat,
  } = useCallControls();
  const { hangupCall } = useCall();

  return (
    <View style={styles.container}>
      <CallControlsButton
        colorKey="activated"
        onPress={toggleChat}
        svgContainerStyle={styles.chatSvgStyle}
      >
        <Chat color="#080707" />
      </CallControlsButton>
      <CallControlsButton
        onPress={toggleVideoState}
        colorKey={isVideoMuted ? 'deactivated' : 'activated'}
      >
        {isVideoMuted ? (
          <VideoSlash color="#ffffff" />
        ) : (
          <Video color="#080707" />
        )}
      </CallControlsButton>
      <CallControlsButton
        onPress={toggleAudioState}
        colorKey={isAudioMuted ? 'deactivated' : 'activated'}
      >
        {isAudioMuted ? <MicOff color="#ffffff" /> : <Mic color="#080707" />}
      </CallControlsButton>
      <CallControlsButton
        onPress={toggleCamera}
        colorKey={cameraBackFacingMode ? 'deactivated' : 'activated'}
      >
        <CameraSwitch color={cameraBackFacingMode ? '#ffffff' : '#080707'} />
      </CallControlsButton>
      <CallControlsButton onPress={hangupCall} colorKey="cancel">
        <PhoneDown color="#ffffff" />
      </CallControlsButton>
    </View>
  );
};
