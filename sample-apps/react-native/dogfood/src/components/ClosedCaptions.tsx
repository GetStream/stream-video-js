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
          width: '100%',
          minHeight: 55,
        },
        closedCaptionItem: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          flexShrink: 1,
          gap: theme.variants.spacingSizes.xs,
          alignItems: 'flex-start',
          marginBottom: 4,
        },
        speakerName: {
          color: theme.colors.textSecondary,
        },
        closedCaption: {
          color: theme.colors.textPrimary,
          flexShrink: 1,
          flex: 1,
        },
      }),
    [theme],
  );
};
