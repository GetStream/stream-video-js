import React, { useMemo } from 'react';
import { LobbyProps } from './Lobby';
import { View, StyleSheet, Text } from 'react-native';
import { useI18n } from '@stream-io/video-react-bindings';
import { useTheme } from '../../../contexts/ThemeContext';
import { Lock } from '../../../icons/Lock';

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
    theme: { colors, lobby, variants },
  } = useTheme();
  const { t } = useI18n();
  const styles = useStyles();

  return (
    <View style={[styles.mainContainer, lobby.infoContainer]}>
      <View style={styles.textContainer}>
        <View style={styles.iconContainer}>
          <Lock color={colors.textPrimary} size={variants.iconSizes.md} />
        </View>
        <Text
          style={[
            { color: colors.textPrimary },
            styles.infoText,
            lobby.infoText,
          ]}
        >
          {t(
            "Start a private test call. This demo is built on Stream's SDKs and runs on our global edge network."
          )}
        </Text>
      </View>
      {JoinCallButton && (
        <JoinCallButton onJoinCallHandler={onJoinCallHandler} />
      )}
    </View>
  );
};

const useStyles = () => {
  const { theme } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        mainContainer: {
          padding: theme.variants.spacingSizes.sm,
        },
        textContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.sheetTertiary,
          paddingHorizontal: theme.variants.spacingSizes.md,
          paddingVertical: theme.variants.spacingSizes.xs,
          borderRadius: theme.variants.borderRadiusSizes.sm,
        },
        iconContainer: {
          marginRight: theme.variants.spacingSizes.sm,
        },
        infoText: {
          fontSize: theme.variants.fontSizes.sm,
          lineHeight: 20,
          fontWeight: '400',
        },
      }),
    [theme]
  );
};
