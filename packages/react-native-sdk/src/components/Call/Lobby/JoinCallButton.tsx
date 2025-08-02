import React, { useMemo, useState } from 'react';
import { type LobbyProps } from './Lobby';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useCall, useI18n } from '@stream-io/video-react-bindings';
import { useTheme } from '../../../contexts/ThemeContext';
import { getLogger } from '@stream-io/video-client';

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
  const styles = useStyles();
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useI18n();
  const call = useCall();

  const onPress = async () => {
    setIsLoading(true);
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
      const logger = getLogger(['JoinCallButton']);
      logger('error', 'Error joining call:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const backgroundColor = isLoading
    ? colors.buttonDisabled
    : colors.buttonPrimary;

  return (
    <Pressable
      style={[styles.container, { backgroundColor }, joinCallButton.container]}
      onPress={onPress}
      disabled={isLoading}
    >
      <Text
        style={[
          styles.label,
          { color: colors.textPrimary },
          typefaces.subtitleBold,
          joinCallButton.label,
        ]}
      >
        {isLoading ? t('Joining...') : t('Join')}
      </Text>
    </Pressable>
  );
};

const useStyles = () => {
  const { theme } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          borderRadius: theme.variants.borderRadiusSizes.lg,
          marginTop: theme.variants.spacingSizes.md,
          paddingVertical: theme.variants.spacingSizes.sm,
        },
        label: {
          textAlign: 'center',
        },
      }),
    [theme],
  );
};
