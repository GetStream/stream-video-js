import React from 'react';
import {
  CallControlsButton,
  useTheme,
} from '@stream-io/video-react-native-sdk';
import { IconWrapper } from '@stream-io/video-react-native-sdk/src/icons';
import { BadgeCountIndicator } from './BadgeCountIndicator';
import Chat from '../../assets/Chat';
import { useUnreadCount } from '../../hooks/useUnreadCount';

/**
 * The props for the Chat Button in the Call Controls.
 */
export type ChatButtonProps = {
  /**
   * Handler to be called when the chat button is pressed.
   * @returns void
   */
  onPressHandler?: () => void;
};

/**
 * Button to open the Chat window while in the call.
 *
 * This call also display the unread count indicator/badge is there messages that are unread.
 */
export const ChatButton = ({ onPressHandler }: ChatButtonProps) => {
  const {
    theme: { colors, chatButton, variants },
  } = useTheme();
  const unreadCountIndicator = useUnreadCount();
  return (
    <CallControlsButton onPress={onPressHandler} style={chatButton}>
      <BadgeCountIndicator count={unreadCountIndicator} />
      <IconWrapper>
        <Chat color={colors.iconPrimary} size={variants.iconSizes.md} />
      </IconWrapper>
    </CallControlsButton>
  );
};
