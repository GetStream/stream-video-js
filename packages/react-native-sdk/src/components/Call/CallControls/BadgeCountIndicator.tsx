import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { ComponentTestIds } from '../../../constants/TestIds';
import { Z_INDEX } from '../../../constants';

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
  const {
    theme: { colors, typefaces },
  } = useTheme();
  const styles = useStyles();

  // Don't show badge if count is 0 or undefined
  if (!count) {
    return null;
  }

  return (
    <View
      testID={ComponentTestIds.BADGE_COUNT_INDICATOR}
      style={[styles.badge, { backgroundColor: colors.iconAlertSuccess }]}
    >
      <Text
        style={[
          styles.badgeText,
          { color: colors.sheetPrimary },
          typefaces.caption,
        ]}
      >
        {count}
      </Text>
    </View>
  );
};

const useStyles = () => {
  const { theme } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        badge: {
          position: 'absolute',
          justifyContent: 'center',
          borderRadius: theme.defaults.borderRadius,
          left: 13,
          bottom: 17,
          zIndex: Z_INDEX.IN_FRONT,
          height: theme.variants.roundButtonSizes.xs,
          width: theme.variants.roundButtonSizes.xs,
        },
        badgeText: {
          textAlign: 'center',
        },
      }),
    [theme]
  );
};
