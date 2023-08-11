import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Participants } from '../../../icons';
import { useParticipantCount } from '@stream-io/video-react-bindings';
import { theme } from '../../../theme';
import { Z_INDEX } from '../../../constants';
import { CallTopViewProps } from '..';

export type ParticipantsInfoBadgeProps = Pick<
  CallTopViewProps,
  'onParticipantInfoPress'
>;

/**
 * Badge that shows the number of participants in the call.
 * When pressed, it opens the ParticipantsInfoList.
 */
export const ParticipantsInfoBadge = ({
  onParticipantInfoPress,
}: ParticipantsInfoBadgeProps) => {
  const participantCount = useParticipantCount();

  return (
    <Pressable
      onPress={onParticipantInfoPress}
      style={({ pressed }) => [
        { ...styles.container, opacity: pressed ? 0.2 : 1 },
      ]}
      disabled={!onParticipantInfoPress}
    >
      <View style={theme.icon.md}>
        <Participants color={theme.light.static_white} />
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{participantCount}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  badge: {
    justifyContent: 'center',
    paddingHorizontal: theme.padding.sm,
    backgroundColor: theme.light.text_low_emphasis,
    borderRadius: theme.rounded.xl,
    zIndex: Z_INDEX.IN_FRONT,
    bottom: theme.spacing.xl,
    right: theme.spacing.xl,
  },
  badgeText: {
    includeFontPadding: false,
    color: theme.light.static_white,
    textAlign: 'center',
    ...theme.fonts.subtitle,
  },
});
