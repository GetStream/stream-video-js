import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useCallStateHooks, useTheme } from '@stream-io/video-react-native-sdk';

export const ClosedCaptions = () => {
  const { useCallClosedCaptions } = useCallStateHooks();
  const closedCaptions = useCallClosedCaptions();
  const styles = useStyles();

  if (closedCaptions.length === 0) {
    return null;
  }

  return (
    <View style={styles.rootContainer}>
      {closedCaptions.map(({ user, start_time, text }) => (
        <View style={styles.closedCaptionItem} key={`${user.id}/${start_time}`}>
          <Text style={styles.speakerName}>{`${user.name}:`}</Text>
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
          padding: theme.variants.spacingSizes.sm,
          width: '100%',
        },
        closedCaptionItem: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          columnGap: theme.variants.spacingSizes.xs,
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
