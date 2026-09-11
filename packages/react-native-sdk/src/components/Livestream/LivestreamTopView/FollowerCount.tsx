import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../contexts';
import { humanize } from '@stream-io/video-client';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { Users } from '../../../icons';

/**
 * Props for the FollowerCount component.
 */
export type FollowerCountProps = {
  /**
   * Humanize the participant count. @default true
   * @example 1000 -> 1k
   * @example 1450 -> 1.45k
   * @example 1000000 -> 1m
   */
  humanizeParticipantCount?: boolean;
};

/**
 * The FollowerCount component that displays the number of participants while in the call.
 */
export const FollowerCount = ({
  humanizeParticipantCount = true,
}: FollowerCountProps) => {
  const {
    theme: { followerCount, components, semantics },
  } = useTheme();

  const { useParticipantCount } = useCallStateHooks();
  const totalParticipants = useParticipantCount();

  return (
    <View style={[styles.container, followerCount.container]}>
      <Users color={semantics.textPrimary} size={components.iconSizeMd} />
      <Text style={followerCount.label}>
        {humanizeParticipantCount
          ? humanize(totalParticipants)
          : totalParticipants}
      </Text>
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
