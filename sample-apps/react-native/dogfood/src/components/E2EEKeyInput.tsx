import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@stream-io/video-react-native-sdk';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../contexts/AppContext';
import { appTheme } from '../theme';
import { TextInput } from './TextInput';
import { isE2EESupported } from '../utils/e2ee';

/**
 * Debug entry for the end-to-end encryption key.
 *
 * Keys are the app's business, not the SDK's, so the passphrase never leaves
 * this app: it is stretched locally and installed as a shared key. Interop with
 * the web and iOS demos relies on all three deriving the same bytes from the
 * same passphrase.
 */
export const E2EEKeyInput = () => {
  const setState = useAppGlobalStoreSetState();
  const stored = useAppGlobalStoreValue((store) => store.e2eeKeyInput) ?? '';
  const [draft, setDraft] = useState(stored);
  const styles = useStyles();

  // Persisted on every keystroke rather than on blur: tapping "Join Call" does
  // not blur a focused input on iOS, and leaving the screen never fires onBlur,
  // so a blur-only commit would let someone type a key and still join in the
  // clear.
  const onChangeText = useCallback(
    (value: string) => {
      setDraft(value);
      setState({ e2eeKeyInput: value.trim() });
    },
    [setState],
  );

  // A key on a build that cannot encrypt is not "set" in any useful sense - the
  // join will refuse rather than quietly go out in the clear, so say so here.
  const status = !draft.trim()
    ? 'Off'
    : isE2EESupported()
      ? 'Key set'
      : 'Not supported on this device';

  return (
    <View style={styles.container}>
      <Text style={styles.label}>End-to-end encryption</Text>
      <TextInput
        placeholder="Shared passphrase"
        value={draft}
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={onChangeText}
      />
      <Text style={styles.status}>{status}</Text>
    </View>
  );
};

const useStyles = () => {
  const { theme } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          marginTop: appTheme.spacing.lg,
        },
        label: {
          color: theme.colors.textPrimary,
          fontSize: 14,
          fontWeight: '500',
          marginBottom: appTheme.spacing.sm,
        },
        status: {
          color: appTheme.colors.light_gray,
          fontSize: 12,
          marginTop: appTheme.spacing.sm,
        },
      }),
    [theme],
  );
};
