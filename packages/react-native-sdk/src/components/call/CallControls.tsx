import React, { useState } from 'react';
import {
  LayoutChangeEvent,
  LayoutRectangle,
  StyleSheet,
  Text,
  View,
  ViewProps,
} from 'react-native';
import { Chat, Reaction } from '../../icons';
import { CallControlsButton } from '../utility/internal/CallControlsButton';
import { theme } from '../../theme';
import { OwnCapability } from '@stream-io/video-client';
import { Restricted } from '@stream-io/video-react-bindings';
import { ToggleAudioButton } from '../utility/internal/ToggleAudioButton';
import { ToggleVideoButton } from '../utility/internal/ToggleVideoButton';
import { ButtonTestIds, ComponentTestIds } from '../../constants/TestIds';
import { Z_INDEX } from '../../constants';
import { ToggleCameraFaceButton } from '../utility/internal/ToggleCameraFaceButton';
import {
  HangUpCallButton,
  HangUpCallButtonProps,
} from '../utility/internal/HangupCallButton';
import { ReactionsPopup } from './ReactionsPopup';
import { StreamVideoRN } from '../../utils';

/**
 * The props for the Chat Button in the Call Controls.
 */
type ChatButtonProps = {
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
 * Props for the CallControls Component.
 */
export interface CallControlsType extends Pick<ViewProps, 'style'> {
  /**
   * Chat Button Props to be passed as an object
   */
  chatButton?: ChatButtonProps;
  /**
   * Hang up call button props to be passed as an object
   */
  hangUpCallButton?: HangUpCallButtonProps;
}

/**
 * A list/row of controls (mute audio/video, toggle front/back camera, hangup call etc.)
 * the user can trigger within an active call.
 */
export const CallControls = ({
  chatButton,
  hangUpCallButton,
  style,
}: CallControlsType) => {
  const [showReactionsPicker, setShowReactionsPicker] =
    useState<boolean>(false);

  const [reactionsButtonLayoutRectangle, setReactionsButtonLayoutRectangle] =
    useState<LayoutRectangle>();

  // This is for the reaction popup
  const onReactionsButtonLayout = (event: LayoutChangeEvent) => {
    const layout = event.nativeEvent.layout;
    setReactionsButtonLayoutRectangle((prev) => {
      if (
        prev &&
        prev.width === layout.width &&
        prev.height === layout.height &&
        prev.x === layout.x &&
        prev.y === layout.y
      ) {
        return prev;
      }
      return layout;
    });
  };

  return (
    <View style={[styles.container, style]}>
      <Restricted requiredGrants={[OwnCapability.CREATE_REACTION]}>
        <CallControlsButton
          testID={ButtonTestIds.REACTION}
          onPress={() => {
            setShowReactionsPicker(true);
          }}
          color={theme.light.static_white}
          style={styles.button}
          onLayout={onReactionsButtonLayout}
        >
          <Reaction color={theme.light.static_black} />
        </CallControlsButton>
      </Restricted>
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

      {showReactionsPicker && (
        <ReactionsPopup
          reactions={StreamVideoRN.getConfig().supportedReactions}
          reactionsButtonLayoutRectangle={reactionsButtonLayoutRectangle}
          onRequestedClose={() => {
            setShowReactionsPicker(false);
          }}
        />
      )}
    </View>
  );
};

const UnreadBadgeCountIndicator = ({
  count,
}: {
  count: ChatButtonProps['unreadBadgeCountIndicator'];
}) => {
  // Don't show badge if count is 0 or undefined
  if (!count) {
    return null;
  }

  return (
    <View
      testID={ComponentTestIds.CHAT_UNREAD_BADGE_COUNT_INDICATOR}
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
    backgroundColor: theme.light.static_black,
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
