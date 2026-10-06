import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@stream-io/video-react-native-sdk';
import { Z_INDEX } from '../../../constants';
import { ComponentTestIds } from '../../../constants/TestIds';

/**
 * A badge that displays a number.
 *
 * @prop {number} count - The number to display in the badge.
 *
 * @returns {ReactElement} A View with a Text that displays the count in the badge.
 */
export const BadgeCountIndicator = ({
  count,
}: {
  count: number | undefined;
}) => {
  const {} = useTheme();
  const styles = useStyles();

  // Don't show badge if count is 0 or undefined
  if (!count) {
    return null;
  }

  return (
    <View
      testID={ComponentTestIds.BADGE_COUNT_INDICATOR}
      style={[styles.badge]}
    >
      <Text style={[styles.badgeText]}>{count}</Text>
    </View>
  );
};

const useStyles = () => {
  const {
    theme: { primitives },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        badge: {
          position: 'absolute',
          justifyContent: 'center',
          borderRadius: primitives.radiusSm,
          left: 13,
          bottom: 17,
          zIndex: Z_INDEX.IN_FRONT,
          height: primitives.spacingSm,
          width: primitives.spacingSm,
        },
        badgeText: {
          textAlign: 'center',
        },
      }),
    [primitives],
  );
};
