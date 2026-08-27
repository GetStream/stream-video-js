import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useCallStateHooks, useTheme } from '@stream-io/video-react-native-sdk';
import { LockIcon } from '../../LockIcon';

/**
 * Lock chip shown while the call is actually encrypted.
 *
 * Driven by `useE2eeEnabled()`, which reflects the SFU's join response rather
 * than local intent: having attached a manager is not proof the server accepted
 * the call as encrypted, and a badge that claimed otherwise would be worse than
 * no badge.
 *
 * Icon only, with the wording in the accessibility label. The web app keeps a
 * text label but drops it below its `sm` breakpoint, where a labelled chip would
 * overflow the header next to the call timer - on a phone that is always the
 * case, so the label is always dropped here.
 */
export const E2EEBadge = () => {
  const { useE2eeEnabled } = useCallStateHooks();
  const e2eeEnabled = useE2eeEnabled();
  const { theme } = useTheme();
  const styles = useStyles();

  if (!e2eeEnabled) return null;

  return (
    <View
      style={styles.container}
      accessible
      accessibilityLabel="End-to-end encrypted"
    >
      <LockIcon color={theme.colors.iconSuccess} size={16} />
    </View>
  );
};

const useStyles = () => {
  const { theme } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          alignItems: 'center',
          backgroundColor: theme.colors.buttonSecondary,
          borderRadius: 8,
          height: 36,
          justifyContent: 'center',
          width: 36,
        },
      }),
    [theme],
  );
};
