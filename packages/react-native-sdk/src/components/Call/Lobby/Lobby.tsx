import React, { type ComponentType } from 'react';
import { StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import {
  LobbyControls as DefaultLobbyControls,
  LobbyControlsProps,
} from '../CallControls/LobbyControls';
import {
  JoinCallButton as DefaultJoinCallButton,
  type JoinCallButtonProps,
} from './JoinCallButton';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  LobbyFooter as DefaultLobbyFooter,
  type LobbyFooterProps,
} from './LobbyFooter';
import {
  LobbyHeader as DefaultLobbyHeader,
  type LobbyHeaderProps,
} from './LobbyHeader';
import { LobbyContent } from './LobbyContent';

/**
 * Props for the Lobby Component.
 */
export type LobbyProps = {
  /**
   * Check if device is in landscape mode.
   * This will apply the landscape mode styles to the component.
   */
  landscape?: boolean;
  /**
   * Handler to be called to join a call.
   */
  onJoinCallHandler?: () => void;
  /**
   * Component to customize the LobbyControls component.
   */
  LobbyControls?: ComponentType<LobbyControlsProps> | null;
  /**
   * Component to customize the Join Call Button in the Lobby component.
   */
  JoinCallButton?: ComponentType<JoinCallButtonProps> | null;
  /**
   * Component to customize the Lobby Footer in the Lobby component.
   */
  LobbyFooter?: ComponentType<LobbyFooterProps> | null;
  /**
   * Component to customize the Lobby Header in the Lobby component.
   */
  LobbyHeader?: ComponentType<LobbyHeaderProps> | null;
  /**
   * Style applied to the Lobby component.
   */
  style?: StyleProp<ViewStyle>;
};

/**
 * Components that acts as a pre-join view for the call. Where you can preview your video and audio. Check for call details and check for number of participants already in the call.
 */
export const Lobby = ({
  landscape = false,
  LobbyControls = DefaultLobbyControls,
  LobbyHeader = DefaultLobbyHeader,
  LobbyFooter = DefaultLobbyFooter,
  JoinCallButton = DefaultJoinCallButton,
  onJoinCallHandler,
  style,
}: LobbyProps) => {
  const {
    theme: { lobby },
  } = useTheme();

  if (landscape) {
    return (
      <View style={[styles.landscapeContainer, lobby.container, style]}>
        <LobbyContent landscape={landscape} />
        <View style={styles.landscapeControlsContainer}>
          {LobbyHeader && <LobbyHeader landscape={landscape} />}
          {LobbyControls && <LobbyControls landscape={landscape} />}
          {LobbyFooter && (
            <LobbyFooter
              JoinCallButton={JoinCallButton}
              onJoinCallHandler={onJoinCallHandler}
            />
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, lobby.container, style]}>
      {LobbyHeader && <LobbyHeader landscape={landscape} />}
      <LobbyContent landscape={landscape} />
      {LobbyControls && <LobbyControls />}
      {LobbyFooter && (
        <LobbyFooter
          JoinCallButton={JoinCallButton}
          onJoinCallHandler={onJoinCallHandler}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'column',
  },
  landscapeContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    flexDirection: 'row',
  },
  landscapeControlsContainer: {
    flex: 1,
    flexDirection: 'column',
    paddingHorizontal: 16,
  },
});
