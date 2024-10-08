import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useCallStateHooks } from '@stream-io/video-react-native-sdk';
import { appTheme } from '../theme';

export const ClosedCaptions = () => {
  const { useCallClosedCaptions } = useCallStateHooks();
  const closedCaptions = useCallClosedCaptions();
  return (
    <View style={styles.rootContainer}>
      {closedCaptions.map(({ speaker_name, start_time, text }) => (
        <View
          style={styles.closedCaptionItem}
          key={`${speaker_name}/${start_time}`}
        >
          <Text style={styles.speakerName}>{speaker_name}:</Text>
          <Text style={styles.closedCaption}>{text}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    backgroundColor: appTheme.colors.static_overlay,
    paddingVertical: 6,
    paddingHorizontal: 6,
    height: 50,
  },
  closedCaptionItem: {
    flexDirection: 'row',
    gap: 8,
  },
  speakerName: {
    color: appTheme.colors.light_gray,
  },
  closedCaption: {
    color: appTheme.colors.static_white,
  },
});
