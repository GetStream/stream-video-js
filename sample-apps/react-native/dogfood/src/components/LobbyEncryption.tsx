import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {
  useCall,
  useCallStateHooks,
  useConnectedUser,
  useTheme,
} from '@stream-io/video-react-native-sdk';
import { LockIcon } from './LockIcon';
import { TextInput } from './TextInput';
import { useLobbyE2EE } from '../contexts/LobbyE2EEContext';
import { useAppGlobalStoreValue } from '../contexts/AppContext';
import { useAppI18n } from '../hooks/useAppI18n';
import { getRandomWords } from '../modules/helpers/randomWords';
import { getInviteUrl } from '../utils/inviteLink';
import { isCallEncrypted } from '../utils/e2ee';
import { appTheme } from '../theme';

/**
 * Lobby card for an end-to-end encrypted call: the shared key, the invite link
 * that carries it, and who turned encryption on. Based on the react-dogfood
 * app's `LobbyEncryption`.
 *
 * Encryption itself is chosen before the lobby (see `MeetingEncryptionSetup`),
 * because it is fixed when the call is created; here the call already exists,
 * so there is nothing to toggle. The shared key is client-side only, so editing
 * it updates the current call without creating a new one.
 *
 * Rendered only where a provider exists, i.e. in the `pronto` environments.
 */
export const LobbyEncryption = () => {
  const { t } = useAppI18n();
  const e2ee = useLobbyE2EE();
  const call = useCall();
  const environment = useAppGlobalStoreValue((store) => store.appEnvironment);
  const { useCallSettings, useCallCreatedBy } = useCallStateHooks();
  const settings = useCallSettings();
  const createdBy = useCallCreatedBy();
  const connectedUser = useConnectedUser();
  const { theme } = useTheme();
  const styles = useStyles();

  const [copied, setCopied] = useState(false);
  const copyResetRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(copyResetRef.current), []);
  // A joiner who arrived with the key should not be able to edit (and break) a
  // working key; one who did not has to type it in.
  const [arrivedWithKey] = useState(!!e2ee?.encryptionKey?.trim());

  const encryptionKey = e2ee?.encryptionKey ?? '';

  const onRefresh = useCallback(() => {
    e2ee?.updateEncryptionKey(getRandomWords(3));
  }, [e2ee]);

  const onCopyLink = useCallback(() => {
    if (!call) return;
    Clipboard.setString(
      getInviteUrl(environment, call.id, encryptionKey.trim() || undefined),
    );
    setCopied(true);
    clearTimeout(copyResetRef.current);
    copyResetRef.current = setTimeout(() => setCopied(false), 2000);
  }, [call, environment, encryptionKey]);

  // Creator vs joiner and encrypted vs plain are only known once the call
  // response arrives, so until then nothing renders.
  if (!e2ee || !settings || !createdBy) return null;

  const isEncryptedCall = isCallEncrypted(settings);
  if (!isEncryptedCall) {
    // A key was brought along for a call that already exists unencrypted:
    // encryption cannot be added now, so say so rather than joining in the
    // clear without a word.
    if (!e2ee.encryptionKey?.trim()) return null;
    return (
      <View style={styles.container}>
        <View style={styles.switchRow}>
          <LockIcon color={theme.colors.iconWarning} size={18} />
          <View style={styles.text}>
            <Text style={styles.title}>
              {t(
                'encryption.lobby.notEncrypted.title',
                'This call is not end-to-end encrypted',
              )}
            </Text>
            <Text style={styles.subtitle}>
              {t(
                'encryption.lobby.notEncrypted.description',
                'It was created without encryption, so your key will not be used. Start a new call to encrypt it.',
              )}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const isCreator =
    !!connectedUser && !!createdBy && createdBy.id === connectedUser.id;
  const needsKey = !isCreator && !arrivedWithKey;
  const keyReadOnly = !isCreator && arrivedWithKey;
  const creatorName = createdBy.name || createdBy.id;

  return (
    <View style={[styles.container, styles.containerOn]}>
      <View style={styles.switchRow}>
        <LockIcon color={theme.colors.iconPrimary} size={18} />
        <View style={styles.text}>
          <Text style={styles.title}>
            {t(
              'encryption.lobby.endToEndEncryption.title',
              'End-to-end encryption',
            )}
          </Text>
          <Text style={styles.subtitle}>
            {needsKey
              ? t(
                  'encryption.lobby.enterSharedKey.description',
                  'Enter the shared key to join',
                )
              : isCreator
                ? t(
                    'encryption.lobby.onlyPeopleWithKey.description',
                    'Only people with the key can join',
                  )
                : `${t('encryption.lobby.enabledBy.text', 'Enabled by')} ${creatorName}`}
          </Text>
        </View>
      </View>

      <View style={styles.details}>
        <Text style={styles.keyLabel}>
          {t('encryption.lobby.sharedKey.label', 'Shared key')}
        </Text>
        <View style={styles.keyRow}>
          <TextInput
            value={encryptionKey}
            editable={!keyReadOnly}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            placeholder={t(
              'encryption.lobby.sharedRoomKey.placeholder',
              'Shared room key',
            )}
            onChangeText={e2ee.updateEncryptionKey}
          />
          {isCreator && (
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
          )}
          <Pressable
            accessibilityRole="button"
            onPress={onCopyLink}
            style={styles.copyButton}
          >
            <Text style={styles.copyButtonText}>
              {copied
                ? t('common.copied.label', 'Copied')
                : t('common.copyLink.label', 'Copy link')}
            </Text>
          </Pressable>
        </View>
        <Text style={styles.hint}>
          {needsKey
            ? t(
                'encryption.lobby.askCreatorForKey.description',
                'Ask the call creator for the shared key, then enter it here.',
              )
            : t(
                'encryption.lobby.shareKeyWarning.description',
                'Anyone with this key (or the invite link that contains it) can join the call. Share it only with people you trust.',
              )}
        </Text>
      </View>
    </View>
  );
};

const useStyles = () => {
  const { theme } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          alignSelf: 'stretch',
          backgroundColor: theme.colors.sheetSecondary,
          borderColor: theme.colors.buttonDisabled,
          borderRadius: 12,
          borderWidth: 1,
          marginTop: appTheme.spacing.md,
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
        copyButton: {
          backgroundColor: theme.colors.buttonPrimary,
          borderRadius: 8,
          paddingHorizontal: appTheme.spacing.md,
          paddingVertical: appTheme.spacing.sm,
        },
        copyButtonText: {
          color: theme.colors.textPrimary,
          fontSize: 14,
          fontWeight: '600',
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
