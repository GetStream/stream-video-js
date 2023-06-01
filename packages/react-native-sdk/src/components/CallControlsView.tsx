import { StyleSheet, View } from 'react-native';
import { useCallControls } from '../hooks/useCallControls';
import { CameraSwitch, Chat, PhoneDown, Reaction } from '../icons';
import { CallControlsButton } from './CallControlsButton';
import { theme } from '../theme';
import { OwnCapability } from '@stream-io/video-client';
import { Restricted, useCall } from '@stream-io/video-react-bindings';
import { useCallback, useState } from 'react';
import { ReactionModal } from './ReactionsModal';
import { ToggleAudioButton } from './ToggleAudioButton';
import { ToggleVideoButton } from './ToggleVideoButton';

/**
 * Shows a list/row of controls (mute audio/video, toggle front/back camera, hangup call etc.)
 * the user can trigger within an active call.
 *
 * | Call Controls |
 * | :--- |
 * | ![call-controls-view](https://user-images.githubusercontent.com/25864161/217349666-af0f3278-393e-449d-b30e-2d1b196abe5e.png) |
 */
export const CallControlsView = () => {
  const [isReactionModalActive, setIsReactionModalActive] =
    useState<boolean>(false);

  const { isCameraOnFrontFacingMode, toggleCameraFacingMode } =
    useCallControls();
  const call = useCall();

  const onCallHangup = async () => {
    try {
      await call?.leave();
    } catch (err) {
      console.log('Error Leaving call:', err);
    }
  };

  const muteStatusColor = (status: boolean) => {
    return status ? theme.light.overlay_dark : theme.light.static_white;
  };

  const onOpenReactionsModalHandler = useCallback(() => {
    setIsReactionModalActive(true);
  }, [setIsReactionModalActive]);

  return (
    <View style={styles.container}>
      <Restricted requiredGrants={[OwnCapability.CREATE_REACTION]}>
        <CallControlsButton
          onPress={onOpenReactionsModalHandler}
          color={theme.light.static_white}
          style={styles.button}
        >
          <Reaction color={theme.light.static_black} />
        </CallControlsButton>
      </Restricted>
      <ReactionModal
        isReactionModalActive={isReactionModalActive}
        setIsReactionModalActive={setIsReactionModalActive}
      />
      <CallControlsButton
        color={theme.light.static_white}
        onPress={() => null}
        svgContainerStyle={styles.svgContainerStyle}
        style={styles.button}
      >
        <Chat color={theme.light.static_black} />
      </CallControlsButton>
      <ToggleVideoButton />
      <ToggleAudioButton />
      <Restricted requiredGrants={[OwnCapability.SEND_VIDEO]}>
        <CallControlsButton
          onPress={toggleCameraFacingMode}
          color={muteStatusColor(!isCameraOnFrontFacingMode)}
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
      </Restricted>
      <CallControlsButton
        onPress={onCallHangup}
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
    borderTopLeftRadius: theme.rounded.lg,
    borderTopRightRadius: theme.rounded.lg,
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
