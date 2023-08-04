import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View, ViewProps } from 'react-native';
import { Chat, Reaction } from '../../icons';
import { CallControlsButton } from '../utility/internal/CallControlsButton';
import { theme } from '../../theme';
import { OwnCapability } from '@stream-io/video-client';
import { Restricted } from '@stream-io/video-react-bindings';
import { ReactionModal } from '../utility/ReactionsModal';
import { ToggleAudioButton } from '../utility/internal/ToggleAudioButton';
import { ToggleVideoButton } from '../utility/internal/ToggleVideoButton';
import { A11yButtons, A11yComponents } from '../../constants/A11yLabels';
import { Z_INDEX } from '../../constants';
import { ToggleCameraFaceButton } from '../utility/internal/ToggleCameraFaceButton';
import {
  HangUpCallButton,
  HangUpCallButtonType,
} from '../utility/internal/HangupCallButton';

/**
 * The props for the Chat Button in the Call Control View.
 */
type ChatButtonType = {
  /**
   * Handler to be called when the chat button is pressed.
   * @returns void
   */
  onPressHandler: () => void;
  /**
   * The unread message indicator to be displayed above on the Chat button.
   */
  unreadBadgeCountIndicator?: number;
};

/**
 * Props for the CallControlsView Component.
 */
export interface CallControlsViewType extends Pick<ViewProps, 'style'> {
  /**
   * Chat Button Props to be passed as an object
   */
  chatButton?: ChatButtonType;
  /**
   * Hang up call button props to be passed as an object
   */
  hangUpCallButton?: HangUpCallButtonType;
}

/**
 * A list/row of controls (mute audio/video, toggle front/back camera, hangup call etc.)
 * the user can trigger within an active call.
 */
export const CallControlsView = ({
  chatButton,
  hangUpCallButton,
  style,
}: CallControlsViewType) => {
  const [isReactionModalActive, setIsReactionModalActive] =
    useState<boolean>(false);

  const onOpenReactionsModalHandler = useCallback(() => {
    setIsReactionModalActive(true);
  }, [setIsReactionModalActive]);

  return (
    <View style={[styles.container, style]}>
      <Restricted requiredGrants={[OwnCapability.CREATE_REACTION]}>
        <CallControlsButton
          accessibilityLabel={A11yButtons.REACTION}
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
            <UnreadBadgeCountIndicator
              count={chatButton.unreadBadgeCountIndicator}
            />
            <Chat color={theme.light.static_black} />
          </CallControlsButton>
        </View>
      )}
      <ToggleVideoButton />
      <ToggleAudioButton />
      <ToggleCameraFaceButton />
      <HangUpCallButton onPressHandler={hangUpCallButton?.onPressHandler} />
    </View>
  );
};

const UnreadBadgeCountIndicator = ({
  count,
}: {
  count: ChatButtonType['unreadBadgeCountIndicator'];
}) => {
  // Don't show badge if count is 0 or undefined
  if (!count) {
    return null;
  }

  return (
    <View
      accessibilityLabel={A11yComponents.CHAT_UNREAD_BADGE_COUNT_INDICATOR}
      style={styles.chatBadge}
    >
      <Text style={styles.chatBadgeText}>{count}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.padding.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: Z_INDEX.IN_FRONT,
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
    zIndex: Z_INDEX.IN_FRONT,
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
