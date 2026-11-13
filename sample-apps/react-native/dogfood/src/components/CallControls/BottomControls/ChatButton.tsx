import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CallControlsButton, useCall } from '@stream-io/video-react-native-sdk';
import { ControlButtonIcon } from '@stream-io/video-react-native-sdk/src/icons';
import { BadgeCountIndicator } from './BadgeCountIndicator';
import { MessageBubbles } from '../../../assets/MessageBubbles';
import { useUnreadCount } from '../../../hooks/useUnreadCount';
import { MeetingStackParamList } from '../../../../types';

/**
 * Button to open the Chat window while in the call.
 *
 * This call also display the unread count indicator/badge is there messages that are unread.
 */
export const ChatButton = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<MeetingStackParamList>>();
  const call = useCall();
  const unreadCountIndicator = useUnreadCount();

  const canOpenChat = !!navigation
    .getState()
    ?.routeNames.includes('ChatScreen');
  if (!call || !canOpenChat) return null;

  return (
    <CallControlsButton
      onPress={() => navigation.navigate('ChatScreen', { callId: call.id })}
    >
      <BadgeCountIndicator count={unreadCountIndicator} />
      <ControlButtonIcon icon={MessageBubbles} />
    </CallControlsButton>
  );
};
