import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../contexts';
import { ShieldBadge } from '../../../icons';
import { useCall } from '@stream-io/video-react-bindings';

/**
 * Props for the HostDurationBadge component.
 */
export type ViewerDurationBadgeProps = {};

/**
 * The ViewerDurationBadge component displays the duration while the live stream is active for the viewer.
 */
export const ViewerDurationBadge = ({}: ViewerDurationBadgeProps) => {
  const [duration, setDuration] = useState(0);
  const call = useCall();
  const {
    theme: {
      colors,
      variants: { iconSizes },
    },
  } = useTheme();

  useEffect(() => {
    let intervalId: NodeJS.Timer;
    intervalId = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [call]);

  const timestamp = new Date(duration * 1000).toISOString().slice(11, 19);

  return (
    <View style={[styles.container, { backgroundColor: colors.dark_gray }]}>
      <View
        style={[
          styles.icon,
          {
            height: iconSizes.xs,
            width: iconSizes.xs,
          },
        ]}
      >
        <ShieldBadge />
      </View>
      <Text style={[styles.durationLabel, { color: colors.static_white }]}>
        {timestamp}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {},
  durationLabel: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '400',
    flexShrink: 1,
    includeFontPadding: false,
    paddingLeft: 4,
  },
});
