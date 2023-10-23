import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../contexts';
import { useI18n } from '@stream-io/video-react-bindings';

/**
 * Props for the LiveIndicator component.
 */
export type LiveIndicatorProps = {};

/**
 * The LiveIndicator component displays whether the live stream is live or not.
 */
export const LiveIndicator = ({}: LiveIndicatorProps) => {
  const {
    theme: { colors, typefaces, liveIndicator },
  } = useTheme();
  const { t } = useI18n();
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.primary },
        liveIndicator.container,
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: colors.static_white },
          typefaces.subtitleBold,
          liveIndicator.label,
        ]}
      >
        {t('Live')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    justifyContent: 'center',
  },
  label: {
    textAlign: 'center',
    includeFontPadding: false,
  },
});
