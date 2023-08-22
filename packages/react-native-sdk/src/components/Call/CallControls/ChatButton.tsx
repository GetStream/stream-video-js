import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CallControlsButton } from './CallControlsButton';
import { Chat } from '../../../icons';
import { ComponentTestIds } from '../../../constants/TestIds';
import { Z_INDEX } from '../../../constants';
import { useTheme } from '../../../contexts/ThemeContext';

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
  const {
    theme: { colors },
  } = useTheme();
  return (
    // TODO: check if this View can be dropped
    <View>
      <CallControlsButton
        onPress={onPressHandler}
        // TODO: check what to do about this random style prop
        // svgContainerStyle={styles.svgContainerStyle}
      >
        {/* Move this to CallControlsButton */}
        <UnreadBadgeCountIndicator count={unreadBadgeCount} />
        <Chat color={colors.static_black} />
      </CallControlsButton>
    </View>
  );
};

const UnreadBadgeCountIndicator = ({
  count,
}: {
  count: ChatButtonProps['unreadBadgeCount'];
}) => {
  const {
    theme: { colors, typefaces },
  } = useTheme();

  // Don't show badge if count is 0 or undefined
  if (!count) {
    return null;
  }

  return (
    <View
      testID={ComponentTestIds.CHAT_UNREAD_BADGE_COUNT_INDICATOR}
      style={(styles.chatBadge, { backgroundColor: colors.error })}
    >
      <Text
        style={
          (styles.chatBadgeText,
          { color: colors.static_white },
          typefaces.bodyBold)
        }
      >
        {count}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  // svgContainerStyle: {
  //   paddingTop: theme.padding.xs,
  // },
  chatBadge: {
    borderRadius: 30,
    position: 'absolute',
    left: 15,
    bottom: 20,
    zIndex: Z_INDEX.IN_FRONT,
    height: 30,
    width: 30,
    justifyContent: 'center',
  },
  chatBadgeText: {
    textAlign: 'center',
  },
});
