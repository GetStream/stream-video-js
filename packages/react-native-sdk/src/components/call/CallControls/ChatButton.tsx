import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CallControlsButton } from './CallControlsButton';
import { theme } from '../../../theme';
import { Chat } from '../../../icons';
import { ComponentTestIds } from '../../../constants/TestIds';
import { Z_INDEX } from '../../../constants';

/**
 * The props for the Chat Button in the Call Controls.
 */
export type ChatButtonProps = {
  /**
   * Handler to be called when the chat button is pressed.
   * @returns void
   */
  onPressHandler?: () => void;
  /**
   * The count of the current unread message to be displayed above on the Chat button.
   */
  unreadBadgeCount?: number;
};

/**
 * Button to open the Chat window while in the call.
 *
 * This call also display the unread count indicator/badge is there messages that are unread.
 */
export const ChatButton = ({
  onPressHandler,
  unreadBadgeCount,
}: ChatButtonProps) => {
  return (
    <View>
      <CallControlsButton
        color={theme.light.static_white}
        onPress={onPressHandler}
        svgContainerStyle={styles.svgContainerStyle}
      >
        <UnreadBadgeCountIndicator count={unreadBadgeCount} />
        <Chat color={theme.light.static_black} />
      </CallControlsButton>
    </View>
  );
};

const UnreadBadgeCountIndicator = ({
  count,
}: {
  count: ChatButtonProps['unreadBadgeCount'];
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
