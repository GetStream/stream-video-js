import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useCall, useCallControls } from '../hooks';
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
import { theme } from '../theme';
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
        color={theme.light.static_white}
        onPress={() => null}
        svgContainerStyle={styles.svgContainerStyle}
        style={styles.button}
      >
        <Chat color={theme.light.static_black} />
      </CallControlsButton>
      <CallControlsButton
        onPress={toggleVideoMuted}
        color={
          isVideoMuted ? theme.light.overlay_dark : theme.light.static_white
        }
        style={!isVideoMuted ? styles.button : null}
      >
        {isVideoMuted ? (
          <VideoSlash color={theme.light.static_white} />
        ) : (
          <Video color={theme.light.static_black} />
        )}
      </CallControlsButton>
      <CallControlsButton
        onPress={toggleAudioMuted}
        color={
          isAudioMuted ? theme.light.overlay_dark : theme.light.static_white
        }
        style={!isAudioMuted ? styles.button : null}
      >
        {isAudioMuted ? (
          <MicOff color={theme.light.static_white} />
        ) : (
          <Mic color={theme.light.static_black} />
        )}
      </CallControlsButton>
      <CallControlsButton
        onPress={toggleCameraFacingMode}
        color={
          isCameraOnFrontFacingMode
            ? theme.light.static_white
            : theme.light.overlay_dark
        }
        style={isCameraOnFrontFacingMode ? styles.button : null}
      >
        <CameraSwitch
          color={
            isCameraOnFrontFacingMode
              ? theme.light.static_black
              : theme.light.static_white
          }
        />
      </CallControlsButton>
      <CallControlsButton
        onPress={handleHangUpCall}
        color={theme.light.error}
        style={[styles.button, { shadowColor: theme.light.error }]}
      >
        <PhoneDown color={theme.light.static_white} />
      </CallControlsButton>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: theme.padding.lg,
    paddingHorizontal: theme.padding.md,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    backgroundColor: theme.light.controls_bg,
    zIndex: 2,
  },
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
