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
//TODO: UPDATE
export const LiveIndicator = ({}: LiveIndicatorProps) => {
  const styles = useStyles();
  const {
    theme: { liveIndicator },
  } = useTheme();
  const { t } = useI18n();
  return (
    <View style={[styles.container, liveIndicator.container]}>
      <Text style={[styles.label, liveIndicator.label]}>{t('Live')}</Text>
    </View>
  );
};

const useStyles = () => {
  const {
    theme: { primitives, components },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingHorizontal: primitives.spacingSm,
          paddingVertical: primitives.spacingSm,
          borderTopLeftRadius: components.buttonRadiusSm,
          borderBottomLeftRadius: components.buttonRadiusSm,
          justifyContent: 'center',
        },
        label: {
          textAlign: 'center',
          includeFontPadding: false,
        },
      }),
    [primitives, components],
  );
};
