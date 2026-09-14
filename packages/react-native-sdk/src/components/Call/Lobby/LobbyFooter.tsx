import React, { useMemo } from 'react';
import { type LobbyProps } from './Lobby';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { useI18n } from '../../../i18n';
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
  const styles = useStyles();
  const { useCallSession } = useCallStateHooks();
  const { t } = useI18n();
  const session = useCallSession();
  const numberOfParticipants = session?.participants.length;

  const participantsText = useMemo(() => {
    if (!numberOfParticipants) {
      return t(
        'lobby.footer.noOtherParticipants.text',
        'Currently there are no other participants in the call.',
      );
    }
    // i18next picks the singular/plural form for the active language via
    // Intl.PluralRules, so no `=== 1` branch is needed here.
    return t('lobby.footer.otherParticipants.text', {
      count: numberOfParticipants,
      defaultValue_one: 'There is {{ count }} more person in the call.',
      defaultValue_other: 'There are {{ count }} more people in the call.',
    });
  }, [numberOfParticipants, t]);

  return (
    <View style={[styles.mainContainer, lobby.infoContainer]}>
      <View style={styles.textContainer}>
        <View style={styles.iconContainer}>
          <Lock color={colors.iconPrimary} size={variants.iconSizes.md} />
        </View>
        <Text
          style={[
            { color: colors.textPrimary },
            styles.infoText,
            lobby.infoText,
          ]}
        >
          {t('lobby.footer.aboutToJoin.text', 'You are about to join a call.') +
            ' ' +
            participantsText}
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
    [theme],
  );
};
