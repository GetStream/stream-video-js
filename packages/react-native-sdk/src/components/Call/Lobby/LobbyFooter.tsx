import React from 'react';
import { View } from 'react-native';
import { type LobbyProps } from './Lobby';
import { useTheme } from '../../../contexts/ThemeContext';

/**
 * Props for the Lobby Footer in the Lobby component.
 */
export type LobbyFooterProps = Pick<
  LobbyProps,
  'onJoinCallHandler' | 'JoinCallButton'
>;

/**
 * The default Lobby Footer to be used in the Lobby component.
 */
export const LobbyFooter = ({
  onJoinCallHandler,
  JoinCallButton,
}: LobbyFooterProps) => {
  const {
    theme: { lobby },
  } = useTheme();

  return (
    <View style={lobby.bottomContainer}>
      {JoinCallButton && (
        <JoinCallButton onJoinCallHandler={onJoinCallHandler} />
      )}
    </View>
  );
};
