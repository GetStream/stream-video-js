import React from 'react';
import { LobbyProps } from './Lobby';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useCall, useI18n } from '@stream-io/video-react-bindings';
import { useTheme } from '../../../contexts/ThemeContext';

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
  const {
    theme: { colors, typefaces, joinCallButton },
  } = useTheme();
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
    <Pressable
      style={[
        styles.container,
        { backgroundColor: colors.primary },
        joinCallButton.container,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.label,
          {
            color: colors.static_white,
          },
          typefaces.subtitleBold,
          joinCallButton.label,
        ]}
      >
        {t('Join')}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    marginTop: 16,
    paddingVertical: 8,
  },
  label: {
    textAlign: 'center',
  },
});
