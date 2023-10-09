import React from 'react';
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
  const {
    theme: {
      colors,
      variants: { iconSizes },
    },
  } = useTheme();
  const { useParticipantCount } = useCallStateHooks();
  const totalParticipants = useParticipantCount();
  return (
    <View style={[styles.container, { backgroundColor: colors.dark_gray }]}>
      <View
        style={[styles.icon, { height: iconSizes.xs, width: iconSizes.xs }]}
      >
        <Eye />
      </View>
      <Text style={[styles.countLabel, { color: colors.static_white }]}>
        {totalParticipants}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {},
  countLabel: {
    fontSize: 13,
    fontWeight: '400',
    flexShrink: 1,
    textAlign: 'center',
    includeFontPadding: false,
    marginLeft: 4,
  },
});
