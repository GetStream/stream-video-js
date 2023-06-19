import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useCallControls } from '../hooks/useCallControls';
import { CameraSwitch, Chat, PhoneDown, Reaction } from '../icons';
import { CallControlsButton } from './CallControlsButton';
import { theme } from '../theme';
import { CallingState, OwnCapability } from '@stream-io/video-client';
import {
  Restricted,
  useCall,
  useCallCallingState,
} from '@stream-io/video-react-bindings';
import { ReactionModal } from './ReactionsModal';
import { ToggleAudioButton } from './ToggleAudioButton';
import { ToggleVideoButton } from './ToggleVideoButton';
import { A11yButtons } from '../constants/A11yLabels';

type ChatButtonType = {
  onPressHandler: () => void;
  unreadBadgeCountIndicator?: number;
};

export type CallControlsViewType = {
  chatButton?: ChatButtonType;
};

/**
 * Shows a list/row of controls (mute audio/video, toggle front/back camera, hangup call etc.)
 * the user can trigger within an active call.
 *
 * | Call Controls |
 * | :--- |
 * | ![call-controls-view](https://user-images.githubusercontent.com/25864161/217349666-af0f3278-393e-449d-b30e-2d1b196abe5e.png) |
 */
export const CallControlsView = ({ chatButton }: CallControlsViewType) => {
  const [isReactionModalActive, setIsReactionModalActive] =
    useState<boolean>(false);

  const { isCameraOnFrontFacingMode, toggleCameraFacingMode } =
    useCallControls();
  const call = useCall();
  const callingState = useCallCallingState();

  const onCallHangup = async () => {
    try {
      if (callingState === CallingState.LEFT) {
        return;
      }
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
      {chatButton && (
        <View>
          <CallControlsButton
            color={theme.light.static_white}
            onPress={chatButton.onPressHandler}
            svgContainerStyle={styles.svgContainerStyle}
            style={styles.button}
          >
            <UnreadBadeCountIndicator
              count={chatButton.unreadBadgeCountIndicator}
            />
            <Chat color={theme.light.static_black} />
          </CallControlsButton>
        </View>
      )}
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
        accessibilityLabel={A11yButtons.HANG_UP_CALL}
      >
        <PhoneDown color={theme.light.static_white} />
      </CallControlsButton>
    </View>
  );
};

const UnreadBadeCountIndicator = ({
  count,
}: {
  count: ChatButtonType['unreadBadgeCountIndicator'];
}) => {
  // Don't show badge if count is 0 or undefined
  if (!count) {
    return null;
  }

  return (
    <View style={styles.chatBadge}>
      <Text style={styles.chatBadgeText}>{count}</Text>
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
  chatBadge: {
    backgroundColor: theme.light.error,
    borderRadius: theme.rounded.xl,
    position: 'absolute',
    left: 15,
    bottom: 20,
    zIndex: 2,
    height: 30,
    width: 30,
    justifyContent: 'center',
  },
  chatBadgeText: {
    color: theme.light.static_white,
    textAlign: 'center',
    ...theme.fonts.bodyBold,
  },
});
