import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../contexts';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { Eye } from '../../../icons';

/**
 * Props for the FollowerCount component.
 */
export type FollowerCountProps = {};

/**
 * The FollowerCount component that displays the number of participants while in the call.
 */
export const FollowerCount = ({}: FollowerCountProps) => {
  const styles = useStyles();
  const {
    theme: { followerCount },
  } = useTheme();

  const { useParticipantCount } = useCallStateHooks();
  const totalParticipants = useParticipantCount();

  return (
    <View style={[styles.container, followerCount.container]}>
      <View style={[styles.icon, followerCount.icon]}>
        <Eye />
      </View>
      <Text style={[styles.label, followerCount.label]}>
        {totalParticipants}
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
          paddingVertical: 4,
          borderTopRightRadius: 4,
          borderBottomRightRadius: 4,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.sheetTertiary,
        },
        icon: {
          height: theme.variants.iconSizes.sm,
          width: theme.variants.iconSizes.sm,
        },
        label: {
          fontSize: theme.variants.fontSizes.md,
          fontWeight: '600',
          flexShrink: 1,
          textAlign: 'center',
          includeFontPadding: false,
          marginLeft: theme.variants.spacingSizes.xs,
          color: theme.colors.textPrimary,
        },
      }),
    [theme],
  );
};
