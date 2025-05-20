import React, { useMemo } from 'react';
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
  const styles = useStyles();
  const {
    theme: { colors, typefaces, liveIndicator },
  } = useTheme();
  const { t } = useI18n();
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.buttonPrimary },
        liveIndicator.container,
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: colors.textPrimary },
          typefaces.subtitleBold,
          liveIndicator.label,
        ]}
      >
        {t('Live')}
      </Text>
    </View>
  );
};

const useStyles = () => {
  const { theme } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingHorizontal: theme.variants.spacingSizes.sm,
          paddingVertical: theme.variants.spacingSizes.sm,
          borderTopLeftRadius: theme.variants.borderRadiusSizes.sm,
          borderBottomLeftRadius: theme.variants.borderRadiusSizes.sm,
          justifyContent: 'center',
        },
        label: {
          textAlign: 'center',
          includeFontPadding: false,
        },
      }),
    [theme],
  );
};
