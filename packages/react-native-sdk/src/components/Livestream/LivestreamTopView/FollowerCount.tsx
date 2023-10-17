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
      followerCount,
    },
  } = useTheme();
  const { useParticipantCount } = useCallStateHooks();
  const totalParticipants = useParticipantCount();
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.dark_gray },
        followerCount.container,
      ]}
    >
      <View
        style={[
          styles.icon,
          { height: iconSizes.xs, width: iconSizes.xs },
          followerCount.icon,
        ]}
      >
        <Eye />
      </View>
      <Text
        style={[
          styles.label,
          { color: colors.static_white },
          followerCount.label,
        ]}
      >
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
  label: {
    fontSize: 13,
    fontWeight: '400',
    flexShrink: 1,
    textAlign: 'center',
    includeFontPadding: false,
    marginLeft: 4,
  },
});
