import { StyleSheet, View } from 'react-native';
import { useCallControls } from '../hooks/useCallControls';
import {
  CameraSwitch,
  Chat,
  Mic,
  MicOff,
  PhoneDown,
  Reaction,
  Video,
  VideoSlash,
} from '../icons';
import { CallControlsButton } from './CallControlsButton';
import { theme } from '../theme';
import { OwnCapability } from '@stream-io/video-client';
import {
  Restricted,
  useOwnCapabilities,
} from '@stream-io/video-react-bindings';
import { useCallback, useState } from 'react';
import { ReactionModal } from './ReactionsModal';
import { PermissionNotification } from './PermissionsNotification';

type CallControlsViewProps = {
  onLeave: () => void;
};

/**
 * Shows a list/row of controls (mute audio/video, toggle front/back camera, hangup call etc.)
 * the user can trigger within an active call.
 *
 * | Call Controls |
 * | :--- |
 * | ![call-controls-view](https://user-images.githubusercontent.com/25864161/217349666-af0f3278-393e-449d-b30e-2d1b196abe5e.png) |
 */
export const CallControlsView = ({ onLeave }: CallControlsViewProps) => {
  const [isReactionModalActive, setIsReactionModalActive] =
    useState<boolean>(false);
  const {
    isAudioMuted,
    isVideoMuted,
    isCameraOnFrontFacingMode,
    toggleVideoMuted,
    toggleAudioMuted,
    toggleCameraFacingMode,
  } = useCallControls();
  const ownCapabilities = useOwnCapabilities();

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
      <Restricted requiredGrants={[OwnCapability.SEND_VIDEO]}>
        <PermissionNotification
          permission={OwnCapability.SEND_VIDEO}
          messageApproved="You can now share your video."
          messageAwaitingApproval="Awaiting for an approval to share your video."
          messageRevoked="You can no longer share your video."
        >
          <CallControlsButton
            onPress={toggleVideoMuted}
            color={muteStatusColor(isVideoMuted)}
            style={!isVideoMuted ? styles.button : null}
            disabled={!ownCapabilities.includes(OwnCapability.SEND_VIDEO)}
          >
            {isVideoMuted ? (
              <VideoSlash color={theme.light.static_white} />
            ) : (
              <Video color={theme.light.static_black} />
            )}
          </CallControlsButton>
        </PermissionNotification>
      </Restricted>

      <PermissionNotification
        permission={OwnCapability.SEND_AUDIO}
        messageApproved="You can now speak."
        messageAwaitingApproval="Awaiting for an approval to speak."
        messageRevoked="You can no longer speak."
      >
        <Restricted requiredGrants={[OwnCapability.SEND_AUDIO]}>
          <CallControlsButton
            onPress={toggleAudioMuted}
            color={muteStatusColor(isAudioMuted)}
            style={!isAudioMuted ? styles.button : null}
            disabled={!ownCapabilities.includes(OwnCapability.SEND_AUDIO)}
          >
            {isAudioMuted ? (
              <MicOff color={theme.light.static_white} />
            ) : (
              <Mic color={theme.light.static_black} />
            )}
          </CallControlsButton>
        </Restricted>
      </PermissionNotification>
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
      <Restricted requiredGrants={[OwnCapability.END_CALL]}>
        <CallControlsButton
          onPress={onLeave}
          color={theme.light.error}
          style={[styles.button, { shadowColor: theme.light.error }]}
        >
          <PhoneDown color={theme.light.static_white} />
        </CallControlsButton>
      </Restricted>
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
