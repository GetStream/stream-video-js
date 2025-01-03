import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useCallStateHooks, useTheme } from '@stream-io/video-react-native-sdk';

export const ClosedCaptions = () => {
  const { useCallClosedCaptions } = useCallStateHooks();
  const closedCaptions = useCallClosedCaptions();
  const styles = useStyles();
  return (
    <View style={styles.rootContainer}>
      {closedCaptions.map(({ user, start_time, text }) => (
        <View style={styles.closedCaptionItem} key={`${user.id}/${start_time}`}>
          <Text style={styles.speakerName}>{user.name}:</Text>
          <Text style={styles.closedCaption}>{text}</Text>
        </View>
      ))}
    </View>
  );
};

const useStyles = () => {
  const { theme } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        rootContainer: {
          backgroundColor: theme.colors.sheetPrimary,
          padding: theme.variants.spacingSizes.md,
          height: 55,
        },
        closedCaptionItem: {
          flexDirection: 'row',
          gap: theme.variants.spacingSizes.xs,
        },
        speakerName: {
          color: theme.colors.textSecondary,
        },
        closedCaption: {
          color: theme.colors.textPrimary,
        },
      }),
    [theme],
  );
};
