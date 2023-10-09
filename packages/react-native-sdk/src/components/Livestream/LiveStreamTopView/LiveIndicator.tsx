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
    theme: { colors, typefaces },
  } = useTheme();
  const { t } = useI18n();
  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <Text
        style={[
          styles.liveLabel,
          { color: colors.static_white },
          typefaces.subtitleBold,
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
  liveLabel: {
    textAlign: 'center',
    includeFontPadding: false,
  },
});
