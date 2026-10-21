import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../contexts';
import { useI18n } from '../../../i18n';

/**
 * Props for the LiveIndicator component.
 */
export type LiveIndicatorProps = {
  isLive: boolean;
};

/**
 * The LiveIndicator component displays whether the live stream is live or not.
 */
export const LiveIndicator = ({ isLive }: LiveIndicatorProps) => {
  const {
    theme: { liveIndicator },
  } = useTheme();
  const { t } = useI18n();
  if (!isLive) {
    return null;
  }
  return (
    <View style={[styles.container, liveIndicator.container]}>
      <View style={liveIndicator.indicator} />
      <Text style={liveIndicator.label}>{t('common.live.label', 'LIVE')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
