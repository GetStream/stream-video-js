import React from 'react';
import { LobbyProps } from './Lobby';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useCall, useI18n } from '@stream-io/video-react-bindings';
import { theme } from '../../../theme';

/**
 * Props for the Join Call Button in the Lobby component.
 */
export type JoinCallButtonProps = Pick<LobbyProps, 'onJoinCallHandler'> & {
  onPressHandler?: () => void;
};

/**
 * The default Join call button to be used in the Lobby component.
 */
export const JoinCallButton = ({
  onJoinCallHandler,
  onPressHandler,
}: JoinCallButtonProps) => {
  const { t } = useI18n();
  const call = useCall();

  const onPress = async () => {
    if (onPressHandler) {
      onPressHandler();
      return;
    }
    try {
      await call?.join({ create: true });
      if (onJoinCallHandler) {
        onJoinCallHandler();
      }
    } catch (error) {
      console.error('Error joining call:', error);
    }
  };

  return (
    <Pressable style={styles.joinButton} onPress={onPress}>
      <Text style={styles.joinButtonText}>{t('Join')}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  joinButton: {
    backgroundColor: theme.light.primary,
    borderRadius: theme.rounded.sm,
    marginTop: theme.margin.md,
    paddingVertical: theme.padding.sm,
  },
  joinButtonText: {
    color: theme.light.static_white,
    textAlign: 'center',
    ...theme.fonts.subtitleBold,
  },
});
