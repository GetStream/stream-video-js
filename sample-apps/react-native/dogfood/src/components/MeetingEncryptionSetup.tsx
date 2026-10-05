import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useTheme } from '@stream-io/video-react-native-sdk';
import { LockIcon } from './LockIcon';
import { TextInput } from './TextInput';
import { useAppI18n } from '../hooks/useAppI18n';
import { appTheme } from '../theme';

type Props = {
  enabled: boolean;
  encryptionKey: string;
  onToggle: (enabled: boolean) => void;
  onKeyChange: (key: string) => void;
  onRefresh: () => void;
};

/**
 * Pre-lobby switch that makes the next meeting end-to-end encrypted.
 *
 * Encryption is fixed when a call is created, so it is chosen here, before the
 * call exists, rather than in the lobby: the call is then created encrypted
 * from the start and never has to be recreated. The key it produces belongs to
 * that one meeting and travels with it into the lobby.
 */
export const MeetingEncryptionSetup = ({
  enabled,
  encryptionKey,
  onToggle,
  onKeyChange,
  onRefresh,
}: Props) => {
  const { t } = useAppI18n();
  const { theme } = useTheme();
  const styles = useStyles();

  return (
    <View style={[styles.container, enabled && styles.containerOn]}>
      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: enabled }}
        onPress={() => onToggle(!enabled)}
        style={styles.switchRow}
      >
        <LockIcon color={theme.colors.iconPrimary} size={18} />
        <View style={styles.text}>
          <Text style={styles.title}>
            {t(
              'encryption.lobby.endToEndEncryption.title',
              'End-to-end encryption',
            )}
          </Text>
          <Text style={styles.subtitle}>
            {enabled
              ? t(
                  'encryption.lobby.onlyPeopleWithKey.description',
                  'Only people with the key can join',
                )
              : t(
                  'encryption.lobby.encryptWithSharedKey.description',
                  'Encrypt this call with a shared key',
                )}
          </Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      </Pressable>

      {enabled && (
        <View style={styles.details}>
          <Text style={styles.keyLabel}>
            {t('encryption.lobby.sharedKey.label', 'Shared key')}
          </Text>
          <View style={styles.keyRow}>
            <TextInput
              value={encryptionKey}
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              placeholder={t(
                'encryption.lobby.sharedRoomKey.placeholder',
                'Shared room key',
              )}
              onChangeText={onKeyChange}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t(
                'encryption.lobby.generateNewKey.label',
                'Generate a new key',
              )}
              hitSlop={8}
              onPress={onRefresh}
              style={styles.iconButton}
            >
              <Text style={styles.iconButtonText}>↻</Text>
            </Pressable>
          </View>
          <Text style={styles.hint}>
            {t(
              'encryption.setup.appliesTo.description',
              'Applies to the call you start or join next. Joining an existing call keeps its own encryption setting.',
            )}
          </Text>
        </View>
      )}
    </View>
  );
};

const useStyles = () => {
  const { theme } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: theme.colors.sheetSecondary,
          borderColor: theme.colors.buttonDisabled,
          borderRadius: 12,
          borderWidth: 1,
          marginTop: appTheme.spacing.lg,
          padding: appTheme.spacing.md,
        },
        containerOn: {
          borderColor: theme.colors.buttonPrimary,
        },
        switchRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: appTheme.spacing.md,
        },
        text: {
          flex: 1,
        },
        title: {
          color: theme.colors.textPrimary,
          fontSize: 15,
          fontWeight: '600',
        },
        subtitle: {
          color: appTheme.colors.light_gray,
          fontSize: 13,
          marginTop: 2,
        },
        details: {
          marginTop: appTheme.spacing.md,
        },
        keyLabel: {
          color: appTheme.colors.light_gray,
          fontSize: 12,
          fontWeight: '500',
        },
        keyRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: appTheme.spacing.sm,
        },
        iconButton: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: appTheme.spacing.sm,
        },
        iconButtonText: {
          color: theme.colors.textPrimary,
          fontSize: 22,
        },
        hint: {
          color: appTheme.colors.light_gray,
          fontSize: 12,
          marginTop: appTheme.spacing.xs,
        },
      }),
    [theme],
  );
};
