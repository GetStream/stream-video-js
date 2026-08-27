import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useCall, useI18n, useTheme } from '@stream-io/video-react-native-sdk';
import { useE2eeKeyStatus } from '../hooks/useE2eeKeyStatus';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../contexts/AppContext';
import { updateE2EESharedKeys } from '../utils/e2ee';
import { appTheme } from '../theme';
import { TextInput } from './TextInput';

/**
 * Surfaces a shared-key mismatch on an encrypted call.
 *
 * Without this a wrong meeting key looks like a broken call rather than a wrong
 * key: media arrives, fails its authentication tag and is dropped, so tiles stay
 * black and audio silent with nothing said about why.
 *
 * When the failure looks local, the banner doubles as the fix: the key can be
 * re-entered here and is pushed straight to the native manager, so a mistyped key
 * does not cost a rejoin. Dismissable, and re-armed once decryption recovers, so
 * a later mismatch is surfaced again rather than nagging about this one.
 */
export const E2EEKeyNotification = () => {
  const status = useE2eeKeyStatus();
  const call = useCall();
  const { t } = useI18n();
  const setState = useAppGlobalStoreSetState();
  const storedKey = useAppGlobalStoreValue((store) => store.e2eeKeyInput) ?? '';
  const [dismissed, setDismissed] = useState(false);
  const [draftKey, setDraftKey] = useState('');
  const styles = useStyles();

  // Re-arm once the call recovers, so a later mismatch is surfaced again.
  useEffect(() => {
    if (status.kind === 'ok') {
      setDismissed(false);
      setDraftKey('');
    }
  }, [status.kind]);

  if (status.kind === 'ok' || dismissed) return null;

  const applyKey = () => {
    const key = draftKey.trim();
    if (!key || !call) return;
    // Persist as well as apply: the stored value is what the next call is
    // created and encrypted with.
    setState({ e2eeKeyInput: key });
    updateE2EESharedKeys(call, key);
    setDraftKey('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.message}>
          {status.kind === 'local-key-mismatch'
            ? t(
                "Nobody's audio or video can be decrypted. Your meeting key is most likely wrong.",
              )
            : `${t('Cannot decrypt participants:')} ${status.names.join(', ')}`}
        </Text>
        <Pressable
          onPress={() => setDismissed(true)}
          hitSlop={12}
          accessibilityLabel={t('Dismiss')}
        >
          <Text style={styles.dismiss}>✕</Text>
        </Pressable>
      </View>
      {status.kind === 'local-key-mismatch' && (
        <View style={styles.form}>
          <TextInput
            placeholder={storedKey ? t('New meeting key') : t('Meeting key')}
            value={draftKey}
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setDraftKey}
            onSubmitEditing={applyKey}
            style={styles.input}
          />
          <Pressable
            onPress={applyKey}
            disabled={!draftKey.trim()}
            style={[styles.apply, !draftKey.trim() && styles.applyDisabled]}
          >
            <Text style={styles.applyText}>{t('Apply')}</Text>
          </Pressable>
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
          borderRadius: 8,
          marginHorizontal: appTheme.spacing.md,
          marginTop: appTheme.spacing.sm,
          padding: appTheme.spacing.md,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'flex-start',
        },
        message: {
          color: theme.colors.textPrimary,
          flex: 1,
          fontSize: 13,
        },
        dismiss: {
          color: appTheme.colors.light_gray,
          fontSize: 16,
          marginLeft: appTheme.spacing.md,
        },
        form: {
          alignItems: 'center',
          flexDirection: 'row',
          marginTop: appTheme.spacing.sm,
        },
        input: {
          flex: 1,
          marginVertical: 0,
        },
        apply: {
          backgroundColor: theme.colors.buttonPrimary,
          borderRadius: 8,
          marginLeft: appTheme.spacing.md,
          paddingHorizontal: appTheme.spacing.lg,
          paddingVertical: appTheme.spacing.sm,
        },
        applyDisabled: {
          backgroundColor: theme.colors.buttonDisabled,
        },
        applyText: {
          color: theme.colors.textPrimary,
          fontWeight: '600',
        },
      }),
    [theme],
  );
};
